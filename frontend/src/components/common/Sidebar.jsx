import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Heart, Columns, Spade, Settings, LogOut, ChevronLeft, ChevronRight, Menu, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import SettingsModal from './SettingsModal';
import CustomSelect from './CustomSelect';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout, activeSquad, setActiveSquad } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'user'] },
    { path: '/kudos', label: 'Mural de Kudos', icon: Heart, roles: ['admin', 'user'] },
    { path: '/poker', label: 'Planning Poker', icon: Spade, roles: ['admin', 'user', 'guest'] },
    { path: '/retro', label: 'Retrospectiva', icon: Columns, roles: ['admin', 'user'] },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin', icon: Shield, roles: ['admin'] });
  }

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role));

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const [logoClickCount, setLogoClickCount] = useState(0);
  const [lastLogoClick, setLastLogoClick] = useState(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastLogoClick < 800) {
      setLogoClickCount(prev => {
        const next = prev + 1;
        if (next >= 9) {
          window.dispatchEvent(new Event('trigger-burnout'));
          return 0;
        }
        return next;
      });
    } else {
      setLogoClickCount(1);
    }
    setLastLogoClick(now);
    navigate('/dashboard');
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button className="mobile-toggle" onClick={toggleMobile}>
        <Menu size={24} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && <div className="mobile-overlay" onClick={toggleMobile}></div>}

      <aside className={`sidebar glass-panel ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div 
              className="logo-icon" 
              onClick={handleLogoClick}
              style={{ cursor: 'pointer' }}
              title="Ir para Dashboard"
            >A</div>
            {user?.squads && user.squads.length > 1 && !isCollapsed ? (
              <CustomSelect 
                className="hide-on-collapse"
                style={{ maxWidth: '150px' }}
                value={activeSquad?._id || ''} 
                onChange={(e) => {
                  const squadInfo = user.squads.find(s => s.squad._id === e.target.value);
                  if (squadInfo) {
                    setActiveSquad(squadInfo.squad);
                    localStorage.setItem('activeSquadId', squadInfo.squad._id);
                  }
                }}
                options={user.squads.map(s => ({ value: s.squad._id, label: s.squad.name }))}
                placeholder="Selecione..."
              />
            ) : (
              <h2 
                className="hide-on-collapse"
                onClick={() => navigate('/dashboard')}
                style={{ cursor: 'pointer' }}
                title="Ir para Dashboard"
              >AgileFlow</h2>
            )}
          </div>
          <button className="collapse-btn hide-on-collapse" onClick={toggleCollapse} title="Recolher menu">
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        


        <nav className="sidebar-nav">
          {visibleItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title={item.label}
              onClick={() => {
                setIsMobileOpen(false);
                if (item.path === '/retro') setIsCollapsed(true);
              }}
            >
              <item.icon size={20} className="nav-icon" />
              <span className="hide-on-collapse">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <img src={user.avatar} alt={user.name} className="avatar" />
            <div className="user-info hide-on-collapse">
              <span className="user-name" title={user.name}>{user.name.split(' ')[0]}</span>
              <span className="user-role">
                {user.role === 'admin' ? 'Global Admin' : (user.squads?.find(s => s.squad._id === activeSquad?._id)?.role || 'User')}
              </span>
            </div>
            
            <div className="footer-actions hide-on-collapse" style={{ display: 'flex', marginLeft: 'auto' }}>
              <button className="settings-btn" onClick={() => setIsSettingsOpen(true)} title="Configurações">
                <Settings size={18} />
              </button>
              <button className="settings-btn logout-btn" onClick={logout} title="Sair" style={{ marginLeft: '4px' }}>
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};

export default Sidebar;
