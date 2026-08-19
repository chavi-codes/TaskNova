import React from 'react';
import { Inbox, Layout, Trophy, Calendar, Layers, ChevronLeft, ChevronRight, Settings } from 'lucide-react';

export default function NavigationSidebar({
  activeView,
  setActiveView,
  isInboxOpen,
  setIsInboxOpen,
  isNavExpanded,
  setIsNavExpanded,
  isMobileNavOpen,
  setIsMobileNavOpen,
  onSwitchBoards,
  autoMoveSetting,
  setAutoMoveSetting
}) {
  const navItems = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: <Inbox size={18} />,
      isActive: isInboxOpen,
      onClick: () => {
        setIsInboxOpen(!isInboxOpen);
        if (window.innerWidth <= 768) setIsMobileNavOpen(false);
      }
    },
    {
      id: 'board',
      label: 'Board',
      icon: <Layout size={18} />,
      isActive: activeView === 'board',
      onClick: () => {
        setActiveView('board');
        if (window.innerWidth <= 768) setIsMobileNavOpen(false);
      }
    },
    {
      id: 'sprint',
      label: 'Sprint',
      icon: <Trophy size={18} />,
      isActive: activeView === 'sprint',
      onClick: () => {
        setActiveView('sprint');
        if (window.innerWidth <= 768) setIsMobileNavOpen(false);
      }
    },
    {
      id: 'planner',
      label: 'Planner',
      icon: <Calendar size={18} />,
      isActive: activeView === 'planner',
      onClick: () => {
        setActiveView('planner');
        if (window.innerWidth <= 768) setIsMobileNavOpen(false);
      }
    },
    {
      id: 'switch_boards',
      label: 'Switch Boards',
      icon: <Layers size={18} />,
      isActive: false,
      onClick: () => {
        onSwitchBoards();
        if (window.innerWidth <= 768) setIsMobileNavOpen(false);
      }
    }
  ];

  return (
    <>
      {/* Mobile drawer backdrop */}
      {isMobileNavOpen && (
        <div 
          className="nav-backdrop"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <aside className={`sidebar-nav ${isNavExpanded ? 'expanded' : 'collapsed'} ${isMobileNavOpen ? 'mobile-open' : ''}`}>
        {/* Branding header */}
        <div className="nav-brand">
          <div className="brand-icon-wrapper">
            <Layout size={20} className="brand-logo-icon" />
          </div>
          {isNavExpanded && <span className="brand-text">TaskNova</span>}
        </div>

        {/* Navigation Items */}
        <nav className="nav-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${item.isActive ? 'active' : ''}`}
              onClick={item.onClick}
              title="" // Clear title to prevent native tooltip overlapping with custom tooltip
            >
              <span className="nav-item-icon">{item.icon}</span>
              {isNavExpanded && <span className="nav-item-label">{item.label}</span>}
              {!isNavExpanded && <span className="custom-tooltip">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="nav-footer">
          {/* Settings button */}
          <button 
            className="nav-item settings-toggle-btn"
            onClick={() => setAutoMoveSetting(!autoMoveSetting)}
            title=""
          >
            <span className="nav-item-icon"><Settings size={18} /></span>
            {isNavExpanded && <span className="nav-item-label">Auto-move Done</span>}
            {!isNavExpanded && <span className="custom-tooltip">Toggle Auto-move</span>}
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            className="nav-collapse-btn"
            onClick={() => setIsNavExpanded(!isNavExpanded)}
            title={isNavExpanded ? 'Collapse Navigation' : 'Expand Navigation'}
          >
            {isNavExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
}
