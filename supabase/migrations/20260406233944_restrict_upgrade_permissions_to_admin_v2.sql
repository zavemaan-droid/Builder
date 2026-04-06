/*
  # Restrict Upgrade Permissions to Admin Only

  ## Overview
  This migration ensures that only the platform owner can authorize and execute platform upgrades.
  No other user should be able to trigger the self-upgrade engine or approve platform-level changes.

  ## Changes

  ### 1. Add Admin Users Table
  - Stores list of authorized admin users
  - Only admins can approve platform upgrades

  ### 2. Update Platform Tables RLS
  - Restrict all platform modification operations to admin users only
  - Users can view proposals and analysis, but cannot create or modify them
  - Only admins can:
    - Create/modify platform versions
    - Create/modify architecture critiques
    - Create/approve platform upgrade proposals
    - Create meta learnings
    - Trigger self-analysis runs
    - Mark auto-improvements as implemented

  ### 3. Secure Project-Level Upgrades
  - Users can still receive AI suggestions for their own projects
  - Platform-level upgrades require admin approval
*/

-- ============================================================================
-- 1. CREATE ADMIN USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text DEFAULT ''
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Anyone can check if they are admin
CREATE POLICY "Users can check own admin status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 2. CREATE HELPER FUNCTION TO CHECK ADMIN STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  );
$$;

-- ============================================================================
-- 3. RESTRICT PLATFORM VERSIONS TO ADMIN ONLY
-- ============================================================================

DROP POLICY IF EXISTS "Users can view platform versions" ON public.platform_versions;
DROP POLICY IF EXISTS "Anyone can view platform versions" ON public.platform_versions;

CREATE POLICY "All users can view platform versions"
  ON public.platform_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create versions"
  ON public.platform_versions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update versions"
  ON public.platform_versions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete versions"
  ON public.platform_versions FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- 4. RESTRICT ARCHITECTURE CRITIQUES TO ADMIN ONLY
-- ============================================================================

DROP POLICY IF EXISTS "Users can view architecture critiques" ON public.architecture_critiques;
DROP POLICY IF EXISTS "Anyone can view architecture critiques" ON public.architecture_critiques;

CREATE POLICY "All users can view architecture critiques"
  ON public.architecture_critiques FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create critiques"
  ON public.architecture_critiques FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update critiques"
  ON public.architecture_critiques FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete critiques"
  ON public.architecture_critiques FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- 5. RESTRICT PLATFORM UPGRADE PROPOSALS TO ADMIN ONLY
-- ============================================================================

DROP POLICY IF EXISTS "Users can view upgrade proposals" ON public.platform_upgrade_proposals;
DROP POLICY IF EXISTS "Anyone can view platform upgrade proposals" ON public.platform_upgrade_proposals;
DROP POLICY IF EXISTS "Users can vote on proposals" ON public.platform_upgrade_proposals;

CREATE POLICY "All users can view platform upgrade proposals"
  ON public.platform_upgrade_proposals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create proposals"
  ON public.platform_upgrade_proposals FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update proposals"
  ON public.platform_upgrade_proposals FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete proposals"
  ON public.platform_upgrade_proposals FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- 6. RESTRICT META LEARNINGS TO ADMIN ONLY
-- ============================================================================

DROP POLICY IF EXISTS "Users can view meta learnings" ON public.meta_learnings;
DROP POLICY IF EXISTS "Anyone can view meta learnings" ON public.meta_learnings;

CREATE POLICY "All users can view meta learnings"
  ON public.meta_learnings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create learnings"
  ON public.meta_learnings FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update learnings"
  ON public.meta_learnings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete learnings"
  ON public.meta_learnings FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- 7. RESTRICT SELF ANALYSIS RUNS TO ADMIN ONLY
-- ============================================================================

DROP POLICY IF EXISTS "Users can view analysis runs" ON public.self_analysis_runs;
DROP POLICY IF EXISTS "Anyone can view analysis runs" ON public.self_analysis_runs;

CREATE POLICY "All users can view analysis runs"
  ON public.self_analysis_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create analysis runs"
  ON public.self_analysis_runs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update analysis runs"
  ON public.self_analysis_runs FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete analysis runs"
  ON public.self_analysis_runs FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- 8. RESTRICT AUTO IMPROVEMENTS TO ADMIN ONLY
-- ============================================================================

DROP POLICY IF EXISTS "Users can view auto improvements" ON public.auto_improvements;
DROP POLICY IF EXISTS "Anyone can view auto improvements" ON public.auto_improvements;

CREATE POLICY "All users can view auto improvements"
  ON public.auto_improvements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create improvements"
  ON public.auto_improvements FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update improvements"
  ON public.auto_improvements FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete improvements"
  ON public.auto_improvements FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- 9. RESTRICT COLLABORATIVE IDEAS TO ADMIN ONLY
-- ============================================================================

DROP POLICY IF EXISTS "Users can view collaborative ideas" ON public.collaborative_ideas;
DROP POLICY IF EXISTS "Anyone can view collaborative ideas" ON public.collaborative_ideas;

CREATE POLICY "All users can view collaborative ideas"
  ON public.collaborative_ideas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create ideas"
  ON public.collaborative_ideas FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update ideas"
  ON public.collaborative_ideas FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete ideas"
  ON public.collaborative_ideas FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- 10. RESTRICT PATTERN DISCOVERIES TO ADMIN ONLY
-- ============================================================================

DROP POLICY IF EXISTS "Users can view pattern discoveries" ON public.pattern_discoveries;
DROP POLICY IF EXISTS "Anyone can view pattern discoveries" ON public.pattern_discoveries;

CREATE POLICY "All users can view pattern discoveries"
  ON public.pattern_discoveries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create discoveries"
  ON public.pattern_discoveries FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update discoveries"
  ON public.pattern_discoveries FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete discoveries"
  ON public.pattern_discoveries FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- 11. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE admin_users IS 'List of authorized administrators who can approve platform upgrades - ONLY ADMINS CAN TRIGGER SELF-UPGRADE ENGINE';
COMMENT ON FUNCTION is_admin() IS 'Check if the current user is an administrator with platform upgrade permissions';
