import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PlanType } from '../types';
import { INITIAL_USERS } from '../utils/sampleData';
import {
  auth,
  googleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  FirebaseUser,
} from '../lib/firebase.ts';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isLoading: boolean;
  latestVerificationCode: string | null;
  loginWithEmailPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmailPassword: (data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    instituteName?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  sendResetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (code?: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationCode: () => Promise<string | null>;
  logout: () => Promise<void>;
  switchDemoUser: (userIndex: number) => void;
  refreshUser: () => Promise<void>;
  updateUserPlan: (plan: PlanType, expiresAt?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'editflow_auth_token';
const USER_KEY = 'editflow_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_USERS[0];
      }
    }
    return INITIAL_USERS[0];
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY) || (user ? `shikshya-token-${user.id}` : null);
  });

  const [isLoading, setIsLoading] = useState(false);
  const [latestVerificationCode, setLatestVerificationCode] = useState<string | null>('784210');

  // Synchronize state with backend PostgreSQL
  const syncWithBackend = async (idToken: string, extraData?: Record<string, any>) => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(extraData || {}),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      }
    } catch (err) {
      console.warn('Failed to sync auth with database:', err);
    }
  };

  // Listen to Firebase Auth state for persistent login sessions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          localStorage.setItem(TOKEN_KEY, idToken);
          await syncWithBackend(idToken);
        } catch (err) {
          console.error('Error fetching ID token:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.warn('Failed to refresh user:', err);
    }
  };

  // Sign in with Email & Password
  const loginWithEmailPassword = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await cred.user.getIdToken();
      setToken(idToken);
      await syncWithBackend(idToken);
      return { success: true };
    } catch (err: any) {
      console.error('Email login error:', err);
      // Fallback: If user exists in demo/local or server accepts email
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
          setToken(data.token);
          return { success: true };
        }
      } catch (localErr) {
        console.warn('Local fallback error:', localErr);
      }
      return { success: false, error: err.message || 'लगइन असफल भयो' };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with Email & Password
  const signupWithEmailPassword = async (data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    instituteName?: string;
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
      await sendEmailVerification(cred.user);
      const idToken = await cred.user.getIdToken();
      setToken(idToken);

      await syncWithBackend(idToken, {
        name: data.name,
        role: data.role || 'teacher',
        instituteName: data.instituteName,
        phone: data.phone,
      });

      return { success: true };
    } catch (err: any) {
      console.error('Email signup error:', err);
      // Fallback: Local signup if offline/demo
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const d = await res.json();
        if (res.ok && d.user) {
          setUser(d.user);
          setToken(d.token);
          if (d.verificationCode) setLatestVerificationCode(d.verificationCode);
          return { success: true };
        }
      } catch (localErr) {
        console.warn('Local signup fallback error:', localErr);
      }
      return { success: false, error: err.message || 'दर्ता असफल भयो' };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google (OAuth)
  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await cred.user.getIdToken();
      setToken(idToken);
      await syncWithBackend(idToken, {
        name: cred.user.displayName,
      });
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      return { success: false, error: err.message || 'Google लगइन असफल भयो' };
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset email
  const sendResetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      console.error('Password reset error:', err);
      return { success: false, error: err.message || 'पासवर्ड रिसेट इमेल पठाउन सकिएन' };
    } finally {
      setIsLoading(false);
    }
  };

  // Email verification
  const verifyEmail = async (code?: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not logged in' };

    try {
      // 1. If Firebase user is present, reload and check
      if (firebaseUser) {
        await firebaseUser.reload();
        if (firebaseUser.emailVerified) {
          setUser((prev) => (prev ? { ...prev, isEmailVerified: true } : null));
          return { success: true };
        }
      }

      // 2. Also check backend verification code endpoint
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, code: code || '123456' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser((prev) => (prev ? { ...prev, isEmailVerified: true } : null));
        return { success: true };
      }
      return { success: false, error: data.error || 'अवैध कोड' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const resendVerificationCode = async (): Promise<string | null> => {
    if (firebaseUser) {
      try {
        await sendEmailVerification(firebaseUser);
      } catch (err) {
        console.warn('Firebase verification email error:', err);
      }
    }
    if (!user?.email) return null;
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.verificationCode) {
        setLatestVerificationCode(data.verificationCode);
        return data.verificationCode;
      }
    } catch (err) {
      console.warn('Error resending code:', err);
    }
    return null;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signout error:', err);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const switchDemoUser = (userIndex: number) => {
    const selected = INITIAL_USERS[userIndex] || INITIAL_USERS[0];
    setUser(selected);
    const demoToken = `shikshya-token-${selected.id}`;
    setToken(demoToken);
    localStorage.setItem(TOKEN_KEY, demoToken);
    localStorage.setItem(USER_KEY, JSON.stringify(selected));
  };

  const updateUserPlan = (plan: PlanType, expiresAt?: string) => {
    if (!user) return;
    const updated: User = {
      ...user,
      plan,
      planExpiresAt: expiresAt,
    };
    setUser(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        isLoading,
        latestVerificationCode,
        loginWithEmailPassword,
        signupWithEmailPassword,
        loginWithGoogle,
        sendResetPassword,
        verifyEmail,
        resendVerificationCode,
        logout,
        switchDemoUser,
        refreshUser,
        updateUserPlan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
