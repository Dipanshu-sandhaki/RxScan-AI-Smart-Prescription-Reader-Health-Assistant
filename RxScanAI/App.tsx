/**
 * RxScan AI — Root App
 *
 * FLOW: boot → onboarding (first launch only) → auth → main
 *
 * WHY ONBOARDING WAS SKIPPED:
 * AsyncStorage (localStorage on web) already had `onboarding_seen = 'true'`
 * from a previous dev run. The logic was correct — the stored data was stale.
 *
 * FIXES APPLIED:
 * 1. resolvePhase() checks onboarding_seen FIRST, before any auth token.
 * 2. sessionStorage only persists 'main' phase (not 'auth'/'onboarding').
 * 3. DEV RESET BUTTON: A floating red button (bottom-left) appears only in
 *    __DEV__ mode. Tap it to wipe all storage and restart from boot.
 *    On web you can also press Ctrl+Shift+R for the same reset.
 */

import React, { JSX, useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from './constants/colors';

// Screens
import BootScreen       from './screens/Bootscreen';
import OnboardingScreen from './screens/OnboardingScreen';
import AuthScreen       from './screens/AuthScreen';
import HomeScreen       from './screens/HomeScreen';
import ScanScreen       from './screens/ScanScreen';
import ResultsScreen    from './screens/ResultsScreen';
import ScheduleScreen   from './screens/ScheduleScreen';
import HistoryScreen    from './screens/HistoryScreen';
import ProfileScreen    from './screens/ProfileScreen';

import { getCurrentUser } from './services/auth.service';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const C = {
  teal:   '#00C2D4',
  white:  '#FFFFFF',
  gray:   'rgba(255,255,255,0.3)',
  bg:     '#060D18',
  border: 'rgba(255,255,255,0.06)',
};

type AppPhase = 'boot' | 'onboarding' | 'auth' | 'main';

// ─── Web: only restore 'main' from sessionStorage ─────────────
// Never restore 'auth' or 'onboarding' — those always re-run from boot.
function getInitialPhase(): AppPhase {
  try {
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem('rxscan_phase');
      if (saved === 'main') return 'main';
    }
  } catch { /* sessionStorage blocked */ }
  return 'boot';
}

// ─── DEV RESET UTILITY ────────────────────────────────────────
// Wipes all RxScan-related keys so the next boot behaves like a fresh install.
const DEV_KEYS = ['onboarding_seen', 'auth_token', 'rxscan_user'];

async function devResetStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(DEV_KEYS);
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('rxscan_phase');
    }
    console.log('[DEV RESET] Storage cleared ✓ — restarting from boot');
  } catch (e) {
    console.warn('[DEV RESET] Failed:', e);
  }
}

// ─── Tab Icon Components ──────────────────────────────────────

function IconHome({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: s * 0.54, borderRightWidth: s * 0.54,
        borderBottomWidth: s * 0.44,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: color,
      }} />
      <View style={{
        position: 'absolute', top: 0, left: s * 0.56,
        width: s * 0.14, height: s * 0.22,
        backgroundColor: color, borderRadius: 1,
      }} />
      <View style={{
        width: s * 0.72, height: s * 0.46,
        backgroundColor: color,
        borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
        alignItems: 'center', justifyContent: 'center', paddingBottom: 3,
      }}>
        <View style={{
          width: s * 0.22, height: s * 0.26,
          backgroundColor: C.bg,
          borderTopLeftRadius: s * 0.06, borderTopRightRadius: s * 0.06,
        }} />
      </View>
    </View>
  );
}

function IconHistory({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, justifyContent: 'center', gap: s * 0.16 }}>
      {[1, 0.75, 0.5].map((w, i) => (
        <View key={i} style={{
          width: s * w, height: s * 0.12,
          backgroundColor: color, borderRadius: s * 0.06,
        }} />
      ))}
    </View>
  );
}

function IconSchedule({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s }}>
      <View style={{
        width: s, height: s * 0.82,
        borderWidth: s * 0.1, borderColor: color,
        borderRadius: s * 0.12, marginTop: s * 0.18,
        overflow: 'hidden',
      }}>
        <View style={{ height: s * 0.25, backgroundColor: color }} />
        <View style={{
          flex: 1, flexDirection: 'row', flexWrap: 'wrap',
          padding: s * 0.06, gap: s * 0.07, alignContent: 'flex-start',
        }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <View key={i} style={{
              width: s * 0.16, height: s * 0.16,
              borderRadius: s * 0.04, backgroundColor: color,
              opacity: i === 1 ? 1 : 0.45,
            }} />
          ))}
        </View>
      </View>
      {[0.28, 0.72].map((x, i) => (
        <View key={i} style={{
          position: 'absolute', top: 0, left: s * x - s * 0.07,
          width: s * 0.14, height: s * 0.26,
          borderWidth: s * 0.09, borderColor: color,
          borderRadius: s * 0.1,
        }} />
      ))}
    </View>
  );
}

function IconProfile({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{
        width: s * 0.4, height: s * 0.4,
        borderRadius: s * 0.2, backgroundColor: color,
        marginBottom: s * 0.02,
      }} />
      <View style={{
        width: s * 0.78, height: s * 0.38,
        borderTopLeftRadius: s * 0.4, borderTopRightRadius: s * 0.4,
        backgroundColor: color,
      }} />
    </View>
  );
}

const TAB_ICONS: Record<string, (props: { color: string; size: number }) => JSX.Element> = {
  Home:     (p) => <IconHome     {...p} />,
  History:  (p) => <IconHistory  {...p} />,
  Schedule: (p) => <IconSchedule {...p} />,
  Profile:  (p) => <IconProfile  {...p} />,
};

