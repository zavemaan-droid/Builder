import { supabase } from '@/services/supabaseClient';
import { sendMessage, AIMessage, AIConfig } from '@/services/aiService';
import { getSharedLearnings, getTrendingKnowledge } from '@/services/knowledgeService';

export interface Critique {
  id: string;
  critique_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  file_path: string;
  line_number: number;
  issue_title: string;
  issue_description: string;
  suggested_fix: string;
  is_resolved: boolean;
  created_at: string;
}

export interface CodeAnalysis {
  critiques: Critique[];
  overall_score: number;
  suggestions: string[];
  best_practices: string[];
}

const CRITIQUE_SYSTEM_PROMPT = `You are an expert code reviewer and security analyst. Your job is to:
1. Identify bugs, security vulnerabilities, and code smells
2. Suggest performance improvements
3. Recommend best practices
4. Point out accessibility issues
5. Highlight maintainability concerns

Be thorough but constructive. Focus on actionable feedback.

Format your response as JSON:
{
  "critiques": [
    {
      "type": "security|performance|bug|style|accessibility",
      "severity": "info|warning|error|critical",
      "file_path": "path/to/file.tsx",
      "line_number": 42,
      "title": "Brief issue title",
      "description": "Detailed explanation",
      "suggested_fix": "How to fix it"
    }
  ],
  "overall_score": 85,
  "suggestions": ["General improvement 1", "General improvement 2"],
  "best_practices": ["Best practice 1", "Best practice 2"]
}`;

export async function analyzeCode(
  projectId: string,
  files: Array<{ path: string; content: string }>,
  config: AIConfig
): Promise<CodeAnalysis> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const [learnings, knowledge] = await Promise.all([
    getSharedLearnings().catch(() => []),
    getTrendingKnowledge().catch(() => []),
  ]);

  let userPrompt = 'Analyze the following code for issues:\n\n';

  files.forEach(file => {
    userPrompt += `File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
  });

  if (learnings.length > 0) {
    userPrompt += '\nCommunity Learnings to consider:\n';
    learnings.slice(0, 3).forEach(l => {
      userPrompt += `- ${l.context}: ${l.solution}\n`;
    });
  }

  if (knowledge.length > 0) {
    userPrompt += '\nBest practices from community:\n';
    knowledge.slice(0, 3).forEach(k => {
      userPrompt += `- ${k.title}\n`;
    });
  }

  const messages: AIMessage[] = [
    { role: 'system', content: CRITIQUE_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const response = await sendMessage(messages, config);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid response format');
  }

  const analysis = JSON.parse(jsonMatch[0]);

  for (const critique of analysis.critiques) {
    await supabase.from('ai_critiques').insert({
      project_id: projectId,
      user_id: userId,
      critique_type: critique.type,
      severity: critique.severity,
      file_path: critique.file_path,
      line_number: critique.line_number,
      issue_title: critique.title,
      issue_description: critique.description,
      suggested_fix: critique.suggested_fix,
    });
  }

  return {
    critiques: analysis.critiques,
    overall_score: analysis.overall_score,
    suggestions: analysis.suggestions,
    best_practices: analysis.best_practices,
  };
}

export async function getProjectCritiques(projectId: string): Promise<Critique[]> {
  const { data, error } = await supabase
    .from('ai_critiques')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_resolved', false)
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function resolveCritique(critiqueId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_critiques')
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', critiqueId);

  if (error) throw error;
}

export async function getCritiqueSummary(projectId: string): Promise<{
  total: number;
  critical: number;
  errors: number;
  warnings: number;
  info: number;
}> {
  const critiques = await getProjectCritiques(projectId);

  return {
    total: critiques.length,
    critical: critiques.filter(c => c.severity === 'critical').length,
    errors: critiques.filter(c => c.severity === 'error').length,
    warnings: critiques.filter(c => c.severity === 'warning').length,
    info: critiques.filter(c => c.severity === 'info').length,
  };
}

export async function runAutoCritique(
  projectId: string,
  files: Array<{ path: string; content: string }>,
  config: AIConfig
): Promise<void> {
  await analyzeCode(projectId, files, config);
}
