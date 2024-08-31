"use client";

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string) => Promise<void>;
  verifyCode: (username: string, code: string) => Promise<void>;
  oauth2Login: (response: string, redirectToPage: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = Cookies.get('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
          headers: {
            Authorization: `${token}`,
          },
        });

        if (response.ok) {
          const user = await response.json();
          console.log(user)
          setUser(user);
        }
      }
      setLoading(false);
    };

    checkUserLoggedIn();

  }, []);

  const login = async (username: string) => {
    const response = await fetch(`${API_BASE_URL}/api/unauth/magic-link-generator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: username }),
    });

    if (response.ok) {
      console.log('Magic link generation successful');
    } else {
      console.error('Magic link generation failed');
    }
  };

  const verifyCode = async (username: string, code: string) => {
    const response = await fetch(`${API_BASE_URL}/api/unauth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: username, magicToken: code }),
    });

    if (response.ok) {
      console.log('Login successful');
      const { token, user } = await response.json();
      Cookies.set('token', token);
      setUser(user);
    } else {
      console.error('Login failed');
    }
  };


  const oauth2Login = (response: string, redirectToPage: string) => {
    try {
      const { token, user } = JSON.parse(response);
      Cookies.set('token', token);
      setUser(user);
      router.push(redirectToPage);
    } catch (err) {
      console.log(err)
    }
  };

  const logout = async () => {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
    Cookies.remove('token');
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyCode, logout, oauth2Login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
