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

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Button,
  Tooltip,
  Collapsible,
  Modal,
} from '@douyinfe/semi-ui';
import {
  Gift,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Turnstile from 'react-turnstile';
import { API, showError, showSuccess, renderQuota } from '../../../../helpers';
import MacSpinner from '../../../common/ui/MacSpinner';

const CheckinCalendar = ({ t, status, turnstileEnabled, turnstileSiteKey }) => {
  const [loading, setLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [turnstileModalVisible, setTurnstileModalVisible] = useState(false);
  const [turnstileWidgetKey, setTurnstileWidgetKey] = useState(0);
  const [checkinData, setCheckinData] = useState({
    enabled: false,
    stats: {
      checked_in_today: false,
      total_checkins: 0,
      total_quota: 0,
      checkin_count: 0,
      records: [],
    },
  });
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(null);

  const checkinRecordsMap = useMemo(() => {
    const map = {};
    const records = checkinData.stats?.records || [];
    records.forEach((record) => {
      map[record.checkin_date] = record.quota_awarded;
    });
    return map;
  }, [checkinData.stats?.records]);

  const monthlyQuota = useMemo(() => {
    const records = checkinData.stats?.records || [];
    return records.reduce((sum, record) => sum + (record.quota_awarded || 0), 0);
  }, [checkinData.stats?.records]);

  const currentStreak = useMemo(() => {
    const records = checkinData.stats?.records || [];
    if (records.length === 0) return 0;
    const sortedDates = records.map((r) => r.checkin_date).sort().reverse();
    let streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (prev - curr) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [checkinData.stats?.records]);

  const daysInMonth = useMemo(() => {
    const [y, m] = currentMonth.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  }, [currentMonth]);

  const attendanceRate = useMemo(() => {
    if (daysInMonth === 0) return 0;
    const records = checkinData.stats?.records || [];
    return Math.round((records.length / daysInMonth) * 100);
  }, [checkinData.stats?.records, daysInMonth]);

  const fetchCheckinStatus = async (month) => {
    const isFirstLoad = !initialLoaded;
    setLoading(true);
    try {
      const res = await API.get(`/api/user/checkin?month=${month}`);
      const { success, data, message } = res.data;
      if (success) {
        setCheckinData(data);
        if (isFirstLoad) {
          setIsCollapsed(data.stats?.checked_in_today ?? false);
          setInitialLoaded(true);
        }
      } else {
        showError(message || t('获取签到状态失败'));
        if (isFirstLoad) {
          setIsCollapsed(false);
          setInitialLoaded(true);
        }
      }
    } catch (error) {
      showError(t('获取签到状态失败'));
      if (isFirstLoad) {
        setIsCollapsed(false);
        setInitialLoaded(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const postCheckin = async (token) => {
    const url = token
      ? `/api/user/checkin?turnstile=${encodeURIComponent(token)}`
      : '/api/user/checkin';
    return API.post(url);
  };

  const shouldTriggerTurnstile = (message) => {
    if (!turnstileEnabled) return false;
    if (typeof message !== 'string') return true;
    return message.includes('Turnstile');
  };

  const doCheckin = async (token) => {
    setCheckinLoading(true);
    try {
      const res = await postCheckin(token);
      const { success, data, message } = res.data;
      if (success) {
        showSuccess(t('签到成功！获得') + ' ' + renderQuota(data.quota_awarded));
        fetchCheckinStatus(currentMonth);
        setTurnstileModalVisible(false);
      } else {
        if (!token && shouldTriggerTurnstile(message)) {
          if (!turnstileSiteKey) {
            showError('Turnstile is enabled but site key is empty.');
            return;
          }
          setTurnstileModalVisible(true);
          return;
        }
        if (token && shouldTriggerTurnstile(message)) {
          setTurnstileWidgetKey((v) => v + 1);
        }
        showError(message || t('签到失败'));
      }
    } catch (error) {
      showError(t('签到失败'));
    } finally {
      setCheckinLoading(false);
    }
  };

  useEffect(() => {
    if (status?.checkin_enabled) {
      fetchCheckinStatus(currentMonth);
    }
  }, [status?.checkin_enabled, currentMonth]);

  if (!status?.checkin_enabled) {
    return null;
  }

  const dateRender = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    const quotaAwarded = checkinRecordsMap[formattedDate];
    const isCheckedIn = quotaAwarded !== undefined;

    if (isCheckedIn) {
      return (
        <Tooltip
          content={`${t('获得')} ${renderQuota(quotaAwarded)}`}
          position='top'
        >
          <div
            className='absolute inset-0 flex flex-col items-center justify-center cursor-pointer'
            style={{
              borderRadius: 'var(--radius-md)',
              background:
                'color-mix(in srgb, var(--accent) 10%, transparent)',
              transition: 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent-gradient)',
                boxShadow: '0 6px 16px -4px rgba(0, 114, 255, 0.35)',
                marginBottom: 2,
              }}
            >
              <Check size={14} style={{ color: '#fff' }} strokeWidth={3} />
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                lineHeight: 1,
                color: 'var(--accent)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {renderQuota(quotaAwarded)}
            </div>
          </div>
        </Tooltip>
      );
    }
    return null;
  };

  const handleMonthChange = (date) => {
    const month = date.toISOString().slice(0, 7);
    setCurrentMonth(month);
  };

  return (
    <section>
      <Modal
        title='Security Check'
        visible={turnstileModalVisible}
        footer={null}
        centered
        onCancel={() => {
          setTurnstileModalVisible(false);
          setTurnstileWidgetKey((v) => v + 1);
        }}
      >
        <div className='flex justify-center py-2'>
          <Turnstile
            key={turnstileWidgetKey}
            sitekey={turnstileSiteKey}
            onVerify={(token) => doCheckin(token)}
            onExpire={() => setTurnstileWidgetKey((v) => v + 1)}
          />
        </div>
      </Modal>

      {/* Header: title + stats */}
      <div className='flex flex-col md:flex-row md:items-end md:justify-between mb-5 gap-4'>
        <div className='min-w-0'>
          <div
            className='flex items-center gap-2 cursor-pointer select-none'
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <h2
              className='text-xl sm:text-2xl'
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "PingFang SC", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {t('settings.checkinActivity')}
            </h2>
            {isCollapsed ? (
              <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />
            ) : (
              <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} />
            )}
          </div>
          <p
            className='mt-1'
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              margin: '4px 0 0 0',
            }}
          >
            {!initialLoaded
              ? t('正在加载签到状态...')
              : checkinData.stats?.checked_in_today
                ? t('今日已签到，累计签到') +
                  ` ${checkinData.stats?.total_checkins || 0} ` +
                  t('天')
                : t('每日签到可获得随机额度奖励')}
            {monthlyQuota > 0 && (
              <span
                className='ml-1'
                style={{
                  color: 'var(--accent)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                · {renderQuota(monthlyQuota)}
              </span>
            )}
          </p>
        </div>
        <div className='flex items-center gap-3 sm:gap-4 flex-wrap'>
          <div
            style={{
              padding: '10px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              minWidth: 96,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1,
              }}
            >
              {t('settings.currentStreak')}
            </p>
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginTop: 6,
                marginBottom: 0,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.2,
              }}
            >
              {currentStreak}
              <span
                style={{
                  fontSize: 12,
                  marginLeft: 4,
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}
              >
                {t('天')}
              </span>
            </p>
          </div>
          <div
            style={{
              padding: '10px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              minWidth: 96,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1,
              }}
            >
              {t('settings.attendance')}
            </p>
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginTop: 6,
                marginBottom: 0,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.2,
              }}
            >
              {attendanceRate}
              <span
                style={{
                  fontSize: 12,
                  marginLeft: 2,
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}
              >
                %
              </span>
            </p>
          </div>
          <Button
            type='primary'
            theme='solid'
            icon={<Gift size={16} />}
            onClick={() => doCheckin()}
            loading={checkinLoading || !initialLoaded}
            disabled={!initialLoaded || checkinData.stats?.checked_in_today}
            style={{
              background: checkinData.stats?.checked_in_today
                ? 'var(--bg-subtle)'
                : 'var(--accent-gradient)',
              color: checkinData.stats?.checked_in_today
                ? 'var(--text-muted)'
                : '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              height: 42,
              padding: '0 22px',
              fontWeight: 700,
              boxShadow: checkinData.stats?.checked_in_today
                ? 'none'
                : '0 8px 20px -6px rgba(0,114,255,0.35)',
            }}
          >
            {!initialLoaded
              ? t('加载中...')
              : checkinData.stats?.checked_in_today
                ? t('今日已签到')
                : t('立即签到')}
          </Button>
        </div>
      </div>

      {/* Calendar content */}
      <Collapsible isOpen={isCollapsed === false} keepDOM>
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            padding: 'clamp(16px, 2.5vw, 24px)',
            boxShadow: 'var(--shadow-ring)',
          }}
        >
          <MacSpinner spinning={loading}>
            <div className='checkin-calendar-v3'>
              <style>{`
                .checkin-calendar-v3 .semi-calendar {
                  font-size: 13px;
                  background: transparent;
                }
                .checkin-calendar-v3 .semi-calendar-header {
                  padding: 0 4px 14px;
                  border-bottom: none;
                }
                .checkin-calendar-v3 .semi-calendar-header .semi-button {
                  border-radius: var(--radius-md) !important;
                  background: var(--bg-subtle) !important;
                  border: 1px solid var(--border-default) !important;
                  color: var(--text-primary) !important;
                  font-weight: 600 !important;
                  box-shadow: none !important;
                  transition: background-color var(--ease-micro),
                              border-color var(--ease-micro) !important;
                }
                .checkin-calendar-v3 .semi-calendar-header .semi-button:hover {
                  background: var(--surface-hover) !important;
                  border-color: color-mix(in srgb, var(--border-default) 140%, transparent) !important;
                }
                .checkin-calendar-v3 .semi-calendar-month-week-row {
                  height: 32px;
                  border-bottom: 1px solid var(--border-subtle);
                }
                .checkin-calendar-v3 .semi-calendar-month-week-row th {
                  font-size: 10px;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.12em;
                  color: var(--text-muted);
                  padding: 6px 0;
                  border: none !important;
                }
                .checkin-calendar-v3 .semi-calendar-month-grid-row {
                  height: auto;
                }
                .checkin-calendar-v3 .semi-calendar-month-grid-row td {
                  height: 64px;
                  padding: 3px;
                  border: none !important;
                  vertical-align: top;
                }
                .checkin-calendar-v3 .semi-calendar-month-grid-row-cell {
                  position: relative;
                  height: 100%;
                  border-radius: var(--radius-md);
                  transition: background-color var(--ease-micro);
                }
                .checkin-calendar-v3 .semi-calendar-month-grid-row-cell:hover {
                  background: var(--surface-hover);
                }
                .checkin-calendar-v3 .semi-calendar-month-grid-row-cell-day {
                  position: absolute;
                  top: 6px;
                  left: 50%;
                  transform: translateX(-50%);
                  font-size: 11px;
                  font-weight: 500;
                  color: var(--text-secondary);
                  z-index: 1;
                  font-family: var(--font-mono);
                  letter-spacing: 0;
                }
                .checkin-calendar-v3 .semi-calendar-month-same {
                  background: transparent;
                }
                .checkin-calendar-v3 .semi-calendar-month-not-current
                  .semi-calendar-month-grid-row-cell-day {
                  color: color-mix(in srgb, var(--text-muted) 50%, transparent);
                }
                .checkin-calendar-v3 .semi-calendar-month-today
                  .semi-calendar-month-grid-row-cell-day {
                  background: var(--accent-gradient);
                  color: #fff;
                  border-radius: 9999px;
                  width: 20px;
                  height: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 6px 14px -4px rgba(0, 114, 255, 0.45);
                  font-weight: 700;
                }
              `}</style>
              <Calendar
                mode='month'
                onChange={handleMonthChange}
                dateGridRender={(dateString) => dateRender(dateString)}
              />
            </div>
          </MacSpinner>

          {/* Rules — subtle muted bar */}
          <div
            className='mt-4 flex flex-wrap items-center gap-x-5 gap-y-1'
            style={{
              padding: '12px 16px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: 11.5,
              color: 'var(--text-muted)',
              lineHeight: 1.6,
            }}
          >
            <span
              className='inline-flex items-center gap-1.5'
              style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                }}
              />
              {t('签到规则')}
            </span>
            <span>· {t('每日签到可获得随机额度奖励')}</span>
            <span>· {t('签到奖励将直接添加到您的账户余额')}</span>
            <span>· {t('每日仅可签到一次，请勿重复签到')}</span>
          </div>
        </div>
      </Collapsible>
    </section>
  );
};

export default CheckinCalendar;
