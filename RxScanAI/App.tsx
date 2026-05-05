import React, { JSX, useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from './constants/colors';

// Screens
import BootScreen       from './screens/Bootscreen';
import OnboardingScreen from './screens/OnboardingScreen';
import AuthScreen       from './screens/AuthScreen';
import ScanScreen       from './screens/ScanScreen';
import ResultsScreen    from './screens/ResultsScreen';
import ScheduleScreen   from './screens/ScheduleScreen';
import HistoryScreen    from './screens/HistoryScreen';
import ProfileScreen    from './screens/ProfileScreen';
import { isLoggedIn } from './services/auth.service';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const C = {
  teal:   '#00C2D4',
  white:  '#FFFFFF',
  gray:   'rgba(255,255,255,0.3)',
  bg:     '#060D18',
  border: 'rgba(255,255,255,0.06)',
};

// ─── App phase state machine ───────────────────────────────────
// boot → onboarding → auth → main          ← CHANGE 2: 'auth' added to type
type AppPhase = 'boot' | 'onboarding' | 'auth' | 'main';

// ─── Tab Icon Components ───────────────────────────────────────
// ↓↓↓ ALL ORIGINAL ICON CODE COMPLETELY UNTOUCHED ↓↓↓

function IconHome({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* Roof triangle */}
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: s * 0.54, borderRightWidth: s * 0.54,
        borderBottomWidth: s * 0.44,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: color,
      }} />
      {/* Chimney */}
      <View style={{
        position: 'absolute', top: 0, left: s * 0.56,
        width: s * 0.14, height: s * 0.22,
        backgroundColor: color, borderRadius: 1,
      }} />
      {/* Body */}
      <View style={{
        width: s * 0.72, height: s * 0.46,
        backgroundColor: color,
        borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
        alignItems: 'center', justifyContent: 'center', paddingBottom: 3,
      }}>
        {/* Door */}
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
      {/* Calendar body */}
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
      {/* Binding rings */}
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
      {/* Head */}
      <View style={{
        width: s * 0.4, height: s * 0.4,
        borderRadius: s * 0.2, backgroundColor: color,
        marginBottom: s * 0.02,
      }} />
      {/* Shoulders */}
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

// ─── Custom Tab Bar ────────────────────────────────────────────
// ↓↓↓ COMPLETELY UNTOUCHED ↓↓↓
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
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
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

// ─── Main Tabs ─────────────────────────────────────────────────
// ↓↓↓ COMPLETELY UNTOUCHED ↓↓↓
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Home"
    >
      <Tab.Screen name="Home"     component={ScanScreen}     />
      <Tab.Screen name="History"  component={HistoryScreen}  />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen}  />
    </Tab.Navigator>
  );
}

// ─── Root App ──────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState<AppPhase>('boot'); // Fast boot for quick access
  const [checkingAuth, setCheckingAuth] = useState(false);

  // Debug: Log phase changes
  useEffect(() => {
    console.log('App - Current phase:', phase);
  }, [phase]);

  // Fast track: Add keyboard shortcut for quick access
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'o' && e.ctrlKey) {
        console.log('Ctrl+O pressed - fast track to onboarding');
        setPhase('onboarding');
      }
      if (e.key === 'q' && e.ctrlKey) {
        console.log('Ctrl+Q pressed - fast track to auth');
        setPhase('auth');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const onBootDone = async () => {
    // Temporarily force onboarding to test auth flow
    console.log('App - Forcing onboarding phase');
    setPhase('onboarding');
    
    // Original logic (commented out for testing):
    /*
    setCheckingAuth(true);
    const loggedIn = await isLoggedIn();
    console.log('App - isLoggedIn result:', loggedIn);
    setCheckingAuth(false);
    if (loggedIn) {
      setPhase('main');
    } else {
      setPhase('onboarding');
    }
    */
  };
  const onOnboardingDone = () => setPhase('auth');
  const onAuthDone       = () => setPhase('main');

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: C.white }}>Checking authentication...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Boot screen is fully independent — no NavigationContainer needed
  if (phase === 'boot') {
    return (
      <SafeAreaProvider>
        <BootScreen onDone={onBootDone} />
      </SafeAreaProvider>
    );
  }

  // Auth screen also runs outside NavigationContainer (same pattern as Boot)
  if (phase === 'auth') {
    return (
      <SafeAreaProvider>
        <AuthScreen onDone={onAuthDone} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {phase === 'onboarding' ? (
            <Stack.Screen name="Onboarding">
              {(props) => (
                <OnboardingScreen
                  {...props}
                  onDone={onOnboardingDone}
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen
                name="Results"
                component={ResultsScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────
// ↓↓↓ COMPLETELY UNTOUCHED ↓↓↓
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
});