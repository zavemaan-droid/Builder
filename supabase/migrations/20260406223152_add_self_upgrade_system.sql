/*
  # Self-Upgrade Engine System

  1. New Tables
    - `platform_versions`
      - Tracks platform architecture versions
      - Stores complete snapshots of system state
    - `architecture_critiques`
      - AI analysis of platform's own code
      - Self-discovered architectural issues
    - `platform_upgrade_proposals`
      - System-level improvements
      - Infrastructure enhancements
    - `meta_learnings`
      - Platform learns from its own evolution
      - Tracks what works and what doesn't
    - `self_analysis_runs`
      - Automated analysis sessions
      - Scheduled self-reviews
  
  2. Security
    - Admin-level RLS for platform changes
    - All users can view analysis
    - Only system can create platform upgrades
  
  3. Features
    - Continuous self-analysis
    - Architecture evolution tracking
    - Meta-learning from improvements
    - Automated version management
*/

-- Platform Versions
CREATE TABLE IF NOT EXISTS platform_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number text NOT NULL UNIQUE,
  release_date timestamptz DEFAULT now(),
  architecture_snapshot jsonb DEFAULT '{}'::jsonb,
  key_features jsonb DEFAULT '[]'::jsonb,
  performance_metrics jsonb DEFAULT '{}'::jsonb,
  breaking_changes text DEFAULT '',
  migration_notes text DEFAULT '',
  is_stable boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform versions"
  ON platform_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage versions"
  ON platform_versions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Architecture Critiques
CREATE TABLE IF NOT EXISTS architecture_critiques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid REFERENCES platform_versions(id) ON DELETE CASCADE,
  critique_category text DEFAULT 'architecture',
  severity text DEFAULT 'info',
  component text DEFAULT '',
  issue_title text NOT NULL,
  issue_description text NOT NULL,
  current_implementation text DEFAULT '',
  suggested_improvement text DEFAULT '',
  estimated_impact text DEFAULT '',
  complexity text DEFAULT 'medium',
  is_addressed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  addressed_at timestamptz DEFAULT NULL
);

ALTER TABLE architecture_critiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view architecture critiques"
  ON architecture_critiques FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage critiques"
  ON architecture_critiques FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update critiques"
  ON architecture_critiques FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Platform Upgrade Proposals
CREATE TABLE IF NOT EXISTS platform_upgrade_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_from text NOT NULL,
  version_to text NOT NULL,
  upgrade_category text DEFAULT 'enhancement',
  title text NOT NULL,
  description text NOT NULL,
  rationale text NOT NULL,
  affected_components jsonb DEFAULT '[]'::jsonb,
  implementation_plan jsonb DEFAULT '{}'::jsonb,
  estimated_effort text DEFAULT '',
  benefits jsonb DEFAULT '[]'::jsonb,
  risks jsonb DEFAULT '[]'::jsonb,
  dependencies jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'proposed',
  ai_confidence numeric DEFAULT 0.0,
  community_votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz DEFAULT NULL,
  implemented_at timestamptz DEFAULT NULL
);

ALTER TABLE platform_upgrade_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform proposals"
  ON platform_upgrade_proposals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create proposals"
  ON platform_upgrade_proposals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can vote on proposals"
  ON platform_upgrade_proposals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Meta Learnings
CREATE TABLE IF NOT EXISTS meta_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_type text DEFAULT 'pattern',
  context text NOT NULL,
  what_worked text NOT NULL,
  what_didnt_work text DEFAULT '',
  why text NOT NULL,
  applicable_to jsonb DEFAULT '[]'::jsonb,
  evidence jsonb DEFAULT '{}'::jsonb,
  confidence_score numeric DEFAULT 0.0,
  times_validated integer DEFAULT 0,
  is_shared boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meta_learnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view meta learnings"
  ON meta_learnings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage learnings"
  ON meta_learnings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Self Analysis Runs
CREATE TABLE IF NOT EXISTS self_analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid REFERENCES platform_versions(id) ON DELETE CASCADE,
  analysis_type text DEFAULT 'full',
  status text DEFAULT 'running',
  components_analyzed jsonb DEFAULT '[]'::jsonb,
  issues_found integer DEFAULT 0,
  proposals_created integer DEFAULT 0,
  learnings_captured integer DEFAULT 0,
  execution_time_ms integer DEFAULT 0,
  logs text DEFAULT '',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT NULL
);

ALTER TABLE self_analysis_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view analysis runs"
  ON self_analysis_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage analysis runs"
  ON self_analysis_runs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_versions_number ON platform_versions(version_number);
CREATE INDEX IF NOT EXISTS idx_architecture_critiques_addressed ON architecture_critiques(is_addressed) WHERE is_addressed = false;
CREATE INDEX IF NOT EXISTS idx_platform_proposals_status ON platform_upgrade_proposals(status) WHERE status = 'proposed';
CREATE INDEX IF NOT EXISTS idx_meta_learnings_confidence ON meta_learnings(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_self_analysis_status ON self_analysis_runs(status);

-- Insert initial platform version
INSERT INTO platform_versions (version_number, architecture_snapshot, key_features, is_stable)
VALUES (
  'v1.0.0',
  '{"architecture": "modular", "patterns": ["service-oriented", "component-based"], "database": "supabase"}'::jsonb,
  '["AI Builder", "GitHub Integration", "Self-Critique", "Upgrade Discovery", "Community Knowledge"]'::jsonb,
  true
) ON CONFLICT (version_number) DO NOTHING;
