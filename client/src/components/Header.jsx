import React from 'react';
import { LayoutGrid, Plus, Search, LogIn, UserPlus } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import UserProfilePopover from './UserProfilePopover';
import { useAuth } from '../context/AuthContext';

export default function Header({ searchQuery, setSearchQuery, onAddCardClick, onOpenLogin, onOpenSignup }) {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="brand-logo-btn">
          <LayoutGrid size={18} />
          <span>TaskNova</span>
        </button>

        {isAuthenticated && (
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search cards, labels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="header-right">
        {isAuthenticated && (
          <button className="btn-create" onClick={onAddCardClick}>
            <Plus size={16} />
            <span>Create</span>
          </button>
        )}

        <ThemeToggle />

        {isAuthenticated ? (
          <UserProfilePopover user={user} />
        ) : (
          <>
            <button className="btn-login" onClick={onOpenLogin}>
              <LogIn size={15} />
              <span>Login</span>
            </button>
            <button className="btn-signup" onClick={onOpenSignup}>
              <UserPlus size={15} />
              <span>Sign Up</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
