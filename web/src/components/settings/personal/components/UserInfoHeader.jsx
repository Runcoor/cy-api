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
import { isRoot, isAdmin, renderQuota } from '../../../../helpers';

const DEFAULT_AVATAR = '/favicon.svg';

const UserInfoHeader = ({ t, userState }) => {
  const username = userState?.user?.username || 'null';
  const [avatarFailed, setAvatarFailed] = useState(false);
  const avatarSrc = userState?.user?.avatar || DEFAULT_AVATAR;

  const getRoleLabel = () => {
    if (isRoot()) return t('超级管理员');
    if (isAdmin()) return t('管理员');
    return t('普通用户');
  };

  const initial = (username && username[0] ? username[0] : 'A').toUpperCase();

  const balance = renderQuota(userState?.user?.quota, 2);
  const usedQuota = renderQuota(userState?.user?.used_quota, 2);
  const requestCount = userState?.user?.request_count ?? 0;
  const groupName = userState?.user?.group || t('默认');

  return (
    <section className='aas-wallet'>
      <div className='aas-avatar-block'>
        <div className='aas-avatar'>
          {!avatarFailed && userState?.user?.avatar ? (
            <img
              src={avatarSrc}
              alt={username}
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            initial
          )}
        </div>
        <div className='aas-avatar-info'>
          <div className='aas-name'>
            <span className='aas-uname' title={username}>
              {username}
            </span>
            <span className='aas-role-pill'>{getRoleLabel()}</span>
          </div>
          <div className='aas-handle'>@{username}</div>
        </div>
      </div>
      <div className='aas-stats'>
        <div className='aas-stat balance'>
          <div className='aas-lbl'>{t('当前余额')}</div>
          <div className='aas-val aas-mono' title={String(balance)}>
            {balance}
          </div>
          <div className='aas-delta'>{t('可用额度')}</div>
        </div>
        <div className='aas-stat'>
          <div className='aas-lbl'>{t('历史消耗')}</div>
          <div className='aas-val aas-mono' title={String(usedQuota)}>
            {usedQuota}
          </div>
          <div className='aas-delta'>
            {t('累计 {{count}} 次调用', { count: requestCount })}
          </div>
        </div>
        <div className='aas-stat'>
          <div className='aas-lbl'>{t('请求次数')}</div>
          <div className='aas-val aas-mono'>{requestCount}</div>
          <div className='aas-delta'>{t('自注册以来')}</div>
        </div>
        <div className='aas-stat'>
          <div className='aas-lbl'>{t('用户分组')}</div>
          <div className='aas-val'>
            <span className='aas-tier-pill' title={groupName}>
              {groupName}
            </span>
          </div>
          <div className='aas-delta'>{getRoleLabel()}</div>
        </div>
      </div>
    </section>
  );
};

export default UserInfoHeader;
