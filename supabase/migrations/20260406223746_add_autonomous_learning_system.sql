/*
  # Autonomous Learning & Discovery System

  1. New Tables
    - `pattern_discoveries`
      - Automatically discovered patterns from all projects
      - What works vs what doesn't across ecosystem
    - `success_metrics`
      - Track build success rates
      - Performance metrics
      - User adoption signals
    - `collaborative_ideas`
      - AI synthesizes ideas from multiple sources
      - Cross-pollination of solutions
    - `auto_improvements`
      - System-generated improvements
      - Auto-build queue
    - `learning_signals`
      - Real-time signals: errors, successes, patterns
      - Aggregated learning from all users
  
  2. Learning Sources
    - Build outcomes (success/failure)
    - Error patterns across projects
    - Code patterns that work
    - Performance metrics
    - User behavior patterns
  
  3. Auto-Build Features
    - System proposes improvements
    - Auto-implements high-confidence changes
    - Learns from implementation results
*/

-- Pattern Discoveries (What works, what doesn't)
CREATE TABLE IF NOT EXISTS pattern_discoveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type text DEFAULT 'code',
  pattern_name text NOT NULL,
  description text NOT NULL,
  discovered_from text DEFAULT 'automated-analysis',
  success_rate numeric DEFAULT 0.0,
  failure_rate numeric DEFAULT 0.0,
  usage_count integer DEFAULT 0,
  context jsonb DEFAULT '{}'::jsonb,
  works_well_for jsonb DEFAULT '[]'::jsonb,
  fails_for jsonb DEFAULT '[]'::jsonb,
  alternatives jsonb DEFAULT '[]'::jsonb,
  confidence_score numeric DEFAULT 0.0,
  last_validated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pattern_discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pattern discoveries"
  ON pattern_discoveries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage pattern discoveries"
  ON pattern_discoveries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Success Metrics (Track what actually works)
CREATE TABLE IF NOT EXISTS success_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  metric_type text DEFAULT 'build',
  metric_name text NOT NULL,
  value numeric DEFAULT 0.0,
  metadata jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE success_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project metrics"
  ON success_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = success_metrics.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert metrics"
  ON success_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Collaborative Ideas (AI synthesis from multiple sources)
CREATE TABLE IF NOT EXISTS collaborative_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_type text DEFAULT 'feature',
  title text NOT NULL,
  description text NOT NULL,
  synthesized_from jsonb DEFAULT '[]'::jsonb,
  source_patterns text[] DEFAULT ARRAY[]::text[],
  source_learnings text[] DEFAULT ARRAY[]::text[],
  target_improvements text[] DEFAULT ARRAY[]::text[],
  estimated_impact text DEFAULT 'medium',
  implementation_ready boolean DEFAULT false,
  auto_build_plan jsonb DEFAULT '{}'::jsonb,
  confidence_score numeric DEFAULT 0.0,
  status text DEFAULT 'proposed',
  created_at timestamptz DEFAULT now(),
  implemented_at timestamptz DEFAULT NULL
);

ALTER TABLE collaborative_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collaborative ideas"
  ON collaborative_ideas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage collaborative ideas"
  ON collaborative_ideas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Auto Improvements (System-generated fixes and enhancements)
CREATE TABLE IF NOT EXISTS auto_improvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text DEFAULT 'platform',
  target_id uuid DEFAULT NULL,
  improvement_category text DEFAULT 'optimization',
  title text NOT NULL,
  description text NOT NULL,
  rationale text NOT NULL,
  auto_generated boolean DEFAULT true,
  based_on_patterns text[] DEFAULT ARRAY[]::text[],
  implementation_code jsonb DEFAULT '{}'::jsonb,
  execution_status text DEFAULT 'pending',
  confidence_score numeric DEFAULT 0.0,
  requires_approval boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  executed_at timestamptz DEFAULT NULL,
  outcome jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE auto_improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view auto improvements"
  ON auto_improvements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage auto improvements"
  ON auto_improvements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Learning Signals (Real-time learning data)
CREATE TABLE IF NOT EXISTS learning_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type text DEFAULT 'build-outcome',
  signal_source text DEFAULT 'system',
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  data jsonb DEFAULT '{}'::jsonb,
  outcome text DEFAULT 'success',
  patterns_detected text[] DEFAULT ARRAY[]::text[],
  learned_insights jsonb DEFAULT '[]'::jsonb,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE learning_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project signals"
  ON learning_signals FOR SELECT
  TO authenticated
  USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = learning_signals.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage learning signals"
  ON learning_signals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pattern_discoveries_success ON pattern_discoveries(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_discoveries_confidence ON pattern_discoveries(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_success_metrics_project ON success_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_success_metrics_type ON success_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_collaborative_ideas_status ON collaborative_ideas(status) WHERE status = 'proposed';
CREATE INDEX IF NOT EXISTS idx_collaborative_ideas_confidence ON collaborative_ideas(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_auto_improvements_status ON auto_improvements(execution_status) WHERE execution_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_learning_signals_processed ON learning_signals(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_learning_signals_project ON learning_signals(project_id);

-- Function to automatically process learning signals
CREATE OR REPLACE FUNCTION process_learning_signal()
RETURNS trigger AS $$
BEGIN
  IF NEW.outcome = 'success' AND array_length(NEW.patterns_detected, 1) > 0 THEN
    UPDATE pattern_discoveries
    SET 
      usage_count = usage_count + 1,
      success_rate = (success_rate * usage_count + 1.0) / (usage_count + 1),
      last_validated = now()
    WHERE pattern_name = ANY(NEW.patterns_detected);
  ELSIF NEW.outcome = 'failure' AND array_length(NEW.patterns_detected, 1) > 0 THEN
    UPDATE pattern_discoveries
    SET 
      usage_count = usage_count + 1,
      failure_rate = (failure_rate * usage_count + 1.0) / (usage_count + 1),
      last_validated = now()
    WHERE pattern_name = ANY(NEW.patterns_detected);
  END IF;
  
  NEW.processed := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_process_learning_signal
  BEFORE INSERT ON learning_signals
  FOR EACH ROW
  EXECUTE FUNCTION process_learning_signal();
