import { supabase } from '@/services/supabaseClient';

export interface BuildConfig {
  project_id: string;
  build_type: 'preview' | 'development' | 'production';
  platform: 'web' | 'android' | 'ios';
}

export interface BuildStatus {
  id: string;
  status: 'pending' | 'building' | 'success' | 'failed';
  build_url: string;
  logs: string;
  error_message: string;
  started_at: string;
  completed_at: string | null;
}

export async function createBuild(config: BuildConfig): Promise<string> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data, error } = await supabase
    .from('project_builds')
    .insert({
      project_id: config.project_id,
      user_id: userId,
      build_type: config.build_type,
      platform: config.platform,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function getBuildStatus(buildId: string): Promise<BuildStatus> {
  const { data, error } = await supabase
    .from('project_builds')
    .select('*')
    .eq('id', buildId)
    .single();

  if (error) throw error;
  return data;
}

export async function getProjectBuilds(projectId: string): Promise<BuildStatus[]> {
  const { data, error } = await supabase
    .from('project_builds')
    .select('*')
    .eq('project_id', projectId)
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function updateBuildStatus(
  buildId: string,
  status: 'building' | 'success' | 'failed',
  updates: Partial<{
    build_url: string;
    logs: string;
    error_message: string;
  }>
): Promise<void> {
  const updateData: any = {
    status,
    ...updates,
  };

  if (status === 'success' || status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('project_builds')
    .update(updateData)
    .eq('id', buildId);

  if (error) throw error;
}

export async function generatePreviewBuild(
  projectId: string,
  htmlContent: string
): Promise<BuildStatus> {
  const buildId = await createBuild({
    project_id: projectId,
    build_type: 'preview',
    platform: 'web',
  });

  try {
    await updateBuildStatus(buildId, 'building', {
      logs: 'Generating preview...',
    });

    const userId = (await supabase.auth.getUser()).data.user?.id;
    const fileName = `preview-${projectId}-${Date.now()}.html`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-previews')
      .upload(`${userId}/${fileName}`, htmlContent, {
        contentType: 'text/html',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('project-previews')
      .getPublicUrl(uploadData.path);

    await updateBuildStatus(buildId, 'success', {
      build_url: urlData.publicUrl,
      logs: 'Preview generated successfully',
    });

    return await getBuildStatus(buildId);
  } catch (error) {
    await updateBuildStatus(buildId, 'failed', {
      error_message: error instanceof Error ? error.message : 'Unknown error',
      logs: 'Failed to generate preview',
    });

    throw error;
  }
}

export async function triggerProductionBuild(
  projectId: string,
  platform: 'web' | 'android' | 'ios'
): Promise<string> {
  const buildId = await createBuild({
    project_id: projectId,
    build_type: 'production',
    platform,
  });

  await updateBuildStatus(buildId, 'building', {
    logs: `Starting ${platform} production build...`,
  });

  return buildId;
}

export async function cancelBuild(buildId: string): Promise<void> {
  await updateBuildStatus(buildId, 'failed', {
    error_message: 'Build cancelled by user',
    logs: 'Build cancelled',
  });
}
