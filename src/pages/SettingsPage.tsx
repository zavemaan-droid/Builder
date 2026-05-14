import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Settings as SettingsIcon, Key, LogOut, ExternalLink, Sparkles, Shield, Database } from 'lucide-react';
import { PROVIDER_INFO, AIProvider } from '@/services/aiService';
import { getMemorySettings, updateMemorySettings, getStorageUsage, formatBytes, MemorySettings } from '@/services/memorySync';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const key = localStorage.getItem('ai_api_key');
    const provider = localStorage.getItem('ai_provider') as AIProvider;
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
    localStorage.setItem('ai_api_key', apiKey);
    localStorage.setItem('ai_provider', selectedProvider);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="page">
      <div className="page-header">
        <SettingsIcon size={24} color="#3b82f6" />
        <h1>Settings</h1>
      </div>

      <div className="page-body" style={{ padding: 0 }}>
        <div className="section">
          <h2 className="section-title">Account</h2>
          <div className="card">
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Email</div>
            <div style={{ fontSize: 16, marginBottom: 16 }}>{user?.email}</div>
            <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleSignOut}>
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">AI Provider</h2>
          <p className="section-subtitle" style={{ marginBottom: 16 }}>Choose your AI provider. All options support free tiers.</p>

          {(Object.keys(PROVIDER_INFO) as AIProvider[]).map((provider) => (
            <div
              key={provider}
              className={`provider-card${selectedProvider === provider ? ' selected' : ''}`}
              onClick={() => setSelectedProvider(provider)}
            >
              <div className="provider-header">
                <div className="radio">
                  {selectedProvider === provider && <div className="radio-inner" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="provider-name">{PROVIDER_INFO[provider].name}</div>
                  <div className="provider-desc">{PROVIDER_INFO[provider].description}</div>
                  <div className="provider-limit">{PROVIDER_INFO[provider].freeLimit}</div>
                </div>
              </div>
              <button className="signup-link" onClick={(e) => { e.stopPropagation(); window.open(PROVIDER_INFO[provider].signupUrl, '_blank'); }}>
                Get API Key <ExternalLink size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="section">
          <h2 className="section-title">API Configuration</h2>
          <div className="card">
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>API Key</div>
            <input
              className="input"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              type="password"
              style={{ marginBottom: 16 }}
            />
            <button
              className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
              style={{ width: '100%' }}
              onClick={saveSettings}
            >
              <Key size={18} /> {saved ? 'Saved!' : 'Save API Key'}
            </button>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Privacy & Sharing</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Control what gets shared to help the community learn.</p>
          <div className="card">
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Share Code Patterns</div>
                <div className="setting-desc">Help others by sharing reusable code patterns</div>
              </div>
              <button className={`toggle${memorySettings.sharePatterns ? ' active' : ''}`} onClick={() => toggleMemorySetting('sharePatterns')} />
            </div>
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Share Agent Learnings</div>
                <div className="setting-desc">Anonymous insights that help agents improve</div>
              </div>
              <button className={`toggle${memorySettings.shareLearnings ? ' active' : ''}`} onClick={() => toggleMemorySetting('shareLearnings')} />
            </div>
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Anonymous Usage Stats</div>
                <div className="setting-desc">Help improve the platform (no personal data)</div>
              </div>
              <button className={`toggle${memorySettings.shareAnonymousUsage ? ' active' : ''}`} onClick={() => toggleMemorySetting('shareAnonymousUsage')} />
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Storage</h2>
          <div className="card">
            <div className="storage-row">
              <Shield size={18} color="#3b82f6" />
              <span className="storage-label">Local (Private)</span>
              <span className="storage-value">{formatBytes(storageUsage.local)}</span>
            </div>
            <div className="storage-row">
              <Database size={18} color="#10b981" />
              <span className="storage-label">Cloud (Shared)</span>
              <span className="storage-value">{formatBytes(storageUsage.cloud)}</span>
            </div>
          </div>
        </div>

        <div className="info-box">
          <Sparkles size={20} color="#3b82f6" />
          <p>Your API key and private data stay on your device. Only patterns and learnings you choose to share go to the cloud.</p>
        </div>
      </div>
    </div>
  );
}
