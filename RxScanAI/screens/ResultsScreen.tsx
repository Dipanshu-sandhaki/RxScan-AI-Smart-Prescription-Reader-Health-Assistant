import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Dimensions, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Colors } from '../constants/colors';
import { downloadPrescriptionPDF } from '../services/ocr.service';

const { width } = Dimensions.get('window');

export default function ResultsScreen({ route, navigation }: any) {
  // ✅ NEW: real API data
  const data = route?.params?.data;
  const [isDownloading, setIsDownloading] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Only show real OCR results
  const medicines = data?.medicines || [];

  if (!data?.medicines?.length) {
    return (
      <LinearGradient colors={['#071828', '#040E18']} style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 16, textAlign: 'center' }}>
            No prescription detected.{'\n'}Please try scanning again.
          </Text>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={{ marginTop: 20 }}>
            <Text style={{ color: Colors.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // ✅ FIX: safe cost calculation
  const totalCost = medicines.reduce(
    (s: number, m: any) => s + (m.estimated_total_cost ?? m.cost ?? 0),
    0
  );

  // ✅ PDF Download Handler - Platform Aware
  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      console.log('📥 Starting PDF download on platform:', Platform.OS);
      
      // Request PDF from backend
      const pdfArrayBuffer = await downloadPrescriptionPDF(data);
      console.log('✅ PDF received from backend:', pdfArrayBuffer.byteLength, 'bytes');
      
      if (Platform.OS === 'web') {
        // Web: Download using blob URL
        console.log('🌐 Using web download method');
        const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `prescription_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('✅ PDF downloaded on web');
      } else {
        // Mobile: Use file system and sharing
        console.log('📱 Using mobile file system method');
        
        // Create base64 string from ArrayBuffer
        const bytes = new Uint8Array(pdfArrayBuffer);
        const binaryString = String.fromCharCode.apply(null, Array.from(bytes) as any);
        const base64String = btoa(binaryString);
        
        // Create filename with date
        const fileName = `prescription_${new Date().toISOString().split('T')[0]}.pdf`;
        const fileUri = FileSystem.documentDirectory + fileName;
        
        console.log('💾 Saving to:', fileUri);
        await FileSystem.writeAsStringAsync(fileUri, base64String, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log('✅ PDF saved to file system');
        
        // Verify file exists
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          throw new Error('File was not saved properly');
        }
        
        // Open share dialog
        console.log('📤 Opening share dialog...');
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Prescription PDF',
          UTI: 'com.adobe.pdf',
        });
        
        console.log('✅ Share dialog completed');
      }
      
      setIsDownloading(false);
      Alert.alert(
        '✅ Success',
        Platform.OS === 'web'
          ? 'Prescription PDF downloaded to your Downloads folder!'
          : 'Prescription PDF ready to share!',
        [{ text: 'OK', onPress: () => {} }]
      );
      
    } catch (error) {
      setIsDownloading(false);
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ PDF download error:', errorMsg);
      console.error('Full error details:', error);
      
      Alert.alert(
        '❌ Download Failed',
        `Error: ${errorMsg}\n\nTroubleshooting:\n• Check backend is running\n• Try scanning again\n• Refresh the page`,
        [{ text: 'Retry', onPress: handleDownloadPDF }, { text: 'Close', onPress: () => {} }]
      );
    }
  };

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

      {/* ✅ PDF Download Button */}
      <View style={styles.downloadBtnContainer}>
        <TouchableOpacity
          style={[styles.downloadBtn, isDownloading && { opacity: 0.6 }]}
          onPress={handleDownloadPDF}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <ActivityIndicator color={Colors.textPrimary} size="small" />
              <Text style={styles.downloadBtnText}>Generating PDF...</Text>
            </>
          ) : (
            <>
              <Text style={styles.downloadBtnIcon}>📥</Text>
              <Text style={styles.downloadBtnText}>Download as PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

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

  downloadBtnContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  downloadBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadBtnIcon: {
    fontSize: 18,
  },
  downloadBtnText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },

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