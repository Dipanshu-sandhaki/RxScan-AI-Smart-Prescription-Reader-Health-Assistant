/**
 * RxScan AI — Onboarding Screen
 *
 * UI/UX FIXES:
 * 1. STRICT AUTHENTICATION: Removed "Maybe later" texts. The user is now 
 * directly funneled to the Auth/Login screen via "Get Started" or "Skip Intro".
 * 2. Hidden Skip on Last Slide: Once the user reaches the final slide, the "Skip" 
 * button disappears, leaving only the primary "Get Started" CTA to drive them to login.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Animated,
  BackHandler,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Circle,
  Line,
  Polyline,
  G,
  Rect,
} from 'react-native-svg';

// ─── Responsive Dimensions ────────────────────────────────────
const { width: W, height: H } = Dimensions.get('window');
const IS_WEB   = Platform.OS === 'web';
const IS_SMALL = H < 700;

const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

// ─── Brand Tokens ─────────────────────────────────────────────
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
  gray:    '#7A8490',
  dimGray: '#2A3540',
};

// ─── Slide Data ───────────────────────────────────────────────
const SLIDES = [
  {
    id: 'scan',
    step: '01',
    tag: 'CAPTURE',
    headline: 'Point. Snap.\nDone.',
    body: 'AI auto-detects your prescription the moment it enters frame. No tapping, no cropping — just instant clarity.',
    accent: C.teal,
    type: 'SCAN' as const,
  },
  {
    id: 'read',
    step: '02',
    tag: 'UNDERSTAND',
    headline: 'Every Medicine\nExplained.',
    body: 'Dosage, warnings and timing in plain language — in Hindi, Tamil, Bengali and 19 more Indian languages.',
    accent: C.green,
    type: 'MEDS' as const,
  },
  {
    id: 'track',
    step: '03',
    tag: 'NEVER MISS',
    headline: 'Smart Dose\nReminders.',
    body: 'Auto-built schedule, nearby pharmacy finder and PDF reports — all synced instantly to your phone.',
    accent: C.purple,
    type: 'BELL' as const,
  },
];

// ─────────────────────────────────────────────────────────────
// ICON COMPONENTS (SVG — no emojis)
// ─────────────────────────────────────────────────────────────

const IconSun = ({ size = 18, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="12" y1="2"  x2="12" y2="4"  stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="12" y1="20" x2="12" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"   stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="2"  y1="12" x2="4"  y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="20" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="4.22" y1="19.78"  x2="5.64" y2="18.36"  stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const IconSunrise = ({ size = 18, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2v4M4.93 7.93l2.83 2.83M2 14h4M22 14h-4M19.07 7.93l-2.83 2.83"
      stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M5 19a7 7 0 0 1 14 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="2" y1="19" x2="22" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const IconMoon = ({ size = 18, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconGlobe = ({ size = 12, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const IconChevronDown = ({ size = 10, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="6 9 12 15 18 9" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconCheck = ({ size = 12, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconArrowRight = ({ size = 16, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14M12 5l7 7-7 7"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconRocket = ({ size = 16, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M15 21v-5s3.03-.55 4-2c1.08-1.62 0-5 0-5"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconScan = ({ size = 13, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"
      stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// ILLUSTRATIONS
// ─────────────────────────────────────────────────────────────

function ScanIllustration({ accent, beamAnim }: { accent: string; beamAnim: Animated.Value }) {
  const beamY = beamAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 85] });
  const lines = [88, 70, 82, 60, 72];

  return (
    <View style={ill.root}>
      <View style={[ill.glow, { backgroundColor: accent + '22' }]} />
      <View style={ill.scanCard}>
        {/* Corner brackets */}
        {([
          { top: 0, left: 0 },
          { top: 0, right: 0 },
          { bottom: 0, left: 0 },
          { bottom: 0, right: 0 },
        ] as const).map((pos, i) => (
          <View key={i} style={[ill.corner, pos]}>
            <View style={[ill.cH, { backgroundColor: accent },
              i % 2 === 1 ? { right: 0, left: undefined } : {}]} />
            <View style={[ill.cV, { backgroundColor: accent },
              i >= 2 ? { bottom: 0, top: undefined } : {}]} />
          </View>
        ))}

        {/* Header row */}
        <View style={ill.scanHeader}>
          <Text style={[ill.rxLabel, { color: accent }]}>PRESCRIPTION</Text>
          <View style={[ill.scanIconWrap, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
            <IconScan size={11} color={accent} />
          </View>
        </View>

        {/* Simulated text lines */}
        <View style={ill.linesWrap}>
          {lines.map((w, i) => (
            <View key={i} style={[ill.line, { width: `${w}%`, opacity: 0.14 + i * 0.04 }]} />
          ))}
          <View style={ill.hr} />
          {[62, 78, 55].map((w, i) => (
            <View key={i} style={[ill.lineS, { width: `${w}%` }]} />
          ))}
        </View>

        {/* Scanning beam */}
        <Animated.View
          style={[ill.beam, { backgroundColor: accent, transform: [{ translateY: beamY }] }]}
        />

        {/* Beam glow */}
        <Animated.View
          style={[ill.beamGlow, { backgroundColor: accent + '30', transform: [{ translateY: beamY }] }]}
        />
      </View>

      {/* Floating badge */}
      <View style={[ill.badge, { borderColor: accent + '50', backgroundColor: accent + '14' }]}>
        <View style={[ill.badgeDotOuter, { borderColor: accent + '40' }]}>
          <View style={[ill.badgeDot, { backgroundColor: accent }]} />
        </View>
        <Text style={[ill.badgeText, { color: accent }]}>AI Reading…</Text>
      </View>
    </View>
  );
}

