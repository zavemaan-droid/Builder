import { sendMessage, AIMessage, AIConfig } from './aiService';
import { getSharedLearnings, getPublicPatterns, getTrendingKnowledge } from './knowledgeService';

export interface CodeFile {
  path: string;
  content: string;
  language: string;
}

export interface UpgradeRequest {
  description: string;
  currentFiles?: CodeFile[];
  targetPlatform?: string;
}

export interface UpgradeResult {
  success: boolean;
  files: CodeFile[];
  explanation: string;
  error?: string;
}

const SYSTEM_PROMPT = `You are an expert full-stack developer and AI coding assistant. Your job is to:
1. Generate complete, production-ready code
2. Follow best practices and modern patterns
3. Write clean, maintainable code
4. Include proper error handling
5. Optimize for the target platform
6. Learn from community knowledge and patterns

When generating code:
- Return ONLY valid code, no explanations in code blocks
- Use TypeScript for all JavaScript/React Native files
- Follow React Native and Expo best practices
- Ensure code is Android-compatible (SDK 55)
- Include all necessary imports
- Apply relevant community patterns and learnings when available

Format your response as JSON:
{
  "files": [
    {
      "path": "path/to/file.tsx",
      "content": "file contents here",
      "language": "typescript"
    }
  ],
  "explanation": "Brief explanation of changes"
}`;

export async function generateCode(
  request: UpgradeRequest,
  config: AIConfig
): Promise<UpgradeResult> {
  try {
    const userPrompt = await buildPrompt(request);

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    const response = await sendMessage(messages, config);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      files: parsed.files || [],
      explanation: parsed.explanation || 'Code generated successfully',
    };
  } catch (error) {
    return {
      success: false,
      files: [],
      explanation: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function buildPrompt(request: UpgradeRequest): Promise<string> {
  let prompt = `Generate code for: ${request.description}\n\n`;

  if (request.targetPlatform) {
    prompt += `Target Platform: ${request.targetPlatform}\n\n`;
  }

  try {
    const [learnings, patterns, knowledge] = await Promise.all([
      getSharedLearnings().catch(() => []),
      getPublicPatterns('react-native').catch(() => []),
      getTrendingKnowledge().catch(() => []),
    ]);

    if (learnings.length > 0) {
      prompt += `Community Learnings (apply if relevant):\n`;
      learnings.slice(0, 3).forEach(l => {
        prompt += `- ${l.context}: ${l.solution}\n`;
      });
      prompt += '\n';
    }

    if (patterns.length > 0) {
      prompt += `Available Patterns:\n`;
      patterns.slice(0, 3).forEach(p => {
        prompt += `- ${p.name}: ${p.description}\n`;
      });
      prompt += '\n';
    }

    if (knowledge.length > 0) {
      prompt += `Community Knowledge:\n`;
      knowledge.slice(0, 2).forEach(k => {
        prompt += `- ${k.title}: ${k.description}\n`;
      });
      prompt += '\n';
    }
  } catch (error) {
    console.log('Could not fetch community data, proceeding without it');
  }

  if (request.currentFiles && request.currentFiles.length > 0) {
    prompt += 'Current files:\n\n';
    request.currentFiles.forEach(file => {
      prompt += `File: ${file.path}\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n\n`;
    });
  }

  prompt += 'Generate complete, working code files.';

  return prompt;
}

export async function improvePlatform(
  feature: string,
  config: AIConfig
): Promise<UpgradeResult> {
  const request: UpgradeRequest = {
    description: `Add or improve the following feature in the AI Builder Platform: ${feature}`,
    targetPlatform: 'React Native (Expo SDK 55)',
  };

  return generateCode(request, config);
}

export async function fixBug(
  bugDescription: string,
  affectedFiles: CodeFile[],
  config: AIConfig
): Promise<UpgradeResult> {
  const request: UpgradeRequest = {
    description: `Fix the following bug: ${bugDescription}`,
    currentFiles: affectedFiles,
    targetPlatform: 'React Native (Expo SDK 55)',
  };

  return generateCode(request, config);
}

export async function refactorCode(
  targetFiles: CodeFile[],
  goal: string,
  config: AIConfig
): Promise<UpgradeResult> {
  const request: UpgradeRequest = {
    description: `Refactor code to: ${goal}`,
    currentFiles: targetFiles,
    targetPlatform: 'React Native (Expo SDK 55)',
  };

  return generateCode(request, config);
}
