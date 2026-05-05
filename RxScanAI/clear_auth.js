/**
 * Clear Auth Data - Debug Helper
 * Run this in browser console to clear stored authentication
 */

// Clear AsyncStorage (React Native Web)
if (window.__DEV__) {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  console.log('✅ Auth data cleared');
  console.log('🔄 Refresh the page to see login flow');
} else {
  console.log('❌ This script only works in development mode');
}

// Alternative: Clear all localStorage
localStorage.clear();
console.log('✅ All localStorage cleared');