// ─── Custom Tab Bar ───────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const iconFn    = TAB_ICONS[route.name];
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress', target: route.key, canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            {isFocused && <View style={styles.activePill} />}
            <View style={{ opacity: isFocused ? 1 : 0.38 }}>
              {iconFn({ color: isFocused ? Colors.primary : C.white, size: 20 })}
            </View>
            <Text style={[styles.tabLabel, isFocused && { color: Colors.primary }]}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Tabs ────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Home"
    >
      <Tab.Screen name="Home"     component={HomeScreen}     />
      <Tab.Screen name="History"  component={HistoryScreen}  />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen}  />
    </Tab.Navigator>
  );
}

// ─── Root App ─────────────────────────────────────────────────
export default function App() {
  const initialPhase = getInitialPhase();
  const [phase, setPhase]   = useState<AppPhase>(initialPhase);
  // isReady=false only when restoring 'main' on web (needs async token verify)
  const [isReady, setIsReady] = useState<boolean>(initialPhase === 'boot');

  // ── Persist phase: only 'main' goes to sessionStorage ─────
  useEffect(() => {
    try {
      if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
        if (phase === 'main') {
          sessionStorage.setItem('rxscan_phase', 'main');
        } else {
          sessionStorage.removeItem('rxscan_phase');
        }
      }
    } catch { /* ignored */ }
  }, [phase]);

  // ── Verify restored 'main' phase on web refresh ───────────
  useEffect(() => {
    if (initialPhase === 'main') {
      verifyRestoredMainPhase();
    }
  }, []);

  // ── Web keyboard shortcuts (dev only) ─────────────────────
  // Ctrl+O → onboarding | Ctrl+Q → auth | Ctrl+Shift+R → full reset
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handle = (e: KeyboardEvent) => {
      if (!__DEV__) return;
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        devResetStorage().then(() => setPhase('boot'));
      } else if (e.ctrlKey && e.key === 'o') {
        setPhase('onboarding');
      } else if (e.ctrlKey && e.key === 'q') {
        setPhase('auth');
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  // ── Core phase resolution ─────────────────────────────────
  // onboarding_seen is ALWAYS checked FIRST.
  // This is the single source of truth for the app flow.
  const resolvePhase = async (): Promise<AppPhase> => {
    try {
      // Step 1: Never-seen onboarding? Show it first.
      const onboardingSeen = await AsyncStorage.getItem('onboarding_seen');
      if (!onboardingSeen) {
        return 'onboarding';
      }

      // Step 2: Onboarding done — check for a saved auth token.
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return 'auth';
      }

      // Step 3: Token exists — verify it's still valid with server.
      const user = await getCurrentUser();
      return user ? 'main' : 'auth';

    } catch {
      // Network error or storage failure → safe fallback to auth.
      return 'auth';
    }
  };

  const verifyRestoredMainPhase = async () => {
    const resolved = await resolvePhase();
    setPhase(resolved);
    setIsReady(true);
  };

  const onBootDone = async () => {
    const resolved = await resolvePhase();
    setPhase(resolved);
  };

  const onOnboardingDone = async () => {
    try {
      await AsyncStorage.setItem('onboarding_seen', 'true');
    } catch { /* ignored */ }
    setPhase('auth');
  };

  const onAuthDone = () => setPhase('main');

  // ── DEV Reset Button ──────────────────────────────────────
  // Visible in __DEV__ mode on every screen.
  // Clears onboarding_seen + auth_token → restarts from boot.
  const DevResetButton = () => {
    if (!__DEV__) return null;
    return (
      <TouchableOpacity
        style={styles.devBtn}
        onPress={async () => {
          await devResetStorage();
          setPhase('boot');
        }}
        activeOpacity={0.75}
      >
        <Text style={styles.devBtnText}>⟳ RESET FLOW</Text>
      </TouchableOpacity>
    );
  };

  // ── Loading spinner (web 'main' restore only) ─────────────
  if (!isReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={C.teal} size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  // ── Boot ──────────────────────────────────────────────────
  if (phase === 'boot') {
    return (
      <SafeAreaProvider>
        <BootScreen onDone={onBootDone} />
        <DevResetButton />
      </SafeAreaProvider>
    );
  }

  // ── Auth ──────────────────────────────────────────────────
  if (phase === 'auth') {
    return (
      <SafeAreaProvider>
        <AuthScreen onDone={onAuthDone} />
        <DevResetButton />
      </SafeAreaProvider>
    );
  }

  // ── Onboarding + Main (inside NavigationContainer) ────────
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {phase === 'onboarding' ? (
            <Stack.Screen name="Onboarding">
              {() => (
                <View style={{ flex: 1 }}>
                  <OnboardingScreen onDone={onOnboardingDone} />
                  <DevResetButton />
                </View>
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="MainTabs"   component={MainTabs}    />
              <Stack.Screen
                name="ScanScreen"
                component={ScanScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="Results"
                component={ResultsScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
            </>
          )}
        </Stack.Navigator>
        <DevResetButton />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
    alignItems: 'flex-end',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 6,
    paddingBottom: 2,
    position: 'relative',
    minHeight: 56,
  },
  activePill: {
    position: 'absolute',
    top: 4,
    width: 42,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0,194,212,0.1)',
  },
  tabLabel: {
    fontSize: 9,
    color: C.gray,
    letterSpacing: 0.3,
    fontWeight: '500',
  },

  // ── DEV RESET BUTTON ──────────────────────────────────────
  devBtn: {
    position: 'absolute',
    bottom: 100,
    left: 10,
    zIndex: 9999,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,100,100,0.4)',
  },
  devBtnText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});