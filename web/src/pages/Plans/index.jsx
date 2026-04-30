/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { UserContext } from '../../context/User';
import { API, showError, showSuccess } from '../../helpers';
import SubscriptionPurchaseModal from '../../components/topup/modals/SubscriptionPurchaseModal';
import {
  Sparkles,
  Zap,
  Crown,
  ArrowRight,
  Star,
  MessageSquare,
} from 'lucide-react';

const PENDING_PLAN_KEY = 'pending_subscription_plan_id';

// 易支付 form-post helper. Mirrors the implementation used in
// components/topup/SubscriptionPlansCard.jsx so the redirect behaviour stays
// consistent with the in-console purchase flow.
function submitEpayForm({ url, params }) {
  const form = document.createElement('form');
  form.action = url;
  form.method = 'POST';
  const isSafari =
    navigator.userAgent.indexOf('Safari') > -1 &&
    navigator.userAgent.indexOf('Chrome') < 1;
  if (!isSafari) form.target = '_blank';
  Object.keys(params || {}).forEach((key) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = params[key];
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOL = { USD: '$', CNY: '¥', EUR: '€' };
const fmtMoney = (amount, currency = 'USD') => {
  const sym = CURRENCY_SYMBOL[currency] || (currency + ' ');
  const n = Number(amount || 0);
  // Tabular for nice alignment in the table; show .00 only when needed.
  const text = Number.isInteger(n) ? n.toString() : n.toFixed(2);
  return `${sym}${text}`;
};

const fmtDuration = (value, unit, t) => {
  const v = Number(value || 0);
  // duration_unit values from the model: "day" | "week" | "month" | "year" | "custom"
  const unitMap = {
    day: t('plans.unit.day'),
    week: t('plans.unit.week'),
    month: t('plans.unit.month'),
    year: t('plans.unit.year'),
    custom: t('plans.unit.custom'),
  };
  return `${v} ${unitMap[unit] || unit}`;
};

// Lowercased plan tier key from the upgrade_group field. Falls back to
// "starter" so unknown groups still get a renderable card.
const tierKey = (plan) => {
  const g = (plan?.upgrade_group || '').toLowerCase();
  if (g.includes('ultra') || g.includes('flagship') || g.includes('旗舰')) return 'ultra';
  if (g.includes('pro') || g.includes('专业')) return 'pro';
  return 'starter';
};

const TIER_META = {
  starter: { icon: Sparkles, color: '#10b981' },
  pro: { icon: Zap, color: '#0072ff', popular: true },
  ultra: { icon: Crown, color: '#a855f7' },
};

// ─── Animated price counter ─────────────────────────────────────────────────

const useCountUp = (target, durationMs = 900, startDelayMs = 0) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    let cancelled = false;
    const t0 = performance.now() + startDelayMs;
    const step = (now) => {
      if (cancelled) return;
      const elapsed = now - t0;
      if (elapsed < 0) {
        raf = requestAnimationFrame(step);
        return;
      }
      const p = Math.min(1, elapsed / durationMs);
      // ease-out cubic for the natural "settle" feel a price counter wants
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs, startDelayMs]);
  return value;
};

// ─── Magnetic CTA wrapper ───────────────────────────────────────────────────

const MagneticWrap = ({ children, strength = 6 }) => {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = 'translate(0, 0)';
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ display: 'inline-block', transition: 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
    >
      {children}
    </div>
  );
};

// ─── Plan card ──────────────────────────────────────────────────────────────

