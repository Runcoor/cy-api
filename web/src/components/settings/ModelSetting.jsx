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

import React, { useEffect, useState } from 'react';
import { API, showError, showSuccess, toBoolean } from '../../helpers';
import { useTranslation } from 'react-i18next';
import SettingGeminiModel from '../../pages/Setting/Model/SettingGeminiModel';
import SettingClaudeModel from '../../pages/Setting/Model/SettingClaudeModel';
import SettingGlobalModel from '../../pages/Setting/Model/SettingGlobalModel';
import SettingGrokModel from '../../pages/Setting/Model/SettingGrokModel';
import SettingsChannelAffinity from '../../pages/Setting/Operation/SettingsChannelAffinity';
import MacSpinner from '../common/ui/MacSpinner';

const ModelSetting = () => {
  const { t } = useTranslation();
  let [inputs, setInputs] = useState({
    'gemini.safety_settings': '',
    'gemini.version_settings': '',
    'gemini.supported_imagine_models': '',
    'gemini.remove_function_response_id_enabled': true,
    'claude.model_headers_settings': '',
    'claude.thinking_adapter_enabled': true,
    'claude.default_max_tokens': '',
    'claude.thinking_adapter_budget_tokens_percentage': 0.8,
    'global.pass_through_request_enabled': false,
    'global.thinking_model_blacklist': '[]',
    'global.chat_completions_to_responses_policy': '{}',
    'general_setting.ping_interval_enabled': false,
    'general_setting.ping_interval_seconds': 60,
    'gemini.thinking_adapter_enabled': false,
    'gemini.thinking_adapter_budget_tokens_percentage': 0.6,
    'grok.violation_deduction_enabled': true,
    'grok.violation_deduction_amount': 0.05,
  });

  let [loading, setLoading] = useState(false);

  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        if (
          item.key === 'gemini.safety_settings' ||
          item.key === 'gemini.version_settings' ||
          item.key === 'claude.model_headers_settings' ||
          item.key === 'claude.default_max_tokens' ||
          item.key === 'gemini.supported_imagine_models' ||
          item.key === 'global.thinking_model_blacklist' ||
          item.key === 'global.chat_completions_to_responses_policy'
        ) {
          if (item.value !== '') {
            try {
              item.value = JSON.stringify(JSON.parse(item.value), null, 2);
            } catch (e) {
              // Keep raw value so user can fix it, and avoid crashing the page.
              console.error(`Invalid JSON for option ${item.key}:`, e);
            }
          }
        }
        // Keep boolean config keys ending with enabled/Enabled so UI parses correctly.
        if (item.key.endsWith('Enabled') || item.key.endsWith('enabled')) {
          newInputs[item.key] = toBoolean(item.value);
        } else {
          newInputs[item.key] = item.value;
        }
      });

      setInputs(newInputs);
    } else {
      showError(message);
    }
  };
  async function onRefresh() {
    try {
      setLoading(true);
      await getOptions();
      // showSuccess('刷新成功');
    } catch (error) {
      showError('刷新失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    onRefresh();
  }, []);

  return (
    <>
      <MacSpinner spinning={loading} size='large'>
        <div className='mv-settings-stack'>
          {/* OpenAI */}
          <div className='mv-settings-section'>
            <SettingGlobalModel options={inputs} refresh={onRefresh} />
          </div>
          {/* Channel affinity */}
          <div className='mv-settings-section'>
            <SettingsChannelAffinity options={inputs} refresh={onRefresh} />
          </div>
          {/* Gemini */}
          <div className='mv-settings-section'>
            <SettingGeminiModel options={inputs} refresh={onRefresh} />
          </div>
          {/* Claude */}
          <div className='mv-settings-section'>
            <SettingClaudeModel options={inputs} refresh={onRefresh} />
          </div>
          {/* Grok */}
          <div className='mv-settings-section'>
            <SettingGrokModel options={inputs} refresh={onRefresh} />
          </div>
        </div>
      </MacSpinner>
    </>
  );
};

export default ModelSetting;
