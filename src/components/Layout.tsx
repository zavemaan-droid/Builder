import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, FolderCode, Bot, Lightbulb, Sparkles, Cpu, Settings } from 'lucide-react';

export default function Layout() {
  const { isAdmin } = useAuth();

  return (
    <div className="app-layout">
      <div className="app-content">
        <Outlet />
      </div>
      <nav className="app-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} end>
          <MessageSquare size={22} />
          <span>Chat</span>
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <FolderCode size={22} />
          <span>Projects</span>
        </NavLink>
        {isAdmin && (
          <NavLink to="/upgrades" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Sparkles size={22} />
            <span>Upgrades</span>
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/platform" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Cpu size={22} />
            <span>Platform</span>
          </NavLink>
        )}
        <NavLink to="/community" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Lightbulb size={22} />
          <span>Community</span>
        </NavLink>
        <NavLink to="/agents" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Bot size={22} />
          <span>Agents</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Settings size={22} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
