import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Linking, Switch } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Settings as SettingsIcon, Key, LogOut, ExternalLink, Sparkles, Shield, Database } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROVIDER_INFO, AIProvider } from '@/services/aiService';
import { getMemorySettings, updateMemorySettings, getStorageUsage, formatBytes, MemorySettings } from '@/services/memorySync';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openrouter');
  const [saved, setSaved] = useState(false);
  const [memorySettings, setMemorySettings] = useState<MemorySettings>({
    sharePatterns: false,
    shareLearnings: false,
    shareAnonymousUsage: true,
    keepLocalBackup: true,
  });
  const [storageUsage, setStorageUsage] = useState({ local: 0, cloud: 0 });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const key = await AsyncStorage.getItem('ai_api_key');
    const provider = await AsyncStorage.getItem('ai_provider') as AIProvider;
    if (key) setApiKey(key);
    if (provider) setSelectedProvider(provider);

    const memSettings = await getMemorySettings();
    setMemorySettings(memSettings);

    const usage = await getStorageUsage();
    setStorageUsage(usage);
  };

  const toggleMemorySetting = async (key: keyof MemorySettings) => {
    const updated = { ...memorySettings, [key]: !memorySettings[key] };
    setMemorySettings(updated);
    await updateMemorySettings(updated);
  };

  const saveSettings = async () => {
    await AsyncStorage.setItem('ai_api_key', apiKey);
    await AsyncStorage.setItem('ai_provider', selectedProvider);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  const openProviderSignup = (provider: AIProvider) => {
    Linking.openURL(PROVIDER_INFO[provider].signupUrl);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SettingsIcon size={24} color="#3b82f6" />
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <LogOut size={18} color="#ef4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Provider</Text>
          <Text style={styles.sectionDescription}>
            Choose your AI provider. All options support free tiers.
          </Text>

          {(Object.keys(PROVIDER_INFO) as AIProvider[]).map((provider) => (
            <TouchableOpacity
              key={provider}
              style={[
                styles.providerCard,
                selectedProvider === provider && styles.providerCardSelected,
              ]}
              onPress={() => setSelectedProvider(provider)}
            >
              <View style={styles.providerHeader}>
                <View style={styles.radio}>
                  {selectedProvider === provider && <View style={styles.radioSelected} />}
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{PROVIDER_INFO[provider].name}</Text>
                  <Text style={styles.providerDescription}>
                    {PROVIDER_INFO[provider].description}
                  </Text>
                  <Text style={styles.providerLimit}>{PROVIDER_INFO[provider].freeLimit}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => openProviderSignup(provider)}
              >
                <Text style={styles.signupButtonText}>Get API Key</Text>
                <ExternalLink size={14} color="#3b82f6" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Configuration</Text>
          <View style={styles.card}>
            <Text style={styles.label}>API Key</Text>
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Enter your API key"
              placeholderTextColor="#6b7280"
              secureTextEntry
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.saveButton, saved && styles.saveButtonSuccess]}
              onPress={saveSettings}
            >
              <Key size={18} color="#fff" />
              <Text style={styles.saveButtonText}>
                {saved ? 'Saved!' : 'Save API Key'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Sharing</Text>
          <Text style={styles.sectionDescription}>
            Control what gets shared to help the community learn.
          </Text>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Share Code Patterns</Text>
                <Text style={styles.settingDescription}>
                  Help others by sharing reusable code patterns
                </Text>
              </View>
              <Switch
                value={memorySettings.sharePatterns}
                onValueChange={() => toggleMemorySetting('sharePatterns')}
                trackColor={{ false: '#2a2a3a', true: '#3b82f660' }}
                thumbColor={memorySettings.sharePatterns ? '#3b82f6' : '#6b7280'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Share Agent Learnings</Text>
                <Text style={styles.settingDescription}>
                  Anonymous insights that help agents improve
                </Text>
              </View>
              <Switch
                value={memorySettings.shareLearnings}
                onValueChange={() => toggleMemorySetting('shareLearnings')}
                trackColor={{ false: '#2a2a3a', true: '#3b82f660' }}
                thumbColor={memorySettings.shareLearnings ? '#3b82f6' : '#6b7280'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Anonymous Usage Stats</Text>
                <Text style={styles.settingDescription}>
                  Help improve the platform (no personal data)
                </Text>
              </View>
              <Switch
                value={memorySettings.shareAnonymousUsage}
                onValueChange={() => toggleMemorySetting('shareAnonymousUsage')}
                trackColor={{ false: '#2a2a3a', true: '#3b82f660' }}
                thumbColor={memorySettings.shareAnonymousUsage ? '#3b82f6' : '#6b7280'}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <View style={styles.card}>
            <View style={styles.storageRow}>
              <Shield size={18} color="#3b82f6" />
              <Text style={styles.storageLabel}>Local (Private)</Text>
              <Text style={styles.storageValue}>{formatBytes(storageUsage.local)}</Text>
            </View>
            <View style={styles.storageRow}>
              <Database size={18} color="#10b981" />
              <Text style={styles.storageLabel}>Cloud (Shared)</Text>
              <Text style={styles.storageValue}>{formatBytes(storageUsage.cloud)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Sparkles size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Your API key and private data stay on your device. Only patterns and learnings you choose to share go to the cloud.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#1a1a24',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  label: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
  },
  saveButtonSuccess: {
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  providerCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2a2a3a',
  },
  providerCardSelected: {
    borderColor: '#3b82f6',
  },
  providerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  providerDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  providerLimit: {
    fontSize: 12,
    color: '#6b7280',
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  signupButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3a',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3a',
  },
  storageLabel: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    marginLeft: 12,
  },
  storageValue: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#3b82f640',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#9ca3af',
    marginLeft: 12,
    lineHeight: 18,
  },
});
