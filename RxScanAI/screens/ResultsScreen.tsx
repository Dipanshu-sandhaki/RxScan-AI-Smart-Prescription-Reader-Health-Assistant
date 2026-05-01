import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

const MOCK_MEDICINES = [
  {
    id: '1', num: '01', name: 'Amoxicillin', generic: 'Penicillin Antibiotic',
    dosage: '500mg', frequency: '2× daily', duration: '7 days',
    instructions: 'After meals', cost: 85, confidence: 96,
    timing: ['morning', 'night'],
  },
  {
    id: '2', num: '02', name: 'Paracetamol', generic: 'Analgesic / Antipyretic',
    dosage: '650mg', frequency: '3× daily', duration: '5 days',
    instructions: 'With water', cost: 42, confidence: 98,
    timing: ['morning', 'afternoon', 'night'],
  },
  {
    id: '3', num: '03', name: 'Vitamin D3', generic: 'Supplement · Cholecalciferol',
    dosage: '1000 IU', frequency: 'Once daily', duration: '30 days',
    instructions: 'Morning only', cost: 121, confidence: 91,
    timing: ['morning'],
  },
];

export default function ResultsScreen({ route, navigation }: any) {
  // ✅ NEW: real API data
  const data = route?.params?.data;

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // ✅ FIX: use API data or fallback
  const medicines = data?.medicines?.length
    ? data.medicines
    : MOCK_MEDICINES;

  // ✅ FIX: safe cost calculation
  const totalCost = medicines.reduce(
    (s: number, m: any) => s + (m.estimated_total_cost ?? m.cost ?? 0),
    0
  );

  return (
    <LinearGradient colors={['#071828', '#040E18']} style={styles.container}>

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.successRow}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={styles.successText}>Prescription Read Successfully</Text>
        </View>

        {/* ✅ FIX: doctor name */}
        <Text style={styles.docTitle}>
          {data?.doctor_info?.name || "Dr. Prescription"}
        </Text>

        <Text style={styles.docSub}>
          Today · {medicines.length} medicines · Est. ₹{totalCost}
        </Text>
      </Animated.View>

      {/* ✅ NEW: Warning box */}
      {data?.warnings?.length > 0 && (
        <View style={{
          marginHorizontal: 20,
          marginTop: 10,
          padding: 10,
          borderRadius: 10,
          backgroundColor: "rgba(255,180,0,0.1)",
          borderWidth: 1,
          borderColor: "rgba(255,180,0,0.3)"
        }}>
          <Text style={{ color: "#FFB800", fontSize: 12 }}>
            ⚠️ {data.warnings[0]}
          </Text>
        </View>
      )}

      {/* Confidence Bar */}
      <Animated.View style={[styles.confBar, { opacity: fadeAnim }]}>
        <Text style={styles.confLabel}>AI Confidence</Text>
        <View style={styles.confTrack}>
          <LinearGradient
            colors={[Colors.primary, Colors.success]}
            style={[
              styles.confFill,
              {
                width: `${Math.round((data?.scan_confidence || 0) * 100)}%`
              }
            ]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.confPct}>
          {Math.round((data?.scan_confidence || 0) * 100)}%
        </Text>
      </Animated.View>

      {/* Medicine List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {medicines.map((med: any, i: number) => (
          <Animated.View
            key={med.id || i}
            style={[
              styles.medCard,
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 40],
                    outputRange: [0, 40 + i * 15],
                  }),
                }],
              },
            ]}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.ocean]}
              style={styles.medAccentBar}
            />

            <View style={styles.medContent}>
              <View style={styles.medTop}>
                <View>
                  <Text style={styles.medNum}>MED · {i + 1}</Text>
                  <Text style={styles.medName}>{med.name}</Text>

                  {/* ✅ FIX */}
                  <Text style={styles.medGeneric}>
                    {med.generic_name || med.generic || '-'}
                  </Text>

                  {/* ✅ NEW confidence */}
                  <Text style={{
                    fontSize: 10,
                    color: (med.confidence || 0) > 0.8 ? "#06FFA5" : "#FFB800"
                  }}>
                    {Math.round((med.confidence || 0) * 100)}% confidence
                  </Text>
                </View>

                <View style={styles.idBadge}>
                  <Text style={styles.idBadgeText}>✓ Identified</Text>
                </View>
              </View>

              {/* ✅ FIXED TAGS */}
              <View style={styles.tagsRow}>
                {[
                  med.dose || med.dosage,
                  med.frequency,
                  med.timing || med.instructions,
                  med.duration
                ].map((t, ti) => (
                  <View key={ti} style={styles.tag}>
                    <Text style={styles.tagText}>{t || '-'}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.medCost}>
                ₹ {med.estimated_total_cost ?? med.cost ?? 0} estimated
              </Text>
            </View>
          </Animated.View>
        ))}

        {/* Total Cost Strip */}
        <LinearGradient
          colors={['rgba(0,237,255,0.08)', 'rgba(0,194,212,0.04)']}
          style={styles.costStrip}
        >
          <View>
            <Text style={styles.costStripLabel}>Total Estimated Cost</Text>
            <Text style={styles.costStripSub}>Based on AI analysis</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.costStripVal}>₹ {totalCost}</Text>
            <Text style={styles.costStripSub}>{medicines.length} medicines</Text>
          </View>
        </LinearGradient>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

// 🔴 STYLES — SAME (unchanged)
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: 20 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  backIcon: { color: Colors.textPrimary, fontSize: 18 },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(6,214,138,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkIcon: { color: Colors.success },
  successText: { color: Colors.success },
  docTitle: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  docSub: { fontSize: 12, color: Colors.textSecondary },

  confBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
  },
  confLabel: { color: Colors.textSecondary },
  confTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 10,
  },
  confFill: { height: 5 },
  confPct: { color: Colors.success },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  medCard: {
    flexDirection: 'row',
    backgroundColor: '#112436',
    borderRadius: 16,
    marginBottom: 10,
  },
  medAccentBar: { width: 3 },
  medContent: { flex: 1, padding: 14 },
  medTop: { flexDirection: 'row', justifyContent: 'space-between' },
  medNum: { color: Colors.primary },
  medName: { color: Colors.textPrimary },
  medGeneric: { color: Colors.textSecondary },

  idBadge: { backgroundColor: 'rgba(6,214,138,0.12)' },
  idBadgeText: { color: Colors.success },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { marginRight: 6 },
  tagText: { color: 'rgba(255,255,255,0.65)' },

  medCost: { color: Colors.accent },

  costStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  costStripLabel: { color: Colors.textSecondary },
  costStripVal: { color: Colors.accent },
  costStripSub: { color: Colors.textSecondary },
});