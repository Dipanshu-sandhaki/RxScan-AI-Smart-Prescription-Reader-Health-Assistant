/**
 * RxScan AI — Auth Service
 * Handles user authentication with backend API
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || (typeof window !== 'undefined' ? 'http://127.0.0.1:8000' : 'http://localhost:8000');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Add logging to all requests
api.interceptors.request.use(request => {
  console.log('API Request:', request.method?.toUpperCase(), request.url, request.baseURL);
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.log('API Error:', error.response?.status, error.config?.url, error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('Backend not running on:', API_BASE);
    }
    return Promise.reject(error);
  }
);

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Test backend connection
 */
export async function testBackendConnection(): Promise<boolean> {
  try {
    const response = await api.get('/health');
    console.log('Backend connection test:', response.data);
    return true;
  } catch (error) {
    console.log('Backend connection failed:', error);
    return false;
  }
}

/**
 * Register a new user
 */
export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  console.log('auth.service - Register called with:', { name, email });
  
  try {
    const response = await api.post<AuthResponse>('/api/auth/register', {
      name,
      email,
      password,
    });
    
    console.log('auth.service - Register response:', response.data);
    
    // Store token
    await AsyncStorage.setItem('auth_token', response.data.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    // Save email for pre-fill on next login
    await AsyncStorage.setItem('saved_email', email);
    
    console.log('auth.service - Token and user stored');
    return response.data;
  } catch (error) {
    console.log('auth.service - Register error:', error);
    throw error;
  }
}

/**
 * Login existing user
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  console.log('auth.service - Login called with:', { email, password: '***' });
  
  try {
    const response = await api.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    
    console.log('auth.service - Login response:', response.data);
    
    // Store token
    await AsyncStorage.setItem('auth_token', response.data.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    // Save email for pre-fill on next login
    await AsyncStorage.setItem('saved_email', email);
    
    return response.data;
  } catch (error: any) {
    console.log('auth.service - Login error:', error);
    console.log('auth.service - Login error response:', error.response);
    console.log('auth.service - Login error data:', error.response?.data);
    // Re-throw the error so the frontend can handle it
    throw error;
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await api.get<User>('/api/auth/me');
    await AsyncStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(): Promise<boolean> {
  try {
    // For web, also check localStorage directly
    const token = await AsyncStorage.getItem('auth_token');
    const webToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    console.log('isLoggedIn check - AsyncStorage token:', token);
    console.log('isLoggedIn check - localStorage token:', webToken);
    
    if (!token && !webToken) return false;
    
    // Use web token if AsyncStorage is empty
    const activeToken = token || webToken;
    
    // Verify token is still valid
    const user = await getCurrentUser();
    console.log('isLoggedIn check - user:', user);
    return !!user;
  } catch (error) {
    console.log('isLoggedIn check failed:', error);
    return false;
  }
}

/**
 * Get stored user
 */
export async function getStoredUser(): Promise<User | null> {
  const userJson = await AsyncStorage.getItem('user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  await api.post('/api/auth/logout');
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('user');
}

export async function deleteAccount(): Promise<void> {
  await api.delete('/api/auth/delete-account');
  // Clear all local data after successful deletion
  await forceClearAuth();
}

export async function deleteAccountByEmail(email: string, password: string): Promise<void> {
  await api.post('/api/auth/delete-account-by-email', {
    email,
    password
  });
  // Clear all local data after successful deletion
  await forceClearAuth();
}

/**
 * Force clear auth data (for testing/debug)
 */
export async function forceClearAuth(): Promise<void> {
  // Clear AsyncStorage
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('user');
  
  // Also clear localStorage for web
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
  
  console.log('✅ Auth data force cleared from AsyncStorage and localStorage');
}

/**
 * Clear auth data (for errors)
 */
export async function clearAuth(): Promise<void> {
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('user');
}

/**
 * Save email for pre-filling login form after logout
 */
export async function saveEmail(email: string): Promise<void> {
  await AsyncStorage.setItem('saved_email', email);
}

/**
 * Get saved email for pre-filling login form
 */
export async function getSavedEmail(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('saved_email');
  } catch {
    return null;
  }
}

// Alias for register to match AuthScreen import
export { register as signup };
