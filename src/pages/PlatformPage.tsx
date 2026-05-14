import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, CheckCircle, Code, Zap, Play } from 'lucide-react';
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

export default function PlatformPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('discoveries');
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [discoveries, setDiscoveries] = useState<PatternDiscovery[]>([]);
  const [ideas, setIdeas] = useState<CollaborativeIdea[]>([]);
  const [autoImprovements, setAutoImprovements] = useState<AutoImprovement[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    else if (!authLoading && user && !isAdmin) navigate('/');
    else if (user && isAdmin) loadData();
  }, [user, authLoading, isAdmin, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const insightsData = await getSystemInsights();
      setInsights(insightsData);

      if (activeTab === 'discoveries') {
        const data = await getTopDiscoveries(20);
        setDiscoveries(data);
      } else if (activeTab === 'ideas') {
        const data = await getCollaborativeIdeas();
        setIdeas(data);
      } else if (activeTab === 'auto-builds') {
        const data = await getPendingAutoImprovements();
        setAutoImprovements(data);
      }
    } catch (error) {
      console.error('Error loading platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (improvementId: string) => {
    try { await approveAutoImprovement(improvementId); loadData(); } catch (error) { console.error('Error approving:', error); }
  };

  const getSuccessColor = (rate: number) => rate >= 0.8 ? '#10b981' : rate >= 0.6 ? '#f59e0b' : '#ef4444';

  if (authLoading || loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <Sparkles size={24} color="#10b981" />
        <h1>Autonomous Learning</h1>
      </div>

      {insights && (
        <div className="stats-row">
          <div className="stat-card"><CheckCircle size={20} color="#10b981" /><div className="stat-value">{Math.round(insights.health.success_rate * 100)}%</div><div className="stat-label">Success</div></div>
          <div className="stat-card"><Code size={20} color="#3b82f6" /><div className="stat-value">{insights.health.active_patterns}</div><div className="stat-label">Patterns</div></div>
          <div className="stat-card"><Sparkles size={20} color="#f59e0b" /><div className="stat-value">{insights.collaborative_ideas.length}</div><div className="stat-label">Ideas</div></div>
          <div className="stat-card"><Zap size={20} color="#3b82f6" /><div className="stat-value">{insights.pending_improvements.length}</div><div className="stat-label">Auto</div></div>
        </div>
      )}

      <div className="tabs">
        <button className={`tab${activeTab === 'discoveries' ? ' active' : ''}`} onClick={() => setActiveTab('discoveries')}>Discoveries</button>
        <button className={`tab${activeTab === 'ideas' ? ' active' : ''}`} onClick={() => setActiveTab('ideas')}>Ideas</button>
        <button className={`tab${activeTab === 'auto-builds' ? ' active' : ''}`} onClick={() => setActiveTab('auto-builds')}>Auto-Build</button>
        <button className={`tab${activeTab === 'insights' ? ' active' : ''}`} onClick={() => setActiveTab('insights')}>Insights</button>
      </div>

      <div className="page-body">
        {activeTab === 'discoveries' && (
          <div>
            <h2 className="section-title">Pattern Discoveries</h2>
            <p className="section-subtitle">What works and what doesn't - learned automatically</p>
            {discoveries.map((d) => (
              <div key={d.id} className="card">
                <div className="card-header">
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{d.pattern_name}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: getSuccessColor(d.success_rate) }}>{Math.round(d.success_rate * 100)}%</span>
                </div>
                <p className="card-description">{d.description}</p>
                {d.works_well_for.length > 0 && (
                  <div className="works-box">
                    <div className="works-label">Works well for:</div>
                    {d.works_well_for.map((item, idx) => <div key={idx} className="works-item">&#10003; {item}</div>)}
                  </div>
                )}
                {d.fails_for.length > 0 && (
                  <div className="fails-box">
                    <div className="fails-label">Avoid for:</div>
                    {d.fails_for.map((item, idx) => <div key={idx} className="fails-item">&#10007; {item}</div>)}
                  </div>
                )}
                <div className="card-footer">
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Used {d.usage_count}x</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{Math.round(d.confidence_score * 100)}% confident</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ideas' && (
          <div>
            <h2 className="section-title">Collaborative Ideas</h2>
            <p className="section-subtitle">AI synthesized from multiple successful patterns</p>
            {ideas.map((idea) => (
              <div key={idea.id} className="card">
                <div className="idea-header">
                  <span className="idea-type">{idea.idea_type}</span>
                  {idea.implementation_ready && (
                    <span className="ready-badge"><CheckCircle size={14} /> Ready</span>
                  )}
                </div>
                <div className="idea-title">{idea.title}</div>
                <div className="idea-description">{idea.description}</div>
                <div className="synthesized-box">
                  <div className="synthesized-label">Synthesized from:</div>
                  <div className="synthesized-text">{idea.synthesized_from.length} patterns</div>
                </div>
                <div className="idea-footer">
                  <span className="idea-confidence">{Math.round(idea.confidence_score * 100)}% confidence</span>
                  <span className="idea-status">{idea.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'auto-builds' && (
          <div>
            <h2 className="section-title">Auto-Build Queue</h2>
            <p className="section-subtitle">System-generated improvements ready to implement</p>
            {autoImprovements.map((imp) => (
              <div key={imp.id} className="card">
                <div className="auto-header">
                  <span className="auto-category" style={{ color: 'var(--accent)' }}>{imp.improvement_category}</span>
                  <span className="badge" style={{ backgroundColor: imp.execution_status === 'pending' ? 'var(--warning-dim)' : 'var(--success-dim)', color: imp.execution_status === 'pending' ? 'var(--warning)' : 'var(--success)' }}>
                    {imp.execution_status}
                  </span>
                </div>
                <div className="auto-title">{imp.title}</div>
                <div className="auto-description">{imp.description}</div>
                <div className="rationale-box">
                  <div className="rationale-label">Why:</div>
                  <div className="rationale-text">{imp.rationale}</div>
                </div>
                <div className="auto-footer">
                  <span className="auto-confidence">{Math.round(imp.confidence_score * 100)}% confident</span>
                  {imp.requires_approval && (
                    <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => handleApprove(imp.id)}>
                      <Play size={14} /> Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'insights' && insights && (
          <div>
            <h2 className="section-title">System Insights</h2>
            <p className="section-subtitle">Real-time learning from entire platform ecosystem</p>

            <div className="insight-card">
              <div className="insight-title">Platform Health</div>
              <div className="insight-value">{Math.round(insights.health.success_rate * 100)}% Success Rate</div>
              <div className="insight-subtext">From {insights.health.total_builds} builds</div>
            </div>

            <div className="insight-card">
              <div className="insight-title">Top Discoveries</div>
              {insights.top_discoveries.map((d: PatternDiscovery, idx: number) => (
                <div key={idx} className="quick-item">
                  <span className="quick-name">{d.pattern_name}</span>
                  <span className="quick-rate">{Math.round(d.success_rate * 100)}%</span>
                </div>
              ))}
            </div>

            <div className="insight-card">
              <div className="insight-title">Recent Collaborative Ideas</div>
              {insights.collaborative_ideas.map((i: CollaborativeIdea, idx: number) => (
                <div key={idx} className="quick-idea">&bull; {i.title}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
