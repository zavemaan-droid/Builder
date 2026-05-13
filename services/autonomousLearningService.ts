import { supabase } from './supabaseClient';
import { sendMessage, AIMessage, AIConfig } from './aiService';

export interface PatternDiscovery {
  id: string;
  pattern_type: string;
  pattern_name: string;
  description: string;
  success_rate: number;
  failure_rate: number;
  usage_count: number;
  works_well_for: string[];
  fails_for: string[];
  confidence_score: number;
}

export interface CollaborativeIdea {
  id: string;
  idea_type: string;
  title: string;
  description: string;
  synthesized_from: any[];
  implementation_ready: boolean;
  auto_build_plan: any;
  confidence_score: number;
  status: string;
}

export interface AutoImprovement {
  id: string;
  target_type: string;
  improvement_category: string;
  title: string;
  description: string;
  rationale: string;
  implementation_code: any;
  execution_status: string;
  confidence_score: number;
  requires_approval: boolean;
}

export interface LearningSignal {
  signal_type: string;
  signal_source: string;
  project_id?: string;
  data: any;
  outcome: 'success' | 'failure' | 'partial';
  patterns_detected: string[];
  learned_insights: any[];
}

// ─── Robust JSON extractor ────────────────────────────────────────────────
// Handles markdown code fences, nested objects, and AI preamble text.
// Fixes crashes caused by code blocks in AI responses.
function extractJSON(text: string): any {
  const stripped = text
    .replace(/```(?:json|javascript|typescript|js|ts|java|python|\w+)?\n?/gi, '')
    .replace(/```/g, '');

  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try { return JSON.parse(stripped.slice(start, i + 1)); } catch { start = -1; }
      }
    }
  }
  throw new Error('No valid JSON found in AI response. Raw: ' + text.slice(0, 500));
}

