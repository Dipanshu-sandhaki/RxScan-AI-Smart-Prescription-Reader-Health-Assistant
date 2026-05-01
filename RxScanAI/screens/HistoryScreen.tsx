import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

const HISTORY = [
  { id: '1', doctor: 'Dr. Sharma',    date: 'Today, 9:43 AM',    meds: 3, cost: 248, confidence: 92 },
  { id: '2', doctor: 'Dr. Mehta',     date: 'Yesterday, 3:12 PM', meds: 2, cost: 156, confidence: 88 },
  { id: '3', doctor: 'City Hospital', date: 'Mar 5, 11:00 AM',   meds: 5, cost: 520, confidence: 95 },
  { id: '4', doctor: 'Dr. Reddy',     date: 'Mar 2, 6:30 PM',    meds: 1, cost: 85,  confidence: 99 },
];

export default function HistoryScreen({ navigation }: any) {
  return (
    <LinearGradient colors={['#071828', '#040E18']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prescription History</Text>
        <Text style={styles.sub}>{HISTORY.length} scans saved</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {HISTORY.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => navigation?.navigate('Results')}
          >
            <View style={styles.cardLeft}>
              <View style={styles.rxIcon}>
                <Text style={styles.rxIconText}>Rx</Text>
              </View>
            </View>
            <View style={styles.cardMid}>
              <Text style={styles.cardDoctor}>{item.doctor}</Text>
              <Text style={styles.cardDate}>{item.date}</Text>
              <View style={styles.cardTags}>
                <View style={styles.tag}><Text style={styles.tagText}>{item.meds} medicines</Text></View>
                <View style={styles.tag}><Text style={styles.tagText}>₹ {item.cost}</Text></View>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.confText}>{item.confidence}%</Text>
              <Text style={styles.confLabel}>AI</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 58, paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
  sub:   { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  list:  { paddingHorizontal: 20, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#112436',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardLeft: {},
  rxIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,194,212,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,194,212,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxIconText:  { fontSize: 14, fontWeight: '900', color: Colors.primary },
  cardMid:     { flex: 1 },
  cardDoctor:  { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  cardDate:    { fontSize: 11, color: Colors.textSecondary, marginTop: 2, marginBottom: 6 },
  cardTags:    { flexDirection: 'row', gap: 6 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tagText:   { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  cardRight: { alignItems: 'center', gap: 2 },
  confText:  { fontFamily: 'monospace', fontSize: 14, fontWeight: '700', color: Colors.success },
  confLabel: { fontSize: 9,  color: Colors.textSecondary },
  arrow:     { fontSize: 18, color: Colors.textSecondary, marginTop: 4 },
});