function MedsIllustration({ accent }: { accent: string }) {
  const meds = [
    { name: 'Amoxicillin', dose: '500mg · BD',     pct: 98 },
    { name: 'Paracetamol', dose: '650mg · TDS',    pct: 96 },
    { name: 'Vitamin D3',  dose: '1000 IU · OD',   pct: 91 },
  ];

  return (
    <View style={ill.root}>
      <View style={[ill.glow, { backgroundColor: accent + '1E' }]} />
      <View style={ill.medsWrap}>
        {meds.map((p, i) => (
          <View key={i} style={ill.medRow}>
            {i === 0 && (
              <View style={[ill.langPill, { borderColor: accent + '50', backgroundColor: accent + '14' }]}>
                <IconGlobe size={11} color={accent} />
                <Text style={[ill.langTxt, { color: accent }]}>हिन्दी</Text>
                <IconChevronDown size={9} color={accent} />
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

function BellIllustration({ accent }: { accent: string }) {
  const rows = [
    { Icon: IconSunrise, label: 'Morning',   detail: '7:00 AM · 2 pills',  done: true  },
    { Icon: IconSun,     label: 'Afternoon', detail: '1:00 PM · 1 pill',   done: true  },
    { Icon: IconMoon,    label: 'Night',     detail: '9:00 PM · 2 pills',  done: false },
  ];

  return (
    <View style={ill.root}>
      <View style={[ill.glow, { backgroundColor: accent + '1E' }]} />
      <View style={ill.bellWrap}>
        {rows.map((r, i) => (
          <LinearGradient
            key={i}
            colors={r.done ? ['#0D2035', '#071828'] : [accent + '1E', accent + '08']}
            style={[ill.reminderCard, !r.done && { borderColor: accent + '45' }]}
          >
            <View style={[ill.remIcon,
              { backgroundColor: accent + '14', borderColor: accent + '30' }]}>
              <r.Icon size={16} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ill.remLabel}>{r.label}</Text>
              <Text style={ill.remTime}>{r.detail}</Text>
            </View>
            <View style={[ill.checkCircle,
              { borderColor: r.done ? accent : C.dimGray,
                backgroundColor: r.done ? accent + '22' : 'transparent' }]}>
              {r.done
                ? <IconCheck size={11} color={accent} />
                : <View style={[ill.checkEmpty, { backgroundColor: C.dimGray }]} />
              }
            </View>
          </LinearGradient>
        ))}

        {/* Adherence bar */}
        <View style={ill.progRow}>
          <Text style={ill.progLabel}>Today's Adherence</Text>
          <Text style={[ill.progPct, { color: accent }]}>67%</Text>
        </View>
        <View style={ill.progTrack}>
          <LinearGradient
            colors={[accent, accent + 'AA']}
            style={ill.progFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const slideAnims = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 0 : W))).current;
  const fadeAnims  = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const beamAnim   = useRef(new Animated.Value(0)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;

  // Scanning beam loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beamAnim, { toValue: 1, duration: 2000, useNativeDriver: IS_WEB ? false : true }),
        Animated.timing(beamAnim, { toValue: 0, duration: 2000, useNativeDriver: IS_WEB ? false : true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Block hardware back on Android
  useEffect(() => {
    if (IS_WEB) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // ── Slide transition ──────────────────────────────────────
  const goToSlide = (nextIdx: number) => {
    if (nextIdx === activeIdx) return;
    const direction = nextIdx > activeIdx ? 1 : -1;

    slideAnims[nextIdx].setValue(direction * W);
    fadeAnims[nextIdx].setValue(0);

    Animated.parallel([
      Animated.timing(slideAnims[activeIdx], {
        toValue: -direction * W,
        duration: 340,
        useNativeDriver: IS_WEB ? false : true,
      }),
      Animated.timing(fadeAnims[activeIdx], {
        toValue: 0,
        duration: 260,
        useNativeDriver: IS_WEB ? false : true,
      }),
      Animated.timing(slideAnims[nextIdx], {
        toValue: 0,
        duration: 340,
        useNativeDriver: IS_WEB ? false : true,
      }),
      Animated.timing(fadeAnims[nextIdx], {
        toValue: 1,
        duration: 340,
        useNativeDriver: IS_WEB ? false : true,
      }),
    ]).start();

    setActiveIdx(nextIdx);
  };

  // ── CTA press ────────────────────────────────────────────
  const goNext = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.93, duration: 80,  useNativeDriver: IS_WEB ? false : true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 160, useNativeDriver: IS_WEB ? false : true }),
    ]).start();

    if (activeIdx < SLIDES.length - 1) {
      goToSlide(activeIdx + 1);
    } else {
      onDone(); // Proceeds directly to Auth
    }
  };

  const accent = SLIDES[activeIdx].accent;
  const isLast = activeIdx === SLIDES.length - 1;
  const illuH  = clamp(H * 0.30, 180, 280);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Ambient background glow */}
      <View style={[s.bgGlow, { backgroundColor: accent }]} />
      <View style={s.bgGrid} />

      {/* ── Header ─────────────────────────────────────── */}
      <View style={s.header}>
        <LinearGradient colors={['#00CEEA', '#009CC0', '#013270']} style={s.logoBox}>
          <Text style={s.logoRx}>Rx</Text>
          <View style={s.aiDot}>
            <Text style={s.aiDotTxt}>AI</Text>
          </View>
        </LinearGradient>

        <View>
          <Text style={s.logoName}>
            <Text style={{ color: C.white }}>Rx</Text>
            <Text style={{ color: C.teal }}>Scan</Text>
          </Text>
          <Text style={s.logoSub}>SMART PRESCRIPTION READER</Text>
        </View>

        {/* Step indicator */}
        <View style={s.stepPill}>
          <Text style={[s.stepTxt, { color: accent }]}>
            {activeIdx + 1} / {SLIDES.length}
          </Text>
        </View>
      </View>

      {/* ── Slide Stack ────────────────────────────────── */}
      <View style={[s.slideStack, { height: illuH + 230 }]}>
        {SLIDES.map((slide, idx) => (
          <Animated.View
            key={slide.id}
            style={[
              s.slidePane,
              {
                opacity: fadeAnims[idx],
                transform: [{ translateX: slideAnims[idx] }],
              },
            ]}
          >
            {/* Illustration */}
            <View style={[s.illuBox, { height: illuH }]}>
              {slide.type === 'SCAN' && (
                <ScanIllustration accent={slide.accent} beamAnim={beamAnim} />
              )}
              {slide.type === 'MEDS' && <MedsIllustration accent={slide.accent} />}
              {slide.type === 'BELL' && <BellIllustration accent={slide.accent} />}
            </View>

            {/* Text content */}
            <View style={s.textBlock}>
              {/* Tag chip */}
              <View style={[s.tagChip,
                { borderColor: slide.accent + '40', backgroundColor: slide.accent + '10' }]}>
                <Text style={[s.tagStep, { color: slide.accent }]}>{slide.step}</Text>
                <View style={[s.tagDiv, { backgroundColor: slide.accent + '40' }]} />
                <Text style={[s.tagLabel, { color: slide.accent }]}>{slide.tag}</Text>
              </View>

              <Text style={s.headline} numberOfLines={2} adjustsFontSizeToFit>
                {slide.headline}
              </Text>
              <Text style={s.body}>{slide.body}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* ── Bottom Controls ────────────────────────────── */}
      <View style={s.bottom}>

        {/* Dot progress */}
        <View style={s.dotsRow}>
          {SLIDES.map((sl, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)} activeOpacity={0.75}>
              <Animated.View
                style={[
                  s.dot,
                  {
                    width: i === activeIdx ? 28 : 7,
                    backgroundColor: i === activeIdx ? sl.accent : C.dimGray,
                    opacity: i === activeIdx ? 1 : 0.5,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Primary CTA */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity onPress={goNext} activeOpacity={0.88}>
            <LinearGradient
              colors={isLast ? [C.green, '#039E60'] : [accent, C.ocean]}
              style={s.btn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLast
                ? <IconRocket size={18} color={C.white} />
                : null
              }
              <Text style={s.btnText}>
                {isLast ? 'Get Started' : 'Next'}
              </Text>
              {!isLast && <IconArrowRight size={17} color={C.white} />}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Secondary actions (Only show Skip if NOT on last slide) */}
        <View style={s.secondaryRow}>
          {!isLast && (
            <TouchableOpacity onPress={onDone} style={s.skipBtn}>
              <Text style={s.skipTxt}>Skip Intro</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </View>
  );
}

// ─── Main Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    overflow: 'hidden',
    ...(IS_WEB ? {
      width: '100%',
      height: '100vh' as any,
    } : {}),
  },
  bgGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: H * 0.45,
    opacity: 0.07,
    borderBottomLeftRadius: W * 0.7,
    borderBottomRightRadius: W * 0.7,
  },
  bgGrid: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.03,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: IS_WEB ? 32 : 52,
    paddingBottom: 10,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  logoBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  logoRx: {
    fontSize: 18, fontWeight: '900', color: C.white, letterSpacing: -0.5,
  },
  aiDot: {
    position: 'absolute', top: -5, right: -5,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.green,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.bg,
  },
  aiDotTxt:  { fontSize: 6, fontWeight: '900', color: '#011A08' },
  logoName:  { fontSize: 17, fontWeight: '900', letterSpacing: -0.4, color: C.white },
  logoSub:   { fontSize: 7, color: C.gray, letterSpacing: 2.5, fontWeight: '600', marginTop: 1 },
  stepPill: {
    marginLeft: 'auto',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stepTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  // ── Slide Stack ──
  slideStack: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    marginTop: 4,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  slidePane: {
    position: 'absolute',
    top: 0, left: 24, right: 24, bottom: 0,
  },
  illuBox: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  textBlock: { flex: 1 },

  // ── Tag chip ──
  tagChip: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    marginBottom: 14,
  },
  tagStep:  { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  tagDiv:   { width: 1, height: 10, borderRadius: 1 },
  tagLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 1.8 },

  headline: {
    fontSize: IS_SMALL ? 28 : 34,
    fontWeight: '900',
    color: C.white,
    letterSpacing: -1,
    lineHeight: IS_SMALL ? 34 : 42,
    marginBottom: 12,
  },
  body: {
    fontSize: IS_SMALL ? 13 : 14.5,
    color: C.gray,
    lineHeight: 23,
    fontWeight: '400',
    maxWidth: 380,
  },

  // ── Bottom ──
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: IS_WEB ? 32 : 36,
    gap: 12,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  btn: {
    borderRadius: 16,
    paddingVertical: IS_SMALL ? 14 : 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  btnText: {
    color: C.white,
    fontSize: IS_SMALL ? 15 : 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    height: 40, // Keeps layout stable even when button is hidden
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipTxt: {
    color: C.gray,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

// ─── Illustration Styles ──────────────────────────────────────
const ill = StyleSheet.create({
  root: {
    width: '100%',
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

  // ── Scan ──
  scanCard: {
    width: clamp(W * 0.78, 240, 340),
    height: 136,
    backgroundColor: '#0D2035',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    padding: 14,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  scanIconWrap: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  corner: { position: 'absolute', width: 20, height: 20 },
  cH: { position: 'absolute', top: 0, left: 0, width: 20, height: 2.5, borderRadius: 2 },
  cV: { position: 'absolute', top: 0, left: 0, width: 2.5, height: 20, borderRadius: 2 },
  rxLabel: { fontSize: 7.5, fontWeight: '700', letterSpacing: 2.2 },
  linesWrap: { gap: 5 },
  line:  { height: 5.5, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 3 },
  hr:    { height: 1,   backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 3 },
  lineS: { height: 4.5, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 3 },
  beam: {
    position: 'absolute', left: 0, right: 0, height: 1.5, opacity: 0.9,
  },
  beamGlow: {
    position: 'absolute', left: 0, right: 0, height: 8, opacity: 0.6,
    marginTop: -3,
  },
  badge: {
    position: 'absolute', bottom: -2, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeDotOuter: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeDot:  { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // ── Meds ──
  medsWrap: { width: clamp(W * 0.84, 260, 360), gap: 7 },
  medRow:   { position: 'relative' },
  langPill: {
    position: 'absolute', top: -9, right: 4, zIndex: 1,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langTxt:  { fontSize: 10, fontWeight: '700' },
  medCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, padding: 10, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  medDot:  { width: 7, height: 7, borderRadius: 4 },
  medName: { fontSize: 12, fontWeight: '700', color: C.white },
  medDose: { fontSize: 10, color: C.gray, marginTop: 1 },
  confTrack: {
    width: 48, height: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 2, overflow: 'hidden',
  },
  confFill: { height: '100%', borderRadius: 2 },
  confPct:  { fontSize: 10, fontWeight: '700' },

  // ── Bell ──
  bellWrap: { width: clamp(W * 0.84, 260, 360), gap: 6 },
  reminderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  remIcon: {
    width: 36, height: 36, borderRadius: 9,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  remLabel:   { fontSize: 12, fontWeight: '700', color: C.white },
  remTime:    { fontSize: 10, color: C.gray, marginTop: 1 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  checkEmpty: { width: 6, height: 6, borderRadius: 3, opacity: 0.3 },
  progRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 6, marginBottom: 4,
  },
  progLabel: { fontSize: 10.5, color: C.gray },
  progPct:   { fontSize: 10.5, fontWeight: '800' },
  progTrack: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, overflow: 'hidden',
  },
  progFill: { height: '100%', width: '67%', borderRadius: 2 },
});