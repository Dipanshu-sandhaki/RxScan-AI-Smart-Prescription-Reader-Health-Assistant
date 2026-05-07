/**
 * RxScan AI — Authentication Screen
 *
 * UX OVERHAUL:
 * 1. STRICT AUTHENTICATION: Removed the "Continue as Guest" button.
 * Users must now either Log In, Sign Up, or Reset their password to access the app.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Polyline, Rect, Line } from 'react-native-svg';

// Import our new Local Database service functions
import { login, signup, getSavedEmail, updatePassword } from '../services/auth.service';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

// Logical Width Capping for Web
const W = IS_WEB ? Math.min(SCREEN_W, 480) : SCREEN_W;
const H = SCREEN_H;

// ─── Brand Tokens ─────────────────────────────────────────────
const C = {
  bg:      '#03101F',
  surface: '#071828',
  card:    '#0D2035',
  teal:    '#00C2D4',
  cyan:    '#00EDFF',
  ocean:   '#016096',
  green:   '#06D68A',
  red:     '#FF4D6A',
  white:   '#FFFFFF',
  gray:    '#7A8490',
  dimGray: '#2A3540',
};

// ─── Icons ────────────────────────────────────────────────────
const IconUser = ({ color = C.gray }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
  </Svg>
);

const IconMail = ({ color = C.gray }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth="2" />
    <Polyline points="22,6 12,13 2,6" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const IconLock = ({ color = C.gray }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const IconEye = ({ color = C.gray, closed = false }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    {closed && <Line x1="3" y1="3" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />}
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function AuthScreen({ onDone }: { onDone: () => void }) {
  // Switched 'forgot' to 'reset' mode
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'name' | 'email' | 'password' | null>(null);
  
  // Toast State
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const toastAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Attempt to prefill email on mount
    getSavedEmail?.().then(saved => {
      if (saved) setEmail(saved);
    }).catch(() => {});
  }, []);

  // ─── UI Handlers ─────────────────────────────────────────────
  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    Animated.spring(toastAnim, { toValue: IS_WEB ? 20 : 50, useNativeDriver: true }).start();
    
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true }).start(() => setToast(null));
    }, 3500);
  };

  const validateForm = () => {
    Keyboard.dismiss();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      triggerToast('Please enter a valid email address.', 'error');
      return false;
    }

    if (mode === 'signup' && name.trim().length < 2) {
      triggerToast('Please enter a valid name.', 'error');
      return false;
    }
    
    if (password.length < 6) {
      triggerToast('Password must be at least 6 characters.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        triggerToast('Login successful! Welcome back.', 'success');
        setTimeout(() => onDone(), 1200);
      } else if (mode === 'signup') {
        await signup(name, email, password);
        triggerToast('Account created! Welcome aboard 🎉', 'success');
        setTimeout(() => onDone(), 1200);
      } else if (mode === 'reset') {
        await updatePassword(email, password); 
        triggerToast('Password successfully updated!', 'success');
        setTimeout(() => setMode('login'), 1500); // Send them back to login to try new pass
      }
    } catch (error: any) {
      const message = error.message || 'Authentication failed. Please try again.';
      triggerToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode);
    if (newMode !== 'reset') {
      setName('');
      setPassword('');
    } else {
      setPassword(''); // Clear old password when switching to reset mode
    }
  };

  // ─── Dynamic Header Content ───
  const getHeaderContent = () => {
    switch (mode) {
      case 'signup': return { title: 'Create Account', sub: 'Join RxScan to manage meds intelligently' };
      case 'reset': return { title: 'Reset Password', sub: 'Create a new password for your account' };
      case 'login': 
      default: return { title: 'Welcome Back', sub: 'Sign in to access your prescriptions' };
    }
  };

  return (
    <KeyboardAvoidingView 
      style={s.root} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Background Elements ── */}
      <View style={s.bgGlow} />

      {/* ── Animated Toast ── */}
      <Animated.View style={[s.toastContainer, { 
        transform: [{ translateY: toastAnim }],
        backgroundColor: toast?.type === 'error' ? C.red : C.green 
      }]}>
        <Text style={[s.toastText, { color: toast?.type === 'error' ? C.white : C.bg }]}>
          {toast?.msg}
        </Text>
      </Animated.View>

      <View style={s.container}>
        
        {/* ── Header ── */}
        <View style={s.header}>
          <LinearGradient colors={['#00CEEA', '#009CC0', '#013270']} style={s.logoBox}>
            <Text style={s.logoRx}>Rx</Text>
            <View style={s.aiDot}><Text style={s.aiDotTxt}>AI</Text></View>
          </LinearGradient>
          <Text style={s.title}>{getHeaderContent().title}</Text>
          <Text style={s.subtitle}>{getHeaderContent().sub}</Text>
        </View>

        {/* ── Custom Tab Toggle (Hidden in Reset Mode) ── */}
        {mode !== 'reset' && (
          <View style={s.tabContainer}>
            <TouchableOpacity 
              style={[s.tab, mode === 'login' && s.tabActive]} 
              onPress={() => mode !== 'login' && toggleMode('login')}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, mode === 'login' && s.tabTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.tab, mode === 'signup' && s.tabActive]} 
              onPress={() => mode !== 'signup' && toggleMode('signup')}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, mode === 'signup' && s.tabTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Form Fields ── */}
        <View style={s.form}>
          {mode === 'signup' && (
            <View style={[s.inputWrapper, focusedInput === 'name' && s.inputWrapperFocused]}>
              <View style={s.inputIcon}>
                <IconUser color={focusedInput === 'name' ? C.cyan : C.gray} />
              </View>
              <TextInput
                style={s.input}
                placeholder="Full Name"
                placeholderTextColor={C.gray}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isLoading}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          )}

          <View style={[s.inputWrapper, focusedInput === 'email' && s.inputWrapperFocused]}>
            <View style={s.inputIcon}>
              <IconMail color={focusedInput === 'email' ? C.cyan : C.gray} />
            </View>
            <TextInput
              style={s.input}
              placeholder="Email Address"
              placeholderTextColor={C.gray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* Password field is now rendered in ALL modes so user can set a new password */}
          <View style={[s.inputWrapper, focusedInput === 'password' && s.inputWrapperFocused]}>
            <View style={s.inputIcon}>
              <IconLock color={focusedInput === 'password' ? C.cyan : C.gray} />
            </View>
            <TextInput
              style={s.input}
              placeholder={mode === 'reset' ? 'New Password' : 'Password'}
              placeholderTextColor={C.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity 
              style={s.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <IconEye closed={!showPassword} color={focusedInput === 'password' ? C.cyan : C.gray} />
            </TouchableOpacity>
          </View>

          {mode === 'login' && (
            <TouchableOpacity style={s.forgotPass} onPress={() => toggleMode('reset')}>
              <Text style={s.forgotPassTxt}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Call to Action ── */}
        <TouchableOpacity onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
          <LinearGradient
            colors={isLoading ? [C.dimGray, C.dimGray] : [C.teal, C.ocean]}
            style={s.btn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={s.btnText}>
                {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Update Password'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Secondary Navigation ── */}
        {mode === 'reset' && (
          <TouchableOpacity onPress={() => toggleMode('login')} style={s.skipWrap} disabled={isLoading}>
            <Text style={s.skipTxt}>Back to Login</Text>
          </TouchableOpacity>
        )}

      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  bgGlow: {
    position: 'absolute',
    top: '-10%', left: '-10%', right: '-10%',
    height: SCREEN_H * 0.5,
    backgroundColor: C.ocean,
    opacity: 0.15,
    borderBottomLeftRadius: 400,
    borderBottomRightRadius: 400,
    transform: [{ scaleX: 1.5 }]
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBox: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  logoRx: { fontSize: 22, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  aiDot: {
    position: 'absolute', top: -5, right: -5,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.green,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.bg,
  },
  aiDotTxt: { fontSize: 7, fontWeight: '900', color: '#011A08' },
  title: { fontSize: 26, fontWeight: '800', color: C.white, marginBottom: 6 },
  subtitle: { fontSize: 13, color: C.gray, textAlign: 'center' },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: C.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
  },
  tabText: { color: C.gray, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: C.cyan, fontWeight: '700' },

  // Form Inputs
  form: { marginBottom: 20 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 14,
    height: 54,
  },
  inputWrapperFocused: {
    borderColor: C.cyan,
    backgroundColor: 'rgba(0, 237, 255, 0.03)',
    shadowColor: C.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: { paddingHorizontal: 16 },
  input: {
    flex: 1,
    color: C.white,
    fontSize: 15,
    height: '100%',
    ...(IS_WEB ? { outlineStyle: 'none' } : {}), 
  },
  eyeIcon: { paddingHorizontal: 16, height: '100%', justifyContent: 'center' },
  forgotPass: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 10 },
  forgotPassTxt: { color: C.teal, fontSize: 13, fontWeight: '600' },

  // Buttons
  btn: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.teal, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  btnText: { color: C.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  skipWrap: { alignSelf: 'center', marginTop: 24, padding: 10 },
  skipTxt: { color: C.gray, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },

  // Toast
  toastContainer: {
    position: 'absolute',
    left: 20, right: 20,
    alignSelf: 'center',
    maxWidth: 440,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 15,
  },
  toastText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
});