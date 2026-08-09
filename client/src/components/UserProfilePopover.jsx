import React, { useEffect, useRef, useState } from 'react';
import { Settings, Palette, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export default function UserProfilePopover({ user }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    showToast('Logout successful. See you soon!', 'success');
  };

  return (
    <div className="profile-popover-wrap" ref={wrapRef}>
      <button className="avatar-circle" onClick={() => setOpen((o) => !o)} aria-label="Open profile menu">
        {user.avatar ? <img src={user.avatar} alt={user.name} className="avatar-img" /> : user.initials}
      </button>

      {open && (
        <div className="profile-popover">
          <div className="profile-popover-header">
            <div className="avatar-circle avatar-circle-lg">
              {user.avatar ? <img src={user.avatar} alt={user.name} className="avatar-img" /> : user.initials}
            </div>
            <div className="profile-popover-id">
              <span className="profile-popover-name">{user.name}</span>
              <span className="profile-popover-email"><Mail size={12} /> {user.email}</span>
            </div>
          </div>

          <div className="profile-popover-divider" />

          <button className="profile-popover-item" onClick={() => { setOpen(false); showToast('Profile settings are coming soon.', 'info'); }}>
            <Settings size={15} />
            <span>Profile Settings</span>
          </button>

          <button className="profile-popover-item" onClick={toggleTheme}>
            <Palette size={15} />
            <span>Theme Preference</span>
            <span className="profile-popover-tag">{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>

          <div className="profile-popover-divider" />

          <button className="profile-popover-item danger" onClick={handleLogout}>
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
