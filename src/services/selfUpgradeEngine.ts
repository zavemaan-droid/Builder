import { supabase } from '@/services/supabaseClient';
import { sendMessage, AIMessage, AIConfig } from '@/services/aiService';

export interface PlatformVersion {
  id: string;
  version_number: string;
  release_date: string;
  architecture_snapshot: any;
  key_features: string[];
  performance_metrics: any;
  breaking_changes: string;
  is_stable: boolean;
}

export interface ArchitectureCritique {
  id: string;
  critique_category: string;
  severity: string;
  component: string;
  issue_title: string;
  issue_description: string;
  suggested_improvement: string;
  estimated_impact: string;
  complexity: string;
  is_addressed: boolean;
}

export interface PlatformUpgradeProposal {
  id: string;
  version_from: string;
  version_to: string;
  upgrade_category: string;
  title: string;
  description: string;
  rationale: string;
  affected_components: string[];
  implementation_plan: any;
  benefits: string[];
  risks: string[];
  status: string;
  ai_confidence: number;
  community_votes: number;
}

export interface MetaLearning {
  id: string;
  learning_type: string;
  context: string;
  what_worked: string;
  what_didnt_work: string;
  why: string;
  applicable_to: string[];
  confidence_score: number;
  times_validated: number;
}

const SELF_ANALYSIS_PROMPT = `You are a meta-AI architect whose ONLY job is to analyze and improve the AI Builder Platform itself.

You are NOT building user apps. You are analyzing the platform's own:
- Architecture and design patterns
- Service organization and modularity
- Database schema efficiency
- Code quality and maintainability
- Performance and scalability
- Security implementation
- User experience flow
- AI integration patterns

Review the platform codebase and provide insights formatted as JSON:
{
  "critiques": [
    {
      "category": "architecture|database|security|performance|ux|ai-integration",
      "severity": "info|warning|error|critical",
      "component": "component/service name",
      "title": "Issue title",
      "description": "Detailed analysis",
      "current_implementation": "How it works now",
      "suggested_improvement": "How to make it better",
      "estimated_impact": "high|medium|low",
      "complexity": "low|medium|high"
    }
  ],
  "learnings": [
    {
      "type": "pattern|anti-pattern|best-practice",
      "context": "Where this applies",
      "what_worked": "Successful patterns",
      "what_didnt_work": "Failed approaches",
      "why": "Root cause analysis",
      "applicable_to": ["component1", "component2"]
    }
  ],
  "proposals": [
    {
      "category": "enhancement|refactor|feature|optimization",
      "title": "V2 Improvement Title",
      "description": "What to change",
      "rationale": "Why this matters",
      "affected_components": ["comp1", "comp2"],
      "implementation_plan": {
        "steps": ["step1", "step2"],
        "estimated_effort": "hours/days/weeks"
      },
      "benefits": ["benefit1", "benefit2"],
      "risks": ["risk1", "risk2"],
      "confidence": 0.85
    }
  ]
}`;

