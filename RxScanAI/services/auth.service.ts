/**
 * RxScan AI — Auth Service
 * Handles user authentication with backend API
 *
 * FIXES APPLIED:
 * 1. API URL now uses your PC's actual IP (works on Expo Go + Web)
 * 2. localStorage usage removed (crashes on native)
 * 3. logout() no longer deletes the user from DB (was a major bug)
 * 4. isLoggedIn() simplified and fixed
 * 5. Platform-aware API URL selection
 * 6. ADDED updatePassword() for MVP password resets
 */

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── API URL Config ────────────────────────────────────────────────────────────
//
//  🔴 IMPORTANT: Replace the IP below with YOUR PC's IP address.
//
const PC_IP = "192.168.8.104"; // ← APNA IP YAHAN DAALO

const API_BASE = (() => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL; // .env file se override kar sakte ho
  }
  if (Platform.OS === "web") {
    return "http://127.0.0.1:8000"; // Web browser
  }
  if (Platform.OS === "android") {
    // Emulator pe hai? → 10.0.2.2
    // Real phone pe hai (Expo Go)? → PC ka IP
    return `http://${PC_IP}:8000`;
  }
  return `http://${PC_IP}:8000`; // iOS
})();

console.log("🔌 API Base URL:", API_BASE);

// ─── Axios Instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request logger
api.interceptors.request.use((request) => {
  console.log(
    "➡️  API Request:",
    request.method?.toUpperCase(),
    request.baseURL + request.url,
  );
  return request;
});

// Response logger + error handler
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const message = error.response?.data?.detail || error.message;
    console.log(`❌ API Error [${status}] ${url}: ${message}`);

    if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
      console.log(
        "🔴 Backend is not running or IP is wrong. API_BASE =",
        API_BASE,
      );
      console.log(
        "   → Start backend: uvicorn main:app --reload --host 0.0.0.0 --port 8000",
      );
    }
    return Promise.reject(error);
  },
);

// Attach auth token to every request automatically
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // AsyncStorage fail hone pe silently ignore karo
  }
  return config;
});

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helper ───────────────────────────────────────────────────────────────────

async function _storeAuthData(
  data: AuthResponse,
  email: string,
): Promise<void> {
  await AsyncStorage.multiSet([
    ["auth_token", data.access_token],
    ["user", JSON.stringify(data.user)],
    ["saved_email", email],
  ]);
}

// ─── Auth Functions ───────────────────────────────────────────────────────────

/**
 * Backend se connection test karo
 */
export async function testBackendConnection(): Promise<boolean> {
  try {
    const response = await api.get("/health");
    console.log("🟢 Backend connected:", response.data);
    return true;
  } catch {
    console.log("🔴 Backend connection failed. URL:", API_BASE);
    return false;
  }
}

/**
 * Naya user register karo
 */
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  console.log("📝 Register:", { name, email });

  const response = await api.post<AuthResponse>("/api/auth/register", {
    name,
    email,
    password,
  });

  await _storeAuthData(response.data, email);
  console.log("✅ Registered and token stored");
  return response.data;
}

// Alias — AuthScreen mein signup naam se import ho raha tha
export { register as signup };

/**
 * Existing user login karo
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  console.log("🔐 Login:", { email });

  const response = await api.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });

  await _storeAuthData(response.data, email);
  console.log("✅ Logged in and token stored");
  return response.data;
}

/**
 * NEW: Update / Reset Password 
 * Sends new password to backend to update the database
 */
export async function updatePassword(
  email: string,
  newPassword: string,
): Promise<void> {
  console.log("🔑 Resetting password for:", { email });

  await api.post("/api/auth/reset-password", {
    email,
    password: newPassword, 
  });

  console.log("✅ Password updated successfully in database");
}

/**
 * Current logged-in user info backend se fetch karo
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await api.get<User>("/api/auth/me");
    await AsyncStorage.setItem("user", JSON.stringify(response.data));
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Check karo user logged in hai ya nahi
 * Token exist karta hai aur valid hai?
 */
export async function isLoggedIn(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    if (!token) {
      console.log("isLoggedIn: No token found");
      return false;
    }
    // Token ke saath backend se verify karo
    const user = await getCurrentUser();
    console.log("isLoggedIn:", !!user, user?.email);
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Locally stored user object return karo (offline use ke liye)
 */
export async function getStoredUser(): Promise<User | null> {
  try {
    const userJson = await AsyncStorage.getItem("user");
    if (!userJson) return null;
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
}

/**
 * Logout — sirf local token/data clear karo
 */
export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove(["auth_token", "user"]);
  console.log("✅ Logged out — local data cleared");
}

/**
 * Account permanently delete karo (authenticated)
 */
export async function deleteAccount(): Promise<void> {
  await api.delete("/api/auth/delete-account");
  await forceClearAuth();
  console.log("✅ Account deleted");
}

/**
 * Account delete karo email + password se (token nahi hai toh)
 */
export async function deleteAccountByEmail(
  email: string,
  password: string,
): Promise<void> {
  await api.post("/api/auth/delete-account-by-email", { email, password });
  await forceClearAuth();
  console.log("✅ Account deleted by email");
}

/**
 * Sabka data clear karo — debug/test ke liye
 */
export async function forceClearAuth(): Promise<void> {
  await AsyncStorage.multiRemove(["auth_token", "user", "saved_email"]);
  console.log("🧹 Auth data force cleared");
}

/**
 * Sirf auth token aur user clear karo (error handling ke liye)
 */
export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove(["auth_token", "user"]);
}

/**
 * Email save karo — login form pre-fill ke liye
 */
export async function saveEmail(email: string): Promise<void> {
  await AsyncStorage.setItem("saved_email", email);
}

/**
 * Saved email wapas lao
 */
export async function getSavedEmail(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem("saved_email");
  } catch {
    return null;
  }
}

export { API_BASE };