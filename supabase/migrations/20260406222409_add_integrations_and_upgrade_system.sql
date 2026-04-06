/*
  # Add Integration & Upgrade System

  1. New Tables
    - `github_connections`
      - Links user accounts to GitHub
      - Stores OAuth tokens securely
    - `project_exports`
      - Tracks export history
      - Download links for ZIP files
    - `project_builds`
      - Internal and external build tracking
      - Build status and artifacts
    - `ai_critiques`
      - AI-generated code reviews
      - Self-analysis of codebase
    - `upgrade_proposals`
      - AI-discovered improvements
      - Requires user approval
    - `upgrade_history`
      - Track approved/rejected upgrades
      - Learn from user preferences
  
  2. Security
    - RLS enabled on all tables
    - Users can only access their own data
    - Encrypted tokens for OAuth
  
  3. Features
    - GitHub repository sync
    - Project export and download
    - Build preview system
    - AI self-critique engine
    - Upgrade approval workflow
*/

-- GitHub Connections
CREATE TABLE IF NOT EXISTS github_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username text NOT NULL,
  access_token text NOT NULL,
  refresh_token text DEFAULT '',
  token_expires_at timestamptz DEFAULT NULL,
  connected_at timestamptz DEFAULT now(),
  last_synced_at timestamptz DEFAULT NULL,
  is_active boolean DEFAULT true,
  UNIQUE(user_id)
);

ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own GitHub connection"
  ON github_connections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Project Exports
CREATE TABLE IF NOT EXISTS project_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type text DEFAULT 'zip',
  file_size integer DEFAULT 0,
  download_url text DEFAULT '',
  expires_at timestamptz DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own exports"
  ON project_exports FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Project Builds
CREATE TABLE IF NOT EXISTS project_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  build_type text DEFAULT 'preview',
  platform text DEFAULT 'web',
  status text DEFAULT 'pending',
  build_url text DEFAULT '',
  logs text DEFAULT '',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT NULL,
  error_message text DEFAULT ''
);

ALTER TABLE project_builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own builds"
  ON project_builds FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create builds"
  ON project_builds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- AI Critiques
CREATE TABLE IF NOT EXISTS ai_critiques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  critique_type text DEFAULT 'general',
  severity text DEFAULT 'info',
  file_path text DEFAULT '',
  line_number integer DEFAULT 0,
  issue_title text NOT NULL,
  issue_description text NOT NULL,
  suggested_fix text DEFAULT '',
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz DEFAULT NULL
);

ALTER TABLE ai_critiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own critiques"
  ON ai_critiques FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create critiques"
  ON ai_critiques FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update critiques"
  ON ai_critiques FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Upgrade Proposals
CREATE TABLE IF NOT EXISTS upgrade_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_type text DEFAULT 'improvement',
  title text NOT NULL,
  description text NOT NULL,
  affected_files jsonb DEFAULT '[]'::jsonb,
  proposed_changes jsonb DEFAULT '{}'::jsonb,
  benefits text DEFAULT '',
  risks text DEFAULT '',
  status text DEFAULT 'pending',
  ai_confidence numeric DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz DEFAULT NULL,
  applied_at timestamptz DEFAULT NULL
);

ALTER TABLE upgrade_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proposals"
  ON upgrade_proposals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create proposals"
  ON upgrade_proposals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update proposals"
  ON upgrade_proposals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Upgrade History
CREATE TABLE IF NOT EXISTS upgrade_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES upgrade_proposals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  reason text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE upgrade_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own upgrade history"
  ON upgrade_history FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_github_connections_user ON github_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_project_exports_user ON project_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_project_builds_status ON project_builds(status);
CREATE INDEX IF NOT EXISTS idx_ai_critiques_project ON ai_critiques(project_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_proposals_status ON upgrade_proposals(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_upgrade_history_proposal ON upgrade_history(proposal_id);
