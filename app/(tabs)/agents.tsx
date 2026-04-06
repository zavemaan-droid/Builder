import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Bot, Play, Pause, Zap } from 'lucide-react-native';
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

export default function AgentsScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    } else if (user) {
      loadAgents();
    }
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
      {
        user_id: user?.id,
        name: 'Code Generator',
        description: 'Automatically generates and improves code based on your descriptions',
        type: 'builder',
        trigger: 'manual',
      },
      {
        user_id: user?.id,
        name: 'Bug Fixer',
        description: 'Automatically detects and fixes bugs in your code',
        type: 'debugger',
        trigger: 'auto',
      },
      {
        user_id: user?.id,
        name: 'Self-Upgrader',
        description: 'Improves the platform itself and adds new features',
        type: 'meta',
        trigger: 'scheduled',
      },
    ];

    try {
      const { data, error } = await supabase
        .from('super_agents')
        .insert(defaultAgents)
        .select();

      if (error) throw error;
      if (data) setAgents(data);
    } catch (error) {
      console.error('Error creating agents:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Bot size={24} color="#3b82f6" />
        <Text style={styles.headerTitle}>Super Agents</Text>
      </View>

      <ScrollView style={styles.content}>
        {agents.length === 0 ? (
          <View style={styles.emptyState}>
            <Bot size={48} color="#3b82f6" />
            <Text style={styles.emptyTitle}>No Agents Yet</Text>
            <Text style={styles.emptyText}>Create AI agents to automate your workflow</Text>
            <TouchableOpacity style={styles.createButton} onPress={createDefaultAgents}>
              <Zap size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Default Agents</Text>
            </TouchableOpacity>
          </View>
        ) : (
          agents.map((agent) => (
            <View key={agent.id} style={styles.agentCard}>
              <View style={styles.agentHeader}>
                <Bot size={24} color="#3b82f6" />
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentType}>{agent.type}</Text>
                </View>
                <Switch
                  value={agent.enabled}
                  onValueChange={() => toggleAgent(agent.id, agent.enabled)}
                  trackColor={{ false: '#2a2a3a', true: '#3b82f660' }}
                  thumbColor={agent.enabled ? '#3b82f6' : '#6b7280'}
                />
              </View>

              <Text style={styles.agentDescription}>{agent.description}</Text>

              <View style={styles.agentFooter}>
                <View style={styles.statusContainer}>
                  {agent.status === 'running' ? (
                    <Play size={14} color="#10b981" />
                  ) : (
                    <Pause size={14} color="#6b7280" />
                  )}
                  <Text style={[styles.status, agent.status === 'running' && styles.statusRunning]}>
                    {agent.status}
                  </Text>
                </View>
                <Text style={styles.runCount}>{agent.run_count} runs</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  agentCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  agentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  agentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  agentType: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  agentDescription: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  agentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 4,
  },
  statusRunning: {
    color: '#10b981',
  },
  runCount: {
    color: '#6b7280',
    fontSize: 12,
  },
});
