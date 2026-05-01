import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, Modal, FlatList,
  StatusBar, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LANGUAGES } from '../constants/languages';
import { scanPrescription } from '../services/ocr.service';

const { width: W, height: H } = Dimensions.get('window');

const C = {
  teal:   '#00C2D4',
  cyan:   '#00EDFF',
  ocean:  '#016096',
  green:  '#06D68A',
  violet: '#A78BFA',
  white:  '#FFFFFF',
  gray:   '#8E9295',
  bg:     '#020C16',
  dark:   'rgba(2,12,22,0.82)',
};

// Scan frame — A4 portrait ratio
const FRAME_W = W - 40;
const FRAME_H = FRAME_W * 1.38;
const FRAME_X = 20;
const FRAME_Y = (H - FRAME_H) / 2 - 24;

type ScanState = 'idle' | 'scanning' | 'analyzing' | 'done';

// ─── Icon Components ──────────────────────────────────────────

function IconFlash({ color, size = 18 }: { color: string; size?: number }) {
  const s = size;
  // Clean ⚡ bolt: two asymmetric triangles forming a Z-shaped strike
  return (
    <View style={{ width: s, height: s }}>
      {/* Upper bolt: wide-left triangle pointing bottom-right */}
      <View style={{
        position: 'absolute', top: 0, left: s * 0.1,
        width: 0, height: 0,
        borderBottomWidth: s * 0.52,
        borderLeftWidth:   s * 0.52,
        borderRightWidth:  s * 0.1,
        borderBottomColor: color,
        borderLeftColor:   'transparent',
        borderRightColor:  'transparent',
      }} />
      {/* Lower bolt: wide-right triangle pointing top-left */}
      <View style={{
        position: 'absolute', bottom: 0, right: s * 0.1,
        width: 0, height: 0,
        borderTopWidth:   s * 0.52,
        borderRightWidth: s * 0.52,
        borderLeftWidth:  s * 0.1,
        borderTopColor:   color,
        borderRightColor: 'transparent',
        borderLeftColor:  'transparent',
      }} />
    </View>
  );
}

function IconFlip({ color, size = 18 }: { color: string; size?: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: s * 0.7, height: s * 0.7,
        borderWidth: s * 0.12, borderColor: color,
        borderRadius: s * 0.7, borderRightColor: 'transparent',
      }} />
      <View style={{
        position: 'absolute', right: s * 0.04, top: s * 0.04,
        width: 0, height: 0,
        borderLeftWidth: s * 0.18, borderLeftColor: color,
        borderTopWidth: s * 0.14, borderTopColor: 'transparent',
        borderBottomWidth: s * 0.14, borderBottomColor: 'transparent',
      }} />
    </View>
  );
}

function IconGallery({ color, size = 20 }: { color: string; size?: number }) {
  const s = size;
  const gap = s * 0.08;
  const cell = (s - gap * 3) / 2;
  return (
    <View style={{ width: s, height: s, flexDirection: 'row', flexWrap: 'wrap', gap: gap, padding: gap }}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={{
          width: cell, height: cell,
          backgroundColor: color, borderRadius: s * 0.06,
          opacity: i === 0 ? 1 : i === 1 ? 0.65 : 0.4,
        }} />
      ))}
    </View>
  );
}

function IconClose({ color, size = 18 }: { color: string; size?: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: s * 0.85, height: s * 0.13,
        backgroundColor: color, borderRadius: 2,
        transform: [{ rotate: '45deg' }],
      }} />
      <View style={{
        position: 'absolute', width: s * 0.85, height: s * 0.13,
        backgroundColor: color, borderRadius: 2,
        transform: [{ rotate: '-45deg' }],
      }} />
    </View>
  );
}

function IconChevron({ color, size = 12 }: { color: string; size?: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: s * 0.5, height: s * 0.5,
        borderRightWidth: s * 0.15, borderTopWidth: s * 0.15,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
        marginLeft: -s * 0.15,
      }} />
    </View>
  );
}

