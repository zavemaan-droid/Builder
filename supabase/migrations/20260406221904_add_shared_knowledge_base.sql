/*
  # Add Shared Knowledge Base for Collective Learning

  1. New Tables
    - `knowledge_base`
      - Stores shared patterns, solutions, and learnings
      - Community-contributed improvements
      - Upvoting system for quality
    - `agent_learnings`
      - Tracks what agents learn from user interactions
      - Anonymous, aggregated data only
    - `pattern_library`
      - Reusable code patterns and templates
      - Best practices that worked for others
    
  2. Security
    - RLS enabled on all tables
    - Users can read all shared knowledge
    - Users can only create/update their own contributions
    - Privacy-first: no personal data stored
  
  3. Features
    - Upvote/downvote for quality control
    - Tags and categories for discovery
    - Usage tracking to surface helpful patterns
*/

-- Knowledge Base: Community wisdom
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text DEFAULT '',
  content text NOT NULL,
  category text DEFAULT 'general',
  tags text[] DEFAULT ARRAY[]::text[],
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  usage_count integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read knowledge base"
  ON knowledge_base FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create knowledge entries"
  ON knowledge_base FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = contributor_id);

CREATE POLICY "Users can update own entries"
  ON knowledge_base FOR UPDATE
  TO authenticated
  USING (auth.uid() = contributor_id)
  WITH CHECK (auth.uid() = contributor_id);

-- Agent Learnings: What agents discover
CREATE TABLE IF NOT EXISTS agent_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES super_agents(id),
  learning_type text DEFAULT 'pattern',
  context text NOT NULL,
  solution text NOT NULL,
  success_rate numeric DEFAULT 0.0,
  times_applied integer DEFAULT 1,
  is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agent_learnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read shared learnings"
  ON agent_learnings FOR SELECT
  TO authenticated
  USING (is_shared = true);

CREATE POLICY "Users can manage their agent learnings"
  ON agent_learnings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_agents
      WHERE super_agents.id = agent_learnings.agent_id
      AND super_agents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_agents
      WHERE super_agents.id = agent_learnings.agent_id
      AND super_agents.user_id = auth.uid()
    )
  );

-- Pattern Library: Reusable code templates
CREATE TABLE IF NOT EXISTS pattern_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  description text DEFAULT '',
  code_snippet text NOT NULL,
  language text DEFAULT 'typescript',
  framework text DEFAULT 'react-native',
  use_case text DEFAULT '',
  rating numeric DEFAULT 0.0,
  times_used integer DEFAULT 0,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pattern_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read public patterns"
  ON pattern_library FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create patterns"
  ON pattern_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns"
  ON pattern_library FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own patterns"
  ON pattern_library FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Votes: Track user feedback on knowledge
CREATE TABLE IF NOT EXISTS knowledge_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  knowledge_id uuid REFERENCES knowledge_base(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, knowledge_id)
);

ALTER TABLE knowledge_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own votes"
  ON knowledge_votes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_base USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_upvotes ON knowledge_base(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_agent_learnings_shared ON agent_learnings(is_shared) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_pattern_library_public ON pattern_library(is_public) WHERE is_public = true;
