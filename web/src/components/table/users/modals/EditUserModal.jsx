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

import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  API,
  showError,
  showSuccess,
  renderQuota,
  renderQuotaWithPrompt,
  getCurrencyConfig,
} from '../../../../helpers';
import {
  quotaToDisplayAmount,
  displayAmountToQuota,
} from '../../../../helpers/quota';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import {
  Button,
  Modal,
  SideSheet,
  Form,
  Row,
  Col,
  InputNumber,
} from '@douyinfe/semi-ui';
import {
  IconUser,
  IconSave,
  IconClose,
  IconLink,
  IconUserGroup,
  IconPlus,
} from '@douyinfe/semi-icons';
import UserBindingManagementModal from './UserBindingManagementModal';
import MacSpinner from '../../../common/ui/MacSpinner';

const EditUserModal = (props) => {
  const { t } = useTranslation();
  const userId = props.editingUser.id;
  const [loading, setLoading] = useState(true);
  const [addQuotaModalOpen, setIsModalOpen] = useState(false);
  const [addQuotaLocal, setAddQuotaLocal] = useState('');
  const [addAmountLocal, setAddAmountLocal] = useState('');
  const isMobile = useIsMobile();
  const [groupOptions, setGroupOptions] = useState([]);
  const [bindingModalVisible, setBindingModalVisible] = useState(false);
  const formApiRef = useRef(null);

  const isEdit = Boolean(userId);

  const getInitValues = () => ({
    username: '',
    display_name: '',
    password: '',
    github_id: '',
    oidc_id: '',
    discord_id: '',
    wechat_id: '',
    telegram_id: '',
    linux_do_id: '',
    email: '',
    quota: 0,
    group: 'default',
    remark: '',
  });

  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      setGroupOptions(res.data.data.map((g) => ({ label: g, value: g })));
    } catch (e) {
      showError(e.message);
    }
  };

  const handleCancel = () => props.handleClose();

  const loadUser = async () => {
    setLoading(true);
    const url = userId ? `/api/user/${userId}` : `/api/user/self`;
    const res = await API.get(url);
    const { success, message, data } = res.data;
    if (success) {
      data.password = '';
      formApiRef.current?.setValues({ ...getInitValues(), ...data });
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
    if (userId) fetchGroups();
    setBindingModalVisible(false);
  }, [props.editingUser.id]);

  const openBindingModal = () => {
    setBindingModalVisible(true);
  };

  const closeBindingModal = () => {
    setBindingModalVisible(false);
  };

  /* ----------------------- submit ----------------------- */
  const submit = async (values) => {
    setLoading(true);
    let payload = { ...values };
    if (typeof payload.quota === 'string')
      payload.quota = parseInt(payload.quota) || 0;
    if (userId) {
      payload.id = parseInt(userId);
    }
    const url = userId ? `/api/user/` : `/api/user/self`;
    const res = await API.put(url, payload);
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('用户信息更新成功！'));
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
    setLoading(false);
  };

  /* --------------------- quota helper -------------------- */
  const addLocalQuota = () => {
    const current = parseInt(formApiRef.current?.getValue('quota') || 0);
    const delta = parseInt(addQuotaLocal) || 0;
    formApiRef.current?.setValue('quota', current + delta);
  };

  /* --------------------------- UI --------------------------- */
  return (
    <>
      <SideSheet
        placement='right'
        title={
          <div className='flex items-center gap-2.5'>
            <span
              className='w-7 h-7 flex items-center justify-center'
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
              }}
            >
              <IconUser size={16} />
            </span>
            <span
              className='text-base font-semibold'
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
            >
              {isEdit ? t('编辑用户') : t('创建用户')}
            </span>
          </div>
        }
        bodyStyle={{ padding: 0 }}
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
        onCancel={handleCancel}
      >
        <MacSpinner spinning={loading}>
          <Form
            initValues={getInitValues()}
            getFormApi={(api) => (formApiRef.current = api)}
            onSubmit={submit}
          >
            {({ values }) => (
              <div className='p-4 space-y-4'>
                {/* 基本信息 */}
                <div
                  className='rounded-[var(--radius-lg)]'
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
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
                      <IconUser size={15} />
                    </span>
                    <div>
                      <h4 className='text-sm font-semibold m-0' style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                        {t('基本信息')}
                      </h4>
                      <p className='text-xs m-0' style={{ color: 'var(--text-muted)' }}>
                        {t('用户的基本账户信息')}
                      </p>
                    </div>
                  </div>
                  <div className='px-5 py-4'>
                    <Row gutter={12}>
                      <Col span={24}>
                        <Form.Input field='username' label={t('用户名')} placeholder={t('请输入新的用户名')} rules={[{ required: true, message: t('请输入用户名') }]} showClear />
                      </Col>
                      <Col span={24}>
                        <Form.Input field='password' label={t('密码')} placeholder={t('请输入新的密码，最短 8 位')} mode='password' showClear />
                      </Col>
                      <Col span={24}>
                        <Form.Input field='display_name' label={t('显示名称')} placeholder={t('请输入新的显示名称')} showClear />
                      </Col>
                      <Col span={24}>
                        <Form.Input field='remark' label={t('备注')} placeholder={t('请输入备注（仅管理员可见）')} showClear />
                      </Col>
                    </Row>
                  </div>
                </div>

                {/* 权限设置 */}
                {userId && (
                  <div
                    className='rounded-[var(--radius-lg)]'
                    style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div
                      className='flex items-center gap-2.5 px-5 py-3'
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <span
                        className='w-7 h-7 flex items-center justify-center flex-shrink-0'
                        style={{
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(52, 199, 89, 0.12)',
                          color: 'var(--success)',
                        }}
                      >
                        <IconUserGroup size={15} />
                      </span>
                      <div>
                        <h4 className='text-sm font-semibold m-0' style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                          {t('权限设置')}
                        </h4>
                        <p className='text-xs m-0' style={{ color: 'var(--text-muted)' }}>
                          {t('用户分组和额度管理')}
                        </p>
                      </div>
                    </div>
                    <div className='px-5 py-4'>
                      <Row gutter={12}>
                        <Col span={24}>
                          <Form.Select field='group' label={t('分组')} placeholder={t('请选择分组')} optionList={groupOptions} allowAdditions search rules={[{ required: true, message: t('请选择分组') }]} />
                        </Col>
                        <Col span={10}>
                          <Form.InputNumber field='quota' label={t('剩余额度')} placeholder={t('请输入新的剩余额度')} step={500000} extraText={renderQuotaWithPrompt(values.quota || 0)} rules={[{ required: true, message: t('请输入额度') }]} style={{ width: '100%' }} />
                        </Col>
                        <Col span={14}>
                          <Form.Slot label={t('添加额度')}>
                            <Button
                              icon={<IconPlus />}
                              onClick={() => setIsModalOpen(true)}
                              style={{
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--surface-active)',
                                border: '1px solid var(--border-default)',
                              }}
                            />
                          </Form.Slot>
                        </Col>
                      </Row>
                    </div>
                  </div>
                )}

                {/* 绑定信息入口 */}
                {userId && (
                  <div
                    className='rounded-[var(--radius-lg)] flex items-center justify-between gap-3 px-5 py-4'
                    style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div className='flex items-center gap-2.5 min-w-0'>
                      <span
                        className='w-7 h-7 flex items-center justify-center flex-shrink-0'
                        style={{
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(175, 82, 222, 0.12)',
                          color: 'var(--info)',
                        }}
                      >
                        <IconLink size={15} />
                      </span>
                      <div className='min-w-0'>
                        <h4 className='text-sm font-semibold m-0' style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                          {t('绑定信息')}
                        </h4>
                        <p className='text-xs m-0 truncate' style={{ color: 'var(--text-muted)' }}>
                          {t('管理用户已绑定的第三方账户，支持筛选与解绑')}
                        </p>
                      </div>
                    </div>
                    <Button
                      theme='light'
                      onClick={openBindingModal}
                      style={{
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--accent-gradient)',
                        color: '#fff',
                        border: 'none',
                        flexShrink: 0,
                      }}
                    >
                      {t('管理绑定')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Form>
        </MacSpinner>
      </SideSheet>

      <UserBindingManagementModal
        visible={bindingModalVisible}
        onCancel={closeBindingModal}
        userId={userId}
        isMobile={isMobile}
        formApiRef={formApiRef}
      />

      {/* 添加额度模态框 */}
      <Modal
        centered
        visible={addQuotaModalOpen}
        onOk={() => {
          addLocalQuota();
          setIsModalOpen(false);
          setAddQuotaLocal('');
          setAddAmountLocal('');
        }}
        onCancel={() => {
          setIsModalOpen(false);
        }}
        closable={null}
        title={
          <div className='flex items-center gap-2'>
            <span
              className='w-6 h-6 flex items-center justify-center'
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
              }}
            >
              <IconPlus size={14} />
            </span>
            <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {t('添加额度')}
            </span>
          </div>
        }
      >
        <div className='mb-4'>
          {(() => {
            const current = formApiRef.current?.getValue('quota') || 0;
            return (
              <p className='text-sm m-0 mb-2' style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {`${t('新额度：')}${renderQuota(current)} + ${renderQuota(addQuotaLocal)} = ${renderQuota(current + parseInt(addQuotaLocal || 0))}`}
              </p>
            );
          })()}
        </div>
        {getCurrencyConfig().type !== 'TOKENS' && (
          <div className='mb-3'>
            <div className='mb-1'>
              <span className='text-xs' style={{ color: 'var(--text-primary)' }}>{t('金额')}</span>
              <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                {' '}
                ({t('仅用于换算，实际保存的是额度')})
              </span>
            </div>
            <InputNumber
              prefix={getCurrencyConfig().symbol}
              placeholder={t('输入金额')}
              value={addAmountLocal}
              precision={2}
              onChange={(val) => {
                setAddAmountLocal(val);
                setAddQuotaLocal(
                  val != null && val !== ''
                    ? displayAmountToQuota(Math.abs(val)) * Math.sign(val)
                    : '',
                );
              }}
              style={{ width: '100%' }}
              showClear
            />
          </div>
        )}
        <div>
          <div className='mb-1'>
            <span className='text-xs' style={{ color: 'var(--text-primary)' }}>{t('额度')}</span>
          </div>
          <InputNumber
            placeholder={t('输入额度')}
            value={addQuotaLocal}
            onChange={(val) => {
              setAddQuotaLocal(val);
              setAddAmountLocal(
                val != null && val !== ''
                  ? Number(
                      (
                        quotaToDisplayAmount(Math.abs(val)) * Math.sign(val)
                      ).toFixed(2),
                    )
                  : '',
              );
            }}
            style={{ width: '100%' }}
            showClear
            step={500000}
          />
        </div>
      </Modal>
    </>
  );
};

export default EditUserModal;
