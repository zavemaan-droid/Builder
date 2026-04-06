import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

export interface MemorySettings {
  sharePatterns: boolean;
  shareLearnings: boolean;
  shareAnonymousUsage: boolean;
  keepLocalBackup: boolean;
}

export interface LocalMemory {
  apiKeys: Record<string, string>;
  preferences: Record<string, any>;
  chatHistory: any[];
  privateNotes: string[];
}

const DEFAULT_SETTINGS: MemorySettings = {
  sharePatterns: false,
  shareLearnings: false,
  shareAnonymousUsage: true,
  keepLocalBackup: true,
};

export async function getMemorySettings(): Promise<MemorySettings> {
  const settings = await AsyncStorage.getItem('memory_settings');
  return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
}

export async function updateMemorySettings(settings: Partial<MemorySettings>): Promise<void> {
  const current = await getMemorySettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem('memory_settings', JSON.stringify(updated));
}

export async function syncToCloud(data: any, type: 'pattern' | 'learning'): Promise<boolean> {
  const settings = await getMemorySettings();

  if (type === 'pattern' && !settings.sharePatterns) {
    return false;
  }

  if (type === 'learning' && !settings.shareLearnings) {
    return false;
  }

  try {
    const table = type === 'pattern' ? 'pattern_library' : 'agent_learnings';
    const { error } = await supabase.from(table).insert(data);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Cloud sync failed:', error);
    return false;
  }
}

export async function getLocalMemory(): Promise<LocalMemory> {
  const apiKeys = await AsyncStorage.getItem('api_keys');
  const preferences = await AsyncStorage.getItem('user_preferences');
  const chatHistory = await AsyncStorage.getItem('chat_messages');
  const privateNotes = await AsyncStorage.getItem('private_notes');

  return {
    apiKeys: apiKeys ? JSON.parse(apiKeys) : {},
    preferences: preferences ? JSON.parse(preferences) : {},
    chatHistory: chatHistory ? JSON.parse(chatHistory) : [],
    privateNotes: privateNotes ? JSON.parse(privateNotes) : [],
  };
}

export async function exportLocalMemory(): Promise<string> {
  const memory = await getLocalMemory();
  return JSON.stringify(memory, null, 2);
}

export async function importLocalMemory(jsonData: string): Promise<void> {
  const memory: LocalMemory = JSON.parse(jsonData);

  if (memory.apiKeys) {
    await AsyncStorage.setItem('api_keys', JSON.stringify(memory.apiKeys));
  }
  if (memory.preferences) {
    await AsyncStorage.setItem('user_preferences', JSON.stringify(memory.preferences));
  }
  if (memory.chatHistory) {
    await AsyncStorage.setItem('chat_messages', JSON.stringify(memory.chatHistory));
  }
  if (memory.privateNotes) {
    await AsyncStorage.setItem('private_notes', JSON.stringify(memory.privateNotes));
  }
}

export async function clearLocalMemory(keepSettings: boolean = true): Promise<void> {
  const settings = keepSettings ? await getMemorySettings() : null;

  await AsyncStorage.clear();

  if (settings) {
    await AsyncStorage.setItem('memory_settings', JSON.stringify(settings));
  }
}

export async function getStorageUsage(): Promise<{
  local: number;
  cloud: number;
}> {
  let localSize = 0;
  const keys = await AsyncStorage.getAllKeys();

  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      localSize += new Blob([value]).size;
    }
  }

  const { data: patterns } = await supabase
    .from('pattern_library')
    .select('code_snippet')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

  const { data: learnings } = await supabase
    .from('agent_learnings')
    .select('solution');

  let cloudSize = 0;
  if (patterns) {
    cloudSize += patterns.reduce((sum, p) => sum + new Blob([p.code_snippet]).size, 0);
  }
  if (learnings) {
    cloudSize += learnings.reduce((sum, l) => sum + new Blob([l.solution]).size, 0);
  }

  return {
    local: localSize,
    cloud: cloudSize,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
