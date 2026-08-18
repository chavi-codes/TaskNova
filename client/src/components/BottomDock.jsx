import React from 'react';
import { Inbox, Calendar, Layout, Layers, Trophy } from 'lucide-react';

export default function BottomDock({
  activeView,
  setActiveView,
  isSidebarOpen,
  setIsSidebarOpen
}) {
  return (
    <div className="bottom-dock">
      <button
        className={`dock-item ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Inbox size={16} />
        <span>Inbox</span>
      </button>

      <button
        className={`dock-item ${activeView === 'planner' ? 'active' : ''}`}
        onClick={() => setActiveView('planner')}
      >
        <Calendar size={16} />
        <span>Planner</span>
      </button>

      <button
        className={`dock-item ${activeView === 'board' ? 'active' : ''}`}
        onClick={() => setActiveView('board')}
      >
        <Layout size={16} />
        <span>Board</span>
      </button>

      <button
        className={`dock-item ${activeView === 'sprint' ? 'active' : ''}`}
        onClick={() => setActiveView('sprint')}
      >
        <Trophy size={16} />
        <span>Sprint</span>
      </button>

      <button
        className="dock-item"
        onClick={() => alert('Switch board feature: You are currently viewing "My Board"!')}
      >
        <Layers size={16} />
        <span>Switch boards</span>
      </button>
    </div>
  );
}