// ─── Permission Screen ─────────────────────────────────────────
function PermissionScreen({ onRequest }: { onRequest: () => void }) {
  return (
    <View style={perm.root}>
      <LinearGradient colors={['#020C16', '#04182A', '#020C16']} style={StyleSheet.absoluteFill} />
      <View style={perm.iconWrap}>
        <LinearGradient colors={[C.teal, C.ocean]} style={perm.iconCircle}>
          <View style={perm.lensOuter}>
            <View style={perm.lensInner} />
          </View>
        </LinearGradient>
      </View>
      <Text style={perm.title}>Camera Permission{'\n'}Required</Text>
      <Text style={perm.body}>
        RxScan AI needs camera access to read and analyse prescriptions.{'\n'}
        Photos are processed on-device and never stored.
      </Text>
      <TouchableOpacity onPress={onRequest} activeOpacity={0.88}>
        <LinearGradient colors={[C.teal, C.ocean]} style={perm.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={perm.btnTxt}>Allow Camera</Text>
        </LinearGradient>
      </TouchableOpacity>
      <View style={perm.privRow}>
        <View style={perm.lockDot} />
        <Text style={perm.privTxt}>100% private · On-device only · Never uploaded</Text>
      </View>
    </View>
  );
}

const perm = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  iconWrap: { marginBottom: 32 },
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.teal, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45, shadowRadius: 22, elevation: 12,
  },
  lensOuter: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center', justifyContent: 'center',
  },
  lensInner: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.9)' },
  title: { fontSize: 28, fontWeight: '900', color: C.white, textAlign: 'center', letterSpacing: -0.5, lineHeight: 34, marginBottom: 16 },
  body: { fontSize: 14, color: C.gray, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  btn: {
    borderRadius: 16, paddingVertical: 17, paddingHorizontal: 48,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  btnTxt: { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  privRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: 'rgba(0,194,212,0.08)', borderWidth: 1, borderColor: 'rgba(0,194,212,0.2)',
  },
  lockDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.teal },
  privTxt: { fontSize: 11, color: C.teal, fontWeight: '600' },
});

// ─── Corner Bracket ──────────────────────────────────────────────
function Bracket({ pos, color }: {
  pos: { top?: number; bottom?: number; left?: number; right?: number };
  color: string;
}) {
  const isRight  = pos.right  !== undefined;
  const isBottom = pos.bottom !== undefined;
  const LEN = 32;
  const THK = 3;
  return (
    <View style={[{ position: 'absolute', width: LEN, height: LEN }, pos]}>
      <View style={{
        position: 'absolute',
        [isBottom ? 'bottom' : 'top']: 0,
        [isRight  ? 'right'  : 'left']: 0,
        width: LEN, height: THK,
        backgroundColor: color, borderRadius: THK,
      }} />
      <View style={{
        position: 'absolute',
        [isBottom ? 'bottom' : 'top']: 0,
        [isRight  ? 'right'  : 'left']: 0,
        width: THK, height: LEN,
        backgroundColor: color, borderRadius: THK,
      }} />
    </View>
  );
}

