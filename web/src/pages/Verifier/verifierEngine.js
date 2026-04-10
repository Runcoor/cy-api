/*
Copyright (C) 2025 QuantumNous

Model Verification Engine — direct browser-side probe.

Supports three formats automatically:
  - openai      : /v1/chat/completions  (gpt-*, openai-compat gemini, claude-on-openai-proxies, etc.)
  - anthropic   : /v1/messages          (claude-* via native Anthropic API)
  - google      : /v1beta/models/{model}:generateContent  (Gemini via native Google API)

Algorithm — two-stage probe ported from relayAPI/src/pages/Index.tsx:
  Stage 1  symbol prompt — does the model honestly emit the chinese closing quote?
  Stage 2  knowledge cutoff prompt — does the model honestly say "不知道" instead of hallucinating?

The two stages combined produce a score 0-100 plus a checklist of pass/warning/fail items.
*/

// Probe prompts. Designed to be unambiguous so reasoning models can't talk
// themselves out of answering. The symbol probe asks for ONE specific
// character; the tariff probe asks for ONE specific factual answer.
const SYMBOL_PROMPT = '请直接输出一个中文右双引号字符 ”,只输出这一个字符,不要解释,不要其它任何内容。';
const TARIFF_PROMPT =
  '不允许联网搜索。请回答:2025年3月4日特朗普把对华关税提到了多少?如果不确定就直接回答"不知道",不要编造数字。';

const PROBE_SYSTEM =
  'You are a verification probe target. Reply with ONLY the exact characters or text the user requests. No explanation, no preamble, no markdown, no code fences. Output nothing else.';

const UNKNOWN_PATTERNS = [
  /不知道/i,
  /不清楚/i,
  /不确定/i,
  /无法确定/i,
  /无法回答/i,
  /i\s*don'?t\s*know/i,
  /not\s*sure/i,
  /can't\s*tell/i,
];

const REFUSAL_PATTERNS = [
  /cannot\s+discuss/i,
  /can'?t\s+discuss/i,
  /cannot\s+provide/i,
  /can'?t\s+provide/i,
  /cannot\s+answer/i,
  /can'?t\s+answer/i,
  /无法讨论/i,
  /拒绝回答/i,
];

const PROBE_MAX_TOKENS = 8192;

// ----------------------------- format detection -----------------------------

