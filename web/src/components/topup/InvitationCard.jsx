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

import React, { useState } from 'react';
import { WalIcons as I } from './_shared/WalletPageStyles';

const formatUsd = (q) => `$${(Number(q) / 500000 || 0).toFixed(2)}`;

const InvitationCard = ({
  t,
  affLink,
  onCopy,
  copied,
  affCount,
  monthEarningsUsd,
  baseRewardUsd,
  tierData,
}) => {
  const [shareOpen, setShareOpen] = useState(null);

  const tiersEnabled = !!tierData?.enabled;
  const tiers = tierData?.tiers || [];
  const currentCount = tierData?.current_count ?? affCount ?? 0;
  // The "next" tier — first one not yet achieved.
  const nextTierIdx = tiers.findIndex((t) => !t.achieved);
  const nextTier = nextTierIdx >= 0 ? tiers[nextTierIdx] : null;
  const lastTierCount = tiers.length ? tiers[tiers.length - 1].count : 0;

  const headlineAmt = baseRewardUsd ? `$${baseRewardUsd.toFixed(2)}` : null;

  const share = (kind) => {
    const text = encodeURIComponent(t('快来加入，使用我的邀请链接：'));
    const url = encodeURIComponent(affLink || '');
    if (kind === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
        '_blank',
      );
    } else if (kind === 'mail') {
      window.location.href = `mailto:?subject=${text}&body=${url}`;
    } else if (kind === 'copy') {
      onCopy?.();
    } else if (kind === 'wechat') {
      onCopy?.();
      setShareOpen('wechat');
      setTimeout(() => setShareOpen(null), 2500);
    }
  };

  return (
    <div className='wal-card wal-invite-card' style={{ padding: 0 }}>
      <div className='wal-invite-horizontal'>
        <div className='wal-inv-left'>
          <div className='wal-inv-eyebrow'>
            <I.Sparkle /> {t('邀请朋友计划')}
          </div>
          <div className='wal-inv-headline'>
            {headlineAmt ? (
              <>
                {t('邀请朋友')} · {t('各获')}{' '}
                <span className='wal-inv-amt'>{headlineAmt}</span>
              </>
            ) : (
              t('邀请朋友 · 共享额度奖励')
            )}
          </div>
          <div className='wal-inv-sub'>
            {t(
              '朋友通过你的邀请链接注册并完成首次充值后，双方均可获得邀请奖励额度。',
            )}{' '}
            {affCount > 0 && (
              <>
                {t('你已成功邀请')} <strong>{affCount}</strong> {t('位朋友')}
                {monthEarningsUsd > 0 && (
                  <>
                    , {t('累计获得')}{' '}
                    <strong>${monthEarningsUsd.toFixed(2)}</strong>
                  </>
                )}
                。
              </>
            )}
          </div>
          <div className='wal-invite-link'>
            <input value={affLink || ''} readOnly />
            <button onClick={() => share('copy')}>
              {copied ? (
                <>
                  <I.Check /> {t('已复制')}
                </>
              ) : (
                <>
                  <I.Copy /> {t('复制链接')}
                </>
              )}
            </button>
          </div>
          <div className='wal-share-row'>
            <span className='wal-share-label'>{t('分享到')}</span>
            <button
              className='wal-share-btn'
              title={t('微信(复制链接)')}
              onClick={() => share('wechat')}
            >
              <I.WeChat />
            </button>
            <button
              className='wal-share-btn'
              title='Twitter / X'
              onClick={() => share('twitter')}
            >
              <I.Twitter />
            </button>
            <button
              className='wal-share-btn'
              title={t('邮件')}
              onClick={() => share('mail')}
            >
              <I.Mail />
            </button>
            <button
              className='wal-share-btn'
              title={t('复制链接')}
              onClick={() => share('copy')}
            >
              <I.Link />
            </button>
            {shareOpen === 'wechat' && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--wal-blue-1)',
                  marginLeft: 6,
                }}
              >
                {t('已复制，粘贴到微信发送')}
              </span>
            )}
          </div>
        </div>

        <div className='wal-inv-right'>
          <div className='wal-inv-tier-head'>
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <I.Users style={{ color: 'var(--wal-blue-1)' }} /> {t('阶梯奖励')}
            </span>
            <span className='wal-inv-progress'>
              {t('当前')} {currentCount}
              {lastTierCount ? ` / ${lastTierCount} ${t('人')}` : ''}
            </span>
          </div>

          {!tiersEnabled || tiers.length === 0 ? (
            <div className='wal-tier-empty'>{t('管理员未启用阶梯奖励')}</div>
          ) : (
            <div className='wal-reward-tiers'>
              {tiers.map((tier, i) => {
                const isDone = !!tier.achieved;
                const isNext = i === nextTierIdx;
                const cls = `wal-tier-step${isDone ? ' done' : ''}${isNext ? ' next' : ''}`;
                return (
                  <div className={cls} key={tier.count}>
                    <div className='wal-tdot'>
                      {isDone ? <I.Check /> : i + 1}
                    </div>
                    <div className='wal-tlbl'>
                      {tier.count} {t('人')}
                    </div>
                    <div className='wal-tval'>
                      {formatUsd(tier.bonus_quota)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {nextTier && (
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--wal-ink-500)',
                lineHeight: 1.55,
              }}
            >
              {t('再邀请')}{' '}
              <strong style={{ color: 'var(--wal-blue-1)' }}>
                {Math.max(nextTier.count - currentCount, 0)}
              </strong>{' '}
              {t('人即可解锁')}{' '}
              <strong style={{ color: 'var(--wal-ink-900)' }}>
                {formatUsd(nextTier.bonus_quota)}
              </strong>{' '}
              {t('阶梯奖励')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitationCard;
