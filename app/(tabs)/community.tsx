import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Lightbulb, TrendingUp, ThumbsUp, ThumbsDown, Search, Code as Code2 } from 'lucide-react-native';
import { getSharedKnowledge, getTrendingKnowledge, searchKnowledge, voteKnowledge, getPublicPatterns, KnowledgeEntry, CodePattern } from '@/services/knowledgeService';

type TabType = 'knowledge' | 'patterns' | 'trending';

export default function CommunityScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [patterns, setPatterns] = useState<CodePattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    } else if (user) {
      loadData();
    }
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
    if (!searchQuery.trim()) {
      loadData();
      return;
    }

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
        <Lightbulb size={24} color="#3b82f6" />
        <Text style={styles.headerTitle}>Community</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trending' && styles.tabActive]}
          onPress={() => setActiveTab('trending')}
        >
          <TrendingUp size={18} color={activeTab === 'trending' ? '#3b82f6' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'trending' && styles.tabTextActive]}>
            Trending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'knowledge' && styles.tabActive]}
          onPress={() => setActiveTab('knowledge')}
        >
          <Lightbulb size={18} color={activeTab === 'knowledge' ? '#3b82f6' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'knowledge' && styles.tabTextActive]}>
            Knowledge
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'patterns' && styles.tabActive]}
          onPress={() => setActiveTab('patterns')}
        >
          <Code2 size={18} color={activeTab === 'patterns' ? '#3b82f6' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'patterns' && styles.tabTextActive]}>
            Patterns
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab !== 'patterns' && (
        <View style={styles.searchContainer}>
          <Search size={18} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search knowledge..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
      )}

      <ScrollView style={styles.content}>
        {activeTab !== 'patterns' ? (
          knowledge.length === 0 ? (
            <View style={styles.emptyState}>
              <Lightbulb size={48} color="#3b82f6" />
              <Text style={styles.emptyTitle}>No Knowledge Yet</Text>
              <Text style={styles.emptyText}>Be the first to share your insights!</Text>
            </View>
          ) : (
            knowledge.map((item) => (
              <View key={item.id} style={styles.knowledgeCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.knowledgeTitle}>{item.title}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                </View>

                <Text style={styles.knowledgeDescription}>{item.description}</Text>

                {item.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <View style={styles.voteContainer}>
                    <TouchableOpacity
                      style={styles.voteButton}
                      onPress={() => handleVote(item.id, 'up')}
                    >
                      <ThumbsUp size={16} color="#10b981" />
                      <Text style={styles.voteText}>{item.upvotes}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.voteButton}
                      onPress={() => handleVote(item.id, 'down')}
                    >
                      <ThumbsDown size={16} color="#ef4444" />
                      <Text style={styles.voteText}>{item.downvotes}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.usageText}>{item.usage_count} uses</Text>
                </View>
              </View>
            ))
          )
        ) : (
          patterns.length === 0 ? (
            <View style={styles.emptyState}>
              <Code2 size={48} color="#3b82f6" />
              <Text style={styles.emptyTitle}>No Patterns Yet</Text>
              <Text style={styles.emptyText}>Share your code patterns with the community!</Text>
            </View>
          ) : (
            patterns.map((pattern) => (
              <View key={pattern.id} style={styles.patternCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.patternName}>{pattern.name}</Text>
                  <View style={styles.languageBadge}>
                    <Text style={styles.languageText}>{pattern.language}</Text>
                  </View>
                </View>

                <Text style={styles.patternDescription}>{pattern.description}</Text>
                <Text style={styles.useCase}>Use case: {pattern.use_case}</Text>

                <View style={styles.codePreview}>
                  <Text style={styles.codeText} numberOfLines={4}>
                    {pattern.code_snippet}
                  </Text>
                </View>

                <View style={styles.patternFooter}>
                  <Text style={styles.framework}>{pattern.framework}</Text>
                  <Text style={styles.timesUsed}>{pattern.times_used} uses</Text>
                </View>
              </View>
            ))
          )
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a24',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
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
  },
  knowledgeCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  knowledgeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '600',
  },
  knowledgeDescription: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  tag: {
    backgroundColor: '#0a0a0f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: '#6b7280',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  usageText: {
    color: '#6b7280',
    fontSize: 12,
  },
  patternCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  patternName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  languageBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  languageText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  patternDescription: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  useCase: {
    color: '#6b7280',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  codePreview: {
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  codeText: {
    color: '#10b981',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  patternFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  framework: {
    color: '#6b7280',
    fontSize: 12,
  },
  timesUsed: {
    color: '#6b7280',
    fontSize: 12,
  },
});