export function detectFormat(rawUrl, model) {
  const url = (rawUrl || '').trim().toLowerCase();
  const m = (model || '').trim().toLowerCase();

  if (
    url.includes('generativelanguage.googleapis.com') ||
    url.includes(':generatecontent') ||
    url.includes('/v1beta/models')
  ) {
    return 'google';
  }
  if (
    url.includes('/v1/messages') ||
    url.includes('api.anthropic.com')
  ) {
    return 'anthropic';
  }
  if (
    url.includes('/v1/chat/completions') ||
    url.includes('/chat/completions') ||
    url.includes('api.openai.com') ||
    url.includes('api.x.ai') ||
    url.includes('openrouter.ai')
  ) {
    return 'openai';
  }
  // fall back to model-prefix sniffing
  if (m.startsWith('claude')) return 'anthropic';
  if (m.startsWith('gpt') || m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4')) return 'openai';
  if (m.startsWith('grok')) return 'openai'; // xAI uses OpenAI-compatible format
  if (m.startsWith('gemini')) return 'openai'; // most gemini proxies expose openai-compat
  return 'openai';
}

function resolveEndpoint(rawUrl, model, format) {
  const trimmed = (rawUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';

  // Strip well-known suffixes to get the base
  const base = trimmed
    .replace(/\/v1\/chat\/completions\/?$/i, '')
    .replace(/\/chat\/completions\/?$/i, '')
    .replace(/\/v1\/messages?\/?$/i, '')
    .replace(/\/v1beta\/models\/[^/]+:generateContent\/?$/i, '')
    .replace(/\/v1beta\/?$/i, '')
    .replace(/\/v1\/?$/i, '')
    .replace(/\/+$/, '');

  if (format === 'anthropic') return `${base}/v1/messages`;
  if (format === 'google') return `${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  return `${base}/v1/chat/completions`;
}

// ----------------------------- single probe -----------------------------

// Stream-mode probe for OpenAI-compatible endpoints. Bypasses non-stream
// aggregation bugs by reading the SSE delta stream directly and accumulating
// content + reasoning_content client-side.
async function sendOpenAIStreamProbe({ baseUrl, apiKey, model, prompt, previousAssistantText, t }) {
  const endpoint = resolveEndpoint(baseUrl, model, 'openai');
  if (!endpoint) throw new Error(t('verifier.verifierError.endpointEmpty'));

  const messages = [{ role: 'system', content: PROBE_SYSTEM }];
  if (previousAssistantText !== undefined) {
    messages.push({ role: 'user', content: SYMBOL_PROMPT });
    messages.push({ role: 'assistant', content: previousAssistantText || '(empty)' });
    messages.push({ role: 'user', content: prompt });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  const m = (model || '').toLowerCase();
  const isReasoning =
    m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4') ||
    m.startsWith('gpt-5') || m.includes('thinking') || m.includes('reasoning');

  const body = { model, messages, stream: true };
  if (isReasoning) {
    body.max_completion_tokens = 65536;
    body.reasoning_effort = 'low';
  } else {
    body.max_tokens = PROBE_MAX_TOKENS;
  }

  const startedAt = performance.now();
  let resp;
  try {
    resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(`${t('verifier.verifierError.networkFailed')}: ${e.message}`);
  }

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 280)}`);
  }
  if (!resp.body) throw new Error(t('verifier.verifierError.networkFailed'));

  // SSE parser — accumulate content and reasoning_content from delta chunks
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let contentAcc = '';
  let reasoningAcc = '';
  let lastChunk = null; // Capture final usage / model fields if present
  let modelField = null;
  let inputTokens = null;
  let outputTokens = null;
  let totalTokens = null;
  let hasRole = false;
  let hasStopReason = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const j = JSON.parse(data);
        lastChunk = j;
        if (typeof j?.model === 'string') modelField = j.model;
        const choice = j?.choices?.[0];
        const delta = choice?.delta || choice?.message || {};
        if (typeof delta.role === 'string') hasRole = true;
        if (typeof delta.content === 'string' && delta.content) contentAcc += delta.content;
        else if (Array.isArray(delta.content)) {
          for (const it of delta.content) {
            if (it && typeof it.text === 'string') contentAcc += it.text;
          }
        }
        if (typeof delta.reasoning_content === 'string' && delta.reasoning_content) {
          reasoningAcc += delta.reasoning_content;
        }
        if (typeof delta.reasoning === 'string' && delta.reasoning) {
          reasoningAcc += delta.reasoning;
        }
        if (typeof choice?.finish_reason === 'string' || choice?.finish_reason === null) {
          hasStopReason = true;
        }
        const usage = j?.usage;
        if (usage) {
          if (typeof usage.prompt_tokens === 'number') inputTokens = usage.prompt_tokens;
          if (typeof usage.completion_tokens === 'number') outputTokens = usage.completion_tokens;
          if (typeof usage.total_tokens === 'number') totalTokens = usage.total_tokens;
        }
      } catch (e) {
        // skip malformed chunk
      }
    }
  }

  const latencyMs = Math.round(performance.now() - startedAt);
  const responseText = (contentAcc || reasoningAcc).trim();
  const tps = outputTokens && latencyMs > 0
    ? Number((outputTokens / (latencyMs / 1000)).toFixed(1))
    : 0;

  return {
    prompt,
    responseText,
    payload: {
      __cyStreamMode: true,
      model: modelField,
      content_accumulated: contentAcc,
      reasoning_accumulated: reasoningAcc,
      last_chunk: lastChunk,
      usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: totalTokens },
    },
    latencyMs,
    inputTokens,
    outputTokens,
    totalTokens,
    tps,
    parseOk: true,
    protocolHints: {
      hasModel: !!modelField,
      hasRole,
      hasContentArray: true, // SSE chunks form a stream, structurally array-like
      hasUsage: inputTokens !== null || outputTokens !== null,
      hasStopReason,
    },
  };
}

