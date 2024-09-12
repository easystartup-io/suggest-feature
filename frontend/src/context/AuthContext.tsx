"use client";

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useToast } from '@/components/ui/use-toast';

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  failed: boolean;
  login: (username: string) => Promise<void>;
  verifyCode: (username: string, code: string) => Promise<void>;
  oauth2Login: (response: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
            headers: {
              Authorization: `${token}`,
            },
          });

          if (response.ok) {
            const user = await response.json();
            setUser(user);
          } else if (response.status === 401) {
            setUser(null);
            Cookies.remove('token');
            router.push('/login');
          } else {
            setFailed(true);
          }
        } catch (err) {
          console.log(err)
          setFailed(true);
          toast({
            title: 'Error',
            description: 'Failed to fetch user data. Please check internet connection and reload again',
            variant: 'destructive'
          })
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
      throw new Error('Failed to send verification code. Please try again.');
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
      const { token, user, organizationSlug } = await response.json();
      Cookies.set('token', token);
      setUser(user);
      if (organizationSlug && organizationSlug.length > 0) {
        router.push(`/${organizationSlug}/dashboard`);
      } else {
        router.push(`/create-org`);
      }
    } else {
      console.error('Login failed');
      throw new Error('Failed to login');
    }
  };


  const oauth2Login = (response: string) => {
    try {
      const { token, user, organizationSlug } = JSON.parse(response);
      Cookies.set('token', token);
      setUser(user);
      if (organizationSlug && organizationSlug.length > 0) {
        router.push(`/${organizationSlug}/dashboard`);
      } else {
        router.push(`/create-org`);
      }
    } catch (err) {
      console.log(err)
    }
  };

  const logout = async () => {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
    Cookies.remove('token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyCode, logout, oauth2Login, failed }}>
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

