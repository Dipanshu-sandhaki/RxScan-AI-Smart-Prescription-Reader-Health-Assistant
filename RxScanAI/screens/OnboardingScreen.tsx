import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Animated,
  FlatList,
  ViewToken,
  BackHandler
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

// ─── Brand Tokens ────────────────────────────────────────────
const C = {
  bg:      '#03101F',
  surface: '#071828',
  card:    '#0D2035',
  teal:    '#00C2D4',
  cyan:    '#00EDFF',
  ocean:   '#016096',
  green:   '#06D68A',
  purple:  '#A78BFA',
  white:   '#FFFFFF',
  gray:    '#8E9295',
};

const SLIDES = [
  {
    id: 'scan',
    tag: '01 — CAPTURE',
    headline: 'Point. Snap.\nDone.',
    body: 'AI auto-detects your prescription the moment it enters frame. No tapping, no cropping.',
    accent: C.teal,
    illustration: 'SCAN',
  },
  {
    id: 'read',
    tag: '02 — UNDERSTAND',
    headline: 'Every Medicine\nExplained.',
    body: 'Dosage, warnings and timing in plain language — in Hindi, Tamil, Bengali and 19 more languages.',
    accent: C.green,
    illustration: 'MEDS',
  },
  {
    id: 'track',
    tag: '03 — NEVER MISS',
    headline: 'Smart Dose\nReminders.',
    body: 'Auto-built schedule, nearby pharmacy finder and PDF reports — all synced instantly.',
    accent: C.purple,
    illustration: 'BELL',
  },
];

// ─── SCAN Illustration ────────────────────────────────────────
function ScanIllustration({ accent, beamAnim }: { accent: string; beamAnim: Animated.Value }) {
  const beamY = beamAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 90] });

  return (
    <View style={ill.root}>
      <View style={[ill.glow, { backgroundColor: accent + '20' }]} />
      <View style={ill.scanCard}>
        {/* Corners */}
        {[
          { top: 0, left: 0 },
          { top: 0, right: 0 },
          { bottom: 0, left: 0 },
          { bottom: 0, right: 0 },
        ].map((pos, i) => (
          <View key={i} style={[ill.corner, pos]}>
            <View style={[ill.cH, { backgroundColor: accent },
              i % 2 === 1 && { right: 0, left: undefined },
            ]} />
            <View style={[ill.cV, { backgroundColor: accent },
              i >= 2 && { bottom: 0, top: undefined },
            ]} />
          </View>
        ))}
        {/* Text lines */}
        <Text style={[ill.rxLabel, { color: accent }]}>PRESCRIPTION</Text>
        <View style={ill.linesWrap}>
          {[88, 70, 82, 60, 72].map((w, i) => (
            <View key={i} style={[ill.line, { width: `${w}%`, opacity: 0.15 + i * 0.04 }]} />
          ))}
          <View style={ill.hr} />
          {[62, 78, 55].map((w, i) => (
            <View key={i} style={[ill.lineS, { width: `${w}%` }]} />
          ))}
        </View>
        {/* Beam */}
        <Animated.View style={[ill.beam, { backgroundColor: accent, transform: [{ translateY: beamY }] }]} />
      </View>
      {/* Floating badge */}
      <View style={[ill.badge, { borderColor: accent + '50', backgroundColor: accent + '15' }]}>
        <View style={[ill.badgeDot, { backgroundColor: accent }]} />
        <Text style={[ill.badgeText, { color: accent }]}>AI Reading…</Text>
      </View>
    </View>
  );
}

