import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

// Token is the ONLY thing we persist client-side. Everything else (user
// profile, board/task data) is fetched fresh from the server for whichever
// token is active, so switching accounts can never leak another user's data.
const TOKEN_KEY = 'tasknova_token';

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isFirstSession, setIsFirstSession] = useState(false);

  // Restore session on load by validating the stored token against the server.
  useEffect(() => {
    (async () => {
      const existingToken = getStoredToken();
      if (!existingToken) {
        setInitializing(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${existingToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setToken(existingToken);
          setUser(data.user);
          setIsFirstSession(!data.user.onboardingDone);
        } else {
          // Stale/invalid token — clear it so no leftover session lingers.
          localStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        // Network error on restore: fail closed, don't assume a session.
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const signup = async ({ fullName, email, password, confirmPassword, avatar }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, confirmPassword, avatar })
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || 'Could not create your account.');

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setIsFirstSession(true);
      return { success: true, user: data.user };
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password, rememberMe }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || 'Invalid email or password.');

      if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, data.token);
      } else {
        sessionStorage.setItem(TOKEN_KEY, data.token);
      }

      setToken(data.token);
      setUser(data.user);
      setIsFirstSession(!data.user.onboardingDone);
      return { success: true, user: data.user };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    const currentToken = token || getStoredToken();
    // Best-effort server-side session invalidation.
    if (currentToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` }
      }).catch(() => {});
    }

    // Wipe every trace of the session client-side so no previous user's
    // data can ever surface for the next person who logs in.
    localStorage.clear();
    sessionStorage.clear();

    setToken(null);
    setUser(null);
    setIsFirstSession(false);
  };

  const completeOnboarding = async () => {
    if (!user || !token) return;
    setIsFirstSession(false);
    try {
      await fetch('/api/auth/onboarding-complete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      // Non-critical — worst case the tour shows again next session.
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    initializing,
    isFirstSession,
    signup,
    login,
    logout,
    completeOnboarding
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