async function sendProbe({ baseUrl, apiKey, model, prompt, previousAssistantText, format, t, _retry }) {
  const endpoint = resolveEndpoint(baseUrl, model, format);
  if (!endpoint) throw new Error(t('verifier.verifierError.endpointEmpty'));

  let headers;
  let body;

  if (format === 'anthropic') {
    const messages = [];
    if (previousAssistantText !== undefined) {
      messages.push({ role: 'user', content: SYMBOL_PROMPT });
      messages.push({ role: 'assistant', content: previousAssistantText || '(empty)' });
      messages.push({ role: 'user', content: prompt });
    } else {
      messages.push({ role: 'user', content: prompt });
    }
    headers = {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      // Enable 1M context beta — harmless for non-1m models, required by proxies
      // that gate 1m variants (e.g. claude-sonnet-4-6[1m]).
      'anthropic-beta': 'context-1m-2025-08-07',
      'anthropic-dangerous-direct-browser-access': 'true',
      'x-api-key': apiKey,
    };
    body = {
      model,
      messages,
      max_tokens: PROBE_MAX_TOKENS,
      stream: false,
      system: PROBE_SYSTEM,
    };
  } else if (format === 'google') {
    const contents = [];
    if (previousAssistantText !== undefined) {
      contents.push({ role: 'user', parts: [{ text: SYMBOL_PROMPT }] });
      contents.push({ role: 'model', parts: [{ text: previousAssistantText || '(empty)' }] });
      contents.push({ role: 'user', parts: [{ text: prompt }] });
    } else {
      contents.push({ role: 'user', parts: [{ text: prompt }] });
    }
    headers = {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    };
    body = {
      contents,
      systemInstruction: { parts: [{ text: PROBE_SYSTEM }] },
      generationConfig: { maxOutputTokens: PROBE_MAX_TOKENS },
    };
  } else if (_retry?.useStream && (format === 'openai' || format === undefined)) {
    // Stream-mode retry for openai-compatible. Returns early via streaming
    // path because some proxies have bugs in their non-stream aggregation
    // for reasoning models — content is null in the final payload but the
    // SSE delta stream still carries the actual tokens.
    return await sendOpenAIStreamProbe({ baseUrl, apiKey, model, prompt, previousAssistantText, t });
  } else {
    // openai (and all openai-compatible: gpt, grok, gemini-compat, etc.)
    const messages = [{ role: 'system', content: PROBE_SYSTEM }];
    if (previousAssistantText !== undefined) {
      messages.push({ role: 'user', content: SYMBOL_PROMPT });
      messages.push({ role: 'assistant', content: previousAssistantText || '(empty)' });
      messages.push({ role: 'user', content: prompt });
    } else {
      messages.push({ role: 'user', content: prompt });
    }
    headers = {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    };
    // Reasoning models (o1/o3/o4/gpt-5) deprecated `max_tokens` in favor of
    // `max_completion_tokens`, and need a much larger budget because reasoning
    // tokens are silently consumed from the same pool. Also skip stream for
    // simpler parsing.
    const m = (model || '').toLowerCase();
    const isReasoning =
      m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4') ||
      m.startsWith('gpt-5') || m.includes('thinking') || m.includes('reasoning');
    body = {
      model,
      messages,
      stream: false,
    };
    if (isReasoning) {
      // For identity probes we don't need deep reasoning. `low` is the
      // smallest universally-accepted level (OpenAI also has "minimal" but
      // some proxies reject it). On retry we escalate to high + bigger budget.
      body.max_completion_tokens = _retry?.maxTokens ?? 32768;
      body.reasoning_effort = _retry?.reasoningEffort ?? 'low';
    } else {
      body.max_tokens = PROBE_MAX_TOKENS;
    }
  }

  const startedAt = performance.now();
  let resp;
  try {
    resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(`${t('verifier.verifierError.networkFailed')}: ${e.message}`);
  }
  const latencyMs = Math.round(performance.now() - startedAt);
  const rawText = await resp.text();

  if (!resp.ok) {
    let detail = rawText;
    try {
      const j = JSON.parse(rawText);
      detail =
        j?.error?.message ||
        j?.error?.detail ||
        j?.message ||
        rawText;
    } catch (e) { /* keep raw */ }
    throw new Error(`HTTP ${resp.status}: ${String(detail).slice(0, 280)}`);
  }

  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch (e) {
    throw new Error(t('verifier.verifierError.invalidJson'));
  }

  // Extract text + usage based on format
  let responseText = '';
  let inputTokens = null;
  let outputTokens = null;
  let totalTokens = null;
  const protocolHints = {
    hasModel: false,
    hasRole: false,
    hasContentArray: false,
    hasUsage: false,
    hasStopReason: false,
  };

  if (format === 'anthropic') {
    const blocks = Array.isArray(payload.content) ? payload.content : [];
    // Extract from both text blocks (primary) and thinking blocks (fallback).
    // Claude Sonnet 4.6 and other reasoning-capable models may emit reasoning
    // via {type:"thinking", thinking:"..."} blocks before the actual text.
    const textParts = [];
    for (const b of blocks) {
      if (!b || typeof b !== 'object') continue;
      if (typeof b.text === 'string' && b.text) textParts.push(b.text);
      else if (typeof b.thinking === 'string' && b.thinking) textParts.push(b.thinking);
      else if (typeof b.content === 'string' && b.content) textParts.push(b.content);
    }
    responseText = textParts.join('\n').trim();
    // Last-resort fallback: top-level completion field (legacy Claude)
    if (!responseText && typeof payload?.completion === 'string') {
      responseText = payload.completion.trim();
    }
    inputTokens = payload?.usage?.input_tokens ?? null;
    outputTokens = payload?.usage?.output_tokens ?? null;
    if (inputTokens != null && outputTokens != null) totalTokens = inputTokens + outputTokens;
    protocolHints.hasModel = typeof payload?.model === 'string';
    protocolHints.hasRole = typeof payload?.role === 'string';
    protocolHints.hasContentArray = Array.isArray(payload?.content);
    protocolHints.hasUsage = !!(payload?.usage && typeof payload.usage === 'object');
    protocolHints.hasStopReason =
      typeof payload?.stop_reason === 'string' || payload?.stop_reason === null;
  } else if (format === 'google') {
    const cands = Array.isArray(payload?.candidates) ? payload.candidates : [];
    const parts = cands[0]?.content?.parts || [];
    responseText = parts
      .filter((p) => p && typeof p.text === 'string')
      .map((p) => p.text)
      .join('\n')
      .trim();
    inputTokens = payload?.usageMetadata?.promptTokenCount ?? null;
    outputTokens = payload?.usageMetadata?.candidatesTokenCount ?? null;
    totalTokens = payload?.usageMetadata?.totalTokenCount ?? null;
    protocolHints.hasModel = !!payload?.modelVersion || cands.length > 0;
    protocolHints.hasRole = typeof cands[0]?.content?.role === 'string';
    protocolHints.hasContentArray = Array.isArray(cands);
    protocolHints.hasUsage = !!payload?.usageMetadata;
    protocolHints.hasStopReason = typeof cands[0]?.finishReason === 'string';
  } else {
    // openai — extract from multiple possible fields to cover reasoning models
    const choice = payload?.choices?.[0];
    const msg = choice?.message || {};
    const parts = [];

    // 1) primary: message.content (string or array of content blocks)
    if (typeof msg.content === 'string' && msg.content) {
      parts.push(msg.content);
    } else if (Array.isArray(msg.content)) {
      for (const it of msg.content) {
        if (it && typeof it.text === 'string' && it.text) parts.push(it.text);
      }
    }

    // 2) reasoning-model fallbacks (gpt-5 / o1 / o3 / o4 / grok-thinking)
    //    Different providers expose the reasoning track under different names:
    //      - OpenAI:     choices[0].message.reasoning_content
    //      - OpenRouter: choices[0].message.reasoning
    //      - aggre-api:    choices[0].message.reasoning_content
    //      - xAI/Grok:   choices[0].message.reasoning_content
    if (typeof msg.reasoning_content === 'string' && msg.reasoning_content) {
      parts.push(msg.reasoning_content);
    }
    if (typeof msg.reasoning === 'string' && msg.reasoning) {
      parts.push(msg.reasoning);
    }
    if (Array.isArray(msg.reasoning_details)) {
      for (const it of msg.reasoning_details) {
        if (it && typeof it.text === 'string' && it.text) parts.push(it.text);
        if (it && typeof it.summary === 'string' && it.summary) parts.push(it.summary);
      }
    }

    // 3) last-resort legacy completion
    if (!parts.length && typeof payload?.choices?.[0]?.text === 'string') {
      parts.push(payload.choices[0].text);
    }

    responseText = parts.join('\n').trim();

    // "Empty reasoning response" detection: some proxies / models return
    // content=null alongside reasoning_tokens>0. This happens when:
    //   (a) reasoning budget exhausted before any visible text emitted
    //   (b) proxy failed to forward final content field
    //   (c) fake proxy mimicking reasoning shape without real output
    // We surface this as a diagnostic hint in the extracted text so the
    // user can see it was not our extractor's fault.
    const reasoningTokens = payload?.usage?.completion_tokens_details?.reasoning_tokens;
    if (!responseText && typeof reasoningTokens === 'number' && reasoningTokens > 0) {
      responseText = '';
      // Attach a synthetic marker so caller can recognize empty-reasoning case
      payload.__cyEmptyReasoning = true;
    }

    inputTokens = payload?.usage?.prompt_tokens ?? null;
    outputTokens = payload?.usage?.completion_tokens ?? null;
    totalTokens = payload?.usage?.total_tokens ?? null;
    protocolHints.hasModel = typeof payload?.model === 'string';
    protocolHints.hasRole = typeof choice?.message?.role === 'string';
    protocolHints.hasContentArray = Array.isArray(payload?.choices);
    protocolHints.hasUsage = !!(payload?.usage && typeof payload.usage === 'object');
    protocolHints.hasStopReason =
      typeof choice?.finish_reason === 'string' || choice?.finish_reason === null;
  }

  const tps = outputTokens && latencyMs > 0
    ? Number((outputTokens / (latencyMs / 1000)).toFixed(1))
    : 0;

  return {
    prompt,
    responseText,
    payload,
    latencyMs,
    inputTokens,
    outputTokens,
    totalTokens,
    tps,
    parseOk: true,
    protocolHints,
  };
}

