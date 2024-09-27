"use client";

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
  username: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string) => Promise<void>;
  verifyCode: (username: string, code: string) => Promise<User>;
  oauth2Login: (response: string, redirectToPage: string) => void;
  updateUserName: (name: string) => Promise<void>;
  logout: () => void;
  verifyLoginOrPrompt: () => boolean
  registerSetOpenLoginDialog: (setOpenDialog: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';



export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [openLoginDialog, setOpenLoginDialog] = useState(null);
  const router = useRouter();

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

        if (openLoginDialog) {
          openLoginDialog(false)
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const registerSetOpenLoginDialog = (setOpenDialog) => {
    console.log('registerSetOpenLoginDialog')
    // This is a hack to store a function in a state, because react considers that we are using function to store state when trying to compute value using previous state
    setOpenLoginDialog(() => setOpenDialog)
  };

  const verifyLoginOrPrompt = () => {
    console.log('verifyLoginOrPrompt')

    if (user) {
      return false;
    }
    if (openLoginDialog) {
      openLoginDialog(true)
      checkUserLoggedIn();
      return true
    }
  };

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
      return user;
    } else {
      console.error('Login failed');
      const { message } = await response.json();
      throw new Error(message);
    }
  };

  const updateUserName = async (name) => {
    try {
      const token = Cookies.get('token');
      const res = await fetch(`${API_BASE_URL}/api/portal/auth/update-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({ name })
      })

      if (res.ok) {
        const userResponse = await res.json();
        setUser(userResponse);
      }
    } catch (error) {
      throw error
    }
  }

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
    <AuthContext.Provider value={{ user, loading, login, verifyCode, logout, oauth2Login, registerSetOpenLoginDialog, verifyLoginOrPrompt, updateUserName }}>
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

