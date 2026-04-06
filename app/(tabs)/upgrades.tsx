import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Sparkles, CircleCheck as CheckCircle, Circle as XCircle, Clock, TriangleAlert as AlertTriangle, TrendingUp } from 'lucide-react-native';
import { getPendingProposals, getProposalHistory, approveProposal, rejectProposal, getUpgradeStats, UpgradeProposal } from '@/services/upgradeDiscoveryService';

type TabType = 'pending' | 'history';

export default function UpgradesScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [proposals, setProposals] = useState<UpgradeProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    applied: 0,
    approval_rate: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    } else if (user) {
      loadData();
      loadStats();
    }
  }, [user, authLoading, activeTab]);

  const loadData = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      if (activeTab === 'pending') {
        const data = await getPendingProposals(selectedProject);
        setProposals(data);
      } else {
        const data = await getProposalHistory(selectedProject);
        setProposals(data);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const data = await getUpgradeStats(user.id);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleApprove = async (proposalId: string) => {
    try {
      await approveProposal(proposalId, 'Approved by user');
      loadData();
      loadStats();
    } catch (error) {
      console.error('Error approving proposal:', error);
    }
  };

  const handleReject = async (proposalId: string) => {
    try {
      await rejectProposal(proposalId, rejectionReason || 'Rejected by user');
      setShowRejectModal(null);
      setRejectionReason('');
      loadData();
      loadStats();
    } catch (error) {
      console.error('Error rejecting proposal:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#10b981';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'applied':
        return '#3b82f6';
      default:
        return '#6b7280';
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
        <Sparkles size={24} color="#3b82f6" />
        <Text style={styles.headerTitle}>AI Upgrades</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Clock size={18} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <CheckCircle size={18} color="#10b981" />
          <Text style={styles.statValue}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={18} color="#3b82f6" />
          <Text style={styles.statValue}>{Math.round(stats.approval_rate)}%</Text>
          <Text style={styles.statLabel}>Rate</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Clock size={18} color={activeTab === 'pending' ? '#3b82f6' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <CheckCircle size={18} color={activeTab === 'history' ? '#3b82f6' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {proposals.length === 0 ? (
          <View style={styles.emptyState}>
            <Sparkles size={48} color="#3b82f6" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'pending' ? 'No Pending Upgrades' : 'No History Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'pending'
                ? 'AI will discover improvements automatically'
                : 'Your upgrade decisions will appear here'
              }
            </Text>
          </View>
        ) : (
          proposals.map((proposal) => (
            <View key={proposal.id} style={styles.proposalCard}>
              <View style={styles.proposalHeader}>
                <View style={styles.typebadge}>
                  <Text style={styles.typeText}>{proposal.proposal_type}</Text>
                </View>
                {activeTab === 'history' && (
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(proposal.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(proposal.status) }]}>
                      {proposal.status}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.proposalTitle}>{proposal.title}</Text>
              <Text style={styles.proposalDescription}>{proposal.description}</Text>

              <View style={styles.detailsContainer}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Benefits:</Text>
                  <Text style={styles.detailText}>{proposal.benefits}</Text>
                </View>

                {proposal.risks && (
                  <View style={styles.detailSection}>
                    <AlertTriangle size={14} color="#f59e0b" />
                    <Text style={styles.detailLabel}>Risks:</Text>
                    <Text style={styles.detailText}>{proposal.risks}</Text>
                  </View>
                )}

                <View style={styles.filesContainer}>
                  <Text style={styles.detailLabel}>Affected Files:</Text>
                  {proposal.affected_files.slice(0, 3).map((file, idx) => (
                    <Text key={idx} style={styles.fileName}>{file}</Text>
                  ))}
                  {proposal.affected_files.length > 3 && (
                    <Text style={styles.moreFiles}>
                      +{proposal.affected_files.length - 3} more
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>AI Confidence:</Text>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${proposal.ai_confidence * 100}%`,
                        backgroundColor: getConfidenceColor(proposal.ai_confidence)
                      }
                    ]}
                  />
                </View>
                <Text style={styles.confidenceValue}>
                  {Math.round(proposal.ai_confidence * 100)}%
                </Text>
              </View>

              {activeTab === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApprove(proposal.id)}
                  >
                    <CheckCircle size={18} color="#fff" />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => setShowRejectModal(proposal.id)}
                  >
                    <XCircle size={18} color="#ef4444" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {showRejectModal === proposal.id && (
                <View style={styles.rejectModal}>
                  <Text style={styles.modalTitle}>Why reject this upgrade?</Text>
                  <TextInput
                    style={styles.reasonInput}
                    placeholder="Optional reason..."
                    placeholderTextColor="#6b7280"
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    multiline
                  />
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={() => {
                        setShowRejectModal(null);
                        setRejectionReason('');
                      }}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalConfirmButton}
                      onPress={() => handleReject(proposal.id)}
                    >
                      <Text style={styles.modalConfirmText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#3b82f6',
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
    textAlign: 'center',
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
  typebadge: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  proposalDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  detailSection: {
    flexDirection: 'row',
    gap: 4,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  filesContainer: {
    gap: 4,
  },
  fileName: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  moreFiles: {
    fontSize: 12,
    color: '#3b82f6',
    fontStyle: 'italic',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#2a2a3a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 6,
  },
  rejectButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  rejectModal: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: '#1a1a24',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#2a2a3a',
  },
  modalCancelText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#ef4444',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