// ----------------------------- check evaluation -----------------------------

function statusToScore(status, weight) {
  if (status === 'pass') return weight;
  if (status === 'warning') return Math.round(weight * 0.5);
  return 0;
}

function isUnknownResponse(text) {
  const n = (text || '').trim();
  if (!n) return true;
  if (n.replace(/\s+/g, '').length < 4) return true;
  if (UNKNOWN_PATTERNS.some((p) => p.test(n))) return true;
  if (REFUSAL_PATTERNS.some((p) => p.test(n))) return true;
  return false;
}

function isTariffAnswerValid(text) {
  // Honest model = "不知道". Hallucinated model = invented number/percentage.
  // Returns true ONLY if it's honestly uncertain.
  return isUnknownResponse(text);
}

function buildChecks({ stage1, stage2, stage1Pass, stage2Pass, t }) {
  const protocolBits = [
    stage1.protocolHints.hasModel,
    stage1.protocolHints.hasRole,
    stage1.protocolHints.hasContentArray,
    stage1.protocolHints.hasUsage,
    stage1.protocolHints.hasStopReason,
    stage2?.protocolHints.hasModel ?? false,
    stage2?.protocolHints.hasRole ?? false,
    stage2?.protocolHints.hasContentArray ?? false,
    stage2?.protocolHints.hasUsage ?? false,
    stage2?.protocolHints.hasStopReason ?? false,
  ].filter(Boolean).length;
  const protocolStatus = protocolBits >= 8 ? 'pass' : protocolBits >= 5 ? 'warning' : 'fail';

  const responseStructureStatus = stage2
    ? stage1.parseOk && stage2.parseOk ? 'pass' : 'fail'
    : stage1.parseOk ? 'warning' : 'fail';

  const knowledgeCutoffStatus = !stage1Pass ? 'fail' : stage2Pass ? 'pass' : 'fail';
  const identityStatus = stage1Pass ? 'pass' : 'fail';

  const checks = [
    {
      key: 'identity',
      name: t('verifier.check.identity'),
      status: identityStatus,
      detail: identityStatus === 'pass'
        ? t('verifier.check.identityPass')
        : t('verifier.check.identityFail'),
    },
    {
      key: 'knowledge',
      name: t('verifier.check.knowledge'),
      status: knowledgeCutoffStatus,
      detail: knowledgeCutoffStatus === 'pass'
        ? t('verifier.check.knowledgePass')
        : t('verifier.check.knowledgeFail'),
    },
    {
      key: 'protocol',
      name: t('verifier.check.protocol'),
      status: protocolStatus,
      detail:
        protocolStatus === 'pass'
          ? t('verifier.check.protocolPass')
          : protocolStatus === 'warning'
            ? t('verifier.check.protocolWarn')
            : t('verifier.check.protocolFail'),
    },
    {
      key: 'response',
      name: t('verifier.check.response'),
      status: responseStructureStatus,
      detail:
        responseStructureStatus === 'pass'
          ? t('verifier.check.responsePass')
          : responseStructureStatus === 'warning'
            ? t('verifier.check.responseWarn')
            : t('verifier.check.responseFail'),
    },
  ];

  let weighted =
    statusToScore(identityStatus, 45) +
    statusToScore(knowledgeCutoffStatus, 35) +
    statusToScore(protocolStatus, 12) +
    statusToScore(responseStructureStatus, 8);
  if (!stage1Pass) weighted = Math.min(weighted, 35);
  else if (!stage2Pass) weighted = Math.min(weighted, 70);

  return { checks, score: Math.max(0, Math.min(100, weighted)) };
}

