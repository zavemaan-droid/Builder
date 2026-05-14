import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, Play, Pause, Zap } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';

interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  enabled: boolean;
  run_count: number;
}

export default function AgentsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    else if (user) loadAgents();
  }, [user, authLoading]);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('super_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = async (agentId: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('super_agents')
        .update({ enabled: !currentEnabled })
        .eq('id', agentId);

      if (error) throw error;
      setAgents(agents.map(a => a.id === agentId ? { ...a, enabled: !currentEnabled } : a));
    } catch (error) {
      console.error('Error toggling agent:', error);
    }
  };

  const createDefaultAgents = async () => {
    const defaultAgents = [
      { user_id: user?.id, name: 'Code Generator', description: 'Automatically generates and improves code based on your descriptions', type: 'builder', trigger: 'manual' },
      { user_id: user?.id, name: 'Bug Fixer', description: 'Automatically detects and fixes bugs in your code', type: 'debugger', trigger: 'auto' },
      { user_id: user?.id, name: 'Self-Upgrader', description: 'Improves the platform itself and adds new features', type: 'meta', trigger: 'scheduled' },
    ];

    try {
      const { data, error } = await supabase.from('super_agents').insert(defaultAgents).select();
      if (error) throw error;
      if (data) setAgents(data);
    } catch (error) {
      console.error('Error creating agents:', error);
    }
  };

  if (authLoading || loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <Bot size={24} color="#3b82f6" />
        <h1>Super Agents</h1>
      </div>

      <div className="page-body">
        {agents.length === 0 ? (
          <div className="empty-state">
            <Bot size={48} color="#3b82f6" />
            <h2>No Agents Yet</h2>
            <p>Create AI agents to automate your workflow</p>
            <button className="btn btn-primary" onClick={createDefaultAgents}>
              <Zap size={20} /> Create Default Agents
            </button>
          </div>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} className="card">
              <div className="agent-header">
                <Bot size={24} color="#3b82f6" />
                <div className="agent-info">
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-type">{agent.type}</div>
                </div>
                <button
                  className={`toggle${agent.enabled ? ' active' : ''}`}
                  onClick={() => toggleAgent(agent.id, agent.enabled)}
                />
              </div>

              <p className="card-description">{agent.description}</p>

              <div className="agent-footer">
                <div className="status-container">
                  {agent.status === 'running' ? <Play size={14} color="#10b981" /> : <Pause size={14} color="#6b7280" />}
                  <span className={`status-text${agent.status === 'running' ? ' status-running' : ''}`}>{agent.status}</span>
                </div>
                <span className="run-count">{agent.run_count} runs</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
