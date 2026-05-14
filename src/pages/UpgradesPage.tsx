import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { getPendingProposals, getProposalHistory, approveProposal, rejectProposal, getUpgradeStats, UpgradeProposal } from '@/services/upgradeDiscoveryService';

type TabType = 'pending' | 'history';

export default function UpgradesPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [proposals, setProposals] = useState<UpgradeProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, applied: 0, approval_rate: 0 });

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    else if (!authLoading && user && !isAdmin) navigate('/');
    else if (user && isAdmin) { loadData(); loadStats(); }
  }, [user, authLoading, isAdmin, activeTab]);

  const loadData = async () => {
    if (!selectedProject) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = activeTab === 'pending' ? await getPendingProposals(selectedProject) : await getProposalHistory(selectedProject);
      setProposals(data);
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
    try { await approveProposal(proposalId, 'Approved by user'); loadData(); loadStats(); } catch (error) { console.error('Error approving:', error); }
  };

  const handleReject = async (proposalId: string) => {
    try { await rejectProposal(proposalId, rejectionReason || 'Rejected by user'); setShowRejectModal(null); setRejectionReason(''); loadData(); loadStats(); } catch (error) { console.error('Error rejecting:', error); }
  };

  const getConfidenceColor = (c: number) => c >= 0.8 ? '#10b981' : c >= 0.6 ? '#f59e0b' : '#ef4444';
  const getStatusColor = (s: string) => s === 'approved' ? '#10b981' : s === 'rejected' ? '#ef4444' : s === 'applied' ? '#3b82f6' : '#6b7280';

  if (authLoading || loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <Sparkles size={24} color="#3b82f6" />
        <h1>AI Upgrades</h1>
      </div>

      <div className="stats-row">
        <div className="stat-card"><Clock size={18} color="#f59e0b" /><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending</div></div>
        <div className="stat-card"><CheckCircle size={18} color="#10b981" /><div className="stat-value">{stats.approved}</div><div className="stat-label">Approved</div></div>
        <div className="stat-card"><TrendingUp size={18} color="#3b82f6" /><div className="stat-value">{Math.round(stats.approval_rate)}%</div><div className="stat-label">Rate</div></div>
      </div>

      <div className="tabs">
        <button className={`tab${activeTab === 'pending' ? ' active' : ''}`} onClick={() => setActiveTab('pending')}>
          <Clock size={18} /> Pending
        </button>
        <button className={`tab${activeTab === 'history' ? ' active' : ''}`} onClick={() => setActiveTab('history')}>
          <CheckCircle size={18} /> History
        </button>
      </div>

      <div className="page-body">
        {proposals.length === 0 ? (
          <div className="empty-state">
            <Sparkles size={48} color="#3b82f6" />
            <h2>{activeTab === 'pending' ? 'No Pending Upgrades' : 'No History Yet'}</h2>
            <p>{activeTab === 'pending' ? 'AI will discover improvements automatically' : 'Your upgrade decisions will appear here'}</p>
          </div>
        ) : (
          proposals.map((proposal) => (
            <div key={proposal.id} className="card">
              <div className="proposal-header">
                <span className="badge badge-accent">{proposal.proposal_type}</span>
                {activeTab === 'history' && (
                  <span className="badge" style={{ backgroundColor: `${getStatusColor(proposal.status)}20`, color: getStatusColor(proposal.status) }}>{proposal.status}</span>
                )}
              </div>
              <div className="proposal-title">{proposal.title}</div>
              <div className="proposal-description">{proposal.description}</div>

              <div className="details-container">
                <div className="detail-section">
                  <span className="detail-label">Benefits:</span>
                  <span className="detail-text">{proposal.benefits}</span>
                </div>
                {proposal.risks && (
                  <div className="detail-section">
                    <AlertTriangle size={14} color="#f59e0b" />
                    <span className="detail-label">Risks:</span>
                    <span className="detail-text">{proposal.risks}</span>
                  </div>
                )}
                <div className="files-container">
                  <span className="detail-label">Affected Files:</span>
                  {proposal.affected_files.slice(0, 3).map((file, idx) => (
                    <span key={idx} className="file-name">{file}</span>
                  ))}
                  {proposal.affected_files.length > 3 && (
                    <span className="more-files">+{proposal.affected_files.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="confidence-container">
                <span className="confidence-label">AI Confidence:</span>
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{ width: `${proposal.ai_confidence * 100}%`, backgroundColor: getConfidenceColor(proposal.ai_confidence) }} />
                </div>
                <span className="confidence-value" style={{ color: getConfidenceColor(proposal.ai_confidence) }}>
                  {Math.round(proposal.ai_confidence * 100)}%
                </span>
              </div>

              {activeTab === 'pending' && (
                <div className="actions">
                  <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleApprove(proposal.id)}>
                    <CheckCircle size={18} /> Approve
                  </button>
                  <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => setShowRejectModal(proposal.id)}>
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              )}

              {showRejectModal === proposal.id && (
                <div className="reject-modal">
                  <div className="modal-title">Why reject this upgrade?</div>
                  <textarea className="reason-input" placeholder="Optional reason..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
                  <div className="modal-actions">
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowRejectModal(null); setRejectionReason(''); }}>Cancel</button>
                    <button className="btn" style={{ flex: 1, background: 'var(--error)', color: '#fff' }} onClick={() => handleReject(proposal.id)}>Reject</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
