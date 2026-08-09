import React, { useRef, useState } from 'react';
import { X, Mail, Lock, User, Loader2, UserPlus, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SignupModal({ onClose, onSwitchToLogin }) {
  const { signup, loading } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [errors, setErrors] = useState({});
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 180);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file for your profile picture.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required.';
    if (!form.email.trim()) next.email = 'Email address is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 6) next.password = 'Use at least 6 characters.';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const res = await signup({ ...form, avatar });
      showToast(`Welcome, ${res.user.name}! Your account has been created successfully.`, 'success', 5000);
      handleClose();
    } catch (err) {
      showToast(err.message || 'Could not create your account.', 'error');
      setErrors({ form: err.message });
    }
  };

  return (
    <div className={`auth-modal-overlay ${closing ? 'closing' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={`auth-modal ${closing ? 'closing' : ''}`} role="dialog" aria-modal="true" aria-labelledby="signup-title">
        <button className="auth-close-btn" onClick={handleClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="auth-modal-head">
          <div className="auth-modal-icon"><UserPlus size={20} /></div>
          <h2 id="signup-title">Create your account</h2>
          <p>Set up boards, lists, and cards in seconds.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="avatar-upload-row">
            <button
              type="button"
              className="avatar-upload-circle"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload profile picture"
            >
              {avatar ? <img src={avatar} alt="Profile preview" /> : <Camera size={18} />}
            </button>
            <div className="avatar-upload-copy">
              <span>Profile picture</span>
              <button type="button" className="auth-link" onClick={() => fileInputRef.current?.click()}>
                {avatar ? 'Change photo' : 'Upload (optional)'}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <div className={`input-icon-wrap ${errors.fullName ? 'has-error' : ''}`}>
              <User size={16} className="input-icon" />
              <input
                type="text"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                autoComplete="name"
              />
            </div>
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className={`input-icon-wrap ${errors.email ? 'has-error' : ''}`}>
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className={`input-icon-wrap ${errors.password ? 'has-error' : ''}`}>
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className={`input-icon-wrap ${errors.confirmPassword ? 'has-error' : ''}`}>
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <button type="button" className="auth-link" onClick={onSwitchToLogin}>
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
