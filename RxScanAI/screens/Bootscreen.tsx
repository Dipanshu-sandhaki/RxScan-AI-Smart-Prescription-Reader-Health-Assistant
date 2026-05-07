/**
 * BootScreen.tsx — Enhanced "Medical Scanner Awakening" v4
 * ─────────────────────────────────────────────────────────────
 * 7-phase boot animation — browser-compatible, zero-lag SVG grid,
 * flawless flexbox centralization, and refined UI scaling.
 * (Outer reticle removed for cleaner UI/UX)
 * ─────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  BackHandler,
  Platform,
} from "react-native";
import Svg, { Path, Circle, Polyline, Line, Rect } from "react-native-svg";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const IS_WEB = Platform.OS === "web";
const ND = !IS_WEB;

// ── Logical Width Capping for Web ─────────────────────────────
const W = IS_WEB ? Math.min(SCREEN_W, 500) : SCREEN_W;
const H = SCREEN_H;

// ── Design tokens ─────────────────────────────────────────────
const BG = "#020C16";
const TEAL = "#00C2D4";
const CYAN = "#00EDFF";
const OCEAN = "#016096";
const GREEN = "#06D68A";
const PURPLE = "#A78BFA";
const WHITE = "#FFFFFF";
const GRAY = "#5A6470";

const ICON_SIZE = W * 0.32;
const LOGO_W = W * 0.68;
const LOGO_H = LOGO_W * 0.28;

// ── Dot grid config ───────────────────────────────────────────
const DOT_SIZE = 2;
const DOT_GAP = W / 14;

// ── Sonar ring sizes ──────────────────────────────────────────
const RING_SIZES = [ICON_SIZE * 1.6, ICON_SIZE * 2.4, ICON_SIZE * 3.4];

// ── Timing (ms) ───────────────────────────────────────────────
const T = {
  sonarDur: 2800,
  sonarDelay: [0, 350, 700] as number[],
  scanLineDur: 1400,
  taglineDur: 1000,
  chipStagger: 300,
  barTo60Dur: 1800,
  barTo100Dur: 1200,
  crossfadeDur: 700,
  logoSlideDur: 650,
  vigDur: 1200,
};

// ─────────────────────────────────────────────────────────────
// SVG ICON COMPONENTS
// ─────────────────────────────────────────────────────────────
const IconZap = ({ size = 14, color = TEAL }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconGlobe = ({ size = 14, color = TEAL }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" />
    <Path
      d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </Svg>
);

const IconShield = ({ size = 14, color = TEAL }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="9 12 11 14 15 10"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CHIPS = [
  { Icon: IconZap, label: "AI Powered", color: CYAN },
  { Icon: IconGlobe, label: "22 Languages", color: GREEN },
  { Icon: IconShield, label: "On-Device", color: PURPLE },
];

// ─────────────────────────────────────────────────────────────
// BACKGROUND COMPONENTS (Optimised SVG)
// ─────────────────────────────────────────────────────────────
const DotGrid = () => {
  const actualCols = Math.ceil(SCREEN_W / DOT_GAP) + 2;
  const actualRows = Math.ceil(SCREEN_H / DOT_GAP) + 2;
  const dots = [];
  const centerX = ((actualCols - 1) / 2) * DOT_GAP;
  const centerY = ((actualRows - 1) / 2) * DOT_GAP;
  const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);

  for (let row = 0; row < actualRows; row++) {
    for (let col = 0; col < actualCols; col++) {
      const cx = col * DOT_GAP;
      const cy = row * DOT_GAP;
      const dist = Math.sqrt((cx - centerX) ** 2 + (cy - centerY) ** 2);
      const opacity = (1 - (dist / maxDist) * 0.7) * 0.22;
      if (opacity > 0.01) {
        dots.push(
          <Circle
            key={`${row}-${col}`}
            cx={cx}
            cy={cy}
            r={DOT_SIZE / 2}
            fill={TEAL}
            opacity={opacity}
          />,
        );
      }
    }
  }
  return (
    <Svg
      width={SCREEN_W}
      height={SCREEN_H}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      {dots}
    </Svg>
  );
};

const HexMesh = () => {
  const R = 22;
  const HX = R * Math.sqrt(3);
  const HY = R * 1.5;
  const cols = Math.ceil(SCREEN_W / HX) + 2;
  const rows = Math.ceil(SCREEN_H / HY) + 2;

  const hexPath = (cx: number, cy: number) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`;
    });
    return `M ${pts.join(" L ")} Z`;
  };

  return (
    <Svg
      width={SCREEN_W}
      height={SCREEN_H}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => {
          const cx = col * HX + (row % 2 === 0 ? 0 : HX / 2) - HX / 2;
          const cy = row * HY - HY / 2;
          return (
            <Path
              key={`${row}-${col}`}
              d={hexPath(cx, cy)}
              stroke={TEAL}
              strokeWidth="0.4"
              fill="none"
              opacity="0.035"
            />
          );
        }),
      )}
    </Svg>
  );
};

const CircuitTraces = () => (
  <Svg
    width={SCREEN_W}
    height={SCREEN_H}
    style={StyleSheet.absoluteFillObject}
    pointerEvents="none"
  >
    <Path
      d={`M 0 ${H * 0.18} h 60 v -28 h 40 v -18 h 24`}
      stroke={TEAL}
      strokeWidth="0.6"
      fill="none"
      opacity="0.18"
    />
    <Circle cx="124" cy={H * 0.18 - 46} r="2.5" fill={TEAL} opacity="0.25" />
    <Path
      d={`M 0 ${H * 0.28} h 32 v -14 h 56`}
      stroke={OCEAN}
      strokeWidth="0.5"
      fill="none"
      opacity="0.14"
    />
    <Path
      d={`M ${SCREEN_W} ${H * 0.76} h -72 v 20 h -36 v 14 h -20`}
      stroke={TEAL}
      strokeWidth="0.6"
      fill="none"
      opacity="0.18"
    />
    <Circle
      cx={SCREEN_W - 72}
      cy={H * 0.76 + 34}
      r="2.5"
      fill={TEAL}
      opacity="0.25"
    />
    <Path
      d={`M ${SCREEN_W} ${H * 0.85} h -40 v -12 h -52`}
      stroke={OCEAN}
      strokeWidth="0.5"
      fill="none"
      opacity="0.12"
    />
    <Rect
      x="8"
      y="8"
      width="14"
      height="14"
      stroke={TEAL}
      strokeWidth="0.8"
      fill="none"
      opacity="0.12"
      rx="2"
    />
    <Rect
      x={SCREEN_W - 22}
      y={H - 22}
      width="14"
      height="14"
      stroke={TEAL}
      strokeWidth="0.8"
      fill="none"
      opacity="0.12"
      rx="2"
    />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// BOOT SCREEN ROOT
// ─────────────────────────────────────────────────────────────
interface Props {
  onDone: () => void;
}

export default function BootScreen({ onDone }: Props) {
  const gridOpacity = useRef(new Animated.Value(0)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring1Scale = useRef(new Animated.Value(0.1)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.1)).current;
  const ring3Opacity = useRef(new Animated.Value(0)).current;
  const ring3Scale = useRef(new Animated.Value(0.1)).current;
  
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.2)).current;
  const iconGlow = useRef(new Animated.Value(0)).current;
  const iconY = useRef(new Animated.Value(0)).current;
  
  const scanLineY = useRef(new Animated.Value(0)).current;
  const scanLineOp = useRef(new Animated.Value(0)).current;
  
  const initOp = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(22)).current;
  const taglineOp = useRef(new Animated.Value(0)).current;
  
  const chip1Op = useRef(new Animated.Value(0)).current;
  const chip1Y = useRef(new Animated.Value(14)).current;
  const chip2Op = useRef(new Animated.Value(0)).current;
  const chip2Y = useRef(new Animated.Value(14)).current;
  const chip3Op = useRef(new Animated.Value(0)).current;
  const chip3Y = useRef(new Animated.Value(14)).current;
  
  const vigOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const glowLoop = useRef<Animated.CompositeAnimation | null>(null);
  const sonarLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (IS_WEB) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  const makeSonar = (op: Animated.Value, sc: Animated.Value, delay: number) =>
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(op, { toValue: 0.6, duration: 120, useNativeDriver: ND }),
        Animated.timing(sc, { toValue: 0.15, duration: 1, useNativeDriver: ND }),
      ]),
      Animated.parallel([
        Animated.timing(sc, { toValue: 1, duration: T.sonarDur, useNativeDriver: ND }),
        Animated.sequence([
          Animated.timing(op, { toValue: 0.55, duration: T.sonarDur * 0.2, useNativeDriver: ND }),
          Animated.timing(op, { toValue: 0, duration: T.sonarDur * 0.8, useNativeDriver: ND }),
        ]),
      ]),
    ]);

  useEffect(() => {
    let isMounted = true;
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const run = async () => {
      await wait(300);
      if (!isMounted) return;

      // Phase 1: Grid & Sonar
      Animated.timing(gridOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: ND,
      }).start();
      makeSonar(ring1Opacity, ring1Scale, T.sonarDelay[0]).start();
      makeSonar(ring2Opacity, ring2Scale, T.sonarDelay[1]).start();
      makeSonar(ring3Opacity, ring3Scale, T.sonarDelay[2]).start();

      await wait(1400);
      if (!isMounted) return;

      // Phase 2: Icon pops in
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: ND,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: ND,
        }),
        Animated.timing(iconGlow, {
          toValue: 1,
          duration: 700,
          useNativeDriver: ND,
        }),
      ]).start();

      setTimeout(() => {
        if (!isMounted) return;
        glowLoop.current = Animated.loop(
          Animated.sequence([
            Animated.timing(iconGlow, { toValue: 0.5, duration: 1300, useNativeDriver: ND }),
            Animated.timing(iconGlow, { toValue: 1.0, duration: 1300, useNativeDriver: ND }),
          ]),
        );
        glowLoop.current.start();
      }, 750);

      setTimeout(() => {
        if (!isMounted) return;
        sonarLoop.current = Animated.loop(
          Animated.parallel([
            makeSonar(ring1Opacity, ring1Scale, T.sonarDelay[0]),
            makeSonar(ring2Opacity, ring2Scale, T.sonarDelay[1]),
            makeSonar(ring3Opacity, ring3Scale, T.sonarDelay[2]),
          ]),
        );
        sonarLoop.current.start();
      }, 500);

      // Trigger the Scan Line sweep
      setTimeout(() => {
        if (!isMounted) return;
        Animated.sequence([
          Animated.timing(scanLineOp, { toValue: 1, duration: 150, useNativeDriver: ND }),
          Animated.timing(scanLineY, { toValue: 1, duration: T.scanLineDur, useNativeDriver: ND }),
          Animated.timing(scanLineOp, { toValue: 0, duration: 250, useNativeDriver: ND }),
        ]).start();
      }, 420);

      await wait(1400);
      if (!isMounted) return;

      // Phase 3: Text & Bar to 60%
      Animated.timing(initOp, {
        toValue: 1,
        duration: 380,
        useNativeDriver: ND,
      }).start();
      Animated.timing(progressAnim, {
        toValue: 0.6,
        duration: T.barTo60Dur,
        useNativeDriver: false,
      }).start();

      await wait(1200);
      if (!isMounted) return;

      glowLoop.current?.stop();

      // Phase 4: Crossfade to final logo lockup
      Animated.parallel([
        Animated.timing(iconOpacity, { toValue: 0, duration: T.crossfadeDur, useNativeDriver: ND }),
        Animated.timing(iconY, { toValue: -H * 0.07, duration: T.crossfadeDur, useNativeDriver: ND }),
        Animated.timing(iconGlow, { toValue: 0, duration: T.crossfadeDur, useNativeDriver: ND }),
        Animated.timing(initOp, { toValue: 0, duration: 280, useNativeDriver: ND }),
        Animated.timing(logoOpacity, { toValue: 1, duration: T.logoSlideDur + 150, useNativeDriver: ND }),
        Animated.timing(logoY, { toValue: 0, duration: T.logoSlideDur, useNativeDriver: ND }),
      ]).start();

      setTimeout(() => {
        if (isMounted)
          Animated.timing(taglineOp, { toValue: 1, duration: T.taglineDur, useNativeDriver: ND }).start();
      }, 300);

      await wait(1100);
      if (!isMounted) return;

      // Phase 5: Chips stagger in & Bar completes
      const chipPairs: [Animated.Value, Animated.Value][] = [
        [chip1Op, chip1Y],
        [chip2Op, chip2Y],
        [chip3Op, chip3Y],
      ];
      chipPairs.forEach(([op, y], i) => {
        setTimeout(() => {
          if (!isMounted) return;
          Animated.parallel([
            Animated.timing(op, { toValue: 1, duration: 420, useNativeDriver: ND }),
            Animated.timing(y, { toValue: 0, duration: 420, useNativeDriver: ND }),
          ]).start();
        }, i * T.chipStagger);
      });

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: T.barTo100Dur,
        useNativeDriver: false,
      }).start();

      await wait(1400);
      if (!isMounted) return;

      sonarLoop.current?.stop();

      // Phase 6: Exit Sequence
      Animated.parallel([
        Animated.timing(vigOpacity, { toValue: 1, duration: T.vigDur, useNativeDriver: ND }),
        Animated.timing(screenOpacity, { toValue: 0, duration: T.vigDur, delay: T.vigDur * 0.4, useNativeDriver: ND }),
      ]).start(() => {
        if (isMounted) onDone();
      });
    };

    run();
    return () => {
      isMounted = false;
      glowLoop.current?.stop();
      sonarLoop.current?.stop();
    };
  }, []);

  const scanY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, ICON_SIZE - ICON_SIZE * 0.08],
  });
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });
  const progressColor = progressAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [TEAL, CYAN, GREEN],
  });
  const glowBloomOp = iconGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.22],
  });

  return (
    <Animated.View style={[s.root, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <HexMesh />
      <CircuitTraces />

      {/* Zero Lag SVG Grid */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { opacity: gridOpacity }]}
        pointerEvents="none"
      >
        <DotGrid />
      </Animated.View>

      {/* Center Layout Wrap */}
      <View style={s.centerOverlay} pointerEvents="none">
        
        {/* Sonar Rings */}
        {[
          { op: ring1Opacity, sc: ring1Scale, size: RING_SIZES[0], color: CYAN, bw: 1.5 },
          { op: ring2Opacity, sc: ring2Scale, size: RING_SIZES[1], color: TEAL, bw: 1.0 },
          { op: ring3Opacity, sc: ring3Scale, size: RING_SIZES[2], color: OCEAN, bw: 0.6 },
        ].map(({ op, sc, size, color, bw }, i) => (
          <Animated.View
            key={i}
            style={[
              s.ring,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor: color,
                borderWidth: bw,
                opacity: op,
                transform: [{ scale: sc }],
              },
            ]}
          />
        ))}

        {/* Glow */}
        <Animated.View style={[s.glowBloom, { opacity: glowBloomOp }]} />

        {/* Flawless Icon Wrap (Outer Reticle Removed) */}
        <Animated.View
          style={[
            s.iconWrap,
            {
              opacity: iconOpacity,
              transform: [{ scale: iconScale }, { translateY: iconY }],
            },
          ]}
        >
          <View style={s.iconInner}>
            <Image
              source={require("../assets/rxscan_icon.png")}
              style={s.icon}
              resizeMode="contain"
            />

            {/* Scanning Laser Sweep */}
            <Animated.View
              style={[
                s.scanLine,
                { opacity: scanLineOp, transform: [{ translateY: scanY }] },
              ]}
            >
              <View style={s.scanLineBar} />
              <View style={s.scanLineGlow} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[s.initWrap, { opacity: initOp }]}>
        <View style={s.initRow}>
          <View style={s.initDot} />
          <Text style={s.initText}>INITIALIZING AI ENGINE</Text>
          <View style={s.initDot} />
        </View>
        <View style={s.initUnderline} />
      </Animated.View>

      {/* Flawlessly Centered Logo Overlay Stack */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.centerOverlay,
          { opacity: logoOpacity, transform: [{ translateY: logoY }] },
        ]}
      >
        <Image
          source={require("../assets/rxscan_dark_fulllogo.png")}
          style={s.logo}
          resizeMode="contain"
        />

        <Animated.Text style={[s.tagline, { opacity: taglineOp }]}>
          SMART PRESCRIPTION READER
        </Animated.Text>
        <Animated.View style={[s.tagSep, { opacity: taglineOp }]} />

        <View style={s.chipsRow}>
          {CHIPS.map(({ Icon, label, color }, i) => {
            const op = [chip1Op, chip2Op, chip3Op][i];
            const y = [chip1Y, chip2Y, chip3Y][i];
            return (
              <Animated.View
                key={i}
                style={[
                  s.chip,
                  {
                    opacity: op,
                    transform: [{ translateY: y }],
                    borderColor: color + "38",
                    backgroundColor: color + "0E",
                  },
                ]}
              >
                <Icon size={13} color={color} />
                <Text style={[s.chipText, { color }]}>{label}</Text>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      <View style={s.progressContainer}>
        <View style={s.progressTrack}>
          {[0.25, 0.5, 0.75].map((pct) => (
            <View
              key={pct}
              style={[s.progressTick, { left: `${pct * 100}%` as any }]}
            />
          ))}
          <Animated.View
            style={[
              s.progressFill,
              { width: progressWidth, backgroundColor: progressColor },
            ]}
          >
            <View style={s.progressGlow} />
          </Animated.View>
        </View>
        <Animated.Text style={[s.progressPct, { opacity: initOp }]}>
          SYS BOOT
        </Animated.Text>
      </View>

      <Animated.View style={[s.versionRow, { opacity: logoOpacity }]}>
        <Text style={s.versionText}>v1.0.0</Text>
        <View style={s.versionDot} />
        <Text style={s.versionText}>BUILD 2026</Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[s.vignette, { opacity: vigOpacity }]}
      />
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    overflow: "hidden",
  },

  // Perfectly centers internal stacks using full width/height anchoring
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  // ── Sonar rings ──
  ring: {
    position: "absolute",
    borderStyle: "solid",
  },

  // ── Glow ──
  glowBloom: {
    position: "absolute",
    width: ICON_SIZE * 2.8,
    height: ICON_SIZE * 2.8,
    borderRadius: ICON_SIZE * 1.4,
    backgroundColor: CYAN,
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 70,
    elevation: 0,
  },

  // ── Icon ──
  iconWrap: {
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 32,
    elevation: 20,
    backgroundColor: "transparent",
    borderRadius: ICON_SIZE * 0.22, // FIX: Rounds the shadow to match the image, removing the black square
  },
  iconInner: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    position: "relative",
    borderRadius: ICON_SIZE * 0.22,
  },
  icon: {
    width: "100%",
    height: "100%",
    borderRadius: ICON_SIZE * 0.22,
  },

  // ── Scan line ──
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: ICON_SIZE * 0.08,
  },
  scanLineBar: {
    position: "absolute",
    left: -6,
    right: -6,
    height: 2,
    backgroundColor: CYAN,
    opacity: 0.96,
    borderRadius: 1,
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  scanLineGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 2,
    height: 20,
    backgroundColor: CYAN,
    opacity: 0.15,
    borderRadius: 4,
  },

  // ── INITIALIZING ──
  initWrap: {
    position: "absolute",
    bottom: H * 0.22,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 6,
  },
  initRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  initDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: TEAL,
    opacity: 0.7,
  },
  initText: {
    fontSize: 9,
    color: TEAL,
    letterSpacing: 3.8,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  initUnderline: {
    width: 120,
    height: 1,
    backgroundColor: TEAL,
    opacity: 0.18,
    borderRadius: 1,
  },

  // ── Logo lockup ──
  logo: { width: LOGO_W, height: LOGO_H },
  tagline: {
    fontSize: 8.5,
    color: GRAY,
    fontWeight: "600",
    fontFamily: "monospace",
    marginTop: 10,
    letterSpacing: 3.8,
  },
  tagSep: {
    width: W * 0.55,
    height: 1,
    backgroundColor: TEAL,
    opacity: 0.14,
    borderRadius: 1,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: "monospace",
  },

  // ── Progress ──
  progressContainer: {
    position: "absolute",
    bottom: 52,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  progressTrack: {
    width: W * 0.7,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 1,
    position: "relative",
    overflow: "hidden",
  },
  progressTick: {
    position: "absolute",
    top: -2,
    width: 1,
    height: 6,
    backgroundColor: OCEAN,
    opacity: 0.35,
  },
  progressFill: { height: "100%", borderRadius: 1 },
  progressGlow: {
    position: "absolute",
    right: -1,
    top: -4,
    width: 7,
    height: 10,
    borderRadius: 4,
    backgroundColor: WHITE,
    opacity: 0.65,
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  progressPct: {
    position: "absolute",
    bottom: -16,
    left: "50%",
    marginLeft: -(W * 0.35),
    fontSize: 7.5,
    color: TEAL,
    letterSpacing: 2.5,
    fontFamily: "monospace",
    opacity: 0.55,
  },

  // ── Version ──
  versionRow: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  versionDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: GRAY,
    opacity: 0.5,
  },
  versionText: {
    fontSize: 9,
    color: "rgba(255,255,255,0.20)",
    letterSpacing: 1.8,
    fontFamily: "monospace",
  },

  // ── Vignette ──
  vignette: { ...StyleSheet.absoluteFillObject, backgroundColor: BG },
});