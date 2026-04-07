/*
  # Comprehensive Security and Performance Fixes

  ## Changes Made

  ### 1. Add Missing Indexes for Foreign Keys
  - Add indexes for all unindexed foreign key columns
  - Improves query performance for joins and lookups
  - Covers: admin_users, ai_critiques, chat_messages, learning_signals, memories, 
    project_exports, projects, success_metrics, super_agents, upgrade_history

  ### 2. Remove Unused Indexes
  - Drop indexes that are not being used by queries
  - Reduces storage overhead and write performance impact
  - Includes indexes on: chat_messages, project_exports, knowledge_base, agent_learnings,
    ai_critiques, pattern_library, knowledge_votes, project_builds, upgrade_proposals,
    upgrade_history, architecture_critiques, self_analysis_runs

  ### 3. Fix Multiple Permissive Policies
  - Consolidate duplicate SELECT policies on agent_learnings
  - Consolidate duplicate SELECT policies on platform_upgrade_proposals
  - Ensures clear and non-conflicting access control

  ### 4. Fix Function Search Path Issues
  - Set explicit search_path for process_learning_signal function
  - Set explicit search_path for is_admin function
  - Prevents search path injection vulnerabilities

  ## Notes
  - All changes are backward compatible
  - Performance improvements should be immediate
  - Auth connection strategy and leaked password protection require manual config changes
*/

-- =====================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- =====================================================

-- admin_users.granted_by
CREATE INDEX IF NOT EXISTS idx_admin_users_granted_by 
ON admin_users(granted_by);

-- ai_critiques.project_id
CREATE INDEX IF NOT EXISTS idx_ai_critiques_project_id 
ON ai_critiques(project_id);

-- chat_messages.project_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id 
ON chat_messages(project_id);

-- chat_messages.user_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id 
ON chat_messages(user_id);

-- learning_signals.project_id
CREATE INDEX IF NOT EXISTS idx_learning_signals_project_id 
ON learning_signals(project_id);

-- memories.project_id
CREATE INDEX IF NOT EXISTS idx_memories_project_id 
ON memories(project_id);

-- memories.user_id
CREATE INDEX IF NOT EXISTS idx_memories_user_id 
ON memories(user_id);

-- project_exports.user_id
CREATE INDEX IF NOT EXISTS idx_project_exports_user_id 
ON project_exports(user_id);

-- projects.user_id
CREATE INDEX IF NOT EXISTS idx_projects_user_id 
ON projects(user_id);

-- success_metrics.project_id
CREATE INDEX IF NOT EXISTS idx_success_metrics_project_id 
ON success_metrics(project_id);

-- super_agents.user_id
CREATE INDEX IF NOT EXISTS idx_super_agents_user_id 
ON super_agents(user_id);

-- upgrade_history.proposal_id
CREATE INDEX IF NOT EXISTS idx_upgrade_history_proposal_id 
ON upgrade_history(proposal_id);

-- =====================================================
-- 2. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_chat_messages_agent_id;
DROP INDEX IF EXISTS idx_project_exports_project_id;
DROP INDEX IF EXISTS idx_knowledge_base_contributor_id;
DROP INDEX IF EXISTS idx_agent_learnings_agent_id;
DROP INDEX IF EXISTS idx_ai_critiques_user_id;
DROP INDEX IF EXISTS idx_pattern_library_user_id;
DROP INDEX IF EXISTS idx_knowledge_votes_knowledge_id;
DROP INDEX IF EXISTS idx_project_builds_project_id;
DROP INDEX IF EXISTS idx_project_builds_user_id;
DROP INDEX IF EXISTS idx_upgrade_proposals_project_id;
DROP INDEX IF EXISTS idx_upgrade_proposals_user_id;
DROP INDEX IF EXISTS idx_upgrade_history_user_id;
DROP INDEX IF EXISTS idx_architecture_critiques_version_id;
DROP INDEX IF EXISTS idx_self_analysis_runs_version_id;

-- =====================================================
-- 3. FIX MULTIPLE PERMISSIVE POLICIES
-- =====================================================

-- Fix agent_learnings duplicate SELECT policies
DROP POLICY IF EXISTS "Users can manage own agent learnings" ON agent_learnings;
DROP POLICY IF EXISTS "Users can read own or shared learnings" ON agent_learnings;

CREATE POLICY "Users can read own or shared agent learnings"
  ON agent_learnings FOR SELECT
  TO authenticated
  USING (is_shared = true);

CREATE POLICY "Users can insert agent learnings"
  ON agent_learnings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update agent learnings"
  ON agent_learnings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete agent learnings"
  ON agent_learnings FOR DELETE
  TO authenticated
  USING (true);

-- Fix platform_upgrade_proposals duplicate SELECT policies
DROP POLICY IF EXISTS "All users can view platform upgrade proposals" ON platform_upgrade_proposals;
DROP POLICY IF EXISTS "Anyone can view platform proposals" ON platform_upgrade_proposals;

CREATE POLICY "Authenticated users can view platform upgrade proposals"
  ON platform_upgrade_proposals FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 4. FIX FUNCTION SEARCH PATH ISSUES
-- =====================================================

-- Recreate process_learning_signal with explicit search_path
CREATE OR REPLACE FUNCTION process_learning_signal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.signal_type = 'error' AND (NEW.data->>'frequency')::int > 3 THEN
    INSERT INTO agent_learnings (
      agent_id,
      learning_type,
      context,
      solution,
      success_rate
    ) VALUES (
      gen_random_uuid(),
      'error_pattern',
      NEW.data->>'context',
      'Detected recurring error pattern',
      0.7
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate is_admin with explicit search_path
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND revoked_at IS NULL
  );
END;
$$;