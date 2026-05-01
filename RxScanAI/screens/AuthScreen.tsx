// screens/AuthScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  BackHandler,          // ✅ single combined import — no duplicate
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width: W } = Dimensions.get('window');

const C = {
  bg:          '#03101F',
  surface:     '#071828',
  card:        '#0D2035',
  teal:        '#00C2D4',
  cyan:        '#00EDFF',
  ocean:       '#016096',
  green:       '#06D68A',
  white:       '#FFFFFF',
  gray:        '#8E9295',
  border:      'rgba(255,255,255,0.06)',
  inputBg:     '#071828',
  inputBorder: 'rgba(0,194,212,0.25)',
};

type AuthMode = 'login' | 'signup';

interface AuthScreenProps {
  onDone: () => void;
}

export default function AuthScreen({ onDone }: AuthScreenProps) {
  const [mode, setMode]                 = useState<AuthMode>('login');
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ✅ BackHandler — top level, never nested inside another function
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  const btnScale  = useRef(new Animated.Value(1)).current;
  const cardShift = useRef(new Animated.Value(0)).current;

  const switchMode = (next: AuthMode) => {
    Animated.sequence([
      Animated.timing(cardShift, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(cardShift, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start();
    setMode(next);
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleAuth = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in your email and password.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80,  useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();

    setLoading(true);

    // ✅ Simulated auth — replace with Firebase in Phase 5
    setTimeout(() => {
      setLoading(false);
      onDone();
    }, 1400);
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <View style={[styles.bgGlow, { backgroundColor: C.teal }]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ── */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#00CEEA', '#009CC0', '#013270']}
              style={styles.logoBox}
            >
              <Text style={styles.logoRx}>Rx</Text>
              <View style={styles.greenDot}>
                <Text style={styles.greenDotTxt}>AI</Text>
              </View>
            </LinearGradient>
            <View>
              <Text style={styles.logoName}>
                <Text style={{ color: C.white }}>Rx</Text>
                <Text style={{ color: C.teal }}>Scan</Text>
              </Text>
              <Text style={styles.logoSub}>SMART PRESCRIPTION READER</Text>
            </View>
          </View>

          {/* ── Headline ── */}
          <View style={styles.headlineWrap}>
            <Text style={styles.headline}>
              {mode === 'login' ? 'Welcome\nBack 👋' : 'Create Your\nAccount ✨'}
            </Text>
            <Text style={styles.subline}>
              {mode === 'login'
                ? 'Login to continue your health journey'
                : 'Join 1 billion Indians managing health smarter'}
            </Text>
          </View>

          {/* ── Toggle ── */}
          <View style={styles.toggleContainer}>
            {(['login', 'signup'] as AuthMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.toggleBtn, mode === m && styles.toggleActive]}
                onPress={() => switchMode(m)}
                activeOpacity={0.8}
              >
                {mode === m && (
                  <LinearGradient
                    colors={[C.teal, C.ocean]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  />
                )}
                <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                  {m === 'login' ? 'Login' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Form Card ── */}
          <Animated.View style={[styles.card, { transform: [{ translateY: cardShift }] }]}>

            {mode === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={inputStyle('name')}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={C.gray}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={inputStyle('email')}
                placeholder="you@example.com"
                placeholderTextColor={C.gray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[inputStyle('password'), { flex: 1, paddingRight: 48 }]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={C.gray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {mode === 'login' && (
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={1}
                style={{ marginTop: 20 }}
              >
                <LinearGradient
                  colors={loading ? ['#1a3a5c', '#1a3a5c'] : [C.teal, C.ocean]}
                  style={styles.submitBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {loading
                    ? <ActivityIndicator color={C.white} size="small" />
                    : <Text style={styles.submitText}>
                        {mode === 'login' ? 'Login  →' : 'Create Account  →'}
                      </Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => Alert.alert('Coming Soon', 'Google Sign-In will be added with Firebase in Phase 5!')}
            >
              <Text style={styles.googleText}>🌐   Continue with Google</Text>
            </TouchableOpacity>

          </Animated.View>

          <Text style={styles.footer}>
            {mode === 'login' ? "Don't have an account?  " : 'Already have an account?  '}
            <Text
              style={styles.footerLink}
              onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'Sign Up' : 'Login'}
            </Text>
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  bgGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
    opacity: 0.06,
    borderBottomLeftRadius: W * 0.8, borderBottomRightRadius: W * 0.8,
  },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
  logoBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  logoRx:           { fontSize: 19, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  greenDot: {
    position: 'absolute', top: -5, right: -5,
    width: 17, height: 17, borderRadius: 9,
    backgroundColor: '#06D68A', alignItems: 'center', justifyContent: 'center',
  },
  greenDotTxt:      { fontSize: 6, fontWeight: '900', color: '#011A08' },
  logoName:         { fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
  logoSub:          { fontSize: 7, color: C.gray, letterSpacing: 2.5, fontWeight: '500', marginTop: 1 },
  headlineWrap:     { marginBottom: 24 },
  headline: {
    fontSize: 34, fontWeight: '900', color: C.white,
    letterSpacing: -1, lineHeight: 40, marginBottom: 8,
  },
  subline:          { fontSize: 14, color: C.gray, lineHeight: 20 },
  toggleContainer: {
    flexDirection: 'row', backgroundColor: C.card,
    borderRadius: 12, padding: 4, marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 11, alignItems: 'center',
    borderRadius: 9, overflow: 'hidden',
  },
  toggleActive:     {},
  toggleText:       { fontSize: 14, color: C.gray, fontWeight: '700' },
  toggleTextActive: { color: C.white },
  card: {
    backgroundColor: C.card, borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: C.border, marginBottom: 20,
  },
  fieldGroup:  { marginBottom: 16 },
  label: {
    fontSize: 12, fontWeight: '700', color: C.gray,
    marginBottom: 7, letterSpacing: 0.8, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: C.white,
  },
  inputFocused:  { borderColor: C.teal, backgroundColor: '#071828' },
  passwordRow:   { flexDirection: 'row', alignItems: 'center' },
  eyeBtn:        { position: 'absolute', right: 14, padding: 4 },
  eyeIcon:       { fontSize: 18 },
  forgotBtn:     { alignSelf: 'flex-end', marginTop: -6, marginBottom: 2 },
  forgotText:    { fontSize: 13, color: C.teal, fontWeight: '600' },
  submitBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    shadowColor: C.teal, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  submitText:    { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  divider:       { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine:   { flex: 1, height: 1, backgroundColor: C.border },
  dividerText:   { marginHorizontal: 12, fontSize: 13, color: C.gray, fontWeight: '600' },
  googleBtn: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', backgroundColor: C.surface,
  },
  googleText:    { fontSize: 15, color: C.white, fontWeight: '600' },
  footer:        { textAlign: 'center', fontSize: 14, color: C.gray },
  footerLink:    { color: C.teal, fontWeight: '800' },
});