/**
 * RxScan AI — Home Dashboard
 *
 * UI/UX OVERHAUL & FIXES:
 * 1. Removed static/non-functional elements (Notification Bell, Upload PDF, Add Manual).
 * 2. Enhanced the Hero Card (Primary CTA) to be larger and more engaging.
 * 3. Polished the "Recent Scans" UI with better spacing, typography, and clean cards.
 * 4. Streamlined the dashboard to focus purely on working features.
 * 5. Replaced the dynamic time-based greeting with a reliable, static "Welcome back" message.
 * 6. UI BUG FIX: Added `borderRadius: 24` and `backgroundColor: C.bg` to the `heroWrapper` 
 * to prevent the shadow from rendering as a black square behind the rounded card corners.
 * 7. Removed "Guest User" text fallback since authentication is now strictly enforced.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Line, Polyline } from 'react-native-svg';

import { getStoredUser, User } from '../services/auth.service';
import { getScanHistory, ScanHistoryItem } from '../services/ocr.service';

const { width: SCREEN_W } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

// ─── Brand Tokens ─────────────────────────────────────────────
const C = {
  bg:      '#03101F',
  surface: '#071828',
  card:    '#0D2035',
  teal:    '#00C2D4',
  cyan:    '#00EDFF',
  white:   '#FFFFFF',
  gray:    '#7A8490',
  grayLight: '#A2AAB5',
  border:  'rgba(255,255,255,0.08)',
};

// ─── Helpers ──────────────────────────────────────────────────
const formatDate = (iso: string): string => {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (diff === 0) return `Today, ${time}`;
  if (diff === 1) return `Yesterday, ${time}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── SVG Icons ────────────────────────────────────────────────
const IconScanLarge = ({ color = C.white, size = 42 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="3" y1="12" x2="21" y2="12" stroke={C.cyan} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const IconScanSmall = ({ color = C.teal, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const IconArrowRight = ({ color = C.cyan, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconChevronRight = ({ color = C.gray, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="9 18 15 12 9 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Main Component ───────────────────────────────────────────
export default function HomeScreen({ navigation }: any) {
  const [user, setUser] = useState<User | null>(null);
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);

  // Set user once on mount
  useEffect(() => {
    getStoredUser().then(data => { if (data) setUser(data); });
  }, []);

  // Reload recent scans every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        try {
          setLoadingScans(true);
          const data = await getScanHistory();
          if (!active) return;
          const sorted = [...data].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setRecentScans(sorted.slice(0, 3)); // Showing top 3 for a better populated look
        } catch {
          // silently fail — backend might be offline
        } finally {
          if (active) setLoadingScans(false);
        }
      };
      load();
      return () => { active = false; };
    }, [])
  );

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      
      <View style={s.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

          {/* ── Header ── */}
          <View style={s.header}>
            <View>
              <Text style={s.greeting}>Welcome back,</Text>
              <Text style={s.userName}>{user?.name || '...'}</Text>
            </View>
          </View>

          {/* ── Primary CTA: Scan Prescription ── */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ScanScreen')}
            style={s.heroWrapper}
          >
            <LinearGradient
              colors={['#013270', '#009CC0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.heroCard}
            >
              <View style={s.heroGlow} />
              
              <View style={s.heroIconWrap}>
                <IconScanLarge />
              </View>
              
              <View style={s.heroTextWrap}>
                <Text style={s.heroTitle}>New Prescription Scan</Text>
                <Text style={s.heroSub}>
                  Instantly extract medicines, dosages, and AI-driven cost estimates using your camera.
                </Text>
              </View>
              
              <View style={s.heroAction}>
                <Text style={s.heroActionTxt}>Launch Scanner</Text>
                <IconArrowRight color={C.white} size={18} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Recent Scans ── */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Activity</Text>
            {recentScans.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('History')} style={s.seeAllBtn}>
                <Text style={s.seeAll}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingScans ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={C.teal} size="large" />
            </View>
          ) : recentScans.length === 0 ? (
            <View style={s.emptyRecent}>
              <View style={s.emptyIconWrap}>
                <IconScanSmall color={C.gray} size={28} />
              </View>
              <Text style={s.emptyRecentTitle}>No history yet</Text>
              <Text style={s.emptyRecentText}>
                Your analyzed prescriptions will be securely saved and displayed here.
              </Text>
            </View>
          ) : (
            <View style={s.recentList}>
              {recentScans.map((scan) => {
                const cost = (scan.medicines || []).reduce(
                  (sum, m) => sum + (m.estimated_total_cost ?? m.cost ?? 0), 0
                );
                return (
                  <TouchableOpacity
                    key={scan.id}
                    style={s.recentCard}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('Results', { data: scan })}
                  >
                    <View style={s.recentIconWrap}>
                      <IconScanSmall />
                    </View>
                    
                    <View style={s.recentInfo}>
                      <Text style={s.recentTitle} numberOfLines={1}>
                        {scan.doctor_info?.name || 'Dr. Prescription'}
                      </Text>
                      <View style={s.recentMetaRow}>
                        <Text style={s.recentDate}>{formatDate(scan.created_at)}</Text>
                        <Text style={s.metaDot}>•</Text>
                        <Text style={s.recentMetaTxt}>{scan.medicines?.length ?? 0} Meds</Text>
                        <Text style={s.metaDot}>•</Text>
                        <Text style={s.recentMetaTxt}>₹{cost}</Text>
                      </View>
                    </View>
                    
                    <IconChevronRight />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: C.bg },
  scrollContent: { padding: 24, paddingBottom: 60 },

  // Header
  header: {
    marginBottom: 32,
    marginTop: IS_WEB ? 20 : 10,
  },
  greeting: { color: C.grayLight, fontSize: 16, fontWeight: '500', marginBottom: 6 },
  userName: { color: C.white, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },

  // Hero Card
  heroWrapper: {
    marginBottom: 40,
    borderRadius: 24, // FIX: Match inner borderRadius to fix shadow geometry
    backgroundColor: C.bg, // FIX: Give shadow a solid base to prevent bleed
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  heroCard: {
    borderRadius: 24,
    padding: 28,
    overflow: 'hidden',
    alignItems: 'flex-start',
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: C.cyan,
    opacity: 0.15,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroTextWrap: { marginBottom: 24 },
  heroTitle:    { color: C.white, fontSize: 24, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  heroSub:      { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 22, fontWeight: '400' },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
  },
  heroActionTxt: { color: C.white, fontWeight: '800', fontSize: 15 },

  // Recent Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  sectionTitle: { color: C.white, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  seeAllBtn:    { paddingVertical: 4, paddingLeft: 10 },
  seeAll:       { color: C.teal, fontSize: 14, fontWeight: '700' },

  loadingRow: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  // Empty State
  emptyRecent: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 32,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.card, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  emptyRecentTitle: { color: C.white, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyRecentText: {
    color: C.gray, fontSize: 14, textAlign: 'center',
    lineHeight: 22, fontWeight: '500', paddingHorizontal: 10,
  },

  // Recent List
  recentList: { gap: 14 },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  recentIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 194, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 212, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recentInfo: { flex: 1, paddingRight: 10 },
  recentTitle: { color: C.white, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  recentMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  recentDate: { color: C.grayLight, fontSize: 13, fontWeight: '600' },
  metaDot: { color: C.gray, fontSize: 13, marginHorizontal: 6 },
  recentMetaTxt: { color: C.teal, fontSize: 13, fontWeight: '700' },
});