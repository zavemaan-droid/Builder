import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Lightbulb, TrendingUp, ThumbsUp, ThumbsDown, Search, Code2 } from 'lucide-react';
import { getSharedKnowledge, getTrendingKnowledge, searchKnowledge, voteKnowledge, getPublicPatterns, KnowledgeEntry, CodePattern } from '@/services/knowledgeService';

type TabType = 'knowledge' | 'patterns' | 'trending';

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [patterns, setPatterns] = useState<CodePattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    else if (user) loadData();
  }, [user, authLoading, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'knowledge') {
        const data = await getSharedKnowledge();
        setKnowledge(data);
      } else if (activeTab === 'patterns') {
        const data = await getPublicPatterns();
        setPatterns(data);
      } else if (activeTab === 'trending') {
        const data = await getTrendingKnowledge();
        setKnowledge(data);
      }
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { loadData(); return; }
    setLoading(true);
    try {
      const results = await searchKnowledge(searchQuery);
      setKnowledge(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (knowledgeId: string, voteType: 'up' | 'down') => {
    try {
      await voteKnowledge(knowledgeId, voteType);
      loadData();
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  if (authLoading || loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <Lightbulb size={24} color="#3b82f6" />
        <h1>Community</h1>
      </div>

      <div className="tabs">
        <button className={`tab${activeTab === 'trending' ? ' active' : ''}`} onClick={() => setActiveTab('trending')}>
          <TrendingUp size={18} /> Trending
        </button>
        <button className={`tab${activeTab === 'knowledge' ? ' active' : ''}`} onClick={() => setActiveTab('knowledge')}>
          <Lightbulb size={18} /> Knowledge
        </button>
        <button className={`tab${activeTab === 'patterns' ? ' active' : ''}`} onClick={() => setActiveTab('patterns')}>
          <Code2 size={18} /> Patterns
        </button>
      </div>

      {activeTab !== 'patterns' && (
        <div className="search-container">
          <Search size={18} />
          <input
            className="search-input"
            placeholder="Search knowledge..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
      )}

      <div className="page-body">
        {activeTab !== 'patterns' ? (
          knowledge.length === 0 ? (
            <div className="empty-state">
              <Lightbulb size={48} color="#3b82f6" />
              <h2>No Knowledge Yet</h2>
              <p>Be the first to share your insights!</p>
            </div>
          ) : (
            knowledge.map((item) => (
              <div key={item.id} className="card">
                <div className="card-header">
                  <span className="card-title">{item.title}</span>
                  <span className="badge badge-accent">{item.category}</span>
                </div>
                <p className="card-description">{item.description}</p>
                {item.tags.length > 0 && (
                  <div className="tags">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}
                <div className="card-footer">
                  <div className="vote-container">
                    <button className="vote-btn" onClick={() => handleVote(item.id, 'up')}>
                      <ThumbsUp size={16} color="#10b981" /> {item.upvotes}
                    </button>
                    <button className="vote-btn" onClick={() => handleVote(item.id, 'down')}>
                      <ThumbsDown size={16} color="#ef4444" /> {item.downvotes}
                    </button>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.usage_count} uses</span>
                </div>
              </div>
            ))
          )
        ) : (
          patterns.length === 0 ? (
            <div className="empty-state">
              <Code2 size={48} color="#3b82f6" />
              <h2>No Patterns Yet</h2>
              <p>Share your code patterns with the community!</p>
            </div>
          ) : (
            patterns.map((pattern) => (
              <div key={pattern.id} className="card">
                <div className="card-header">
                  <span className="card-title">{pattern.name}</span>
                  <span className="badge badge-success">{pattern.language}</span>
                </div>
                <p className="card-description">{pattern.description}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 12 }}>
                  Use case: {pattern.use_case}
                </p>
                <div className="code-preview">
                  <code>{pattern.code_snippet}</code>
                </div>
                <div className="card-footer">
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pattern.framework}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pattern.times_used} uses</span>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
