/**
 * BootScreen.tsx
 * ─────────────────────────────────────────────────────────────
 * "Medical Scanner Awakening" — 7-phase boot animation
 *
 * Phase 0 ( 0 – 300ms )   : Pure black
 * Phase 1 ( 300 – 1700ms ) : Dot grid + 3 sonar rings fire from centre
 * Phase 2 ( 1700 – 3100ms ): Icon springs in + scan line sweeps it
 * Phase 3 ( 3100 – 4300ms ): Icon holds, INITIALIZING types out, bar → 60%
 * Phase 4 ( 4300 – 5400ms ): Icon slides up, full logo fades in, tagline
 * Phase 5 ( 5400 – 6800ms ): Lockup holds, 3 feature chips stagger in, bar → 100%
 * Phase 6 ( 6800 – 8500ms ): Vignette closes → black → onDone()
 * ─────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Image, Animated, StyleSheet,
  Dimensions, StatusBar, Text, BackHandler
} from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

// ── Design tokens ──────────────────────────────────────────────
const BG    = '#020C16';
const TEAL  = '#00C2D4';
const CYAN  = '#00EDFF';
const OCEAN = '#016096';
const GREEN = '#06D68A';
const WHITE = '#FFFFFF';
const GRAY  = '#5A6470';

const ICON_SIZE = W * 0.30;
const LOGO_W    = W * 0.68;
const LOGO_H    = LOGO_W * 0.28;

// ── Dot grid config ────────────────────────────────────────────
const COLS     = 14;
const ROWS     = 22;
const DOT_SIZE = 2;
const DOT_GAP  = W / COLS;

// ── Sonar ring sizes ───────────────────────────────────────────
const RING_SIZES = [ICON_SIZE * 1.6, ICON_SIZE * 2.4, ICON_SIZE * 3.4];

// ── Feature chips ──────────────────────────────────────────────
const CHIPS = ['⚡ AI Powered', '🌐 22 Languages', '🔒 On-Device'];

// ── Timing (ms) — cinematic, slow & premium ───────────────────
const T = {
  sonarDur:     2800,
  sonarDelay:   [0, 350, 700] as number[],
  scanLineDur:  1400,
  taglineDur:   1000,
  chipStagger:  280,
  barTo60Dur:   1800,
  barTo100Dur:  1200,
  crossfadeDur: 700,
  logoSlideDur: 650,
  vigDur:       1200,
};

interface Props { onDone: () => void; }

// ══════════════════════════════════════════════════════════════
export default function BootScreen({ onDone }: Props) {

  // ── Animated values ─────────────────────────────────────────

  // Grid
  const gridOpacity  = useRef(new Animated.Value(0)).current;

  // Sonar rings — native driver only (opacity + scale)
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring1Scale   = useRef(new Animated.Value(0.1)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale   = useRef(new Animated.Value(0.1)).current;
  const ring3Opacity = useRef(new Animated.Value(0)).current;
  const ring3Scale   = useRef(new Animated.Value(0.1)).current;

  // Icon — native driver only
  const iconOpacity  = useRef(new Animated.Value(0)).current;
  const iconScale    = useRef(new Animated.Value(0.2)).current;
  const iconGlow     = useRef(new Animated.Value(0)).current;
  const iconY        = useRef(new Animated.Value(0)).current;

  // Scan line — native driver only
  const scanLineY    = useRef(new Animated.Value(0)).current;
  const scanLineOp   = useRef(new Animated.Value(0)).current;

  // Init text — native driver only
  const initOp       = useRef(new Animated.Value(0)).current;

  // Progress bar — JS driver (width % cannot use native)
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Full logo — native driver only
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoY        = useRef(new Animated.Value(22)).current;

  // Tagline — native driver only (NO letterSpacing animation)
  const taglineOp    = useRef(new Animated.Value(0)).current;

  // Feature chips — native driver only
  const chip1Op = useRef(new Animated.Value(0)).current;
  const chip1Y  = useRef(new Animated.Value(12)).current;
  const chip2Op = useRef(new Animated.Value(0)).current;
  const chip2Y  = useRef(new Animated.Value(12)).current;
  const chip3Op = useRef(new Animated.Value(0)).current;
  const chip3Y  = useRef(new Animated.Value(12)).current;

  // Vignette + screen fade — native driver only
  const vigOpacity    = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Loop refs for cleanup
  const glowLoop  = useRef<Animated.CompositeAnimation | null>(null);
  const sonarLoop = useRef<Animated.CompositeAnimation | null>(null);

  // ── ✅ FIX: BackHandler as its OWN useEffect (top level, NOT nested) ──
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // block back during boot
    });
    return () => backHandler.remove();
  }, []);

  // ── Sonar ring helper ──────────────────────────────────────
  const makeSonar = (
    op: Animated.Value,
    sc: Animated.Value,
    delay: number,
  ) =>
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(op, { toValue: 0.6,  duration: 120, useNativeDriver: true }),
        Animated.timing(sc, { toValue: 0.15, duration: 1,   useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(sc, { toValue: 1, duration: T.sonarDur, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(op, { toValue: 0.55, duration: T.sonarDur * 0.2, useNativeDriver: true }),
          Animated.timing(op, { toValue: 0,    duration: T.sonarDur * 0.8, useNativeDriver: true }),
        ]),
      ]),
    ]);

  // ── Main animation sequence ────────────────────────────────
  useEffect(() => {
    const alive = { v: true };
    const wait  = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    // ✅ NO hooks inside here — just plain async logic

    const run = async () => {

      // ── Phase 0: Pure black ────────────────────────────
      await wait(300);
      if (!alive.v) return;

      // ── Phase 1: Dot grid materialises + sonar rings ───
      Animated.timing(gridOpacity, {
        toValue: 1, duration: 700, useNativeDriver: true,
      }).start();

      makeSonar(ring1Opacity, ring1Scale, T.sonarDelay[0]).start();
      makeSonar(ring2Opacity, ring2Scale, T.sonarDelay[1]).start();
      makeSonar(ring3Opacity, ring3Scale, T.sonarDelay[2]).start();

      await wait(1400);
      if (!alive.v) return;

      // ── Phase 2: Icon springs in ───────────────────────
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1, friction: 5, tension: 50, useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1, duration: 400, useNativeDriver: true,
        }),
        Animated.timing(iconGlow, {
          toValue: 1, duration: 700, useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        glowLoop.current = Animated.loop(
          Animated.sequence([
            Animated.timing(iconGlow, {
              toValue: 0.5, duration: 1300, useNativeDriver: true,
            }),
            Animated.timing(iconGlow, {
              toValue: 1, duration: 1300, useNativeDriver: true,
            }),
          ])
        );
        glowLoop.current.start();
      }, 750);

      setTimeout(() => {
        sonarLoop.current = Animated.loop(
          Animated.parallel([
            makeSonar(ring1Opacity, ring1Scale, T.sonarDelay[0]),
            makeSonar(ring2Opacity, ring2Scale, T.sonarDelay[1]),
            makeSonar(ring3Opacity, ring3Scale, T.sonarDelay[2]),
          ])
        );
        sonarLoop.current.start();
      }, 500);

      setTimeout(() => {
        Animated.sequence([
          Animated.timing(scanLineOp, {
            toValue: 1, duration: 150, useNativeDriver: true,
          }),
          Animated.timing(scanLineY, {
            toValue: 1, duration: T.scanLineDur, useNativeDriver: true,
          }),
          Animated.timing(scanLineOp, {
            toValue: 0, duration: 250, useNativeDriver: true,
          }),
        ]).start();
      }, 420);

      await wait(1400);
      if (!alive.v) return;

      // ── Phase 3: INITIALIZING text + bar → 60% ─────────
      Animated.timing(initOp, {
        toValue: 1, duration: 380, useNativeDriver: true,
      }).start();

      Animated.timing(progressAnim, {
        toValue: 0.6, duration: T.barTo60Dur, useNativeDriver: false,
      }).start();

      await wait(1200);
      if (!alive.v) return;

      // ── Phase 4: Cross-fade to full logo ────────────────
      glowLoop.current?.stop();

      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 0, duration: T.crossfadeDur, useNativeDriver: true,
        }),
        Animated.timing(iconY, {
          toValue: -H * 0.07, duration: T.crossfadeDur, useNativeDriver: true,
        }),
        Animated.timing(iconGlow, {
          toValue: 0, duration: T.crossfadeDur, useNativeDriver: true,
        }),
        Animated.timing(initOp, {
          toValue: 0, duration: 280, useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1, duration: T.logoSlideDur + 150, useNativeDriver: true,
        }),
        Animated.timing(logoY, {
          toValue: 0, duration: T.logoSlideDur, useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        Animated.timing(taglineOp, {
          toValue: 1, duration: T.taglineDur, useNativeDriver: true,
        }).start();
      }, 300);

      await wait(1100);
      if (!alive.v) return;

      // ── Phase 5: Feature chips stagger + bar → 100% ────
      const chipPairs: [Animated.Value, Animated.Value][] = [
        [chip1Op, chip1Y],
        [chip2Op, chip2Y],
        [chip3Op, chip3Y],
      ];
      chipPairs.forEach(([op, y], i) => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(op, { toValue: 1, duration: 420, useNativeDriver: true }),
            Animated.timing(y,  { toValue: 0, duration: 420, useNativeDriver: true }),
          ]).start();
        }, i * T.chipStagger);
      });

      Animated.timing(progressAnim, {
        toValue: 1, duration: T.barTo100Dur, useNativeDriver: false,
      }).start();

      await wait(1400);
      if (!alive.v) return;

      // ── Phase 6: Vignette + fade to black ──────────────
      sonarLoop.current?.stop();

      Animated.parallel([
        Animated.timing(vigOpacity, {
          toValue: 1, duration: T.vigDur, useNativeDriver: true,
        }),
        Animated.timing(screenOpacity, {
          toValue: 0, duration: T.vigDur,
          delay: T.vigDur * 0.4,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (alive.v) onDone();
      });
    };

    run();
    return () => {
      alive.v = false;
      glowLoop.current?.stop();
      sonarLoop.current?.stop();
    };
  }, []);

  // ── Derived interpolations ───────────────────────────────────
  const scanY = scanLineY.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, ICON_SIZE],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });
  const progressColor = progressAnim.interpolate({
    inputRange:  [0, 0.6, 1],
    outputRange: [TEAL, CYAN, GREEN],
  });

  // ── Render ──────────────────────────────────────────────────
  return (
    <Animated.View style={[s.root, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* ── 1. Dot grid ──────────────────────────────────── */}
      <Animated.View style={[s.dotGrid, { opacity: gridOpacity }]}>
        {Array.from({ length: ROWS }).map((_, row) =>
          Array.from({ length: COLS }).map((_, col) => {
            const dist    = Math.sqrt(
              Math.pow(col - COLS / 2, 2) + Math.pow(row - ROWS / 2, 2)
            );
            const maxDist = Math.sqrt(
              Math.pow(COLS / 2, 2) + Math.pow(ROWS / 2, 2)
            );
            const baseOp  = (1 - (dist / maxDist) * 0.75) * 0.28;
            return (
              <View
                key={`${row}-${col}`}
                style={[s.dot, {
                  left:    col * DOT_GAP + DOT_GAP / 2 - DOT_SIZE / 2,
                  top:     row * (H / ROWS) + (H / ROWS) / 2 - DOT_SIZE / 2,
                  opacity: baseOp,
                }]}
              />
            );
          })
        )}
      </Animated.View>

      {/* ── 2. Sonar rings ───────────────────────────────── */}
      {[
        { op: ring1Opacity, sc: ring1Scale, size: RING_SIZES[0], color: CYAN,  bw: 1.5 },
        { op: ring2Opacity, sc: ring2Scale, size: RING_SIZES[1], color: TEAL,  bw: 1   },
        { op: ring3Opacity, sc: ring3Scale, size: RING_SIZES[2], color: OCEAN, bw: 0.5 },
      ].map(({ op, sc, size, color, bw }, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[s.ring, {
            width: size, height: size, borderRadius: size / 2,
            marginLeft: -size / 2, marginTop: -size / 2,
            borderColor: color, borderWidth: bw,
            opacity: op,
            transform: [{ scale: sc }],
          }]}
        />
      ))}

      {/* ── 3. Glow bloom ────────────────────────────────── */}
      <Animated.View style={[s.glowBloom, { opacity: iconGlow }]} />

      {/* ── 4. App icon ──────────────────────────────────── */}
      <Animated.View style={[
        s.iconWrap,
        {
          opacity:   iconOpacity,
          transform: [{ scale: iconScale }, { translateY: iconY }],
        },
      ]}>
        <Image
          source={require('../assets/rxscan_icon.png')}
          style={s.icon}
          resizeMode="contain"
        />
        <Animated.View
          pointerEvents="none"
          style={[s.scanLine, {
            opacity:   scanLineOp,
            transform: [{ translateY: scanY }],
          }]}
        >
          <View style={s.scanLineBar} />
          <View style={s.scanLineGlow} />
        </Animated.View>
      </Animated.View>

      {/* ── 5. INITIALIZING text ─────────────────────────── */}
      <Animated.View style={[s.initWrap, { opacity: initOp }]}>
        <View style={s.initRow}>
          <View style={s.initDot} />
          <Text style={s.initText}>INITIALIZING AI ENGINE</Text>
          <View style={s.initDot} />
        </View>
      </Animated.View>

      {/* ── 6. Full logo lockup ───────────────────────────── */}
      <Animated.View style={[
        s.logoLockup,
        {
          opacity:   logoOpacity,
          transform: [{ translateY: logoY }],
        },
      ]}>
        <Image
          source={require('../assets/rxscan_dark_fulllogo.png')}
          style={s.logo}
          resizeMode="contain"
        />

        <Animated.Text style={[s.tagline, { opacity: taglineOp }]}>
          SMART PRESCRIPTION READER
        </Animated.Text>

        <View style={s.chipsRow}>
          {CHIPS.map((chip, i) => {
            const op = [chip1Op, chip2Op, chip3Op][i];
            const y  = [chip1Y,  chip2Y,  chip3Y][i];
            return (
              <Animated.View
                key={i}
                style={[s.chip, {
                  opacity:   op,
                  transform: [{ translateY: y }],
                }]}
              >
                <Text style={s.chipText}>{chip}</Text>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      {/* ── 7. Progress bar ──────────────────────────────── */}
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFill, {
          width:           progressWidth,
          backgroundColor: progressColor,
        }]}>
          <View style={s.progressGlow} />
        </Animated.View>
      </View>

      {/* ── 8. Version label ─────────────────────────────── */}
      <Animated.Text style={[s.versionText, { opacity: logoOpacity }]}>
        v1.0.0
      </Animated.Text>

      {/* ── 9. Vignette overlay ──────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[s.vignette, { opacity: vigOpacity }]}
      />
    </Animated.View>
  );
}

// ── Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: BG,
    alignItems:      'center',
    justifyContent:  'center',
  },

  dotGrid: { ...StyleSheet.absoluteFillObject },
  dot: {
    position:        'absolute',
    width:           DOT_SIZE,
    height:          DOT_SIZE,
    borderRadius:    DOT_SIZE / 2,
    backgroundColor: TEAL,
  },

  ring: {
    position:    'absolute',
    top:         '50%',
    left:        '50%',
    borderStyle: 'solid',
  },

  glowBloom: {
    position:        'absolute',
    width:           ICON_SIZE * 2.6,
    height:          ICON_SIZE * 2.6,
    borderRadius:    ICON_SIZE * 1.3,
    backgroundColor: TEAL,
    shadowColor:     CYAN,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    60,
    elevation:       0,
  },

  iconWrap: {
    position:      'absolute',
    shadowColor:   TEAL,
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius:  28,
    elevation:     20,
  },
  icon: {
    width:        ICON_SIZE,
    height:       ICON_SIZE,
    borderRadius: ICON_SIZE * 0.22,
    overflow:     'hidden',
  },

  scanLine: {
    position: 'absolute',
    left:     0,
    right:    0,
    top:      0,
    height:   ICON_SIZE * 0.08,
  },
  scanLineBar: {
    position:        'absolute',
    left:            -4,
    right:           -4,
    height:          2,
    backgroundColor: CYAN,
    opacity:         0.95,
    borderRadius:    1,
    shadowColor:     CYAN,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    8,
    elevation:       8,
  },
  scanLineGlow: {
    position:        'absolute',
    left:            0,
    right:           0,
    top:             2,
    height:          18,
    backgroundColor: CYAN,
    opacity:         0.12,
    borderRadius:    3,
  },

  initWrap: {
    position: 'absolute',
    bottom:   H * 0.22,
  },
  initRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  initDot: {
    width:           4,
    height:          4,
    borderRadius:    2,
    backgroundColor: TEAL,
    opacity:         0.7,
  },
  initText: {
    fontSize:      9,
    color:         TEAL,
    letterSpacing: 3.5,
    fontWeight:    '600',
    fontFamily:    'monospace',
  },

  logoLockup: {
    position:   'absolute',
    alignItems: 'center',
    gap:        10,
  },
  logo: {
    width:  LOGO_W,
    height: LOGO_H,
  },

  tagline: {
    fontSize:      8.5,
    color:         GRAY,
    fontWeight:    '600',
    fontFamily:    'monospace',
    marginTop:     2,
    letterSpacing: 3.5,
  },

  chipsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginTop:     16,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical:   5,
    borderRadius:      20,
    backgroundColor:   'rgba(0,194,212,0.08)',
    borderWidth:       1,
    borderColor:       'rgba(0,194,212,0.22)',
  },
  chipText: {
    fontSize:      10,
    color:         TEAL,
    fontWeight:    '600',
    letterSpacing: 0.2,
  },

  progressTrack: {
    position:        'absolute',
    bottom:          44,
    left:            W * 0.18,
    right:           W * 0.18,
    height:          2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius:    1,
    overflow:        'hidden',
  },
  progressFill: {
    height:       '100%',
    borderRadius: 1,
  },
  progressGlow: {
    position:        'absolute',
    right:           -1,
    top:             -3,
    width:           6,
    height:          8,
    borderRadius:    3,
    backgroundColor: WHITE,
    opacity:         0.6,
    shadowColor:     CYAN,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    6,
  },

  versionText: {
    position:      'absolute',
    bottom:        28,
    fontSize:      10,
    color:         'rgba(255,255,255,0.18)',
    letterSpacing: 1.5,
    fontFamily:    'monospace',
  },

  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
  },
});