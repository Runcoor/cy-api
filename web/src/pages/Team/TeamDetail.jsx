/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/

import React, { useEffect, useState, useContext } from 'react';
import {
  Button,
  Input,
  InputNumber,
  Typography,
  Modal,
  Table,
  Tag,
  Tooltip,
  Banner,
  Skeleton,
  Select,
} from '@douyinfe/semi-ui';
import { IconCopy, IconDelete, IconPlus, IconRefresh } from '@douyinfe/semi-icons';
import { Users, Crown, Shield, User, ArrowLeft, Zap, Key, Link2, Unlink } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess, renderQuota } from '../../helpers';
import { copy } from '../../helpers/utils';
import { UserContext } from '../../context/User';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const { Text } = Typography;

const TeamDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isMobile = useIsMobile();
  const [userState] = useContext(UserContext);

  const [team, setTeam] = useState(null);
  const [myRole, setMyRole] = useState(0);
  const [members, setMembers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const [quotaTopUpVisible, setQuotaTopUpVisible] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [toppingUp, setToppingUp] = useState(false);

  const [editLimitVisible, setEditLimitVisible] = useState(false);
  const [editLimitUserId, setEditLimitUserId] = useState(0);
  const [editLimitValue, setEditLimitValue] = useState(-1);

  // Link token
  const [linkTokenVisible, setLinkTokenVisible] = useState(false);
  const [linkTokenId, setLinkTokenId] = useState(null);
  const [linkingToken, setLinkingToken] = useState(false);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  const isOwner = myRole >= 100;
  const isAdmin = myRole >= 10;

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/team/${id}`);
      if (res.data?.success) {
        setTeam(res.data.data.team);
        setMyRole(res.data.data.role);
      } else {
        showError(res.data?.message || t('加载失败'));
        navigate('/console/team');
      }
    } catch { navigate('/console/team'); }
    setLoading(false);
  };

  const loadMembers = async () => {
    try {
      const res = await API.get(`/api/team/${id}/member`);
      if (res.data?.success) setMembers(res.data.data || []);
    } catch {}
  };

  const loadTokens = async () => {
    try {
      const res = await API.get(`/api/team/${id}/token`);
      if (res.data?.success) setTokens(res.data.data || []);
    } catch {}
  };

  useEffect(() => {
    loadTeam();
    loadMembers();
    loadTokens();
    loadAvailableTokens();
  }, [id]);

  const handleAddMember = async () => {
    const uid = parseInt(addMemberUserId);
    if (!uid || uid <= 0) { showError(t('请输入有效的用户ID')); return; }
    setAddingMember(true);
    try {
      const res = await API.post(`/api/team/${id}/member`, { user_id: uid });
      if (res.data?.success) { showSuccess(t('成员添加成功')); setAddMemberVisible(false); setAddMemberUserId(''); loadMembers(); }
      else showError(res.data?.message || t('添加失败'));
    } catch { showError(t('请求失败')); }
    setAddingMember(false);
  };

  const handleRemoveMember = (userId, username) => {
    Modal.confirm({
      title: t('确认移除'),
      content: `${t('确定要移除成员')} ${username || userId}?`,
      centered: true,
      onOk: async () => {
        try {
          const res = await API.delete(`/api/team/${id}/member/${userId}`);
          if (res.data?.success) { showSuccess(t('已移除')); loadMembers(); loadTokens(); }
          else showError(res.data?.message || t('移除失败'));
        } catch { showError(t('请求失败')); }
      },
    });
  };

  const handleTopUpQuota = async () => {
    if (topUpAmount <= 0) { showError(t('充值额度必须大于0')); return; }
    setToppingUp(true);
    try {
      const res = await API.post(`/api/team/${id}/quota`, { quota: topUpAmount });
      if (res.data?.success) { showSuccess(t('额度已转入团队')); setQuotaTopUpVisible(false); setTopUpAmount(0); loadTeam(); }
      else showError(res.data?.message || t('转入失败'));
    } catch { showError(t('请求失败')); }
    setToppingUp(false);
  };

  const handleUpdateLimit = async () => {
    try {
      const res = await API.put(`/api/team/${id}/member/${editLimitUserId}`, { quota_limit: editLimitValue });
      if (res.data?.success) { showSuccess(t('更新成功')); setEditLimitVisible(false); loadMembers(); }
      else showError(res.data?.message || t('更新失败'));
    } catch { showError(t('请求失败')); }
  };

  const handleRegenerateInvite = async () => {
    try {
      const res = await API.post(`/api/team/${id}/invite`);
      if (res.data?.success) { showSuccess(t('邀请码已重新生成')); loadTeam(); }
      else showError(res.data?.message || t('操作失败'));
    } catch { showError(t('请求失败')); }
  };

  const loadAvailableTokens = async () => {
    setLoadingTokens(true);
    try {
      const res = await API.get(`/api/team/${id}/available-tokens`);
      if (res.data?.success) setAvailableTokens(res.data.data || []);
    } catch {}
    setLoadingTokens(false);
  };

  const handleLinkToken = async () => {
    if (!linkTokenId || linkTokenId <= 0) { showError(t('请选择令牌')); return; }
    setLinkingToken(true);
    try {
      const res = await API.post(`/api/team/${id}/token/${linkTokenId}`);
      if (res.data?.success) { showSuccess(t('令牌已关联')); setLinkTokenVisible(false); setLinkTokenId(null); loadTokens(); loadAvailableTokens(); }
      else showError(res.data?.message || t('关联失败'));
    } catch { showError(t('请求失败')); }
    setLinkingToken(false);
  };

  const handleUnlinkToken = async (tokenId) => {
    try {
      const res = await API.delete(`/api/team/${id}/token/${tokenId}`);
      if (res.data?.success) { showSuccess(t('已解除关联')); loadTokens(); }
      else showError(res.data?.message || t('操作失败'));
    } catch { showError(t('请求失败')); }
  };

  if (loading || !team) {
    return (
      <div className='w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12'>
        <Skeleton.Title active style={{ width: '40%', marginBottom: 24 }} />
        <Skeleton.Paragraph active rows={6} />
      </div>
    );
  }

  const usedPercent = team.quota > 0 ? Math.min(100, Math.round((team.used_quota / team.quota) * 100)) : 0;

  const memberColumns = [
    { title: t('用户'), dataIndex: 'username', render: (text, record) => (
      <div>
        <Text strong>{record.display_name || text}</Text>
        <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>@{text}</Text>
      </div>
    )},
    { title: t('角色'), dataIndex: 'member', width: 100, render: (_, record) => {
      const r = record.member?.role || 0;
      return r >= 100 ? <Tag color='amber'>{t('创建者')}</Tag> : r >= 10 ? <Tag color='blue'>{t('管理员')}</Tag> : <Tag>{t('成员')}</Tag>;
    }},
    { title: t('额度上限'), dataIndex: 'member', width: 120, render: (_, record) => {
      const limit = record.member?.quota_limit;
      return limit === -1 ? <Text style={{ color: 'var(--text-muted)' }}>{t('不限')}</Text> : renderQuota(limit);
    }},
    { title: t('已用额度'), width: 120, render: (_, record) => renderQuota(record.member?.used_quota || 0) },
    { title: t('请求次数'), width: 100, render: (_, record) => record.member?.request_count || 0 },
  ];

  if (isOwner) {
    memberColumns.push({
      title: t('操作'), width: 160, render: (_, record) => {
        const userId = record.member?.user_id;
        const isOwnerMember = record.member?.role >= 100;
        return isOwnerMember ? null : (
          <div className='flex gap-2'>
            <Button size='small' theme='light' type='tertiary'
              onClick={() => { setEditLimitUserId(userId); setEditLimitValue(record.member?.quota_limit ?? -1); setEditLimitVisible(true); }}
            >
              {t('限额')}
            </Button>
            <Button size='small' theme='light' type='danger'
              onClick={() => handleRemoveMember(userId, record.username)}
            >
              {t('移除')}
            </Button>
          </div>
        );
      },
    });
  }

  return (
    <div className='w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8'>
      {/* Header */}
      <div>
        <Button theme='borderless' type='tertiary' icon={<ArrowLeft size={16} />}
          onClick={() => navigate('/console/team')} style={{ marginBottom: 12, borderRadius: 'var(--radius-md)' }}
        >
          {t('返回团队列表')}
        </Button>
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: 0 }}>
            {team.name}
          </h1>
          {isOwner && (
            <div className='flex gap-2'>
              <Button theme='light' type='primary' icon={<IconPlus />} onClick={() => setAddMemberVisible(true)}
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                {t('添加成员')}
              </Button>
              <Button theme='solid' type='primary' icon={<Zap size={14} />} onClick={() => setQuotaTopUpVisible(true)}
                style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600 }}
              >
                {t('充值额度')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Team stats cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
        {/* Quota card */}
        <div className='rounded-[var(--radius-lg)] p-5 relative overflow-hidden'
          style={{ background: 'var(--accent-gradient)', boxShadow: '0 12px 32px rgba(0,114,255,0.12)' }}>
          <p className='text-[10px] uppercase tracking-widest font-semibold mb-1' style={{ color: 'rgba(255,255,255,0.7)' }}>{t('团队额度')}</p>
          <p className='text-2xl font-extrabold mb-2' style={{ color: '#fff', fontFamily: 'var(--font-serif)' }}>
            {renderQuota(team.quota)}
          </p>
          <div style={{ width: '100%', height: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${usedPercent}%`, background: '#fff', borderRadius: 9999 }} />
          </div>
          <p className='text-xs mt-2' style={{ color: 'rgba(255,255,255,0.7)' }}>
            {t('已用')} {renderQuota(team.used_quota)} ({usedPercent}%)
          </p>
        </div>

        {/* Members card */}
        <div className='rounded-[var(--radius-lg)] p-5' style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}>
          <p className='text-[10px] uppercase tracking-widest font-semibold mb-1' style={{ color: 'var(--text-muted)' }}>{t('成员')}</p>
          <p className='text-2xl font-extrabold' style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
            {members.length}
          </p>
          <p className='text-xs mt-2' style={{ color: 'var(--text-muted)' }}>
            {t('请求')} {team.request_count || 0}
          </p>
        </div>

        {/* Invite card */}
        <div className='rounded-[var(--radius-lg)] p-5' style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}>
          <p className='text-[10px] uppercase tracking-widest font-semibold mb-1' style={{ color: 'var(--text-muted)' }}>{t('邀请码')}</p>
          <div className='flex items-center gap-2 mt-1'>
            <code className='text-lg font-bold' style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
              {team.invite_code}
            </code>
            <Button size='small' theme='borderless' type='tertiary' icon={<IconCopy />}
              onClick={() => { copy(team.invite_code); showSuccess(t('已复制')); }}
            />
            {isOwner && (
              <Button size='small' theme='borderless' type='tertiary' icon={<IconRefresh />}
                onClick={handleRegenerateInvite}
              />
            )}
          </div>
          <p className='text-xs mt-2' style={{ color: 'var(--text-muted)' }}>
            {t('分享邀请码邀请成员加入')}
          </p>
        </div>
      </div>

      {/* Members table */}
      <div>
        <h2 className='text-lg font-bold mb-4' style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          {t('成员列表')}
        </h2>
        <Table
          columns={memberColumns}
          dataSource={members}
          rowKey={(record) => record.member?.id}
          pagination={false}
          size='small'
          style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
        />
      </div>

      {/* Team tokens */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-bold m-0' style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            {t('关联令牌')}
          </h2>
          <Button size='small' theme='light' type='primary' icon={<IconPlus />}
            onClick={() => setLinkTokenVisible(true)} style={{ borderRadius: 'var(--radius-md)' }}
          >
            {t('关联令牌')}
          </Button>
        </div>
        <Banner
          type='info' closeIcon={null}
          description={t('关联到团队的令牌，其 API 请求将从团队额度池扣费，而非个人钱包。')}
          style={{ borderRadius: 'var(--radius-md)', marginBottom: 12 }}
        />
        {tokens.length === 0 ? (
          <div className='text-center py-8 rounded-[var(--radius-lg)]' style={{ background: 'var(--surface)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
            <Key size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <Text style={{ fontSize: 13 }}>{t('暂无关联令牌')}</Text>
          </div>
        ) : (
          <div className='space-y-2'>
            {tokens.map((item) => (
              <div key={item.team_token?.id} className='flex items-center gap-3 p-3 rounded-[var(--radius-md)]'
                style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}>
                <Key size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div className='flex-1 min-w-0'>
                  <Text strong className='truncate block' style={{ fontSize: 13 }}>{item.token_name || `Token #${item.team_token?.token_id}`}</Text>
                  <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    @{item.username} · {t('已用')} {renderQuota(item.token_used || 0)}
                  </Text>
                </div>
                <Tag size='small' color={item.token_status === 1 ? 'green' : 'grey'}>
                  {item.token_status === 1 ? t('启用') : t('禁用')}
                </Tag>
                <Button size='small' theme='borderless' type='danger' icon={<Unlink size={13} />}
                  onClick={() => handleUnlinkToken(item.team_token?.token_id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}
      <Modal title={t('添加成员')} visible={addMemberVisible} onCancel={() => setAddMemberVisible(false)} footer={null} centered size='small'>
        <div className='space-y-4 pb-2'>
          <Input value={addMemberUserId} onChange={setAddMemberUserId} placeholder={t('输入用户ID')} showClear
            style={{ borderRadius: 'var(--radius-md)' }} onEnterPress={handleAddMember} />
          <Banner type='info' closeIcon={null} description={t('也可以分享邀请码让成员自行加入')} style={{ borderRadius: 'var(--radius-md)' }} />
          <Button theme='solid' type='primary' block loading={addingMember} onClick={handleAddMember}
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600, height: 40 }}>
            {t('添加')}
          </Button>
        </div>
      </Modal>

      <Modal title={t('充值团队额度')} visible={quotaTopUpVisible} onCancel={() => setQuotaTopUpVisible(false)} footer={null} centered size='small'>
        <div className='space-y-4 pb-2'>
          <Banner type='info' closeIcon={null} description={t('将从你的个人额度转入团队额度池')} style={{ borderRadius: 'var(--radius-md)' }} />
          <div>
            <Text style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
              {t('你的个人额度')}: {renderQuota(userState?.user?.quota || 0)}
            </Text>
            <InputNumber value={topUpAmount} onChange={setTopUpAmount} min={1} style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
          </div>
          <Button theme='solid' type='primary' block loading={toppingUp} onClick={handleTopUpQuota}
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600, height: 40 }}>
            {t('确认转入')}
          </Button>
        </div>
      </Modal>

      <Modal title={t('设置额度上限')} visible={editLimitVisible} onCancel={() => setEditLimitVisible(false)} footer={null} centered size='small'>
        <div className='space-y-4 pb-2'>
          <Banner type='info' closeIcon={null} description={t('-1 表示不限制，成员可使用团队池中的全部额度')} style={{ borderRadius: 'var(--radius-md)' }} />
          <InputNumber value={editLimitValue} onChange={setEditLimitValue} min={-1} style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
          <Button theme='solid' type='primary' block onClick={handleUpdateLimit}
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600, height: 40 }}>
            {t('保存')}
          </Button>
        </div>
      </Modal>

      <Modal title={t('关联令牌')} visible={linkTokenVisible} onCancel={() => { setLinkTokenVisible(false); setLinkTokenId(null); }} footer={null} centered size='small'>
        <div className='space-y-4 pb-2'>
          <Banner type='info' closeIcon={null} description={t('选择你的令牌关联到团队，关联后该令牌的请求将从团队额度扣费')} style={{ borderRadius: 'var(--radius-md)' }} />
          <Select
            value={linkTokenId}
            onChange={setLinkTokenId}
            placeholder={t('选择令牌')}
            loading={loadingTokens}
            style={{ width: '100%' }}
            optionList={availableTokens.map((tk) => ({
              value: tk.id,
              label: tk.name || `Token #${tk.id}`,
            }))}
            renderSelectedItem={(option) => (
              <span>{option.label}</span>
            )}
            renderOptionItem={(renderProps) => {
              const tk = availableTokens.find((t) => t.id === renderProps.value);
              return (
                <div {...renderProps} style={{ ...renderProps.style, padding: '8px 12px' }}>
                  <div className='flex items-center justify-between'>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{renderProps.label}</span>
                    <Tag size='small' color={tk?.status === 1 ? 'green' : 'grey'} style={{ marginLeft: 8 }}>
                      {tk?.status === 1 ? t('启用') : t('禁用')}
                    </Tag>
                  </div>
                  {tk?.group && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('分组')}: {tk.group}</span>
                  )}
                </div>
              );
            }}
            emptyContent={<div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{t('暂无可用令牌')}</div>}
          />
          <Button theme='solid' type='primary' block loading={linkingToken} onClick={handleLinkToken}
            disabled={!linkTokenId}
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600, height: 40 }}>
            {t('关联')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TeamDetail;