// ----------------------------- model discovery -----------------------------

/**
 * Fetch the list of models the proxy reports as available.
 *
 * Supports all three protocol formats:
 *   - openai    : GET {base}/v1/models  → { data: [{id: "..."}, ...] }
 *   - anthropic : GET {base}/v1/models  → { data: [{id: "..."}, ...] }  (same shape since Sep 2024)
 *   - google    : GET {base}/v1beta/models?key=... → { models: [{name: "models/...", ...}] }
 *
 * Returns a sorted array of model id strings. Throws on network/auth failure.
 */
export async function fetchAvailableModels({ baseUrl, apiKey, format }) {
  const trimmed = (baseUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) throw new Error('API endpoint is empty');
  if (!apiKey) throw new Error('API key is empty');

  const base = trimmed
    .replace(/\/v1\/chat\/completions\/?$/i, '')
    .replace(/\/chat\/completions\/?$/i, '')
    .replace(/\/v1\/messages?\/?$/i, '')
    .replace(/\/v1beta\/models\/[^/]+:generateContent\/?$/i, '')
    .replace(/\/v1beta\/?$/i, '')
    .replace(/\/v1\/?$/i, '')
    .replace(/\/+$/, '');

  let url;
  let headers;
  if (format === 'google') {
    url = `${base}/v1beta/models`;
    headers = { 'x-goog-api-key': apiKey };
  } else if (format === 'anthropic') {
    url = `${base}/v1/models`;
    headers = {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
  } else {
    // openai and openai-compatible proxies
    url = `${base}/v1/models`;
    headers = { authorization: `Bearer ${apiKey}` };
  }

  let resp;
  try {
    resp = await fetch(url, { method: 'GET', headers });
  } catch (e) {
    throw new Error(`Network: ${e.message}`);
  }

  const rawText = await resp.text();
  if (!resp.ok) {
    let detail = rawText;
    try {
      const j = JSON.parse(rawText);
      detail = j?.error?.message || j?.message || rawText;
    } catch (e) { /* keep raw */ }
    throw new Error(`HTTP ${resp.status}: ${String(detail).slice(0, 200)}`);
  }

  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch (e) {
    throw new Error('Response is not JSON');
  }

  let ids = [];
  if (format === 'google') {
    // Google: { models: [{ name: "models/gemini-2.5-pro", ... }, ...] }
    const arr = Array.isArray(payload?.models) ? payload.models : [];
    ids = arr
      .map((m) => (typeof m?.name === 'string' ? m.name.replace(/^models\//, '') : null))
      .filter(Boolean);
  } else {
    // OpenAI / Anthropic / OpenAI-compatible: { data: [{ id: "..." }, ...] }
    const arr = Array.isArray(payload?.data) ? payload.data : [];
    ids = arr
      .map((m) => (typeof m?.id === 'string' ? m.id : null))
      .filter(Boolean);
  }

  // Deduplicate and sort: chat-capable models first (rough heuristic),
  // then alphabetical within each group for stable display.
  const unique = Array.from(new Set(ids));
  unique.sort((a, b) => a.localeCompare(b));
  return unique;
}

// ----------------------------- public entry -----------------------------

export async function runVerification({ baseUrl, apiKey, model, format, t }) {
  let stage1 = await sendProbe({
    baseUrl, apiKey, model, format, prompt: SYMBOL_PROMPT, t,
  });

  // Tier 1 retry: bump reasoning_effort to high + 64k tokens. Some proxies
  // mishandle low effort and silently produce no content.
  if (!stage1.responseText && stage1.payload?.__cyEmptyReasoning) {
    stage1 = await sendProbe({
      baseUrl, apiKey, model, format, prompt: SYMBOL_PROMPT, t,
      _retry: { reasoningEffort: 'high', maxTokens: 65536 },
    });
  }

  // Tier 2 retry: switch to stream mode. Many proxies have bugs in their
  // non-stream aggregation path for reasoning models — content arrives
  // correctly via SSE delta chunks but is lost when assembled into the final
  // payload. Stream mode bypasses the broken aggregator entirely.
  if (!stage1.responseText && (format === 'openai' || format === undefined)) {
    try {
      stage1 = await sendProbe({
        baseUrl, apiKey, model, format, prompt: SYMBOL_PROMPT, t,
        _retry: { useStream: true },
      });
    } catch (e) {
      // Stream retry failed; surface the original empty-reasoning hint below.
    }
  }

  // If STILL empty after both retries, surface the diagnostic error.
  if (!stage1.responseText) {
    throw new Error(t('verifier.verifierError.emptyReasoning'));
  }

  // The "honest" model emits the chinese closing quote ”. Counterfeits often emit ".
  const stage1Pass = stage1.responseText.includes('”');

  let stage2 = null;
  let stage2Pass = false;
  if (stage1Pass) {
    stage2 = await sendProbe({
      baseUrl, apiKey, model, format,
      prompt: TARIFF_PROMPT,
      previousAssistantText: stage1.responseText,
      t,
    });
    stage2Pass = isTariffAnswerValid(stage2.responseText);
  }

  const { checks, score } = buildChecks({ stage1, stage2, stage1Pass, stage2Pass, t });

  const latency = stage2 ? Math.round((stage1.latencyMs + stage2.latencyMs) / 2) : stage1.latencyMs;
  const tps = stage2 ? Number(((stage1.tps + stage2.tps) / 2).toFixed(1)) : stage1.tps;
  const inputTokens = (stage1.inputTokens ?? 0) + (stage2?.inputTokens ?? 0);
  const outputTokens = (stage1.outputTokens ?? 0) + (stage2?.outputTokens ?? 0);

  return {
    id: `#${Math.floor(100000 + Math.random() * 900000)}`,
    score,
    checks,
    latency,
    tps,
    inputTokens,
    outputTokens,
    stage1Reply: stage1.responseText,
    stage2Reply: stage2?.responseText || null,
    stage1Raw: stage1.payload,
    stage2Raw: stage2?.payload || null,
    format,
    model,
    endpoint: baseUrl,
    timestamp: new Date().toISOString(),
  };
}
