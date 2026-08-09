import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginModal({ onClose, onSwitchToSignup }) {
  const { login, loading } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({ email: '', password: '', rememberMe: true });
  const [errors, setErrors] = useState({});
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 180);
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Email address is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const res = await login(form);
      showToast(`Welcome back, ${res.user.name.split(' ')[0]}!`, 'success');
      handleClose();
    } catch (err) {
      showToast(err.message || 'Invalid email or password', 'error');
      setErrors({ form: err.message });
    }
  };

  const handleForgotPassword = () => {
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      showToast('Enter your email above first, then try again.', 'info');
      return;
    }
    showToast(`If an account exists for ${form.email}, a reset link is on its way.`, 'info');
  };

  return (
    <div className={`auth-modal-overlay ${closing ? 'closing' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={`auth-modal ${closing ? 'closing' : ''}`} role="dialog" aria-modal="true" aria-labelledby="login-title">
        <button className="auth-close-btn" onClick={handleClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="auth-modal-head">
          <div className="auth-modal-icon"><LogIn size={20} /></div>
          <h2 id="login-title">Log in to your board</h2>
          <p>Pick up right where your lists and cards left off.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="auth-row-between">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
              />
              <span>Remember me</span>
            </label>
            <button type="button" className="forgot-link" onClick={handleForgotPassword}>
              Forgot password?
            </button>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : 'Log In'}
          </button>
        </form>

        <p className="auth-footer-text">
          Don't have an account?{' '}
          <button type="button" className="auth-link" onClick={onSwitchToSignup}>
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
