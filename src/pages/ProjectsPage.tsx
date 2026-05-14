import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FolderCode, Plus, Clock } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';

interface Project {
  id: string;
  name: string;
  description: string;
  platform: string;
  status: string;
  created_at: string;
}

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    else if (user) loadProjects();
  }, [user, authLoading]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user?.id,
          name: 'New Project',
          description: 'A new project',
          platform: 'Web',
          status: 'planning',
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setProjects([data, ...projects]);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (authLoading || loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <FolderCode size={24} color="#3b82f6" />
        <h1>Projects</h1>
        <button className="btn btn-primary" style={{ marginLeft: 'auto', padding: '8px 12px' }} onClick={createProject}>
          <Plus size={20} />
        </button>
      </div>

      <div className="page-body">
        {projects.length === 0 ? (
          <div className="empty-state">
            <FolderCode size={48} color="#3b82f6" />
            <h2>No Projects Yet</h2>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary" onClick={createProject}>
              <Plus size={20} /> Create Project
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="card">
              <div className="project-header">
                <span className="card-title">{project.name}</span>
                <span className="badge badge-accent">{project.status}</span>
              </div>
              <p className="card-description">{project.description}</p>
              <div className="project-footer">
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{project.platform}</span>
                <div className="date-container">
                  <Clock size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
