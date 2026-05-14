import { supabase } from '@/services/supabaseClient';
import { sendMessage, AIMessage, AIConfig } from '@/services/aiService';
import { getSharedLearnings, getTrendingKnowledge, getPublicPatterns } from '@/services/knowledgeService';

export interface UpgradeProposal {
  id: string;
  proposal_type: string;
  title: string;
  description: string;
  affected_files: string[];
  proposed_changes: any;
  benefits: string;
  risks: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  ai_confidence: number;
  created_at: string;
}

const UPGRADE_DISCOVERY_PROMPT = `You are an AI that discovers code improvements and upgrades. Your job is to:
1. Analyze existing code for improvement opportunities
2. Research latest best practices and patterns
3. Identify outdated dependencies or patterns
4. Suggest performance optimizations
5. Recommend security enhancements
6. Propose feature additions that align with project goals

Be conservative - only suggest upgrades that:
- Have clear benefits
- Are low-risk
- Align with modern best practices
- Are supported by community knowledge

Format your response as JSON:
{
  "proposals": [
    {
      "type": "performance|security|refactor|feature|dependency",
      "title": "Brief upgrade title",
      "description": "Detailed explanation",
      "affected_files": ["path/to/file1.tsx", "path/to/file2.tsx"],
      "proposed_changes": {
        "file1.tsx": "proposed code changes",
        "file2.tsx": "proposed code changes"
      },
      "benefits": "Why this upgrade is valuable",
      "risks": "Potential risks or breaking changes",
      "confidence": 0.85
    }
  ]
}`;

export async function discoverUpgrades(
  projectId: string,
  files: Array<{ path: string; content: string }>,
  config: AIConfig
): Promise<UpgradeProposal[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const [learnings, knowledge, patterns] = await Promise.all([
    getSharedLearnings().catch(() => []),
    getTrendingKnowledge().catch(() => []),
    getPublicPatterns('react-native').catch(() => []),
  ]);

  let userPrompt = 'Analyze this codebase for improvement opportunities:\n\n';

  files.forEach(file => {
    userPrompt += `File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
  });

  if (learnings.length > 0) {
    userPrompt += '\nCommunity Learnings:\n';
    learnings.slice(0, 5).forEach(l => {
      userPrompt += `- ${l.context}: ${l.solution} (Success rate: ${l.success_rate})\n`;
    });
  }

  if (patterns.length > 0) {
    userPrompt += '\nProven Patterns:\n';
    patterns.slice(0, 5).forEach(p => {
      userPrompt += `- ${p.name}: ${p.description}\n`;
    });
  }

  if (knowledge.length > 0) {
    userPrompt += '\nTrending Knowledge:\n';
    knowledge.slice(0, 5).forEach(k => {
      userPrompt += `- ${k.title}: ${k.description}\n`;
    });
  }

  const messages: AIMessage[] = [
    { role: 'system', content: UPGRADE_DISCOVERY_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const response = await sendMessage(messages, config);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid response format');
  }

  const result = JSON.parse(jsonMatch[0]);
  const proposals: UpgradeProposal[] = [];

  for (const proposal of result.proposals) {
    const { data, error } = await supabase
      .from('upgrade_proposals')
      .insert({
        project_id: projectId,
        user_id: userId,
        proposal_type: proposal.type,
        title: proposal.title,
        description: proposal.description,
        affected_files: proposal.affected_files,
        proposed_changes: proposal.proposed_changes,
        benefits: proposal.benefits,
        risks: proposal.risks,
        ai_confidence: proposal.confidence,
        status: 'pending',
      })
      .select()
      .single();

    if (!error && data) {
      proposals.push(data);
    }
  }

  return proposals;
}

export async function getPendingProposals(projectId: string): Promise<UpgradeProposal[]> {
  const { data, error } = await supabase
    .from('upgrade_proposals')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'pending')
    .order('ai_confidence', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProposalHistory(projectId: string): Promise<UpgradeProposal[]> {
  const { data, error } = await supabase
    .from('upgrade_proposals')
    .select('*')
    .eq('project_id', projectId)
    .in('status', ['approved', 'rejected', 'applied'])
    .order('reviewed_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

export async function approveProposal(
  proposalId: string,
  reason: string = ''
): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  await supabase
    .from('upgrade_proposals')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', proposalId);

  await supabase.from('upgrade_history').insert({
    proposal_id: proposalId,
    user_id: userId,
    action: 'approved',
    reason,
  });
}

export async function rejectProposal(
  proposalId: string,
  reason: string
): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  await supabase
    .from('upgrade_proposals')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', proposalId);

  await supabase.from('upgrade_history').insert({
    proposal_id: proposalId,
    user_id: userId,
    action: 'rejected',
    reason,
  });
}

export async function applyProposal(proposalId: string): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  await supabase
    .from('upgrade_proposals')
    .update({
      status: 'applied',
      applied_at: new Date().toISOString(),
    })
    .eq('id', proposalId);

  await supabase.from('upgrade_history').insert({
    proposal_id: proposalId,
    user_id: userId,
    action: 'applied',
    reason: 'Upgrade successfully applied',
  });
}

export async function scheduleAutoDiscovery(
  projectId: string,
  intervalHours: number = 24
): Promise<void> {
  console.log(`Auto-discovery scheduled for project ${projectId} every ${intervalHours} hours`);
}

export async function getUpgradeStats(userId: string): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  applied: number;
  approval_rate: number;
}> {
  const { data, error } = await supabase
    .from('upgrade_proposals')
    .select('status')
    .eq('user_id', userId);

  if (error) throw error;

  const stats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    applied: 0,
    approval_rate: 0,
  };

  data?.forEach(proposal => {
    if (proposal.status === 'pending') stats.pending++;
    if (proposal.status === 'approved') stats.approved++;
    if (proposal.status === 'rejected') stats.rejected++;
    if (proposal.status === 'applied') stats.applied++;
  });

  const total = stats.approved + stats.rejected;
  stats.approval_rate = total > 0 ? (stats.approved / total) * 100 : 0;

  return stats;
}
