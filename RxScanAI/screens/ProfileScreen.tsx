import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { getStoredUser, logout, forceClearAuth, deleteAccountByEmail } from '../services/auth.service';

const SETTINGS = [
  { icon: '🌐', label: 'Language',        value: 'Hindi',   },
  { icon: '🔔', label: 'Notifications',   value: 'On',      toggle: true },
  { icon: '🔒', label: 'Data & Privacy',  value: '',        },
  { icon: '☁️', label: 'Cloud Backup',    value: 'Off',     toggle: true },
  { icon: '💊', label: 'Medicine Database', value: 'Updated', },
  { icon: '❓', label: 'Help & Support',  value: '',        },
  { icon: '🔧', label: 'Clear Auth',     value: '',        onPress: 'clearAuth' },
  { icon: 'ℹ️', label: 'About RxScan AI', value: 'v1.0.0',  },
];

type ModalConfig = {
  title: string;
  message: string;
  buttons: { text: string; style?: 'cancel' | 'destructive' | 'default'; onPress: () => void }[];
  showInput?: boolean;
  inputPlaceholder?: string;
  inputSecure?: boolean;
};

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const showModal = (config: ModalConfig) => {
    setInputValue('');
    setModal(config);
  };

  const closeModal = () => {
    setModal(null);
    setInputValue('');
  };

  const goToAuth = () => {
    forceClearAuth().then(() => {
      window.location.reload();
    });
  };

  useEffect(() => {
    getStoredUser().then(u => setUser(u));
  }, []);

  const handleLogout = () => {
    showModal({
      title: 'Logout',
      message: 'Are you sure you want to logout? You will need to sign in again to use the app.',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: closeModal },
        {
          text: 'Logout',
          style: 'default',
          onPress: async () => {
            closeModal();
            try {
              await logout();
              await forceClearAuth();
              setUser(null);
              showToast('Successfully logged out. You can login again anytime.');
              setTimeout(() => goToAuth(), 1500);
            } catch (error: any) {
              showToast('Failed to logout. Please try again.', 'error');
            }
          }
        },
      ]
    });
  };

  const handleDeleteAccount = () => {
    showModal({
      title: '⚠️ Delete Account',
      message: 'WARNING: This will permanently delete your account and all your data. This action cannot be undone. Are you absolutely sure?',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: closeModal },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            closeModal();
            setTimeout(() => {
              showModal({
                title: 'Confirm Password',
                message: 'Please enter your password to confirm account deletion:',
                showInput: true,
                inputPlaceholder: 'Enter your password',
                inputSecure: true,
                buttons: [
                  { text: 'Cancel', style: 'cancel', onPress: closeModal },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      if (!inputValue) {
                        showToast('Password is required', 'error');
                        return;
                      }
                      closeModal();
                      try {
                        if (!user?.email) throw new Error('User email not found');
                        await deleteAccountByEmail(user.email, inputValue);
                        showToast('Account permanently deleted.');
                        setTimeout(() => window.location.reload(), 1500);
                      } catch (error: any) {
                        const message = error.response?.data?.detail || 'Failed to delete account. Please check your password.';
                        showToast(message, 'error');
                      }
                    }
                  }
                ]
              });
            }, 100);
          }
        },
      ]
    });
  };

  return (
    <LinearGradient colors={['#071828', '#040E18']} style={styles.container}>

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, { backgroundColor: toast.type === 'success' ? '#06D68A' : '#EF476F' }]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Custom Modal */}
      {modal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modal.title}</Text>
            <Text style={styles.modalMessage}>{modal.message}</Text>
            {modal.showInput && (
              <input
                type={modal.inputSecure ? 'password' : 'text'}
                placeholder={modal.inputPlaceholder || ''}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  color: 'white',
                  fontSize: 14,
                  marginBottom: 16,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            )}
            <View style={styles.modalButtons}>
              {modal.buttons.map((btn, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.modalBtn,
                    btn.style === 'destructive' && { backgroundColor: '#EF476F' },
                    btn.style === 'cancel' && { backgroundColor: 'rgba(255,255,255,0.08)' },
                    btn.style === 'default' && { backgroundColor: Colors.primary },
                    (!btn.style) && { backgroundColor: Colors.primary },
                  ]}
                  onPress={btn.onPress}
                >
                  <Text style={[
                    styles.modalBtnText,
                    btn.style === 'cancel' && { color: 'rgba(255,255,255,0.6)' }
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* User Card */}
      <LinearGradient colors={['rgba(0,194,212,0.12)', 'rgba(0,194,212,0.04)']} style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.userSub}>{user?.email || 'Sign in to sync prescriptions'}</Text>
        </View>
        {user ? (
          <View style={{ flexDirection: 'column', gap: 8 }}>
            <TouchableOpacity style={[styles.signInBtn, { backgroundColor: '#FF9500' }]} onPress={handleLogout}>
              <Text style={styles.signInText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.signInBtn, { backgroundColor: '#EF476F' }]} onPress={handleDeleteAccount}>
              <Text style={styles.signInText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.signInBtn, { backgroundColor: Colors.primary }]} onPress={goToAuth}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        )}
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
          <TouchableOpacity
            key={i}
            style={styles.settingRow}
            onPress={async () => {
              if (item.onPress === 'clearAuth') {
                await forceClearAuth();
                showToast('Authentication data cleared. Please restart the app.');
              }
            }}
          >
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

  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 12,
    zIndex: 999,
    alignItems: 'center',
  },
  toastText: { color: '#03101F', fontWeight: '700', fontSize: 14 },

  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 998,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#0D2035',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle:   { fontSize: 17, fontWeight: '800', color: 'white', marginBottom: 10 },
  modalMessage: { fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 20, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalBtn:     { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalBtnText: { fontSize: 14, fontWeight: '700', color: 'white' },

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
  signInBtn:  { marginLeft: 'auto', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
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
  settingIcon:     { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  settingIconText: { fontSize: 18 },
  settingLabel:    { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  settingRight:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue:    { fontSize: 12, color: Colors.textSecondary },
  settingArrow:    { fontSize: 18, color: Colors.textSecondary },
});