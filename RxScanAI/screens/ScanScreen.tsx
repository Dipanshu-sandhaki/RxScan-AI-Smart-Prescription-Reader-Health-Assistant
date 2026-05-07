/**
 * RxScan AI — Scan Screen
 * High-end Camera & Gallery Scanner with Cinematic Processing UI
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, StatusBar, Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

// Import your existing API service
import { scanPrescription } from '../services/ocr.service';

const { width: W, height: H } = Dimensions.get('window');

// ─── Premium Brand Tokens ─────────────────────────────────────────
const C = {
  bg:      '#03101F',
  surface: '#071828',
  teal:    '#00C2D4',
  cyan:    '#00EDFF',
  ocean:   '#016096',
  green:   '#06D68A',
  white:   '#FFFFFF',
  gray:    '#8E9295',
  dark:    'rgba(2, 12, 22, 0.85)',
  glass:   'rgba(255, 255, 255, 0.1)',
};

// Scan frame — A4 portrait ratio
const FRAME_W = W - 48;
const FRAME_H = FRAME_W * 1.35;
const FRAME_X = 24;
const FRAME_Y = (H - FRAME_H) / 2 - 40;

type ScanState = 'idle' | 'scanning' | 'analyzing' | 'done';

// ─── Professional SVG Icons ────────────────────────────────────────
const IconFlash = ({ on }: { on: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill={on ? C.cyan : "none"}>
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={on ? C.cyan : C.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconFlip = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" stroke={C.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconGallery = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke={C.white} strokeWidth="2" />
    <Circle cx="8.5" cy="8.5" r="1.5" fill={C.white} />
    <Path d="M21 15l-5-5L5 21" stroke={C.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconClose = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={C.white} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="6" y1="6" x2="18" y2="18" stroke={C.white} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const IconAI = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2a10 10 0 1 0 10 10H12V2z" fill={C.teal} opacity="0.8" />
    <Path d="M12 2a10 10 0 0 1 10 10H12V2z" fill={C.cyan} />
    <Circle cx="12" cy="12" r="3" fill={C.bg} />
  </Svg>
);


// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function ScanScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  
  // State
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashOn, setFlashOn] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("Initializing AI...");

  const cameraRef = useRef<CameraView>(null);
  
  // Animations
  const beamAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  // 1. Reset state when coming back to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setScanState('idle');
      setSelectedImage(null);
      fadeAnim.setValue(0);
    });
    return unsubscribe;
  }, [navigation]);

  // 2. Laser Beam Animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beamAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(beamAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // 3. AI Processing Pulse & Dynamic Text (Triggers when analyzing)
  useEffect(() => {
    if (scanState === 'analyzing') {
      // Fade in the dark processing overlay
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

      // Pulsating logo
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();

      // Cycling Loading Text to keep user interested
      const texts = [
        "Scanning Document...", 
        "Extracting Text...", 
        "Identifying Medications...", 
        "Calculating Dosages...", 
        "Finalizing Results..."
      ];
      let i = 0;
      const textInterval = setInterval(() => {
        i = (i + 1) % texts.length;
        setLoadingText(texts[i]);
      }, 1500);

      return () => {
        pulseLoop.stop();
        clearInterval(textInterval);
      };
    }
  }, [scanState]);


  // ─── Actions ───

  const handleCapture = async () => {
    if (scanState !== "idle") return;
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
        if (photo?.uri) processImage(photo.uri);
      }
    } catch (err) {
      Alert.alert("Camera Error", "Failed to capture image.");
    }
  };

  const handleGallery = async () => {
    if (scanState !== 'idle') return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        processImage(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert("Gallery Error", "Failed to load image.");
    }
  };

  const processImage = async (uri: string) => {
    setSelectedImage(uri);
    setScanState("analyzing"); // Triggers the cinematic loading UI

    try {
      const result = await scanPrescription(uri, false);
      setScanState("done");
      
      // Short delay for smoothness before navigating
      setTimeout(() => {
        navigation?.navigate("Results", { data: result });
      }, 600);

    } catch (error: any) {
      setScanState("idle");
      setSelectedImage(null);
      fadeAnim.setValue(0);
      Alert.alert("Analysis Failed", error.message || "Could not process this prescription. Please try again with a clearer image.");
    }
  };


  // ─── Render Checks ───
  if (!permission) return <View style={s.root} />;
  if (!permission.granted) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center', padding: 30 }]}>
        <Text style={{ color: C.white, fontSize: 20, textAlign: 'center', marginBottom: 20 }}>
          Camera access is required to scan prescriptions.
        </Text>
        <TouchableOpacity style={s.allowBtn} onPress={requestPermission}>
          <Text style={s.allowBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const beamY = beamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_H - 4],
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Background: Live Camera OR Frozen Selected Image ── */}
      {selectedImage ? (
        <Image source={{ uri: selectedImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flashOn ? 'on' : 'off'}
        />
      )}

      {/* ── Dark Masks outside Viewfinder ── */}
      <View style={[s.mask, { top: 0, left: 0, right: 0, height: FRAME_Y }]} />
      <View style={[s.mask, { top: FRAME_Y + FRAME_H, left: 0, right: 0, bottom: 0 }]} />
      <View style={[s.mask, { top: FRAME_Y, left: 0, width: FRAME_X, height: FRAME_H }]} />
      <View style={[s.mask, { top: FRAME_Y, right: 0, width: FRAME_X, height: FRAME_H }]} />

      {/* ── Viewfinder Frame ── */}
      <View style={[s.frameZone, { top: FRAME_Y, left: FRAME_X, width: FRAME_W, height: FRAME_H }]} pointerEvents="none">
        
        {/* Corner Brackets */}
        <View style={s.cornerTL} />
        <View style={s.cornerTR} />
        <View style={s.cornerBL} />
        <View style={s.cornerBR} />

        {/* Scanning Laser Beam (Only active when idle/camera active) */}
        {!selectedImage && (
          <Animated.View style={[s.laserBeam, { transform: [{ translateY: beamY }] }]}>
            <LinearGradient
              colors={['transparent', C.cyan, 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.laserLine}
            />
            <View style={s.laserGlow} />
          </Animated.View>
        )}
      </View>

      {/* ── Cinematic AI Processing Overlay ── */}
      <Animated.View style={[StyleSheet.absoluteFill, s.processingOverlay, { opacity: fadeAnim }]} pointerEvents="none">
        <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center' }}>
          <View style={s.aiGlowRing}>
            <IconAI />
          </View>
        </Animated.View>
        <Text style={s.processingTitle}>AI Engine Active</Text>
        <Text style={s.processingSubtitle}>{loadingText}</Text>
      </Animated.View>

      {/* ── Top Navigation Bar ── */}
      <View style={[s.topBar, { top: insets.top + 10 }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation?.goBack()} disabled={scanState !== 'idle'}>
          <IconClose />
        </TouchableOpacity>

        <Text style={s.headerTitle}>Scan Prescription</Text>

        <TouchableOpacity style={[s.iconBtn, flashOn && s.iconBtnActive]} onPress={() => setFlashOn(!flashOn)} disabled={scanState !== 'idle'}>
          <IconFlash on={flashOn} />
        </TouchableOpacity>
      </View>

      {/* ── Bottom Controls ── */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 30 }]}>
        
        {/* Gallery Button */}
        <TouchableOpacity style={s.sideAction} onPress={handleGallery} disabled={scanState !== 'idle'}>
          <View style={s.sideIconWrap}><IconGallery /></View>
          <Text style={s.sideActionText}>Gallery</Text>
        </TouchableOpacity>

        {/* Shutter Button */}
        <TouchableOpacity onPress={handleCapture} disabled={scanState !== 'idle'} activeOpacity={0.8}>
          <View style={s.shutterOuter}>
            <View style={s.shutterInner} />
          </View>
        </TouchableOpacity>

        {/* Flip Camera Button */}
        <TouchableOpacity style={s.sideAction} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} disabled={scanState !== 'idle'}>
          <View style={s.sideIconWrap}><IconFlip /></View>
          <Text style={s.sideActionText}>Flip</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  
  // Masks & Frames
  mask: { position: 'absolute', backgroundColor: C.dark },
  frameZone: { position: 'absolute' },
  
  // Corner Brackets (Thinner, sharper, professional)
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderColor: C.cyan, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 30, height: 30, borderColor: C.cyan, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, borderColor: C.cyan, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderColor: C.cyan, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },

  // Laser
  laserBeam: { position: 'absolute', left: 0, right: 0, height: 4, justifyContent: 'center' },
  laserLine: { height: 2, width: '100%' },
  laserGlow: { position: 'absolute', alignSelf: 'center', width: '60%', height: 12, backgroundColor: C.cyan, opacity: 0.3, borderRadius: 10, shadowColor: C.cyan, shadowRadius: 10, shadowOpacity: 1 },

  // Cinematic Processing Overlay
  processingOverlay: {
    backgroundColor: 'rgba(2, 12, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  aiGlowRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(0, 237, 255, 0.15)',
    borderWidth: 1, borderColor: 'rgba(0, 237, 255, 0.4)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: C.cyan, shadowRadius: 30, shadowOpacity: 0.6,
  },
  processingTitle: { color: C.white, fontSize: 20, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  processingSubtitle: { color: C.teal, fontSize: 14, fontWeight: '500', letterSpacing: 1 },

  // Top Bar
  topBar: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, zIndex: 10,
  },
  headerTitle: { color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.glass,
    justifyContent: 'center', alignItems: 'center',
  },
  iconBtnActive: { backgroundColor: 'rgba(0, 237, 255, 0.2)', borderWidth: 1, borderColor: C.cyan },

  // Bottom Controls
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingHorizontal: 30, zIndex: 10,
  },
  sideAction: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  sideIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.glass,
    justifyContent: 'center', alignItems: 'center',
  },
  sideActionText: { color: C.white, fontSize: 12, fontWeight: '600' },

  // Shutter
  shutterOuter: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: C.white,
    justifyContent: 'center', alignItems: 'center',
  },
  shutterInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.white,
  },

  // Permissions
  allowBtn: { backgroundColor: C.teal, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  allowBtnText: { color: C.bg, fontSize: 16, fontWeight: '700' },
});