import { supabase } from '@/services/supabaseClient';

export interface KnowledgeEntry {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  usage_count: number;
  is_verified: boolean;
  created_at: string;
}

export interface AgentLearning {
  id: string;
  learning_type: string;
  context: string;
  solution: string;
  success_rate: number;
  times_applied: number;
  is_shared: boolean;
}

export interface CodePattern {
  id: string;
  name: string;
  description: string;
  code_snippet: string;
  language: string;
  framework: string;
  use_case: string;
  rating: number;
  times_used: number;
  is_public: boolean;
}

export async function getSharedKnowledge(category?: string): Promise<KnowledgeEntry[]> {
  let query = supabase
    .from('knowledge_base')
    .select('*')
    .order('upvotes', { ascending: false })
    .limit(50);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function searchKnowledge(searchTerm: string): Promise<KnowledgeEntry[]> {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    .order('upvotes', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function contributeKnowledge(entry: {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
}): Promise<void> {
  const { error } = await supabase
    .from('knowledge_base')
    .insert({
      ...entry,
      contributor_id: (await supabase.auth.getUser()).data.user?.id,
    });

  if (error) throw error;
}

export async function voteKnowledge(knowledgeId: string, voteType: 'up' | 'down'): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { error: voteError } = await supabase
    .from('knowledge_votes')
    .upsert({
      user_id: userId,
      knowledge_id: knowledgeId,
      vote_type: voteType,
    });

  if (voteError) throw voteError;

  const column = voteType === 'up' ? 'upvotes' : 'downvotes';
  const { error: updateError } = await supabase.rpc('increment_vote', {
    knowledge_id: knowledgeId,
    column_name: column,
  });

  if (updateError) console.error('Vote count update failed:', updateError);
}

export async function getPublicPatterns(framework?: string): Promise<CodePattern[]> {
  let query = supabase
    .from('pattern_library')
    .select('*')
    .eq('is_public', true)
    .order('rating', { ascending: false })
    .limit(50);

  if (framework) {
    query = query.eq('framework', framework);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function savePattern(pattern: {
  name: string;
  description: string;
  code_snippet: string;
  language: string;
  framework: string;
  use_case: string;
  is_public: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from('pattern_library')
    .insert({
      ...pattern,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    });

  if (error) throw error;
}

export async function recordAgentLearning(
  agentId: string,
  learning: {
    learning_type: string;
    context: string;
    solution: string;
    is_shared: boolean;
  }
): Promise<void> {
  const { error } = await supabase
    .from('agent_learnings')
    .insert({
      agent_id: agentId,
      ...learning,
    });

  if (error) throw error;
}

export async function getSharedLearnings(learningType?: string): Promise<AgentLearning[]> {
  let query = supabase
    .from('agent_learnings')
    .select('*')
    .eq('is_shared', true)
    .order('success_rate', { ascending: false })
    .limit(100);

  if (learningType) {
    query = query.eq('learning_type', learningType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function incrementPatternUsage(patternId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_pattern_usage', {
    pattern_id: patternId,
  });

  if (error) console.error('Pattern usage increment failed:', error);
}

export async function getTrendingKnowledge(): Promise<KnowledgeEntry[]> {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .order('usage_count', { ascending: false })
    .order('upvotes', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}
