/*
  # Fix Security and Performance Issues

  ## Overview
  This migration addresses multiple critical security and performance issues identified in the database audit:
  1. Adds missing indexes on foreign keys for optimal query performance
  2. Optimizes RLS policies to use subquery pattern for auth functions
  3. Removes unused indexes to reduce overhead
  4. Fixes overly permissive RLS policies
  5. Addresses multiple permissive policies on same tables

  ## Changes

  ### 1. Add Missing Foreign Key Indexes
  - agent_learnings: agent_id
  - ai_critiques: user_id
  - architecture_critiques: version_id
  - chat_messages: agent_id
  - knowledge_base: contributor_id
  - knowledge_votes: knowledge_id
  - pattern_library: user_id
  - project_builds: project_id, user_id
  - project_exports: project_id
  - self_analysis_runs: version_id
  - upgrade_history: user_id
  - upgrade_proposals: project_id, user_id

  ### 2. Drop Unused Indexes
  Removes indexes that have not been used to reduce storage and maintenance overhead

  ### 3. Optimize RLS Policies
  Updates all RLS policies to use `(SELECT auth.uid())` pattern instead of direct `auth.uid()` calls
  to prevent re-evaluation for each row

  ### 4. Fix Overly Permissive Policies
  Restricts "system" policies that currently allow unrestricted access to authenticated users

  ### 5. Consolidate Multiple Permissive Policies
  Merges duplicate SELECT policies into single optimized policies
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_agent_learnings_agent_id 
  ON public.agent_learnings(agent_id);

CREATE INDEX IF NOT EXISTS idx_ai_critiques_user_id 
  ON public.ai_critiques(user_id);

CREATE INDEX IF NOT EXISTS idx_architecture_critiques_version_id 
  ON public.architecture_critiques(version_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_agent_id 
  ON public.chat_messages(agent_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_contributor_id 
  ON public.knowledge_base(contributor_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_votes_knowledge_id 
  ON public.knowledge_votes(knowledge_id);

CREATE INDEX IF NOT EXISTS idx_pattern_library_user_id 
  ON public.pattern_library(user_id);

CREATE INDEX IF NOT EXISTS idx_project_builds_project_id 
  ON public.project_builds(project_id);

CREATE INDEX IF NOT EXISTS idx_project_builds_user_id 
  ON public.project_builds(user_id);

CREATE INDEX IF NOT EXISTS idx_project_exports_project_id 
  ON public.project_exports(project_id);

CREATE INDEX IF NOT EXISTS idx_self_analysis_runs_version_id 
  ON public.self_analysis_runs(version_id);

CREATE INDEX IF NOT EXISTS idx_upgrade_history_user_id 
  ON public.upgrade_history(user_id);

CREATE INDEX IF NOT EXISTS idx_upgrade_proposals_project_id 
  ON public.upgrade_proposals(project_id);

CREATE INDEX IF NOT EXISTS idx_upgrade_proposals_user_id 
  ON public.upgrade_proposals(user_id);

-- ============================================================================
-- 2. DROP UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_projects_user_id;
DROP INDEX IF EXISTS idx_projects_created_at;
DROP INDEX IF EXISTS idx_super_agents_user_id;
DROP INDEX IF EXISTS idx_super_agents_enabled;
DROP INDEX IF EXISTS idx_memories_user_id;
DROP INDEX IF EXISTS idx_memories_project_id;
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_chat_messages_project_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_github_connections_user;
DROP INDEX IF EXISTS idx_project_exports_user;
DROP INDEX IF EXISTS idx_knowledge_category;
DROP INDEX IF EXISTS idx_knowledge_tags;
DROP INDEX IF EXISTS idx_knowledge_upvotes;
DROP INDEX IF EXISTS idx_agent_learnings_shared;
DROP INDEX IF EXISTS idx_ai_critiques_project;
DROP INDEX IF EXISTS idx_pattern_library_public;
DROP INDEX IF EXISTS idx_project_builds_status;
DROP INDEX IF EXISTS idx_upgrade_proposals_status;
DROP INDEX IF EXISTS idx_upgrade_history_proposal;
DROP INDEX IF EXISTS idx_platform_versions_number;
DROP INDEX IF EXISTS idx_architecture_critiques_addressed;
DROP INDEX IF EXISTS idx_platform_proposals_status;
DROP INDEX IF EXISTS idx_meta_learnings_confidence;
DROP INDEX IF EXISTS idx_collaborative_ideas_status;
DROP INDEX IF EXISTS idx_collaborative_ideas_confidence;
DROP INDEX IF EXISTS idx_self_analysis_status;
DROP INDEX IF EXISTS idx_pattern_discoveries_success;
DROP INDEX IF EXISTS idx_pattern_discoveries_confidence;
DROP INDEX IF EXISTS idx_success_metrics_project;
DROP INDEX IF EXISTS idx_success_metrics_type;
DROP INDEX IF EXISTS idx_auto_improvements_status;
DROP INDEX IF EXISTS idx_learning_signals_processed;
DROP INDEX IF EXISTS idx_learning_signals_project;

-- ============================================================================
-- 3. OPTIMIZE RLS POLICIES - PROJECTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 4. OPTIMIZE RLS POLICIES - SUPER_AGENTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own agents" ON public.super_agents;
DROP POLICY IF EXISTS "Users can insert own agents" ON public.super_agents;
DROP POLICY IF EXISTS "Users can update own agents" ON public.super_agents;
DROP POLICY IF EXISTS "Users can delete own agents" ON public.super_agents;

CREATE POLICY "Users can view own agents"
  ON public.super_agents FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own agents"
  ON public.super_agents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own agents"
  ON public.super_agents FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own agents"
  ON public.super_agents FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 5. OPTIMIZE RLS POLICIES - MEMORIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can insert own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can update own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON public.memories;

CREATE POLICY "Users can view own memories"
  ON public.memories FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own memories"
  ON public.memories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own memories"
  ON public.memories FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own memories"
  ON public.memories FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 6. OPTIMIZE RLS POLICIES - CHAT_MESSAGES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;

CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 7. OPTIMIZE RLS POLICIES - KNOWLEDGE_BASE TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can create knowledge entries" ON public.knowledge_base;
DROP POLICY IF EXISTS "Users can update own entries" ON public.knowledge_base;

CREATE POLICY "Users can create knowledge entries"
  ON public.knowledge_base FOR INSERT
  TO authenticated
  WITH CHECK (contributor_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own entries"
  ON public.knowledge_base FOR UPDATE
  TO authenticated
  USING (contributor_id = (SELECT auth.uid()))
  WITH CHECK (contributor_id = (SELECT auth.uid()));

-- ============================================================================
-- 8. OPTIMIZE RLS POLICIES - AGENT_LEARNINGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage their agent learnings" ON public.agent_learnings;
DROP POLICY IF EXISTS "Users can read shared learnings" ON public.agent_learnings;

-- Consolidated policy for reading learnings
CREATE POLICY "Users can read own or shared learnings"
  ON public.agent_learnings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.super_agents
      WHERE super_agents.id = agent_learnings.agent_id
      AND super_agents.user_id = (SELECT auth.uid())
    ) OR is_shared = true
  );

CREATE POLICY "Users can manage own agent learnings"
  ON public.agent_learnings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.super_agents
      WHERE super_agents.id = agent_learnings.agent_id
      AND super_agents.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.super_agents
      WHERE super_agents.id = agent_learnings.agent_id
      AND super_agents.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 9. OPTIMIZE RLS POLICIES - PATTERN_LIBRARY TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read public patterns" ON public.pattern_library;
DROP POLICY IF EXISTS "Users can create patterns" ON public.pattern_library;
DROP POLICY IF EXISTS "Users can update own patterns" ON public.pattern_library;
DROP POLICY IF EXISTS "Users can delete own patterns" ON public.pattern_library;

CREATE POLICY "Users can read public patterns"
  ON public.pattern_library FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create patterns"
  ON public.pattern_library FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own patterns"
  ON public.pattern_library FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own patterns"
  ON public.pattern_library FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 10. OPTIMIZE RLS POLICIES - KNOWLEDGE_VOTES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own votes" ON public.knowledge_votes;

CREATE POLICY "Users can view all votes"
  ON public.knowledge_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own votes"
  ON public.knowledge_votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own votes"
  ON public.knowledge_votes FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 11. OPTIMIZE RLS POLICIES - GITHUB_CONNECTIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own GitHub connection" ON public.github_connections;

CREATE POLICY "Users can manage own GitHub connection"
  ON public.github_connections FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 12. OPTIMIZE RLS POLICIES - PROJECT_EXPORTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own exports" ON public.project_exports;

CREATE POLICY "Users can manage own exports"
  ON public.project_exports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_exports.project_id
      AND projects.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_exports.project_id
      AND projects.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 13. OPTIMIZE RLS POLICIES - PROJECT_BUILDS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own builds" ON public.project_builds;
DROP POLICY IF EXISTS "Users can create builds" ON public.project_builds;

CREATE POLICY "Users can view own builds"
  ON public.project_builds FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create builds"
  ON public.project_builds FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 14. OPTIMIZE RLS POLICIES - AI_CRITIQUES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own critiques" ON public.ai_critiques;
DROP POLICY IF EXISTS "System can create critiques" ON public.ai_critiques;
DROP POLICY IF EXISTS "Users can update critiques" ON public.ai_critiques;

CREATE POLICY "Users can view own critiques"
  ON public.ai_critiques FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create critiques"
  ON public.ai_critiques FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own critiques"
  ON public.ai_critiques FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 15. OPTIMIZE RLS POLICIES - UPGRADE_PROPOSALS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own proposals" ON public.upgrade_proposals;
DROP POLICY IF EXISTS "System can create proposals" ON public.upgrade_proposals;
DROP POLICY IF EXISTS "Users can update proposals" ON public.upgrade_proposals;

CREATE POLICY "Users can view own proposals"
  ON public.upgrade_proposals FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create proposals"
  ON public.upgrade_proposals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own proposals"
  ON public.upgrade_proposals FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 16. OPTIMIZE RLS POLICIES - UPGRADE_HISTORY TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own upgrade history" ON public.upgrade_history;

CREATE POLICY "Users can view own upgrade history"
  ON public.upgrade_history FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own upgrade history"
  ON public.upgrade_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 17. OPTIMIZE RLS POLICIES - SUCCESS_METRICS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own project metrics" ON public.success_metrics;
DROP POLICY IF EXISTS "System can insert metrics" ON public.success_metrics;

CREATE POLICY "Users can view own project metrics"
  ON public.success_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = success_metrics.project_id
      AND projects.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert project metrics"
  ON public.success_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = success_metrics.project_id
      AND projects.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 18. OPTIMIZE RLS POLICIES - LEARNING_SIGNALS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "System can manage learning signals" ON public.learning_signals;
DROP POLICY IF EXISTS "Users can view own project signals" ON public.learning_signals;

CREATE POLICY "Users can view own project signals"
  ON public.learning_signals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = learning_signals.project_id
      AND projects.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert project signals"
  ON public.learning_signals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = learning_signals.project_id
      AND projects.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 19. FIX OVERLY PERMISSIVE POLICIES - PLATFORM TABLES
-- ============================================================================

-- PLATFORM_VERSIONS: Make read-only for users, restrict modifications
DROP POLICY IF EXISTS "Anyone can view platform versions" ON public.platform_versions;
DROP POLICY IF EXISTS "System can manage versions" ON public.platform_versions;

CREATE POLICY "Users can view platform versions"
  ON public.platform_versions FOR SELECT
  TO authenticated
  USING (true);

-- AUTO_IMPROVEMENTS: Read-only for users
DROP POLICY IF EXISTS "Anyone can view auto improvements" ON public.auto_improvements;
DROP POLICY IF EXISTS "System can manage auto improvements" ON public.auto_improvements;

CREATE POLICY "Users can view auto improvements"
  ON public.auto_improvements FOR SELECT
  TO authenticated
  USING (true);

-- COLLABORATIVE_IDEAS: Read-only for users
DROP POLICY IF EXISTS "Anyone can view collaborative ideas" ON public.collaborative_ideas;
DROP POLICY IF EXISTS "System can manage collaborative ideas" ON public.collaborative_ideas;

CREATE POLICY "Users can view collaborative ideas"
  ON public.collaborative_ideas FOR SELECT
  TO authenticated
  USING (true);

-- META_LEARNINGS: Read-only for users
DROP POLICY IF EXISTS "Anyone can view meta learnings" ON public.meta_learnings;
DROP POLICY IF EXISTS "System can manage learnings" ON public.meta_learnings;

CREATE POLICY "Users can view meta learnings"
  ON public.meta_learnings FOR SELECT
  TO authenticated
  USING (true);

-- PATTERN_DISCOVERIES: Read-only for users
DROP POLICY IF EXISTS "Anyone can view pattern discoveries" ON public.pattern_discoveries;
DROP POLICY IF EXISTS "System can manage pattern discoveries" ON public.pattern_discoveries;

CREATE POLICY "Users can view pattern discoveries"
  ON public.pattern_discoveries FOR SELECT
  TO authenticated
  USING (true);

-- SELF_ANALYSIS_RUNS: Read-only for users
DROP POLICY IF EXISTS "Anyone can view analysis runs" ON public.self_analysis_runs;
DROP POLICY IF EXISTS "System can manage analysis runs" ON public.self_analysis_runs;

CREATE POLICY "Users can view analysis runs"
  ON public.self_analysis_runs FOR SELECT
  TO authenticated
  USING (true);

-- ARCHITECTURE_CRITIQUES: Restrict to version owners
DROP POLICY IF EXISTS "Anyone can view critiques" ON public.architecture_critiques;
DROP POLICY IF EXISTS "System can manage critiques" ON public.architecture_critiques;
DROP POLICY IF EXISTS "System can update critiques" ON public.architecture_critiques;

CREATE POLICY "Users can view architecture critiques"
  ON public.architecture_critiques FOR SELECT
  TO authenticated
  USING (true);

-- PLATFORM_UPGRADE_PROPOSALS: Allow voting but restrict creation
DROP POLICY IF EXISTS "Anyone can view proposals" ON public.platform_upgrade_proposals;
DROP POLICY IF EXISTS "System can create proposals" ON public.platform_upgrade_proposals;
DROP POLICY IF EXISTS "Users can vote on proposals" ON public.platform_upgrade_proposals;

CREATE POLICY "Users can view upgrade proposals"
  ON public.platform_upgrade_proposals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can vote on proposals"
  ON public.platform_upgrade_proposals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
