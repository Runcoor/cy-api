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

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Spin, Empty } from '@douyinfe/semi-ui';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUserDetail } from '../../hooks/users/useUserDetail';

const UserDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = parseInt(id, 10);
  const { overview, loading, error, refetch } = useUserDetail(userId);

  if (loading && !overview) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
        <Spin size='large' />
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div style={{ padding: 24 }}>
        <Empty title={t('加载失败')} description={error}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <Button onClick={() => navigate('/console/user')}>
              {t('返回用户列表')}
            </Button>
            <Button type='primary' onClick={refetch}>
              {t('重试')}
            </Button>
          </div>
        </Empty>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  return (
    <div style={{ padding: 16 }}>
      {/* BackBar */}
      <div style={{ marginBottom: 12 }}>
        <Button
          theme='borderless'
          type='tertiary'
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate('/console/user')}
        >
          {t('返回用户列表')}
        </Button>
      </div>
      {/* Top region (placeholder; real content added in Task 5) */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            padding: 16,
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <pre
            style={{
              margin: 0,
              fontSize: 12,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {JSON.stringify(overview, null, 2)}
          </pre>
        </div>
      </div>
      {/* Tabs region — added in Task 6+ */}
    </div>
  );
};

export default UserDetail;
