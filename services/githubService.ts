import { supabase } from './supabaseClient';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  updated_at: string;
}

export interface GitHubConnection {
  id: string;
  github_username: string;
  is_active: boolean;
  connected_at: string;
  last_synced_at: string | null;
}

export async function getGitHubConnection(): Promise<GitHubConnection | null> {
  const { data, error } = await supabase
    .from('github_connections')
    .select('id, github_username, is_active, connected_at, last_synced_at')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function connectGitHub(username: string, accessToken: string): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { error } = await supabase
    .from('github_connections')
    .upsert({
      user_id: userId,
      github_username: username,
      access_token: accessToken,
      is_active: true,
      connected_at: new Date().toISOString(),
    });

  if (error) throw error;
}

export async function disconnectGitHub(): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { error } = await supabase
    .from('github_connections')
    .update({ is_active: false })
    .eq('user_id', userId);

  if (error) throw error;
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase
    .from('github_connections')
    .select('access_token')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) throw new Error('GitHub not connected');
  return data.access_token;
}

export async function listRepositories(): Promise<GitHubRepo[]> {
  const token = await getAccessToken();

  const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch repositories');
  }

  return await response.json();
}

export async function createRepository(name: string, description: string, isPrivate: boolean): Promise<GitHubRepo> {
  const token = await getAccessToken();

  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      private: isPrivate,
      auto_init: true,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create repository');
  }

  return await response.json();
}

export async function pushToRepository(
  repoName: string,
  files: Array<{ path: string; content: string }>,
  commitMessage: string
): Promise<void> {
  const token = await getAccessToken();
  const connection = await getGitHubConnection();

  if (!connection) throw new Error('GitHub not connected');

  for (const file of files) {
    const response = await fetch(
      `https://api.github.com/repos/${connection.github_username}/${repoName}/contents/${file.path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: btoa(file.content),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to push ${file.path}`);
    }
  }

  await supabase
    .from('github_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
}

export async function syncProjectToGitHub(
  projectId: string,
  repoName: string,
  files: Array<{ path: string; content: string }>
): Promise<void> {
  try {
    await pushToRepository(repoName, files, `Update from AI Builder Platform - ${new Date().toISOString()}`);
  } catch (error) {
    const connection = await getGitHubConnection();
    if (connection) {
      await createRepository(repoName, `Project from AI Builder Platform`, false);
      await pushToRepository(repoName, files, 'Initial commit from AI Builder Platform');
    } else {
      throw error;
    }
  }
}