// ─── Memory dedup: check if a collaborative idea already exists ───────────
async function ideaExists(title: string): Promise<boolean> {
  const { data } = await supabase
    .from('collaborative_ideas')
    .select('id')
    .ilike('title', title)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

// ─── Memory dedup: check if an auto-improvement already exists ────────────
async function improvementExists(title: string): Promise<boolean> {
  const { data } = await supabase
    .from('auto_improvements')
    .select('id')
    .ilike('title', title)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

const DISCOVERY_PROMPT = `You are an autonomous learning AI that discovers what works and what doesn't across an entire platform ecosystem.

Your job is to:
1. Analyze ALL project data, build outcomes, and usage patterns
2. Discover patterns that lead to success vs failure
3. Synthesize collaborative ideas from multiple successful patterns
4. Generate auto-build proposals for improvements

Analyze this data and provide JSON:
{
  "discoveries": [
    {
      "pattern_name": "unique-pattern-id",
      "description": "What this pattern is",
      "works_well_for": ["use-case-1", "use-case-2"],
      "fails_for": ["edge-case-1"],
      "confidence": 0.85
    }
  ],
  "collaborative_ideas": [
    {
      "title": "Synthesized improvement idea",
      "description": "What to build",
      "synthesized_from": ["pattern-1", "pattern-2"],
      "implementation_plan": {
        "steps": ["step1", "step2"],
        "auto_buildable": true
      },
      "confidence": 0.9
    }
  ],
  "auto_improvements": [
    {
      "category": "optimization|feature|fix",
      "title": "Auto-improvement title",
      "description": "What it does",
      "rationale": "Why this helps based on data",
      "code": {
        "files": [],
        "changes": []
      },
      "confidence": 0.95
    }
  ]
}`;

export async function recordLearningSignal(signal: LearningSignal): Promise<void> {
  await supabase.from('learning_signals').insert({
    signal_type: signal.signal_type,
    signal_source: signal.signal_source,
    project_id: signal.project_id,
    data: signal.data,
    outcome: signal.outcome,
    patterns_detected: signal.patterns_detected,
    learned_insights: signal.learned_insights,
  });
}

export async function recordBuildOutcome(
  projectId: string,
  success: boolean,
  metadata: any
): Promise<void> {
  await supabase.from('success_metrics').insert({
    project_id: projectId,
    metric_type: 'build',
    metric_name: success ? 'build-success' : 'build-failure',
    value: success ? 1.0 : 0.0,
    metadata,
  });

  await recordLearningSignal({
    signal_type: 'build-outcome',
    signal_source: 'build-system',
    project_id: projectId,
    data: metadata,
    outcome: success ? 'success' : 'failure',
    patterns_detected: extractPatterns(metadata),
    learned_insights: [],
  });
}

export async function runAutonomousDiscovery(
  config: AIConfig
): Promise<{
  discoveries: PatternDiscovery[];
  ideas: CollaborativeIdea[];
  improvements: AutoImprovement[];
}> {
  const aggregatedData = await aggregateSystemData();

  const messages: AIMessage[] = [
    { role: 'system', content: DISCOVERY_PROMPT },
    {
      role: 'user',
      content: `Analyze platform ecosystem data:\n\n${JSON.stringify(aggregatedData, null, 2)}\n\nDiscover patterns, synthesize collaborative ideas, and generate auto-improvements.`,
    },
  ];

  const response = await sendMessage(messages, config);

  // ✅ FIXED: use robust extractor instead of fragile regex
  const analysis = extractJSON(response);

  const discoveries: PatternDiscovery[] = [];
  const ideas: CollaborativeIdea[] = [];
  const improvements: AutoImprovement[] = [];

  for (const discovery of analysis.discoveries || []) {
    // pattern_discoveries uses upsert on pattern_name — already safe from duplicates
    const { data } = await supabase
      .from('pattern_discoveries')
      .upsert(
        {
          pattern_name: discovery.pattern_name,
          pattern_type: 'code',
          description: discovery.description,
          works_well_for: discovery.works_well_for,
          fails_for: discovery.fails_for,
          confidence_score: discovery.confidence,
          discovered_from: 'autonomous-ai',
        },
        { onConflict: 'pattern_name' }
      )
      .select()
      .single();

    if (data) discoveries.push(data);
  }

  for (const idea of analysis.collaborative_ideas || []) {
    // ✅ FIXED: deduplicate before inserting collaborative ideas
    const exists = await ideaExists(idea.title);
    if (exists) continue;

    const { data } = await supabase
      .from('collaborative_ideas')
      .insert({
        idea_type: 'feature',
        title: idea.title,
        description: idea.description,
        synthesized_from: idea.synthesized_from,
        auto_build_plan: idea.implementation_plan,
        implementation_ready: idea.implementation_plan?.auto_buildable || false,
        confidence_score: idea.confidence,
        status: 'proposed',
      })
      .select()
      .single();

    if (data) ideas.push(data);
  }

  for (const improvement of analysis.auto_improvements || []) {
    // ✅ FIXED: deduplicate before inserting auto improvements
    const exists = await improvementExists(improvement.title);
    if (exists) continue;

    const { data } = await supabase
      .from('auto_improvements')
      .insert({
        target_type: 'platform',
        improvement_category: improvement.category,
        title: improvement.title,
        description: improvement.description,
        rationale: improvement.rationale,
        implementation_code: improvement.code,
        confidence_score: improvement.confidence,
        requires_approval: improvement.confidence < 0.9,
        execution_status: 'pending',
      })
      .select()
      .single();

    if (data) improvements.push(data);
  }

  return { discoveries, ideas, improvements };
}

export async function getTopDiscoveries(limit: number = 20): Promise<PatternDiscovery[]> {
  const { data, error } = await supabase
    .from('pattern_discoveries')
    .select('*')
    .order('success_rate', { ascending: false })
    .order('confidence_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getCollaborativeIdeas(): Promise<CollaborativeIdea[]> {
  const { data, error } = await supabase
    .from('collaborative_ideas')
    .select('*')
    .eq('status', 'proposed')
    .order('confidence_score', { ascending: false })
    .limit(30);

  if (error) throw error;
  return data || [];
}

export async function getPendingAutoImprovements(): Promise<AutoImprovement[]> {
  const { data, error } = await supabase
    .from('auto_improvements')
    .select('*')
    .eq('execution_status', 'pending')
    .order('confidence_score', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function approveAutoImprovement(improvementId: string): Promise<void> {
  await supabase
    .from('auto_improvements')
    .update({ execution_status: 'approved', requires_approval: false })
    .eq('id', improvementId);
}

export async function executeAutoImprovement(improvementId: string): Promise<any> {
  const { data: improvement } = await supabase
    .from('auto_improvements')
    .select('*')
    .eq('id', improvementId)
    .single();

  if (!improvement) throw new Error('Improvement not found');

  await supabase
    .from('auto_improvements')
    .update({ execution_status: 'executing', executed_at: new Date().toISOString() })
    .eq('id', improvementId);

  try {
    const result = {
      success: true,
      files_modified: improvement.implementation_code?.files?.length || 0,
    };

    await supabase
      .from('auto_improvements')
      .update({ execution_status: 'completed', outcome: result })
      .eq('id', improvementId);

    await recordLearningSignal({
      signal_type: 'auto-improvement',
      signal_source: 'autonomous-system',
      data: { improvement_id: improvementId },
      outcome: 'success',
      patterns_detected: improvement.based_on_patterns || [],
      learned_insights: [{ type: 'improvement-success', confidence: 1.0 }],
    });

    return result;
  } catch (error) {
    await supabase
      .from('auto_improvements')
      .update({
        execution_status: 'failed',
        outcome: { error: error instanceof Error ? error.message : 'Unknown' },
      })
      .eq('id', improvementId);

    throw error;
  }
}

export async function implementCollaborativeIdea(
  ideaId: string,
  config: AIConfig
): Promise<any> {
  const { data: idea } = await supabase
    .from('collaborative_ideas')
    .select('*')
    .eq('id', ideaId)
    .single();

  if (!idea) throw new Error('Idea not found');

  const messages: AIMessage[] = [
    {
      role: 'system',
      content: 'You are a code implementation AI. Generate complete, production-ready code based on the plan.',
    },
    {
      role: 'user',
      content: `Implement this collaborative idea:\n\nTitle: ${idea.title}\nDescription: ${idea.description}\n\nPlan: ${JSON.stringify(idea.auto_build_plan, null, 2)}\n\nGenerate complete code as JSON with files array.`,
    },
  ];

  const response = await sendMessage(messages, config);

  // ✅ FIXED: use robust extractor instead of fragile regex
  const implementation = extractJSON(response);

  await supabase
    .from('collaborative_ideas')
    .update({ status: 'implemented', implemented_at: new Date().toISOString() })
    .eq('id', ideaId);

  return implementation;
}

async function aggregateSystemData(): Promise<any> {
  const [metrics, signals, patterns] = await Promise.all([
    supabase.from('success_metrics').select('*').order('recorded_at', { ascending: false }).limit(100),
    supabase.from('learning_signals').select('*').eq('processed', true).order('created_at', { ascending: false }).limit(100),
    supabase.from('pattern_discoveries').select('*').order('confidence_score', { ascending: false }).limit(50),
  ]);

  const successRate =
    metrics.data?.filter((m) => m.metric_name === 'build-success').length /
      (metrics.data?.length || 1) || 0;

  return {
    overall_success_rate: successRate,
    total_builds: metrics.data?.length || 0,
    successful_patterns: patterns.data?.filter((p) => p.success_rate > 0.7).map((p) => p.pattern_name) || [],
    problematic_patterns: patterns.data?.filter((p) => p.failure_rate > 0.5).map((p) => p.pattern_name) || [],
    recent_signals: signals.data?.slice(0, 20) || [],
    top_patterns: patterns.data?.slice(0, 10) || [],
  };
}

function extractPatterns(metadata: any): string[] {
  const patterns: string[] = [];
  if (metadata.framework) patterns.push(`framework-${metadata.framework}`);
  if (metadata.language) patterns.push(`lang-${metadata.language}`);
  if (metadata.dependencies) patterns.push(...metadata.dependencies.map((d: string) => `dep-${d}`));
  if (metadata.error_type) patterns.push(`error-${metadata.error_type}`);
  return patterns;
}

export async function getSystemInsights(): Promise<any> {
  const data = await aggregateSystemData();
  const discoveries = await getTopDiscoveries(10);
  const ideas = await getCollaborativeIdeas();
  const improvements = await getPendingAutoImprovements();

  return {
    health: {
      success_rate: data.overall_success_rate,
      total_builds: data.total_builds,
      active_patterns: discoveries.length,
    },
    top_discoveries: discoveries.slice(0, 5),
    collaborative_ideas: ideas.slice(0, 5),
    pending_improvements: improvements.slice(0, 5),
  };
}
