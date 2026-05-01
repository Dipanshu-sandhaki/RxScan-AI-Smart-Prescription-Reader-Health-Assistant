import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

const DAYS = [
  { day: 'MON', num: '13' }, { day: 'TUE', num: '14' },
  { day: 'WED', num: '15', active: true },
  { day: 'THU', num: '16' }, { day: 'FRI', num: '17' },
  { day: 'SAT', num: '18' }, { day: 'SUN', num: '19' },
];

const TIMELINE = [
  {
    id: 'morning', label: 'Morning', time: '7:00 AM', icon: '🌅',
    iconBg: 'rgba(255,200,50,0.1)', iconBorder: 'rgba(255,200,50,0.25)',
    medicines: [
      { name: 'Amoxicillin', dose: '500mg', taken: true },
      { name: 'Vitamin D3',  dose: '1000 IU', taken: true },
    ],
  },
  {
    id: 'afternoon', label: 'Afternoon', time: '1:00 PM', icon: '☀️',
    iconBg: 'rgba(0,194,212,0.1)', iconBorder: 'rgba(0,194,212,0.25)',
    medicines: [
      { name: 'Paracetamol', dose: '650mg', taken: false },
    ],
  },
  {
    id: 'night', label: 'Night', time: '9:00 PM', icon: '🌙',
    iconBg: 'rgba(130,80,255,0.1)', iconBorder: 'rgba(130,80,255,0.25)',
    medicines: [
      { name: 'Amoxicillin',  dose: '500mg', taken: false },
      { name: 'Paracetamol', dose: '650mg', taken: false },
    ],
  },
];

export default function ScheduleScreen() {
  const [notifs, setNotifs] = useState(true);
  const [takenMap, setTakenMap] = useState<Record<string, boolean>>({});

  const toggleTaken = (key: string) => {
    setTakenMap((p) => ({ ...p, [key]: !p[key] }));
  };

  return (
    <LinearGradient colors={['#071828', '#040E18']} style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dose Schedule</Text>
        <Text style={styles.sub}>Dr. Sharma · 7-day course</Text>
      </View>

      {/* Date Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateStrip}
      >
        {DAYS.map((d) => (
          <TouchableOpacity key={d.num} activeOpacity={0.8}>
            {d.active ? (
              <LinearGradient
                colors={[Colors.primary, Colors.ocean]}
                style={styles.dateChip}
              >
                <Text style={styles.dateDayActive}>{d.day}</Text>
                <Text style={styles.dateNumActive}>{d.num}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.dateChip, styles.dateChipInactive]}>
                <Text style={styles.dateDayInactive}>{d.day}</Text>
                <Text style={styles.dateNumInactive}>{d.num}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notification Toggle */}
      <View style={styles.notifRow}>
        <Text style={styles.notifText}>🔔  Reminder notifications</Text>
        <Switch
          value={notifs}
          onValueChange={setNotifs}
          trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.success }}
          thumbColor="white"
        />
      </View>

      {/* Timeline */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {TIMELINE.map((block, bi) => (
          <View key={block.id} style={styles.timeBlock}>
            {/* Connector line */}
            {bi < TIMELINE.length - 1 && <View style={styles.connector} />}

            {/* Time icon */}
            <View style={[styles.timeIconWrap, { backgroundColor: block.iconBg, borderColor: block.iconBorder }]}>
              <Text style={styles.timeIcon}>{block.icon}</Text>
            </View>

            {/* Content */}
            <View style={styles.timeContent}>
              <View style={styles.timeHeader}>
                <Text style={styles.timeLabel}>{block.label}</Text>
                <Text style={styles.timeText}>{block.time}</Text>
              </View>

              <View style={styles.medsRow}>
                {block.medicines.map((med, mi) => {
                  const key = `${block.id}_${mi}`;
                  const isTaken = takenMap[key] ?? med.taken;
                  return (
                    <TouchableOpacity
                      key={mi}
                      style={[styles.medChip, isTaken && styles.medChipTaken]}
                      onPress={() => toggleTaken(key)}
                    >
                      <View style={styles.medChipContent}>
                        <Text style={styles.medChipName}>{med.name}</Text>
                        <Text style={styles.medChipDose}>{med.dose}</Text>
                      </View>
                      {isTaken && <Text style={styles.takenCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        ))}

        {/* Progress Summary */}
        <LinearGradient
          colors={['rgba(6,214,138,0.08)', 'rgba(6,214,138,0.03)']}
          style={styles.progressCard}
        >
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <View style={styles.progressBarTrack}>
            <LinearGradient
              colors={[Colors.success, Colors.successGlow]}
              style={[styles.progressBarFill, { width: '40%' }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.progressText}>2 of 5 doses taken  ·  3 remaining</Text>
        </LinearGradient>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
  sub:   { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },

  // Date Strip
  dateStrip: { paddingHorizontal: 20, paddingBottom: 14, gap: 8 },
  dateChip: {
    width: 48,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    gap: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dateChipInactive: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowOpacity: 0,
    elevation: 0,
  },
  dateDayActive:   { fontSize: 9,  color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  dateNumActive:   { fontSize: 17, color: 'white',                 fontWeight: '800' },
  dateDayInactive: { fontSize: 9,  color: Colors.textSecondary },
  dateNumInactive: { fontSize: 17, color: Colors.textPrimary,       fontWeight: '700' },

  // Notif
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(6,255,165,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6,255,165,0.15)',
  },
  notifText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  // Timeline
  timeBlock: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    left: 19,
    top: 44,
    bottom: -24,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  timeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 6,
  },
  timeIcon:    { fontSize: 18 },
  timeContent: { flex: 1 },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeLabel:   { fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, color: Colors.primary, fontWeight: '600', textTransform: 'uppercase' },
  timeText:    { fontSize: 11, color: Colors.textSecondary },
  medsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  medChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#112436',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  medChipTaken: {
    backgroundColor: 'rgba(6,214,138,0.08)',
    borderColor: 'rgba(6,214,138,0.2)',
  },
  medChipContent: {},
  medChipName:  { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  medChipDose:  { fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
  takenCheck:   { color: Colors.success, fontSize: 12, fontWeight: '800' },

  // Progress Card
  progressCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6,255,165,0.15)',
    marginTop: 4,
  },
  progressTitle:    { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressText:    { fontSize: 11, color: Colors.textSecondary },
});
