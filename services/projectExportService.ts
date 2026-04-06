import { supabase } from './supabaseClient';

export interface ProjectFile {
  path: string;
  content: string;
}

export interface ExportResult {
  id: string;
  download_url: string;
  file_size: number;
  expires_at: string;
}

export async function createProjectZip(files: ProjectFile[]): Promise<Blob> {
  const JSZip = await import('jszip');
  const zip = new JSZip.default();

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

export async function exportProject(
  projectId: string,
  files: ProjectFile[]
): Promise<ExportResult> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const zipBlob = await createProjectZip(files);
  const fileName = `project-${projectId}-${Date.now()}.zip`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('project-exports')
    .upload(`${userId}/${fileName}`, zipBlob, {
      contentType: 'application/zip',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('project-exports')
    .getPublicUrl(uploadData.path);

  const { data: exportRecord, error: recordError } = await supabase
    .from('project_exports')
    .insert({
      project_id: projectId,
      user_id: userId,
      export_type: 'zip',
      file_size: zipBlob.size,
      download_url: urlData.publicUrl,
    })
    .select()
    .single();

  if (recordError) throw recordError;

  return {
    id: exportRecord.id,
    download_url: exportRecord.download_url,
    file_size: exportRecord.file_size,
    expires_at: exportRecord.expires_at,
  };
}

export async function getProjectExports(projectId: string): Promise<ExportResult[]> {
  const { data, error } = await supabase
    .from('project_exports')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}

export async function downloadProjectZip(downloadUrl: string): Promise<void> {
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = 'project.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function cleanupExpiredExports(): Promise<void> {
  const { data: expiredExports, error: fetchError } = await supabase
    .from('project_exports')
    .select('id, download_url')
    .lt('expires_at', new Date().toISOString());

  if (fetchError) throw fetchError;

  if (expiredExports && expiredExports.length > 0) {
    for (const exp of expiredExports) {
      const path = exp.download_url.split('/').slice(-2).join('/');
      await supabase.storage.from('project-exports').remove([path]);
    }

    const ids = expiredExports.map(e => e.id);
    await supabase.from('project_exports').delete().in('id', ids);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