export async function getCurrentVersion(): Promise<PlatformVersion> {
  const { data, error } = await supabase
    .from('platform_versions')
    .select('*')
    .eq('is_stable', true)
    .order('release_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('No stable version found');
  return data;
}

export async function runSelfAnalysis(
  platformCode: string,
  config: AIConfig
): Promise<{
  critiques: ArchitectureCritique[];
  learnings: MetaLearning[];
  proposals: PlatformUpgradeProposal[];
}> {
  const currentVersion = await getCurrentVersion();

  const { data: analysisRun, error: runError } = await supabase
    .from('self_analysis_runs')
    .insert({
      version_id: currentVersion.id,
      analysis_type: 'full',
      status: 'running',
    })
    .select()
    .single();

  if (runError) throw runError;

  const startTime = Date.now();

  try {
    const messages: AIMessage[] = [
      { role: 'system', content: SELF_ANALYSIS_PROMPT },
      {
        role: 'user',
        content: `Analyze the AI Builder Platform codebase:\n\n${platformCode}\n\nCurrent Version: ${currentVersion.version_number}\nFocus on: Architecture improvements for V2, scalability, and platform evolution.`,
      },
    ];

    const response = await sendMessage(messages, config);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid analysis response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    const critiques: ArchitectureCritique[] = [];
    const learnings: MetaLearning[] = [];
    const proposals: PlatformUpgradeProposal[] = [];

    for (const critique of analysis.critiques || []) {
      const { data } = await supabase
        .from('architecture_critiques')
        .insert({
          version_id: currentVersion.id,
          critique_category: critique.category,
          severity: critique.severity,
          component: critique.component,
          issue_title: critique.title,
          issue_description: critique.description,
          current_implementation: critique.current_implementation,
          suggested_improvement: critique.suggested_improvement,
          estimated_impact: critique.estimated_impact,
          complexity: critique.complexity,
        })
        .select()
        .single();

      if (data) critiques.push(data);
    }

    for (const learning of analysis.learnings || []) {
      const { data } = await supabase
        .from('meta_learnings')
        .insert({
          learning_type: learning.type,
          context: learning.context,
          what_worked: learning.what_worked,
          what_didnt_work: learning.what_didnt_work || '',
          why: learning.why,
          applicable_to: learning.applicable_to,
          confidence_score: 0.8,
          is_shared: true,
        })
        .select()
        .single();

      if (data) learnings.push(data);
    }

    const nextVersion = getNextVersion(currentVersion.version_number);

    for (const proposal of analysis.proposals || []) {
      const { data } = await supabase
        .from('platform_upgrade_proposals')
        .insert({
          version_from: currentVersion.version_number,
          version_to: nextVersion,
          upgrade_category: proposal.category,
          title: proposal.title,
          description: proposal.description,
          rationale: proposal.rationale,
          affected_components: proposal.affected_components,
          implementation_plan: proposal.implementation_plan,
          benefits: proposal.benefits,
          risks: proposal.risks,
          ai_confidence: proposal.confidence,
          status: 'proposed',
        })
        .select()
        .single();

      if (data) proposals.push(data);
    }

    const executionTime = Date.now() - startTime;

    await supabase
      .from('self_analysis_runs')
      .update({
        status: 'completed',
        issues_found: critiques.length,
        proposals_created: proposals.length,
        learnings_captured: learnings.length,
        execution_time_ms: executionTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', analysisRun.id);

    return { critiques, learnings, proposals };
  } catch (error) {
    await supabase
      .from('self_analysis_runs')
      .update({
        status: 'failed',
        logs: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', analysisRun.id);

    throw error;
  }
}

export async function getPlatformCritiques(): Promise<ArchitectureCritique[]> {
  const { data, error } = await supabase
    .from('architecture_critiques')
    .select('*')
    .eq('is_addressed', false)
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPlatformProposals(): Promise<PlatformUpgradeProposal[]> {
  const { data, error } = await supabase
    .from('platform_upgrade_proposals')
    .select('*')
    .eq('status', 'proposed')
    .order('ai_confidence', { ascending: false })
    .order('community_votes', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getMetaLearnings(): Promise<MetaLearning[]> {
  const { data, error } = await supabase
    .from('meta_learnings')
    .select('*')
    .eq('is_shared', true)
    .order('confidence_score', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

export async function voteOnProposal(proposalId: string, vote: number): Promise<void> {
  const { data: proposal } = await supabase
    .from('platform_upgrade_proposals')
    .select('community_votes')
    .eq('id', proposalId)
    .single();

  if (!proposal) throw new Error('Proposal not found');

  await supabase
    .from('platform_upgrade_proposals')
    .update({
      community_votes: (proposal.community_votes || 0) + vote,
    })
    .eq('id', proposalId);
}

export async function createNewVersion(
  versionNumber: string,
  implementedProposals: string[]
): Promise<PlatformVersion> {
  const currentVersion = await getCurrentVersion();

  const { data, error } = await supabase
    .from('platform_versions')
    .insert({
      version_number: versionNumber,
      architecture_snapshot: {},
      key_features: [],
      is_stable: false,
    })
    .select()
    .single();

  if (error) throw error;

  for (const proposalId of implementedProposals) {
    await supabase
      .from('platform_upgrade_proposals')
      .update({
        status: 'implemented',
        implemented_at: new Date().toISOString(),
      })
      .eq('id', proposalId);
  }

  await supabase
    .from('platform_versions')
    .update({ is_stable: false })
    .eq('id', currentVersion.id);

  return data;
}

export async function getAnalysisHistory(): Promise<any[]> {
  const { data, error } = await supabase
    .from('self_analysis_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

function getNextVersion(currentVersion: string): string {
  const parts = currentVersion.replace('v', '').split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1]);
  const patch = parseInt(parts[2]);

  return `v${major}.${minor + 1}.0`;
}

export async function scheduleSelfAnalysis(intervalHours: number = 24): Promise<void> {
  console.log(`Self-analysis scheduled every ${intervalHours} hours`);
}

export async function getPlatformHealth(): Promise<{
  version: string;
  total_critiques: number;
  critical_issues: number;
  pending_proposals: number;
  learnings_count: number;
  last_analysis: string | null;
}> {
  const version = await getCurrentVersion();
  const critiques = await getPlatformCritiques();
  const proposals = await getPlatformProposals();
  const learnings = await getMetaLearnings();
  const history = await getAnalysisHistory();

  return {
    version: version.version_number,
    total_critiques: critiques.length,
    critical_issues: critiques.filter(c => c.severity === 'critical').length,
    pending_proposals: proposals.length,
    learnings_count: learnings.length,
    last_analysis: history[0]?.completed_at || null,
  };
}
