import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Cpu, CircleAlert as AlertCircle, TrendingUp, Zap, Code, CircleArrowUp as ArrowUpCircle, Sparkles, CircleCheck as CheckCircle, Play } from 'lucide-react-native';
import {
  getPlatformHealth,
  getPlatformCritiques,
  getPlatformProposals,
  getMetaLearnings,
  voteOnProposal,
  getAnalysisHistory,
  ArchitectureCritique,
  PlatformUpgradeProposal,
  MetaLearning,
} from '@/services/selfUpgradeEngine';
import {
  getTopDiscoveries,
  getCollaborativeIdeas,
  getPendingAutoImprovements,
  approveAutoImprovement,
  getSystemInsights,
  PatternDiscovery,
  CollaborativeIdea,
  AutoImprovement,
} from '@/services/autonomousLearningService';

type TabType = 'discoveries' | 'ideas' | 'auto-builds' | 'insights';

export default function PlatformScreen() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('discoveries');
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [discoveries, setDiscoveries] = useState<PatternDiscovery[]>([]);
  const [ideas, setIdeas] = useState<CollaborativeIdea[]>([]);
  const [autoImprovements, setAutoImprovements] = useState<AutoImprovement[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    } else if (!authLoading && user && !isAdmin) {
      router.replace('/');
    } else if (user && isAdmin) {
      loadData();
    }
  }, [user, authLoading, isAdmin, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const insightsData = await getSystemInsights();
      setInsights(insightsData);

      if (activeTab === 'discoveries') {
        const discoveryData = await getTopDiscoveries(20);
        setDiscoveries(discoveryData);
      } else if (activeTab === 'ideas') {
        const ideaData = await getCollaborativeIdeas();
        setIdeas(ideaData);
      } else if (activeTab === 'auto-builds') {
        const improvementData = await getPendingAutoImprovements();
        setAutoImprovements(improvementData);
      }
    } catch (error) {
      console.error('Error loading platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (improvementId: string) => {
    try {
      await approveAutoImprovement(improvementId);
      loadData();
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const getSuccessColor = (rate: number) => {
    if (rate >= 0.8) return '#10b981';
    if (rate >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  if (authLoading || loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Access Denied</Text>
        <Text style={styles.errorSubtext}>Only administrators can access this page</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sparkles size={24} color="#10b981" />
        <Text style={styles.headerTitle}>Autonomous Learning</Text>
      </View>

      {insights && (
        <View style={styles.healthCards}>
          <View style={styles.healthCard}>
            <CheckCircle size={20} color="#10b981" />
            <Text style={styles.healthValue}>
              {Math.round(insights.health.success_rate * 100)}%
            </Text>
            <Text style={styles.healthLabel}>Success</Text>
          </View>
          <View style={styles.healthCard}>
            <Code size={20} color="#3b82f6" />
            <Text style={styles.healthValue}>{insights.health.active_patterns}</Text>
            <Text style={styles.healthLabel}>Patterns</Text>
          </View>
          <View style={styles.healthCard}>
            <Sparkles size={20} color="#f59e0b" />
            <Text style={styles.healthValue}>{insights.collaborative_ideas.length}</Text>
            <Text style={styles.healthLabel}>Ideas</Text>
          </View>
          <View style={styles.healthCard}>
            <Zap size={20} color="#a855f7" />
            <Text style={styles.healthValue}>{insights.pending_improvements.length}</Text>
            <Text style={styles.healthLabel}>Auto</Text>
          </View>
        </View>
      )}

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discoveries' && styles.tabActive]}
          onPress={() => setActiveTab('discoveries')}
        >
          <Text style={[styles.tabText, activeTab === 'discoveries' && styles.tabTextActive]}>
            Discoveries
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'ideas' && styles.tabActive]}
          onPress={() => setActiveTab('ideas')}
        >
          <Text style={[styles.tabText, activeTab === 'ideas' && styles.tabTextActive]}>
            Ideas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'auto-builds' && styles.tabActive]}
          onPress={() => setActiveTab('auto-builds')}
        >
          <Text style={[styles.tabText, activeTab === 'auto-builds' && styles.tabTextActive]}>
            Auto-Build
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && styles.tabActive]}
          onPress={() => setActiveTab('insights')}
        >
          <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>
            Insights
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'discoveries' && (
          <View>
            <Text style={styles.sectionTitle}>Pattern Discoveries</Text>
            <Text style={styles.sectionSubtitle}>
              What works and what doesn't - learned automatically
            </Text>
            {discoveries.map((discovery) => (
              <View key={discovery.id} style={styles.discoveryCard}>
                <View style={styles.discoveryHeader}>
                  <Text style={styles.discoveryName}>{discovery.pattern_name}</Text>
                  <View style={styles.rateContainer}>
                    <Text
                      style={[
                        styles.successRate,
                        { color: getSuccessColor(discovery.success_rate) },
                      ]}
                    >
                      {Math.round(discovery.success_rate * 100)}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.discoveryDescription}>{discovery.description}</Text>

                {discovery.works_well_for.length > 0 && (
                  <View style={styles.worksBox}>
                    <Text style={styles.worksLabel}>Works well for:</Text>
                    {discovery.works_well_for.map((item, idx) => (
                      <Text key={idx} style={styles.worksItem}>✓ {item}</Text>
                    ))}
                  </View>
                )}

                {discovery.fails_for.length > 0 && (
                  <View style={styles.failsBox}>
                    <Text style={styles.failsLabel}>Avoid for:</Text>
                    {discovery.fails_for.map((item, idx) => (
                      <Text key={idx} style={styles.failsItem}>✗ {item}</Text>
                    ))}
                  </View>
                )}

                <View style={styles.discoveryFooter}>
                  <Text style={styles.usageCount}>Used {discovery.usage_count}x</Text>
                  <Text style={styles.confidenceText}>
                    {Math.round(discovery.confidence_score * 100)}% confident
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'ideas' && (
          <View>
            <Text style={styles.sectionTitle}>Collaborative Ideas</Text>
            <Text style={styles.sectionSubtitle}>
              AI synthesized from multiple successful patterns
            </Text>
            {ideas.map((idea) => (
              <View key={idea.id} style={styles.ideaCard}>
                <View style={styles.ideaHeader}>
                  <Text style={styles.ideaType}>{idea.idea_type}</Text>
                  {idea.implementation_ready && (
                    <View style={styles.readyBadge}>
                      <CheckCircle size={14} color="#10b981" />
                      <Text style={styles.readyText}>Ready</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.ideaTitle}>{idea.title}</Text>
                <Text style={styles.ideaDescription}>{idea.description}</Text>

                <View style={styles.synthesizedBox}>
                  <Text style={styles.synthesizedLabel}>Synthesized from:</Text>
                  <Text style={styles.synthesizedText}>
                    {idea.synthesized_from.length} patterns
                  </Text>
                </View>

                <View style={styles.ideaFooter}>
                  <Text style={styles.ideaConfidence}>
                    {Math.round(idea.confidence_score * 100)}% confidence
                  </Text>
                  <Text style={styles.ideaStatus}>{idea.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'auto-builds' && (
          <View>
            <Text style={styles.sectionTitle}>Auto-Build Queue</Text>
            <Text style={styles.sectionSubtitle}>
              System-generated improvements ready to implement
            </Text>
            {autoImprovements.map((improvement) => (
              <View key={improvement.id} style={styles.autoCard}>
                <View style={styles.autoHeader}>
                  <Text style={styles.autoCategory}>{improvement.improvement_category}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          improvement.execution_status === 'pending'
                            ? '#f59e0b20'
                            : '#10b98120',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            improvement.execution_status === 'pending'
                              ? '#f59e0b'
                              : '#10b981',
                        },
                      ]}
                    >
                      {improvement.execution_status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.autoTitle}>{improvement.title}</Text>
                <Text style={styles.autoDescription}>{improvement.description}</Text>

                <View style={styles.rationaleBox}>
                  <Text style={styles.rationaleLabel}>Why:</Text>
                  <Text style={styles.rationaleText}>{improvement.rationale}</Text>
                </View>

                <View style={styles.autoFooter}>
                  <Text style={styles.autoConfidence}>
                    {Math.round(improvement.confidence_score * 100)}% confident
                  </Text>
                  {improvement.requires_approval && (
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApprove(improvement.id)}
                    >
                      <Play size={14} color="#fff" />
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'insights' && insights && (
          <View>
            <Text style={styles.sectionTitle}>System Insights</Text>
            <Text style={styles.sectionSubtitle}>
              Real-time learning from entire platform ecosystem
            </Text>

            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Platform Health</Text>
              <Text style={styles.insightValue}>
                {Math.round(insights.health.success_rate * 100)}% Success Rate
              </Text>
              <Text style={styles.insightSubtext}>
                From {insights.health.total_builds} builds
              </Text>
            </View>

            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Top Discoveries</Text>
              {insights.top_discoveries.map((d: PatternDiscovery, idx: number) => (
                <View key={idx} style={styles.quickItem}>
                  <Text style={styles.quickName}>{d.pattern_name}</Text>
                  <Text style={styles.quickRate}>
                    {Math.round(d.success_rate * 100)}%
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Recent Collaborative Ideas</Text>
              {insights.collaborative_ideas.map((i: CollaborativeIdea, idx: number) => (
                <Text key={idx} style={styles.quickIdea}>
                  • {i.title}
                </Text>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'health' && (
          <View>
            <Text style={styles.sectionTitle}>Self-Analysis History</Text>
            <Text style={styles.sectionSubtitle}>
              AI continuously analyzes platform architecture
            </Text>
            {analysisHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Cpu size={48} color="#3b82f6" />
                <Text style={styles.emptyTitle}>No Analysis Yet</Text>
                <Text style={styles.emptyText}>
                  Platform will run self-analysis automatically
                </Text>
              </View>
            ) : (
              analysisHistory.map((run) => (
                <View key={run.id} style={styles.analysisCard}>
                  <View style={styles.analysisHeader}>
                    <Text style={styles.analysisStatus}>{run.status}</Text>
                    <Text style={styles.analysisDate}>
                      {new Date(run.started_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.analysisStats}>
                    <View style={styles.analysisStat}>
                      <Text style={styles.statLabel}>Issues</Text>
                      <Text style={styles.statValue}>{run.issues_found}</Text>
                    </View>
                    <View style={styles.analysisStat}>
                      <Text style={styles.statLabel}>Proposals</Text>
                      <Text style={styles.statValue}>{run.proposals_created}</Text>
                    </View>
                    <View style={styles.analysisStat}>
                      <Text style={styles.statLabel}>Learnings</Text>
                      <Text style={styles.statValue}>{run.learnings_captured}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'critiques' && (
          <View>
            <Text style={styles.sectionTitle}>Architecture Critiques</Text>
            <Text style={styles.sectionSubtitle}>
              AI-discovered issues in platform code
            </Text>
            {critiques.map((critique) => (
              <View key={critique.id} style={styles.critiqueCard}>
                <View style={styles.critiqueHeader}>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: `${getSeverityColor(critique.severity)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        { color: getSeverityColor(critique.severity) },
                      ]}
                    >
                      {critique.severity}
                    </Text>
                  </View>
                  <Text style={styles.component}>{critique.component}</Text>
                </View>
                <Text style={styles.critiqueTitle}>{critique.issue_title}</Text>
                <Text style={styles.critiqueDescription}>
                  {critique.issue_description}
                </Text>
                <View style={styles.improvementBox}>
                  <Text style={styles.improvementLabel}>Suggested Fix:</Text>
                  <Text style={styles.improvementText}>
                    {critique.suggested_improvement}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'proposals' && (
          <View>
            <Text style={styles.sectionTitle}>Platform V2 Proposals</Text>
            <Text style={styles.sectionSubtitle}>
              AI-generated ideas for platform evolution
            </Text>
            {proposals.map((proposal) => (
              <View key={proposal.id} style={styles.proposalCard}>
                <View style={styles.proposalHeader}>
                  <Text style={styles.proposalCategory}>{proposal.upgrade_category}</Text>
                  <Text style={styles.versionBadgeSmall}>
                    {proposal.version_from} → {proposal.version_to}
                  </Text>
                </View>
                <Text style={styles.proposalTitle}>{proposal.title}</Text>
                <Text style={styles.proposalDescription}>{proposal.description}</Text>

                <View style={styles.rationaleBox}>
                  <Text style={styles.rationaleLabel}>Why:</Text>
                  <Text style={styles.rationaleText}>{proposal.rationale}</Text>
                </View>

                <View style={styles.benefitsContainer}>
                  <Text style={styles.benefitsLabel}>Benefits:</Text>
                  {proposal.benefits.map((benefit, idx) => (
                    <Text key={idx} style={styles.benefitItem}>• {benefit}</Text>
                  ))}
                </View>

                <View style={styles.proposalFooter}>
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceLabel}>Confidence:</Text>
                    <Text style={styles.confidenceValue}>
                      {Math.round(proposal.ai_confidence * 100)}%
                    </Text>
                  </View>
                  <View style={styles.voteContainer}>
                    <TouchableOpacity
                      style={styles.voteButton}
                      onPress={() => handleVote(proposal.id, 1)}
                    >
                      <TrendingUp size={16} color="#10b981" />
                      <Text style={styles.voteCount}>{proposal.community_votes}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
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
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6b7280',
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
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  versionBadge: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  versionText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  healthCards: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  healthCard: {
    flex: 1,
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  healthValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  healthLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a24',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3a',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  analysisCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  analysisStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  analysisDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  analysisStats: {
    flexDirection: 'row',
    gap: 16,
  },
  analysisStat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  critiqueCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  critiqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  component: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  critiqueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  critiqueDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 12,
  },
  improvementBox: {
    backgroundColor: '#0a0a0f',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b98120',
  },
  improvementLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  improvementText: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  proposalCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  proposalCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
    textTransform: 'uppercase',
  },
  versionBadgeSmall: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  proposalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  proposalDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 12,
  },
  rationaleBox: {
    backgroundColor: '#0a0a0f',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  rationaleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 4,
  },
  rationaleText: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  benefitsContainer: {
    marginBottom: 12,
  },
  benefitsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 6,
  },
  benefitItem: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 20,
  },
  proposalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  confidenceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  voteContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  voteCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  discoveryCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  discoveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  discoveryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    fontFamily: 'monospace',
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successRate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  discoveryDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 12,
  },
  worksBox: {
    backgroundColor: '#10b98110',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  worksLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 6,
  },
  worksItem: {
    fontSize: 13,
    color: '#10b981',
    lineHeight: 20,
  },
  failsBox: {
    backgroundColor: '#ef444410',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  failsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 6,
  },
  failsItem: {
    fontSize: 13,
    color: '#ef4444',
    lineHeight: 20,
  },
  discoveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  usageCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  confidenceText: {
    fontSize: 12,
    color: '#6b7280',
  },
  ideaCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ideaType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
    textTransform: 'uppercase',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  readyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  ideaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  ideaDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 12,
  },
  synthesizedBox: {
    backgroundColor: '#0a0a0f',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  synthesizedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  synthesizedText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  ideaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ideaConfidence: {
    fontSize: 12,
    color: '#6b7280',
  },
  ideaStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
    textTransform: 'uppercase',
  },
  autoCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  autoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  autoCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a855f7',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  autoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  autoDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 12,
  },
  autoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoConfidence: {
    fontSize: 12,
    color: '#6b7280',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  approveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  insightCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  insightValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  insightSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  quickItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3a',
  },
  quickName: {
    fontSize: 13,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  quickRate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  quickIdea: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 20,
  },
  learningCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  learningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  learningType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
    textTransform: 'uppercase',
  },
  learningConfidence: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  learningContext: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  learningContent: {
    gap: 12,
  },
  learningSection: {
    backgroundColor: '#0a0a0f',
    padding: 12,
    borderRadius: 8,
  },
  learningSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 4,
  },
  learningSectionText: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  validationCount: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
});