const PlanCard = ({ index, plan, popular, t, onSubscribe }) => {
  const tk = tierKey(plan);
  const meta = TIER_META[tk] || TIER_META.starter;
  const Icon = meta.icon;
  const [hover, setHover] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const tm = setTimeout(() => setMounted(true), 80 + index * 120);
    return () => clearTimeout(tm);
  }, [index]);

  const animatedPrice = useCountUp(Number(plan.price_amount || 0), 900, 200 + index * 120);
  const sym = CURRENCY_SYMBOL[plan.currency] || (plan.currency + ' ');
  const displayPrice = Number.isInteger(Number(plan.price_amount))
    ? Math.round(animatedPrice).toString()
    : animatedPrice.toFixed(2);

  const accent = popular
    ? 'linear-gradient(135deg, rgba(0, 114, 255, 0.18) 0%, rgba(0, 198, 255, 0.10) 50%, transparent 100%)'
    : 'transparent';

  // Discount % vs. original price (when available) — small "save X%" label
  const original = Number(plan.original_price_amount || 0);
  const current = Number(plan.price_amount || 0);
  const savePct = original > current && original > 0
    ? Math.round((1 - current / original) * 100)
    : 0;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: 'var(--surface)',
        border: popular ? '1.5px solid rgba(0, 114, 255, 0.45)' : '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl, 18px)',
        padding: '32px 28px 28px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: popular
          ? (hover
              ? '0 16px 48px rgba(0, 114, 255, 0.22), 0 0 0 1px rgba(0, 114, 255, 0.3) inset'
              : '0 8px 32px rgba(0, 114, 255, 0.16), 0 0 0 1px rgba(0, 114, 255, 0.18) inset')
          : (hover
              ? '0 12px 36px rgba(0, 0, 0, 0.10)'
              : '0 2px 8px rgba(0, 0, 0, 0.04)'),
        transform: mounted ? `translateY(${hover ? -6 : 0}px)` : 'translateY(20px)',
        opacity: mounted ? 1 : 0,
        transition: 'all 360ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        zIndex: popular ? 2 : 1,
      }}
    >
      {popular && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: accent,
            pointerEvents: 'none',
            opacity: 0.85,
            borderRadius: 'inherit',
          }}
        />
      )}

      {popular && (
        <div className='cy-badge-shimmer' style={popularBadgeStyle}>
          <Star size={11} fill='#fff' stroke='none' />
          {t('plans.popular')}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: popular ? 'var(--accent-gradient)' : 'var(--surface-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <Icon size={22} color={popular ? '#fff' : meta.color} />
        </div>

        {/* Tier label */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: popular ? 'var(--accent)' : 'var(--text-muted)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {t(`plans.tier.${tk}`)}
        </div>

        {/* Plan title — comes from API, not i18n */}
        <h3
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
          }}
        >
          {plan.title}
        </h3>

        {/* Price */}
        <div style={{ marginTop: 18, marginBottom: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {sym}{displayPrice}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            / {fmtDuration(plan.duration_value, plan.duration_unit, t)}
          </span>
        </div>

        {/* Token-gift line — the headline value prop of this product */}
        <div
          style={{
            fontSize: 13,
            color: popular ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          {t('plans.gift', { amount: fmtMoney(plan.original_price_amount, plan.currency) })}
        </div>

        {/* Save % chip when original > price */}
        {savePct > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 700,
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.12)',
              borderRadius: 999,
              marginBottom: 10,
            }}
          >
            {t('plans.save', { pct: savePct })}
          </div>
        )}

        {/* Subtitle from API */}
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: '14px 0 22px',
            flex: 1,
          }}
        >
          {plan.subtitle}
        </p>

        {/* CTA */}
        <MagneticWrap strength={4}>
          <CTAButton
            popular={popular}
            label={t('plans.subscribe')}
            onClick={() => onSubscribe?.(plan)}
          />
        </MagneticWrap>
      </div>
    </div>
  );
};

const popularBadgeStyle = {
  position: 'absolute',
  top: -14,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '5px 16px',
  borderRadius: '999px',
  background: 'var(--accent-gradient)',
  color: '#fff',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  boxShadow: '0 6px 20px rgba(0, 114, 255, 0.35)',
  zIndex: 3,
};

const CTAButton = ({ popular, label, onClick }) => {
  const [hover, setHover] = useState(false);
  if (popular) {
    return (
      <button
        type='button'
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onClick}
        style={{
          width: '100%',
          padding: '13px 20px',
          fontSize: 14,
          fontWeight: 600,
          color: '#fff',
          background: 'var(--accent-gradient)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all 200ms ease-out',
          boxShadow: hover
            ? '0 10px 28px rgba(0, 114, 255, 0.40)'
            : '0 4px 16px rgba(0, 114, 255, 0.25)',
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      type='button'
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        width: '100%',
        padding: '13px 20px',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-primary)',
        background: hover ? 'var(--surface-hover)' : 'transparent',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'all 200ms ease-out',
        letterSpacing: '0.01em',
      }}
    >
      {label}
    </button>
  );
};

// ─── Comparison table ──────────────────────────────────────────────────────

const useInView = (ref, opts) => {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || seen) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, ...opts },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, seen, opts]);
  return seen;
};

