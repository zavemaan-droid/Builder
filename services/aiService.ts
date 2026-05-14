export type AIProvider = 'openrouter' | 'groq' | 'huggingface';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

const DEFAULT_MODELS = {
  openrouter: 'meta-llama/llama-3.1-70b-instruct',
  groq: 'llama-3.1-70b-versatile',
  huggingface: 'meta-llama/Meta-Llama-3-70B-Instruct',
};

const ENDPOINTS = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  huggingface: 'https://api-inference.huggingface.co/models',
};

export async function sendMessage(
  messages: AIMessage[],
  config: AIConfig
): Promise<string> {
  const { provider, apiKey, model } = config;
  const selectedModel = model || DEFAULT_MODELS[provider];

  try {
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
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } else if (provider === 'huggingface') {
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

      const data = await response.json();
      return data[0].generated_text;
    }

    throw new Error('Unsupported provider');
  } catch (error) {
    throw new Error(`AI Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const PROVIDER_INFO = {
  openrouter: {
    name: 'OpenRouter',
    description: 'Access to 100+ models including Llama, Mistral, and more',
    signupUrl: 'https://openrouter.ai/',
    free: true,
    freeLimit: 'Limited free credits, then pay-as-you-go',
  },
  groq: {
    name: 'Groq',
    description: 'Ultra-fast inference with Llama models',
    signupUrl: 'https://console.groq.com/',
    free: true,
    freeLimit: 'Generous free tier with rate limits',
  },
  huggingface: {
    name: 'Hugging Face',
    description: 'Open-source models via Inference API',
    signupUrl: 'https://huggingface.co/',
    free: true,
    freeLimit: 'Free tier available with rate limits',
  },
};
