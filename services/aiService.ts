// Updated for Pollinations API v0.3.0
// Base URL: https://gen.pollinations.ai
// Get your API key: https://enter.pollinations.ai

export type AIProvider = 'pollinations' | 'openrouter' | 'groq' | 'huggingface';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
}

// ─── Pollinations Models (80+ available via gen.pollinations.ai) ─────────
export const POLLINATIONS_TEXT_MODELS = [
  { id: 'openai',               label: 'OpenAI (Default)'       },
  { id: 'openai-fast',          label: 'OpenAI Fast'            },
  { id: 'openai-large',         label: 'OpenAI Large'           },
  { id: 'gpt-5.5',              label: 'GPT-5.5'                },
  { id: 'claude-fast',          label: 'Claude Fast'            },
  { id: 'claude',               label: 'Claude (Sonnet)'        },
  { id: 'claude-large',         label: 'Claude Large'           },
  { id: 'claude-opus-4.7',      label: 'Claude Opus 4.7'        },
  { id: 'gemini',               label: 'Gemini'                 },
  { id: 'gemini-fast',          label: 'Gemini Fast'            },
  { id: 'gemini-large',         label: 'Gemini Large'           },
  { id: 'gemini-search',        label: 'Gemini Search'          },
  { id: 'deepseek',             label: 'DeepSeek'               },
  { id: 'deepseek-pro',         label: 'DeepSeek Pro'           },
  { id: 'grok',                 label: 'Grok'                   },
  { id: 'grok-large',           label: 'Grok Large'             },
  { id: 'perplexity-fast',      label: 'Perplexity Fast'        },
  { id: 'perplexity-reasoning', label: 'Perplexity Reasoning'   },
  { id: 'mistral',              label: 'Mistral'                },
  { id: 'mistral-large',        label: 'Mistral Large'          },
  { id: 'llama',                label: 'Llama'                  },
  { id: 'llama-maverick',       label: 'Llama Maverick'         },
] as const;

export const POLLINATIONS_TTS_VOICES = [
  'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
] as const;

// ─── Endpoint map ────────────────────────────────────────────────────────
const DEFAULT_MODELS: Record<string, string> = {
  pollinations: 'openai',
  openrouter:   'meta-llama/llama-3.1-70b-instruct',
  groq:         'llama-3.1-70b-versatile',
  huggingface:  'meta-llama/Meta-Llama-3-70B-Instruct',
};

const ENDPOINTS: Record<string, string> = {
  // NEW: gen.pollinations.ai — OpenAI-compatible, supports 80+ models
  pollinations: 'https://gen.pollinations.ai/v1/chat/completions',
  openrouter:   'https://openrouter.ai/api/v1/chat/completions',
  groq:         'https://api.groq.com/openai/v1/chat/completions',
  huggingface:  'https://api-inference.huggingface.co/models',
};

// ─── Main sendMessage ────────────────────────────────────────────────────
export async function sendMessage(
  messages: AIMessage[],
  config: AIConfig
): Promise<string> {
  const { provider, apiKey, model } = config;
  const selectedModel = model || DEFAULT_MODELS[provider] || 'openai';

  // ── Pollinations (primary) ────────────────────────────────────────────
  if (provider === 'pollinations') {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    // sk_ = server-side secret (no rate limits)
    // pk_ = publishable client key (1 pollen/IP/hour)
    // Anonymous works too, but limited to 1 req/15s
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(ENDPOINTS.pollinations, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as any;
      throw new Error(err?.error?.message || `Pollinations error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.choices[0].message.content;
  }

  // ── OpenRouter / Groq ─────────────────────────────────────────────────
  if (provider === 'openrouter' || provider === 'groq') {
    const response = await fetch(ENDPOINTS[provider], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(provider === 'openrouter' && {
          'HTTP-Referer': 'https://ai-builder.app',
          'X-Title': 'AI Builder Platform',
        }),
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json() as any;
    return data.choices[0].message.content;
  }

  // ── HuggingFace ───────────────────────────────────────────────────────
  if (provider === 'huggingface') {
    const response = await fetch(`${ENDPOINTS.huggingface}/${selectedModel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
        parameters: {
          max_new_tokens: 4096,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('HuggingFace API request failed');
    }

    const data = await response.json() as any;
    return data[0].generated_text;
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

// ─── Pollinations TTS ─────────────────────────────────────────────────────
// Returns a direct audio URL — use in <audio src="..."> or fetch() to play
export function pollinationsTTS(
  text: string,
  voice: typeof POLLINATIONS_TTS_VOICES[number] = 'nova',
  apiKey?: string
): string {
  const encoded = encodeURIComponent(text);
  const keyParam = apiKey ? `&key=${apiKey}` : '';
  return `https://gen.pollinations.ai/audio/${encoded}?voice=${voice}&model=openai-audio${keyParam}`;
}

// ─── Pollinations Image Generation ────────────────────────────────────────
// Returns a direct image URL — use in <img src="..."> or fetch() to download
export function pollinationsImage(
  prompt: string,
  options: {
    width?: number;
    height?: number;
    model?: string;
    seed?: number;
    apiKey?: string;
  } = {}
): string {
  const { width = 1024, height = 1024, model = 'flux', seed, apiKey } = options;
  const encoded = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    model,
    ...(seed !== undefined && { seed: String(seed) }),
    ...(apiKey && { key: apiKey }),
  });
  return `https://gen.pollinations.ai/image/${encoded}?${params}`;
}

// ─── Provider info for Settings screen ────────────────────────────────────
export const PROVIDER_INFO = {
  pollinations: {
    name: 'Pollinations.ai',
    description: 'Free AI for text, images, voice & video. 80+ models: GPT, Claude, Gemini, Grok, DeepSeek.',
    signupUrl: 'https://enter.pollinations.ai',
    apiKeyRequired: false,
    freeLimit: 'Anonymous: 1 req/15s | With API key: up to unlimited (sk_ tier)',
    keyTypes: {
      'sk_': 'Server-side secret key — no rate limits',
      'pk_': 'Publishable client key — 1 pollen/IP/hour',
    },
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Access to 100+ models including Llama, Mistral, and more',
    signupUrl: 'https://openrouter.ai/',
    apiKeyRequired: true,
    freeLimit: 'Limited free credits, then pay-as-you-go',
  },
  groq: {
    name: 'Groq',
    description: 'Ultra-fast inference with Llama models',
    signupUrl: 'https://console.groq.com/',
    apiKeyRequired: true,
    freeLimit: 'Generous free tier',
  },
  huggingface: {
    name: 'HuggingFace',
    description: 'Open source models via HuggingFace Inference API',
    signupUrl: 'https://huggingface.co/',
    apiKeyRequired: true,
    freeLimit: 'Free tier available',
  },
};
