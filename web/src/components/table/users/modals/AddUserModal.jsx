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

import React, { useState, useRef } from 'react';
import { API, showError, showSuccess } from '../../../../helpers';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import {
  Button,
  SideSheet,
  Form,
  Row,
  Col,
} from '@douyinfe/semi-ui';
import { IconSave, IconClose, IconUserAdd } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import MacSpinner from '../../../common/ui/MacSpinner';

const AddUserModal = (props) => {
  const { t } = useTranslation();
  const formApiRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  const getInitValues = () => ({
    username: '',
    display_name: '',
    password: '',
    remark: '',
  });

  const submit = async (values) => {
    setLoading(true);
    const res = await API.post(`/api/user/`, values);
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('用户账户创建成功！'));
      formApiRef.current?.setValues(getInitValues());
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    props.handleClose();
  };

  return (
    <>
      <SideSheet
        placement={'left'}
        title={
          <div className='flex items-center gap-2.5'>
            <span
              className='w-7 h-7 flex items-center justify-center'
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(52, 199, 89, 0.15)',
                color: 'var(--success)',
              }}
            >
              <IconUserAdd size={16} />
            </span>
            <span
              className='text-base font-semibold'
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
            >
              {t('添加用户')}
            </span>
          </div>
        }
        bodyStyle={{ padding: '0' }}
        visible={props.visible}
        width={isMobile ? '100%' : 600}
        footer={
          <div
            className='flex justify-end gap-2 px-4 py-3'
            style={{
              background: 'var(--surface)',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <Button
              theme='light'
              onClick={handleCancel}
              icon={<IconClose />}
              style={{
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-active)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
              }}
            >
              {t('取消')}
            </Button>
            <Button
              theme='solid'
              onClick={() => formApiRef.current?.submitForm()}
              icon={<IconSave />}
              loading={loading}
              style={{
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-gradient)',
                color: '#fff',
                border: 'none',
              }}
            >
              {t('提交')}
            </Button>
          </div>
        }
        closeIcon={null}
        onCancel={() => handleCancel()}
      >
        <MacSpinner spinning={loading}>
          <Form
            initValues={getInitValues()}
            getFormApi={(api) => (formApiRef.current = api)}
            onSubmit={submit}
            onSubmitFail={(errs) => {
              const first = Object.values(errs)[0];
              if (first) showError(Array.isArray(first) ? first[0] : first);
              formApiRef.current?.scrollToError();
            }}
          >
            <div className='p-4 space-y-4'>
              <div
                className='rounded-[var(--radius-lg)]'
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  className='flex items-center gap-2.5 px-5 py-3'
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <span
                    className='w-7 h-7 flex items-center justify-center flex-shrink-0'
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                    }}
                  >
                    <IconUserAdd size={15} />
                  </span>
                  <div>
                    <h4
                      className='text-sm font-semibold m-0'
                      style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
                    >
                      {t('用户信息')}
                    </h4>
                    <p className='text-xs m-0' style={{ color: 'var(--text-muted)' }}>
                      {t('创建新用户账户')}
                    </p>
                  </div>
                </div>
                <div className='px-5 py-4'>
                  <Row gutter={12}>
                    <Col span={24}>
                      <Form.Input
                        field='username'
                        label={t('用户名')}
                        placeholder={t('请输入用户名')}
                        rules={[{ required: true, message: t('请输入用户名') }]}
                        showClear
                      />
                    </Col>
                    <Col span={24}>
                      <Form.Input
                        field='display_name'
                        label={t('显示名称')}
                        placeholder={t('请输入显示名称')}
                        showClear
                      />
                    </Col>
                    <Col span={24}>
                      <Form.Input
                        field='password'
                        label={t('密码')}
                        type='password'
                        placeholder={t('请输入密码')}
                        rules={[{ required: true, message: t('请输入密码') }]}
                        showClear
                      />
                    </Col>
                    <Col span={24}>
                      <Form.Input
                        field='remark'
                        label={t('备注')}
                        placeholder={t('请输入备注（仅管理员可见）')}
                        showClear
                      />
                    </Col>
                  </Row>
                </div>
              </div>
            </div>
          </Form>
        </MacSpinner>
      </SideSheet>
    </>
  );
};

export default AddUserModal;
