import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

const SETTINGS = [
  { icon: '🌐', label: 'Language',        value: 'Hindi',   },
  { icon: '🔔', label: 'Notifications',   value: 'On',      toggle: true },
  { icon: '🔒', label: 'Data & Privacy',  value: '',        },
  { icon: '☁️', label: 'Cloud Backup',    value: 'Off',     toggle: true },
  { icon: '💊', label: 'Medicine Database', value: 'Updated', },
  { icon: '❓', label: 'Help & Support',  value: '',        },
  { icon: 'ℹ️', label: 'About RxScan AI', value: 'v1.0.0',  },
];

export default function ProfileScreen() {
  return (
    <LinearGradient colors={['#071828', '#040E18']} style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* User Card */}
      <LinearGradient colors={['rgba(0,194,212,0.12)', 'rgba(0,194,212,0.04)']}
        style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <View>
          <Text style={styles.userName}>Guest User</Text>
          <Text style={styles.userSub}>Sign in to sync prescriptions</Text>
        </View>
        <TouchableOpacity style={styles.signInBtn}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Scans',    value: '4'  },
          { label: 'Saved',    value: '4'  },
          { label: 'Medicines', value: '11' },
        ].map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Settings List */}
      <ScrollView contentContainerStyle={styles.settingsList} showsVerticalScrollIndicator={false}>
        {SETTINGS.map((item, i) => (
          <TouchableOpacity key={i} style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingIconText}>{item.icon}</Text>
            </View>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <View style={styles.settingRight}>
              {item.toggle ? (
                <Switch
                  value={item.value === 'On'}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.primary }}
                  thumbColor="white"
                />
              ) : (
                <>
                  {item.value ? <Text style={styles.settingValue}>{item.value}</Text> : null}
                  <Text style={styles.settingArrow}>›</Text>
                </>
              )}
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
  header: { paddingTop: 58, paddingHorizontal: 20, paddingBottom: 14 },
  title:  { fontSize: 24, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,194,212,0.2)',
    marginBottom: 16,
  },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,194,212,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22 },
  userName:   { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  userSub:    { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  signInBtn:  { marginLeft: 'auto', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: Colors.primary },
  signInText: { fontSize: 12, fontWeight: '700', color: 'white' },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  statItem:  { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 3 },

  settingsList: { paddingHorizontal: 20, gap: 6 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  settingIconText: { fontSize: 18 },
  settingLabel:    { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  settingRight:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue:    { fontSize: 12, color: Colors.textSecondary },
  settingArrow:    { fontSize: 18, color: Colors.textSecondary },
});