// ─── Analyzing Overlay ───────────────────────────────────────────
function AnalyzingOverlay({ pulseAnim }: { pulseAnim: Animated.Value }) {
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseAnim }]}>
      {[0.25, 0.5, 0.75].map(x => (
        <View key={`v${x}`} style={[s.gridV, { left: `${x * 100}%` }]} />
      ))}
      {[0.2, 0.4, 0.6, 0.8].map(y => (
        <View key={`h${y}`} style={[s.gridH, { top: `${y * 100}%` }]} />
      ))}
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function ScanScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState]       = useState<ScanState>('idle');
  const [facing, setFacing]             = useState<CameraType>('back');
  const [flashOn, setFlashOn]           = useState(false);
  const [langModal, setLangModal]       = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);

  const cameraRef   = useRef<CameraView>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isMounted   = useRef(true);

  const beamAnim     = useRef(new Animated.Value(0)).current;
  const bracketGlow  = useRef(new Animated.Value(0.55)).current;
  const btnScale     = useRef(new Animated.Value(1)).current;
  const flashOp      = useRef(new Animated.Value(0)).current;
  const pulseAnim    = useRef(new Animated.Value(0.2)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Cleanup on unmount — prevents setState on unmounted component
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  // Beam loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beamAnim, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(beamAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Bracket pulse
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bracketGlow, { toValue: 1,   duration: 1200, useNativeDriver: true }),
        Animated.timing(bracketGlow, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Idle button pulse — stops cleanly on state change
  useEffect(() => {
    if (scanState !== 'idle') {
      btnScale.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(btnScale, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(btnScale, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanState]);

  // Analyzing grid pulse
  useEffect(() => {
    if (scanState !== 'analyzing') {
      pulseAnim.setValue(0.2);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.55, duration: 650, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.1,  duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanState]);

  // Progress bar driven by scan state
  useEffect(() => {
    if (scanState === 'scanning') {
      Animated.timing(progressAnim, { toValue: 0.6,  duration: 1800, useNativeDriver: false }).start();
    } else if (scanState === 'analyzing') {
      Animated.timing(progressAnim, { toValue: 0.95, duration: 1600, useNativeDriver: false }).start();
    } else if (scanState === 'done') {
      Animated.timing(progressAnim, { toValue: 1,    duration: 280,  useNativeDriver: false }).start();
    } else {
      progressAnim.setValue(0);
    }
  }, [scanState]);

  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => { if (isMounted.current) fn(); }, ms);
    timeoutRefs.current.push(id);
    return id;
  }, []);

  const beamY = beamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_H - 3],
  });

  const stateConfig: Record<ScanState, { color: string; label: string; sublabel: string }> = {
    idle:      { color: C.teal,   label: 'Ready to Scan',          sublabel: 'Place prescription within frame' },
    scanning:  { color: C.cyan,   label: 'Scanning…',               sublabel: 'Hold device steady'              },
    analyzing: { color: C.violet, label: 'AI Reading…',             sublabel: 'Extracting medication details'   },
    done:      { color: C.green,  label: 'Complete!',               sublabel: 'Opening results…'                },
  };
  const sc = stateConfig[scanState];

  const handleCapture = async () => {
  if (scanState !== "idle") return;

  setScanState("scanning");

  Animated.sequence([
    Animated.timing(flashOp, {
      toValue: 0.6,
      duration: 60,
      useNativeDriver: true,
    }),
    Animated.timing(flashOp, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }),
  ]).start();

  try {
    let photo;

    if (cameraRef.current) {
      photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: true,
      });
    }

    // ✅ API CALL
    if (photo?.uri) {
      const result = await scanPrescription(photo.uri, true);

      console.log("🔥 API RESULT:", result);

      setScanState("done");

      safeTimeout(() => {
        navigation?.navigate("Results", {
          data: result, // ✅ REAL DATA
        });
      }, 600);

      return; // 🚨 VERY IMPORTANT (stop further execution)
    }

  } catch (err) {
    console.log("❌ API ERROR:", err);
    setScanState("idle");
    return;
  }

  // ❌ FALLBACK (only if photo fail / no uri)
  setScanState("analyzing");

  safeTimeout(() => {
    setScanState("done");

    safeTimeout(() => {
      navigation?.navigate("Results", { mockScan: true });
    }, 600);

  }, 2000);
};

  // Reset to idle (also used as cancel during scan)
  const handleReset = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
    setScanState('idle');
    progressAnim.setValue(0);
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  if (!permission.granted) return <PermissionScreen onRequest={requestPermission} />;

  const bracketColor =
    scanState === 'analyzing' ? C.violet :
    scanState === 'done'      ? C.green  : C.cyan;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Full screen camera ── */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flashOn ? 'on' : 'off'}
      />

      {/* ── Dark masks outside scan frame ── */}
      <View style={[s.mask, { top: 0, left: 0, right: 0, height: FRAME_Y }]} />
      <View style={[s.mask, { top: FRAME_Y + FRAME_H, left: 0, right: 0, bottom: 0 }]} />
      <View style={[s.mask, { top: FRAME_Y, left: 0, width: FRAME_X, height: FRAME_H }]} />
      <View style={[s.mask, { top: FRAME_Y, right: 0, width: FRAME_X, height: FRAME_H }]} />

      {/* ── Scan frame ── */}
      <View
        style={[s.frameZone, { top: FRAME_Y, left: FRAME_X, width: FRAME_W, height: FRAME_H }]}
        pointerEvents="none"
      >
        {/* Corner brackets */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: bracketGlow }]}>
          <Bracket pos={{ top: 0,    left: 0  }} color={bracketColor} />
          <Bracket pos={{ top: 0,    right: 0 }} color={bracketColor} />
          <Bracket pos={{ bottom: 0, left: 0  }} color={bracketColor} />
          <Bracket pos={{ bottom: 0, right: 0 }} color={bracketColor} />
        </Animated.View>

        {/* Scan beam */}
        {(scanState === 'idle' || scanState === 'scanning') && (
          <Animated.View style={[s.beam, { transform: [{ translateY: beamY }] }]} pointerEvents="none">
            <LinearGradient
              colors={['transparent', bracketColor + 'BB', bracketColor + 'FF', bracketColor + 'BB', 'transparent']}
              style={{ flex: 1, height: 2 }}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <View style={[s.beamGlow, { backgroundColor: bracketColor }]} />
          </Animated.View>
        )}

        {/* Analyzing grid */}
        {scanState === 'analyzing' && <AnalyzingOverlay pulseAnim={pulseAnim} />}

        {/* Done — subtle green tint */}
        {scanState === 'done' && (
          <LinearGradient
            colors={['transparent', C.green + '15', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          />
        )}
      </View>

      {/* ── Progress bar ── */}
      {scanState !== 'idle' && (
        <View style={[s.progressTrack, { top: FRAME_Y - 8 }]}>
          <Animated.View style={[s.progressFill, { width: progressWidth, backgroundColor: bracketColor }]} />
        </View>
      )}

      {/* ── Top bar ── */}
      <View style={[s.topBar, { top: insets.top + 6 }]}>
        <TouchableOpacity
          style={s.topBtn}
          onPress={scanState !== 'idle' ? handleReset : () => navigation?.goBack?.()}
          activeOpacity={0.8}
        >
          <IconClose color={C.white} size={15} />
        </TouchableOpacity>

        <View style={s.topCenter}>
          <View style={[s.statusDot, { backgroundColor: sc.color }]} />
          <Text style={s.topTitle}>Scan Prescription</Text>
        </View>

        {/* Language selector — inline in topBar */}
        <TouchableOpacity
          style={s.topLangBtn}
          onPress={() => setLangModal(true)}
          activeOpacity={0.85}
        >
          <Text style={s.langFlag}>{selectedLang.flag}</Text>
          <Text style={s.langName}>{selectedLang.name}</Text>
          <IconChevron color="rgba(255,255,255,0.4)" size={9} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.topBtn, flashOn && s.topBtnFlash]}
          onPress={() => setFlashOn(f => !f)}
          activeOpacity={0.8}
        >
          <IconFlash color={flashOn ? C.cyan : 'rgba(255,255,255,0.65)'} size={15} />
        </TouchableOpacity>
      </View>

      {/* ── Bottom controls ── */}
      <View style={s.bottomBar}>
        <TouchableOpacity style={s.sideBtn} activeOpacity={0.8}>
          <View style={s.sideBtnInner}>
            <IconGallery color="rgba(255,255,255,0.7)" size={21} />
          </View>
          <Text style={s.sideBtnLabel}>Gallery</Text>
        </TouchableOpacity>

        {/* Shutter button */}
        <View style={s.shutterWrap}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              onPress={handleCapture}
              activeOpacity={0.85}
              disabled={scanState !== 'idle'}
            >
              <View style={[s.shutterRing, {
                borderColor:
                  scanState === 'idle'      ? `${C.cyan}60`   :
                  scanState === 'scanning'  ? `${C.cyan}AA`   :
                  scanState === 'analyzing' ? `${C.violet}90` :
                  `${C.green}AA`,
              }]}>
                <LinearGradient
                  colors={
                    scanState === 'idle'      ? [C.teal,   '#005580']  :
                    scanState === 'scanning'  ? [C.cyan,   C.ocean]    :
                    scanState === 'analyzing' ? [C.violet, '#5B21B6']  :
                    [C.green, '#047857']
                  }
                  style={s.shutterInner}
                  start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
                >
                  {scanState === 'idle' && (
                    <View style={s.lensOuter}><View style={s.lensInner} /></View>
                  )}
                  {scanState === 'scanning' && (
                    <View style={s.scanLines}>
                      {[0, 1, 2, 3].map(i => (
                        <View key={i} style={[s.scanLine, { opacity: 0.5 + i * 0.15 }]} />
                      ))}
                    </View>
                  )}
                  {scanState === 'analyzing' && (
                    <View style={s.brainDot}><View style={s.brainInner} /></View>
                  )}
                  {scanState === 'done' && (
                    <View style={s.checkWrap}>
                      <View style={s.checkL} />
                      <View style={s.checkR} />
                    </View>
                  )}
                </LinearGradient>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <TouchableOpacity
          style={s.sideBtn}
          onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}
          activeOpacity={0.8}
        >
          <View style={s.sideBtnInner}>
            <IconFlip color="rgba(255,255,255,0.7)" size={20} />
          </View>
          <Text style={s.sideBtnLabel}>Flip</Text>
        </TouchableOpacity>
      </View>

      {/* White flash */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'white', opacity: flashOp }]}
        pointerEvents="none"
      />

      {/* ── Language Modal ── */}
      <Modal visible={langModal} transparent animationType="slide">
        <Pressable style={m.backdrop} onPress={() => setLangModal(false)}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>Output Language</Text>
            <Text style={m.sub}>Results and voice output will be in this language</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={l => l.code}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: H * 0.5 }}
              renderItem={({ item }) => {
                const active = item.code === selectedLang.code;
                return (
                  <TouchableOpacity
                    style={[m.chip, active && m.chipActive]}
                    onPress={() => { setSelectedLang(item); setLangModal(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={m.chipFlag}>{item.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[m.chipName, active && { color: C.teal }]}>{item.name}</Text>
                      <Text style={m.chipNative}>{item.native}</Text>
                    </View>
                    {active && (
                      <View style={m.activeTick}>
                        <View style={m.tickL} />
                        <View style={m.tickR} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  mask: { position: 'absolute', backgroundColor: C.dark },
  frameZone: { position: 'absolute', overflow: 'hidden' },

  beam: { position: 'absolute', left: 0, right: 0, height: 2 },
  beamGlow: {
    position: 'absolute', left: '8%', right: '8%',
    top: 1, height: 10, opacity: 0.2, borderRadius: 5,
  },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(167,139,250,0.12)' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(167,139,250,0.12)' },

  progressTrack: {
    position: 'absolute', left: FRAME_X, width: FRAME_W,
    height: 2, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 1, overflow: 'hidden',
  },
  progressFill: { height: 2, borderRadius: 1 },

  topBar: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, gap: 12,
  },
  topBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  topBtnFlash: {
    backgroundColor: 'rgba(0,237,255,0.14)',
    borderColor: 'rgba(0,237,255,0.4)',
  },
  topCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  topTitle:  { fontSize: 15, fontWeight: '800', color: C.white, letterSpacing: 0.2 },

  // Language selector — now lives inside the topBar row
  topLangBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 42, paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 13,
  },
  langFlag: { fontSize: 13 },
  langName: { fontSize: 11, color: C.white, fontWeight: '600' },

  bottomBar: {
    position: 'absolute', bottom: 38, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 44,
  },
  sideBtn: { alignItems: 'center', gap: 6 },
  sideBtnInner: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  sideBtnLabel: { fontSize: 10, color: C.gray, fontWeight: '500', letterSpacing: 0.4 },

  shutterWrap:  { alignItems: 'center' },
  shutterRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, padding: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  lensOuter: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  lensInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.85)' },

  scanLines: { gap: 4, alignItems: 'center' },
  scanLine:  { width: 28, height: 2.5, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 2 },

  brainDot: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  brainInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.9)' },

  checkWrap: { alignItems: 'center', justifyContent: 'center', width: 32, height: 32 },
  checkL: {
    position: 'absolute', width: 10, height: 3,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 2,
    transform: [{ rotate: '45deg' }, { translateX: -5 }, { translateY: 3 }],
  },
  checkR: {
    position: 'absolute', width: 18, height: 3,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 2,
    transform: [{ rotate: '-50deg' }, { translateX: 3 }],
  },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#071828',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 44,
    borderTopWidth: 1, borderColor: 'rgba(0,194,212,0.18)',
  },
  handle: {
    width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  title:  { fontSize: 20, fontWeight: '900', color: C.white, letterSpacing: -0.3 },
  sub:    { fontSize: 12, color: C.gray, marginTop: 4, marginBottom: 20 },
  chip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 4, padding: 12, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  chipActive: { backgroundColor: 'rgba(0,194,212,0.1)', borderColor: 'rgba(0,194,212,0.35)' },
  chipFlag:   { fontSize: 18 },
  chipName:   { fontSize: 13, fontWeight: '700', color: C.white },
  chipNative: { fontSize: 10, color: C.gray, marginTop: 1 },
  activeTick: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  tickL: {
    position: 'absolute', width: 6, height: 2.5,
    backgroundColor: C.teal, borderRadius: 1,
    transform: [{ rotate: '45deg' }, { translateX: -2 }, { translateY: 1 }],
  },
  tickR: {
    position: 'absolute', width: 11, height: 2.5,
    backgroundColor: C.teal, borderRadius: 1,
    transform: [{ rotate: '-50deg' }, { translateX: 1 }],
  },
});