const ComparisonTable = ({ plans, t }) => {
  const ref = useRef(null);
  const inView = useInView(ref);

  // Map plan → tier key for the i18n marketing rows.
  const tieredPlans = plans.map((p) => ({ ...p, _tier: tierKey(p) }));

  const rows = [
    {
      label: t('plans.compare.row.price'),
      cell: (p) => fmtMoney(p.price_amount, p.currency),
      highlight: true,
    },
    {
      label: t('plans.compare.row.duration'),
      cell: (p) => fmtDuration(p.duration_value, p.duration_unit, t),
    },
    {
      label: t('plans.compare.row.gift'),
      cell: (p) => fmtMoney(p.original_price_amount, p.currency),
      highlight: true,
    },
    {
      label: t('plans.compare.row.group'),
      cell: (p) => p.upgrade_group || '—',
    },
    {
      label: t('plans.compare.row.useCase'),
      cell: (p) => t(`plans.useCase.${p._tier}`),
    },
    {
      label: t('plans.compare.row.audience'),
      cell: (p) => t(`plans.audience.${p._tier}`),
    },
  ];

  return (
    <div
      ref={ref}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <div className='cy-plans-table-desktop' style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'linear-gradient(90deg, rgba(0,114,255,0.05), rgba(0,198,255,0.08), rgba(0,114,255,0.04))' }}>
              <th style={thStyle}>{t('plans.compare.feature')}</th>
              {tieredPlans.map((p) => {
                const isPopular = TIER_META[p._tier]?.popular;
                return (
                  <th
                    key={p.id}
                    style={{
                      ...thStyle,
                      color: isPopular ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {p.title}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  transition: 'background 150ms ease, opacity 500ms cubic-bezier(0.2,0.8,0.2,1), transform 500ms cubic-bezier(0.2,0.8,0.2,1)',
                  transitionDelay: `${i * 70}ms`,
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'translateY(0)' : 'translateY(12px)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {row.label}
                </td>
                {tieredPlans.map((p) => {
                  const isPopular = TIER_META[p._tier]?.popular;
                  return (
                    <td
                      key={p.id}
                      style={{
                        padding: '16px 24px',
                        color: isPopular && row.highlight ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: row.highlight ? 600 : 400,
                      }}
                    >
                      {row.cell(p)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards stack */}
      <div className='cy-plans-table-mobile' style={{ display: 'none', flexDirection: 'column' }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              padding: '14px 18px',
              borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 500ms cubic-bezier(0.2,0.8,0.2,1), transform 500ms cubic-bezier(0.2,0.8,0.2,1)',
              transitionDelay: `${i * 70}ms`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {row.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tieredPlans.length}, 1fr)`, gap: 10 }}>
              {tieredPlans.map((p) => {
                const isPopular = TIER_META[p._tier]?.popular;
                return (
                  <div key={p.id}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: 12, color: isPopular && row.highlight ? 'var(--accent)' : 'var(--text-primary)', fontWeight: row.highlight ? 600 : 500 }}>
                      {row.cell(p)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const thStyle = {
  padding: '16px 24px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

// ─── Main page ─────────────────────────────────────────────────────────────

const PlansPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userState] = useContext(UserContext);
  const isLoggedIn = !!userState?.user;
  const [heroVisible, setHeroVisible] = useState(false);
  const [tableVisible, setTableVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Purchase modal — payment configuration is fetched lazily on first open
  // (only logged-in users can hit /api/user/topup/info), then cached.
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paying, setPaying] = useState(false);
  const [selectedEpayMethod, setSelectedEpayMethod] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentInfoLoading, setPaymentInfoLoading] = useState(false);

  useEffect(() => {
    setHeroVisible(true);
    const t1 = setTimeout(() => setTableVisible(true), 700);
    const t2 = setTimeout(() => setCtaVisible(true), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Bare axios — the global API helper sends an Aggre-User header that
        // the public /plans endpoint doesn't need and that may be blank for
        // anonymous visitors.
        const res = await axios.get('/api/subscription/plans');
        if (cancelled) return;
        const items = (res?.data?.data || []).map((row) => row?.plan || row);
        // Sort by price ascending so the cheapest tier is first.
        items.sort((a, b) => Number(a.price_amount || 0) - Number(b.price_amount || 0));
        setPlans(items);
      } catch (e) {
        if (!cancelled) setLoadError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Mark exactly one card popular: the middle one if there are 3+, else
  // whichever has tier=pro.
  const popularIdx = plans.length >= 3
    ? Math.floor(plans.length / 2)
    : plans.findIndex((p) => tierKey(p) === 'pro');

  const epayMethods = useMemo(() => {
    const list = paymentInfo?.payMethods || [];
    return list.filter(
      (m) => m?.type && m.type !== 'stripe' && m.type !== 'creem' && m.type !== 'waffo' && m.type !== 'cryptomus',
    );
  }, [paymentInfo]);

  const ensurePaymentInfo = useCallback(async () => {
    if (paymentInfo || paymentInfoLoading) return paymentInfo;
    setPaymentInfoLoading(true);
    try {
      const res = await API.get('/api/user/topup/info');
      const { success, data } = res.data || {};
      if (success && data) {
        let methods = data.pay_methods || [];
        if (typeof methods === 'string') {
          try { methods = JSON.parse(methods); } catch { methods = []; }
        }
        methods = (methods || []).filter((m) => m?.name && m?.type);
        const info = {
          payMethods: methods,
          enableOnlineTopUp: !!data.enable_online_topup,
          enableStripeTopUp: !!data.enable_stripe_topup,
          enableCreemTopUp: !!data.enable_creem_topup,
          enableNowPaymentsTopUp: !!data.enable_nowpayments_topup,
        };
        setPaymentInfo(info);
        return info;
      }
    } catch {
      // Swallow — modal will render the "no payment configured" banner.
    } finally {
      setPaymentInfoLoading(false);
    }
    return null;
  }, [paymentInfo, paymentInfoLoading]);

  const openBuyForPlan = useCallback(
    async (plan) => {
      if (!plan?.id) return;
      if (!isLoggedIn) {
        // Remember intent across the auth redirect so we can re-open the
        // modal once the user comes back to /plans.
        try { sessionStorage.setItem(PENDING_PLAN_KEY, String(plan.id)); } catch {}
        const next = `/plans?plan=${plan.id}`;
        navigate(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      setSelectedPlan({ plan });
      setModalOpen(true);
      const info = paymentInfo || (await ensurePaymentInfo());
      const firstEpay = (info?.payMethods || []).find(
        (m) => m?.type && m.type !== 'stripe' && m.type !== 'creem' && m.type !== 'waffo' && m.type !== 'cryptomus' && m.type !== 'nowpayments',
      );
      setSelectedEpayMethod((prev) => prev || firstEpay?.type || '');
    },
    [isLoggedIn, navigate, paymentInfo, ensurePaymentInfo],
  );

  const closeBuyModal = () => {
    setModalOpen(false);
    setSelectedPlan(null);
    setPaying(false);
  };

  // Auto-open the modal when the user lands back on /plans with ?plan=<id>
  // (post-login redirect), or when sessionStorage has a pending intent.
  // Runs once plans have loaded so we can resolve the plan object.
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (loading || plans.length === 0) return;
    if (!isLoggedIn) return;

    let pendingId = searchParams.get('plan');
    if (!pendingId) {
      try { pendingId = sessionStorage.getItem(PENDING_PLAN_KEY); } catch {}
    }
    if (!pendingId) return;

    const target = plans.find((p) => String(p.id) === String(pendingId));
    autoOpenedRef.current = true;
    try { sessionStorage.removeItem(PENDING_PLAN_KEY); } catch {}
    if (searchParams.get('plan')) {
      const next = new URLSearchParams(searchParams);
      next.delete('plan');
      setSearchParams(next, { replace: true });
    }
    if (target) {
      openBuyForPlan(target);
    }
  }, [loading, plans, isLoggedIn, searchParams, setSearchParams, openBuyForPlan]);

  const payStripe = async () => {
    const plan = selectedPlan?.plan;
    if (!plan?.stripe_price_id) {
      showError(t('该套餐未配置 Stripe'));
      return;
    }
    setPaying(true);
    try {
      const res = await API.post('/api/subscription/stripe/pay', { plan_id: plan.id });
      if (res.data?.message === 'success') {
        window.open(res.data.data?.pay_link, '_blank');
        showSuccess(t('已打开支付页面'));
        closeBuyModal();
      } else {
        const errorMsg =
          typeof res.data?.data === 'string' ? res.data.data : res.data?.message || t('支付失败');
        showError(errorMsg);
      }
    } catch {
      showError(t('支付请求失败'));
    } finally {
      setPaying(false);
    }
  };

  const payCreem = async () => {
    const plan = selectedPlan?.plan;
    if (!plan?.creem_product_id) {
      showError(t('该套餐未配置 Creem'));
      return;
    }
    setPaying(true);
    try {
      const res = await API.post('/api/subscription/creem/pay', { plan_id: plan.id });
      if (res.data?.message === 'success') {
        window.open(res.data.data?.checkout_url, '_blank');
        showSuccess(t('已打开支付页面'));
        closeBuyModal();
      } else {
        const errorMsg =
          typeof res.data?.data === 'string' ? res.data.data : res.data?.message || t('支付失败');
        showError(errorMsg);
      }
    } catch {
      showError(t('支付请求失败'));
    } finally {
      setPaying(false);
    }
  };

  const payNowPayments = async () => {
    const plan = selectedPlan?.plan;
    if (!plan?.id) return;
    setPaying(true);
    try {
      const res = await API.post('/api/subscription/nowpayments/pay', { plan_id: plan.id });
      if (res.data?.message === 'success' && res.data.data?.pay_link) {
        window.open(res.data.data.pay_link, '_blank');
        showSuccess(t('已打开支付页面'));
        closeBuyModal();
      } else {
        const errorMsg =
          typeof res.data?.data === 'string' ? res.data.data : res.data?.message || t('支付失败');
        showError(errorMsg);
      }
    } catch {
      showError(t('支付请求失败'));
    } finally {
      setPaying(false);
    }
  };

  const payEpay = async () => {
    const plan = selectedPlan?.plan;
    if (!plan?.id) return;
    if (!selectedEpayMethod) {
      showError(t('请选择支付方式'));
      return;
    }
    setPaying(true);
    try {
      const res = await API.post('/api/subscription/epay/pay', {
        plan_id: plan.id,
        payment_method: selectedEpayMethod,
      });
      if (res.data?.message === 'success') {
        submitEpayForm({ url: res.data.url, params: res.data.data });
        showSuccess(t('已发起支付'));
        closeBuyModal();
      } else {
        const errorMsg =
          typeof res.data?.data === 'string' ? res.data.data : res.data?.message || t('支付失败');
        showError(errorMsg);
      }
    } catch {
      showError(t('支付请求失败'));
    } finally {
      setPaying(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - var(--header-height))',
        background: 'var(--bg-base)',
        padding: '60px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Drifting background blobs */}
      <div className='cy-blob cy-blob-a' aria-hidden style={blobAStyle} />
      <div className='cy-blob cy-blob-b' aria-hidden style={blobBStyle} />

      <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' }}>
        {/* Hero */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 60,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            opacity: heroVisible ? 1 : 0,
            transition: 'all 600ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, rgba(0, 114, 255, 0.10), rgba(0, 198, 255, 0.16))',
              border: '1px solid rgba(0, 114, 255, 0.20)',
              color: 'var(--accent)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            <Sparkles size={11} />
            {t('plans.hero.kicker')}
          </div>
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            {t('plans.hero.title1')}
            <br />
            <span
              style={{
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t('plans.hero.title2')}
            </span>
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              maxWidth: 580,
              margin: '20px auto 0',
            }}
          >
            {t('plans.hero.desc')}
          </p>
        </div>

        {/* Plan cards */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
            {t('plans.loading')}
          </div>
        ) : loadError ? (
          <div style={{ textAlign: 'center', color: 'var(--semi-color-danger)', padding: '60px 0' }}>
            {t('plans.loadError')}: {loadError}
          </div>
        ) : plans.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
            {t('plans.empty')}
          </div>
        ) : (
          <div
            className='cy-plans-grid'
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)`,
              gap: 24,
              alignItems: 'stretch',
              marginBottom: 80,
              maxWidth: 1100,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {plans.map((p, i) => (
              <PlanCard
                key={p.id}
                index={i}
                plan={p}
                popular={i === popularIdx}
                t={t}
                onSubscribe={openBuyForPlan}
              />
            ))}
          </div>
        )}

        {/* Comparison */}
        {!loading && !loadError && plans.length > 0 && (
          <div
            style={{
              transform: tableVisible ? 'translateY(0)' : 'translateY(30px)',
              opacity: tableVisible ? 1 : 0,
              transition: 'all 600ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--text-primary)',
                textAlign: 'center',
                margin: '0 0 32px',
                letterSpacing: '-0.02em',
              }}
            >
              {t('plans.compare.title')}
            </h2>
            <ComparisonTable plans={plans} t={t} />
          </div>
        )}

        {/* CTA banner */}
        <div
          style={{
            marginTop: 80,
            borderRadius: 'var(--radius-xl, 18px)',
            background: 'linear-gradient(135deg, rgba(0, 114, 255, 0.10) 0%, rgba(0, 198, 255, 0.06) 100%)',
            border: '1px solid rgba(0, 114, 255, 0.20)',
            padding: '48px 32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            transform: ctaVisible ? 'translateY(0)' : 'translateY(30px)',
            opacity: ctaVisible ? 1 : 0,
            transition: 'all 600ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <h3
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {t('plans.cta.title')}
          </h3>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              maxWidth: 480,
              margin: '12px auto 28px',
              lineHeight: 1.6,
            }}
          >
            {t('plans.cta.desc')}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <MagneticWrap strength={5}>
              <Link
                to={isLoggedIn ? '/console/topup' : `/register?next=${encodeURIComponent('/plans')}`}
                style={{ textDecoration: 'none' }}
              >
                <button
                  style={{
                    padding: '12px 28px',
                    fontSize: 14,
                    fontWeight: 600,
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 6px 24px rgba(0, 114, 255, 0.32)',
                    transition: 'transform 200ms ease, box-shadow 200ms ease',
                  }}
                >
                  {isLoggedIn ? t('plans.cta.primaryAuth') : t('plans.cta.primary')}
                  <ArrowRight size={14} />
                </button>
              </Link>
            </MagneticWrap>
            <Link to='/about' style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '12px 28px',
                  fontSize: 14,
                  fontWeight: 600,
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 200ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
              >
                <MessageSquare size={14} />
                {t('plans.cta.secondary')}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Purchase modal — wires Stripe / Creem / 易支付 directly from the
          pricing page so users don't bounce through /console/topup. */}
      <SubscriptionPurchaseModal
        t={t}
        visible={modalOpen}
        onCancel={closeBuyModal}
        selectedPlan={selectedPlan}
        paying={paying}
        selectedEpayMethod={selectedEpayMethod}
        setSelectedEpayMethod={setSelectedEpayMethod}
        epayMethods={epayMethods}
        enableOnlineTopUp={paymentInfo?.enableOnlineTopUp || false}
        enableStripeTopUp={paymentInfo?.enableStripeTopUp || false}
        enableCreemTopUp={paymentInfo?.enableCreemTopUp || false}
        enableNowPaymentsTopUp={paymentInfo?.enableNowPaymentsTopUp || false}
        purchaseLimitInfo={null}
        onPayStripe={payStripe}
        onPayCreem={payCreem}
        onPayEpay={payEpay}
        onPayNowPayments={payNowPayments}
      />

      {/* Page-scoped CSS for blob drift, badge shimmer, and table responsiveness. */}
      <style>{`
        @keyframes cy-drift-a {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(40px, 30px) scale(1.06); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes cy-drift-b {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-30px, 20px) scale(1.04); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .cy-blob-a { animation: cy-drift-a 18s ease-in-out infinite; }
        .cy-blob-b { animation: cy-drift-b 22s ease-in-out infinite; }

        @keyframes cy-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .cy-badge-shimmer {
          background: linear-gradient(110deg,
            rgba(0,114,255,1) 0%,
            rgba(0,114,255,1) 35%,
            rgba(255,255,255,0.55) 50%,
            rgba(0,198,255,1) 65%,
            rgba(0,198,255,1) 100%) !important;
          background-size: 200% 100% !important;
          animation: cy-shimmer 4s linear infinite;
        }

        @media (max-width: 768px) {
          .cy-plans-grid { grid-template-columns: 1fr !important; }
          .cy-plans-table-desktop { display: none !important; }
          .cy-plans-table-mobile { display: flex !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cy-blob-a, .cy-blob-b, .cy-badge-shimmer { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

const blobAStyle = {
  position: 'absolute',
  top: -120,
  left: '20%',
  width: 480,
  height: 480,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(0, 114, 255, 0.10) 0%, transparent 70%)',
  filter: 'blur(40px)',
  pointerEvents: 'none',
};
const blobBStyle = {
  position: 'absolute',
  top: 200,
  right: '15%',
  width: 380,
  height: 380,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(0, 198, 255, 0.08) 0%, transparent 70%)',
  filter: 'blur(40px)',
  pointerEvents: 'none',
};

export default PlansPage;
