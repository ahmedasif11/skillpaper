// src/hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { User } from '../types';
import { authAPI, ApiError } from '../lib/api';
import { useErrorHandler } from './useErrorHandler';
import { toast } from 'sonner';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    // Check for stored user on component mount
    const storedUser = localStorage.getItem('resumeBuilder_user');
    const storedToken = localStorage.getItem('resumeBuilder_token');

    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('resumeBuilder_user');
        localStorage.removeItem('resumeBuilder_token');
        console.error('Invalid stored user data:', error);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password);
      const { user: userData, token } = response;

      // Store in localStorage
      localStorage.setItem('resumeBuilder_user', JSON.stringify(userData));
      localStorage.setItem('resumeBuilder_token', token);

      setUser(userData);
      toast.success('Login successful');
      return { success: true };
    } catch (error) {
      const apiError = handleError(error);
      toast.error(apiError.message);
      return {
        success: false,
        error: apiError.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.register(name, email, password);
      const { user: userData, token } = response;

      // Store in localStorage
      localStorage.setItem('resumeBuilder_user', JSON.stringify(userData));
      localStorage.setItem('resumeBuilder_token', token);

      setUser(userData);
      toast.success('Registration successful');
      return { success: true };
    } catch (error) {
      const apiError = handleError(error);
      toast.error(apiError.message);
      return {
        success: false,
        error: apiError.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('resumeBuilder_user');
    localStorage.removeItem('resumeBuilder_token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const isTokenValid = () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('resumeBuilder_token');
    if (!token) return false;

    try {
      // Basic JWT token validation (check if it's not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && isTokenValid(),
  };
};