// ─── MEDS Illustration ────────────────────────────────────────
function MedsIllustration({ accent }: { accent: string }) {
  const items = [
    { name: 'Amoxicillin', dose: '500mg', pct: 98 },
    { name: 'Paracetamol', dose: '650mg', pct: 96 },
    { name: 'Vitamin D3',  dose: '1000 IU', pct: 91 },
  ];
  return (
    <View style={ill.root}>
      <View style={[ill.glow, { backgroundColor: accent + '18' }]} />
      <View style={ill.medsWrap}>
        {items.map((p, i) => (
          <View key={i} style={ill.medRow}>
            {i === 0 && (
              <View style={[ill.langPill, { borderColor: accent + '50', backgroundColor: accent + '15' }]}>
                <Text style={[ill.langTxt, { color: accent }]}>हिन्दी ▾</Text>
              </View>
            )}
            <LinearGradient colors={['#0D2035', '#071828']} style={ill.medCard}>
              <View style={[ill.medDot, { backgroundColor: accent }]} />
              <View style={{ flex: 1 }}>
                <Text style={ill.medName}>{p.name}</Text>
                <Text style={ill.medDose}>{p.dose}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={ill.confTrack}>
                  <View style={[ill.confFill, { width: `${p.pct}%`, backgroundColor: accent }]} />
                </View>
                <Text style={[ill.confPct, { color: accent }]}>{p.pct}%</Text>
              </View>
            </LinearGradient>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── BELL Illustration ────────────────────────────────────────
function BellIllustration({ accent }: { accent: string }) {
  const rows = [
    { icon: '🌅', label: 'Morning',   time: '7:00 AM · 2 pills', done: true },
    { icon: '☀️', label: 'Afternoon', time: '1:00 PM · 1 pill',  done: true },
    { icon: '🌙', label: 'Night',     time: '9:00 PM · 2 pills', done: false },
  ];
  return (
    <View style={ill.root}>
      <View style={[ill.glow, { backgroundColor: accent + '18' }]} />
      <View style={ill.bellWrap}>
        {rows.map((r, i) => (
          <LinearGradient
            key={i}
            colors={r.done ? ['#0D2035', '#071828'] : [accent + '18', accent + '08']}
            style={[ill.reminderCard, !r.done && { borderColor: accent + '40' }]}
          >
            <View style={[ill.remIcon, { backgroundColor: accent + '15', borderColor: accent + '30' }]}>
              <Text style={{ fontSize: 16 }}>{r.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ill.remLabel}>{r.label}</Text>
              <Text style={ill.remTime}>{r.time}</Text>
            </View>
            <View style={[ill.checkCircle, { borderColor: accent + '60', backgroundColor: r.done ? accent + '20' : 'transparent' }]}>
              {r.done && <Text style={[ill.checkMark, { color: accent }]}>✓</Text>}
            </View>
          </LinearGradient>
        ))}
        <View style={ill.progRow}>
          <Text style={ill.progLabel}>Today's Progress</Text>
          <Text style={[ill.progPct, { color: accent }]}>67%</Text>
        </View>
        <View style={ill.progTrack}>
          <LinearGradient colors={[accent, accent + 'AA']} style={ill.progFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        </View>
      </View>
    </View>
  );
}

// ─── Single Slide ─────────────────────────────────────────────
function Slide({
  item, index, scrollX, beamAnim,
}: {
  item: typeof SLIDES[0]; index: number;
  scrollX: Animated.Value; beamAnim: Animated.Value;
}) {
  const inputRange = [(index - 1) * W, index * W, (index + 1) * W];
  const opacity    = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
  const translateY = scrollX.interpolate({ inputRange, outputRange: [20, 0, 20], extrapolate: 'clamp' });

  return (
    <View style={{ width: W, paddingHorizontal: 24 }}>
      {/* Illustration — fixed height */}
      <View style={s.illuBox}>
        {item.illustration === 'SCAN' && <ScanIllustration accent={item.accent} beamAnim={beamAnim} />}
        {item.illustration === 'MEDS' && <MedsIllustration accent={item.accent} />}
        {item.illustration === 'BELL' && <BellIllustration accent={item.accent} />}
      </View>

      {/* Text — animated */}
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        {/* Tag chip */}
        <View style={[s.tagChip, { borderColor: item.accent + '45', backgroundColor: item.accent + '12' }]}>
          <Text style={[s.tagText, { color: item.accent }]}>{item.tag}</Text>
        </View>

        {/* Headline */}
        <Text style={s.headline} numberOfLines={2} adjustsFontSizeToFit>
          {item.headline}
        </Text>

        {/* Body */}
        <Text style={s.body}>{item.body}</Text>
      </Animated.View>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────
export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollX  = useRef(new Animated.Value(0)).current;
  const beamAnim = useRef(new Animated.Value(0)).current;
  const listRef  = useRef<FlatList>(null);
  const btnScale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beamAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(beamAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  React.useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    return true; // block back button during onboarding
  });
  return () => backHandler.remove();
}, []);

  const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setActiveIdx(viewableItems[0].index);
  }, []);

  const goNext = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    if (activeIdx < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIdx + 1, animated: true });
    } else {
      onDone();
    }
  };

  const accent = SLIDES[activeIdx].accent;
  const isLast = activeIdx === SLIDES.length - 1;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Subtle bg glow top */}
      <View style={[s.bgGlow, { backgroundColor: accent }]} />

      {/* ── Header ── */}
      <View style={s.header}>
        <LinearGradient colors={['#00CEEA', '#009CC0', '#013270']} style={s.logoBox}>
          <Text style={s.logoRx}>Rx</Text>
          <View style={s.greenDot}><Text style={s.greenDotTxt}>AI</Text></View>
        </LinearGradient>
        <View>
          <Text style={s.logoName}>
            <Text style={{ color: C.white }}>Rx</Text>
            <Text style={{ color: C.teal }}>Scan</Text>
          </Text>
          <Text style={s.logoSub}>SMART PRESCRIPTION READER</Text>
        </View>
      </View>

      {/* ── Slides ── */}
      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(i) => i.id}
        horizontal pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item, index }) => (
          <Slide item={item} index={index} scrollX={scrollX} beamAnim={beamAnim} />
        )}
      />

      {/* ── Bottom ── */}
      <View style={s.bottom}>
        {/* Dots */}
        <View style={s.dotsRow}>
          {SLIDES.map((sl, i) => {
            const dotW = scrollX.interpolate({
              inputRange: [(i - 1) * W, i * W, (i + 1) * W],
              outputRange: [6, 20, 6], extrapolate: 'clamp',
            });
            const dotO = scrollX.interpolate({
              inputRange: [(i - 1) * W, i * W, (i + 1) * W],
              outputRange: [0.3, 1, 0.3], extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[s.dot, { width: dotW, opacity: dotO, backgroundColor: sl.accent }]}
              />
            );
          })}
        </View>

        {/* Button */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity onPress={goNext} activeOpacity={1}>
            <LinearGradient
              colors={isLast ? [C.green, '#039E60'] : [accent, C.ocean]}
              style={s.btn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={s.btnText}>
                {isLast ? 'Get Started  →' : 'Next  →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Skip */}
        {!isLast && (
          <TouchableOpacity onPress={onDone} style={s.skipBtn}>
            <Text style={s.skipTxt}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  bgGlow: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: H * 0.42, opacity: 0.07,
    borderBottomLeftRadius: W * 0.8,
    borderBottomRightRadius: W * 0.8,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 24,
    paddingTop: 52, paddingBottom: 8,
  },
  logoBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  logoRx:  { fontSize: 19, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  greenDot: {
    position: 'absolute', top: -5, right: -5,
    width: 17, height: 17, borderRadius: 9,
    backgroundColor: C.green, alignItems: 'center', justifyContent: 'center',
  },
  greenDotTxt: { fontSize: 6, fontWeight: '900', color: '#011A08' },
  logoName:    { fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
  logoSub:     { fontSize: 7, color: C.gray, letterSpacing: 2.5, fontWeight: '500', marginTop: 1 },

  // Illustration box — fixed height so text always has space
  illuBox: {
    height: H * 0.30,   // 30% of screen — enough for illustration
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },

  // Slide text
  tagChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
    marginBottom: 12,
  },
  tagText: {
    fontFamily: 'monospace', fontSize: 10,
    fontWeight: '700', letterSpacing: 1.8,
  },
  headline: {
    fontSize: 34,            // reduced from 42 → fits 2 lines perfectly
    fontWeight: '900',
    color: C.white,
    letterSpacing: -1,
    lineHeight: 40,
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    color: C.gray,
    lineHeight: 22,
    fontWeight: '400',
  },

  // Bottom
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 12,
  },
  dotsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 2,
  },
  dot: { height: 5, borderRadius: 3 },
  btn: {
    borderRadius: 16, paddingVertical: 17,
    alignItems: 'center',
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  btnText: { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  skipBtn: { alignItems: 'center', paddingVertical: 2 },
  skipTxt: { color: C.gray, fontSize: 13, fontWeight: '500' },
});

// ─── Illustration Styles ──────────────────────────────────────
const ill = StyleSheet.create({
  root: {
    width: W - 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 160, height: 160,
    borderRadius: 80,
    alignSelf: 'center',
    top: '5%',
  },

  // Scan card
  scanCard: {
    width: W * 0.78,
    height: 130,
    backgroundColor: '#0D2035',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    padding: 14,
    position: 'relative',
  },
  corner: { position: 'absolute', width: 20, height: 20 },
  cH: { position: 'absolute', top: 0, left: 0, width: 20, height: 2.5, borderRadius: 2 },
  cV: { position: 'absolute', top: 0, left: 0, width: 2.5, height: 20, borderRadius: 2 },
  rxLabel:  { fontSize: 8, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  linesWrap: { gap: 5 },
  line:  { height: 6, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 3 },
  hr:    { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 3 },
  lineS: { height: 5, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 3 },
  beam: {
    position: 'absolute', left: 0, right: 0, height: 2,
    opacity: 0.9,
  },
  badge: {
    position: 'absolute', bottom: -4, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 16, borderWidth: 1,
  },
  badgeDot:  { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Meds
  medsWrap: { width: W * 0.84, gap: 6 },
  medRow:   { position: 'relative' },
  langPill: {
    position: 'absolute', top: -8, right: 4, zIndex: 1,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1,
  },
  langTxt:  { fontSize: 10, fontWeight: '700' },
  medCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, padding: 10, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  medDot:  { width: 7, height: 7, borderRadius: 4 },
  medName: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  medDose: { fontSize: 10, color: '#8E9295', marginTop: 1 },
  confTrack: {
    width: 48, height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2, overflow: 'hidden',
  },
  confFill: { height: '100%', borderRadius: 2 },
  confPct:  { fontSize: 10, fontWeight: '700' },

  // Bell
  bellWrap: { width: W * 0.84, gap: 6 },
  reminderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  remIcon: {
    width: 36, height: 36, borderRadius: 9,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  remLabel:   { fontSize: 12, fontWeight: '700', color: '#FFF' },
  remTime:    { fontSize: 10, color: '#8E9295', marginTop: 1 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { fontSize: 11, fontWeight: '900' },
  progRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 4, marginBottom: 3,
  },
  progLabel: { fontSize: 10, color: '#8E9295' },
  progPct:   { fontSize: 10, fontWeight: '800' },
  progTrack: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, overflow: 'hidden',
  },
  progFill: { height: '100%', width: '67%', borderRadius: 2 },
});