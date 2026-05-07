/**
 * RxScan AI — Profile & Settings Screen
 *
 * BUGS FIXED & UI OVERHAUL:
 * 1. Button Wrapping Fix: Shortened "Delete Permanently" to "Delete" to stop the text 
 * from breaking onto a second line and breaking the button UI.
 * 2. Instant Auth Redirect: Completely removed the intermediate "Guest" page. If a user 
 * logs out or deletes their account, they are instantly routed to the Sign In page.
 * 3. Security: The screen now explicitly renders nothing (blank) while the redirect 
 * happens to ensure no data flashes on screen.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

import { getStoredUser, logout, forceClearAuth, deleteAccountByEmail, User } from '../services/auth.service';
import { getScanHistory } from '../services/ocr.service';

const IS_WEB = Platform.OS === 'web';

// ─── Brand Tokens ─────────────────────────────────────────────
const C = {
  bg:      '#03101F',
  surface: '#071828',
  card:    '#0D2035',
  teal:    '#00C2D4',
  cyan:    '#00EDFF',
  green:   '#06D68A',
  warning: '#FFB800',
  red:     '#FF4D6A',
  white:   '#FFFFFF',
  gray:    '#7A8490',
  border:  'rgba(255,255,255,0.08)',
};

// ─── SVG Icons ────────────────────────────────────────────────
const IconLogOut = ({ color = C.warning, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconTrash = ({ color = C.red, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconInfo = ({ color = C.white, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="8" x2="12.01" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconChevronRight = ({ color = C.gray, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconAlertTriangle = ({ color = C.red, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

// ─── Types ────────────────────────────────────────────────────
type ModalConfig = {
  title: string;
  message: string;
  isDanger?: boolean;
  buttons: { text: string; style?: 'cancel' | 'destructive' | 'default'; onPress: (currentInput?: string) => void }[];
  showInput?: boolean;
  inputPlaceholder?: string;
  inputSecure?: boolean;
};

// ─── Main Component ───────────────────────────────────────────
export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ scans: 0, meds: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadProfileData = async () => {
        setIsLoading(true);
        try {
          const u = await getStoredUser();
          setUser(u);
          if (u) {
            const history = await getScanHistory();
            const totalMeds = history.reduce((acc, scan) => acc + (scan.medicines?.length || 0), 0);
            setStats({ scans: history.length, meds: totalMeds });
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      loadProfileData();
    }, [])
  );

  // ── STRICT REDIRECT LOGIC ──
  const goToAuth = useCallback(() => {
    if (IS_WEB) {
      window.location.replace('/');
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    }
  }, [navigation]);

  // Instantly redirect if the component detects no user after loading
  useEffect(() => {
    if (!isLoading && !user) {
      goToAuth();
    }
  }, [isLoading, user, goToAuth]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const showModal = (config: ModalConfig) => {
    setInputValue('');
    setModalError('');
    setModal(config);
  };

  const closeModal = () => {
    setModal(null);
    setInputValue('');
    setModalError('');
  };

  const handleLogout = () => {
    showModal({
      title: 'Log Out',
      message: 'Are you sure you want to log out? You will need to sign in again to sync your data.',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: closeModal },
        {
          text: 'Log Out',
          style: 'default',
          onPress: async () => {
            closeModal();
            try {
              await logout();
              await forceClearAuth();
              setUser(null);
              // goToAuth is automatically triggered by the useEffect above when user becomes null
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
      title: 'Delete Account',
      message: 'This will permanently delete your account and all saved prescription history. This action cannot be undone.',
      isDanger: true,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: closeModal },
        {
          text: 'Proceed',
          style: 'destructive',
          onPress: () => {
            closeModal();
            setTimeout(() => {
              showModal({
                title: 'Confirm Deletion',
                message: 'Please enter your password to permanently delete your account:',
                isDanger: true,
                showInput: true,
                inputPlaceholder: 'Enter your password',
                inputSecure: true,
                buttons: [
                  { text: 'Cancel', style: 'cancel', onPress: closeModal },
                  {
                    text: 'Delete', // FIX: Changed from 'Delete Permanently' to prevent text wrapping
                    style: 'destructive',
                    onPress: async (currentInput) => {
                      if (!currentInput) {
                        setModalError('Password is required to proceed.');
                        return;
                      }
                      
                      setModalError('');
                      try {
                        if (!user?.email) throw new Error('User email not found');
                        await deleteAccountByEmail(user.email, currentInput);
                        
                        await forceClearAuth();
                        closeModal();
                        setUser(null); 
                        // Redirect happens automatically via useEffect
                      } catch (error: any) {
                        setModalError('Incorrect password. Please try again.');
                      }
                    }
                  }
                ]
              });
            }, 300);
          }
        },
      ]
    });
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  // If loading or unauthenticated, return blank (or loader) to prevent "Ghost" UI flashes
  if (isLoading || !user) {
    return (
      <SafeAreaView style={s.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={s.loaderWrap}>
          <ActivityIndicator size="large" color={C.teal} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Authenticated Render ─────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      
      {toast && (
        <View style={[s.toast, { backgroundColor: toast.type === 'success' ? C.green : C.red }]}>
          <Text style={s.toastText}>{toast.message}</Text>
        </View>
      )}

      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Profile</Text>
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={s.authContainer}>
            
            <View style={s.userCard}>
              <View style={s.avatarWrap}>
                <Text style={s.avatarText}>{getInitials(user?.name || '')}</Text>
              </View>
              <View style={s.userInfo}>
                <Text style={s.userName} numberOfLines={1}>{user?.name}</Text>
                <Text style={s.userEmail} numberOfLines={1}>{user?.email}</Text>
              </View>
            </View>

            <View style={s.statsContainer}>
              <View style={s.statBox}>
                <Text style={s.statValue}>{stats.scans}</Text>
                <Text style={s.statLabel}>Total Scans</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statBox}>
                <Text style={s.statValue}>{stats.meds}</Text>
                <Text style={s.statLabel}>Meds Parsed</Text>
              </View>
            </View>

            <Text style={s.sectionTitle}>Account Actions</Text>
            <View style={s.actionList}>
              
              <TouchableOpacity style={s.actionRow} activeOpacity={0.7} onPress={handleLogout}>
                <View style={[s.actionIconWrap, { backgroundColor: 'rgba(255, 184, 0, 0.1)' }]}>
                  <IconLogOut />
                </View>
                <Text style={s.actionLabel}>Log Out</Text>
                <IconChevronRight />
              </TouchableOpacity>

              <TouchableOpacity style={s.actionRow} activeOpacity={0.7} onPress={handleDeleteAccount}>
                <View style={[s.actionIconWrap, { backgroundColor: 'rgba(255, 77, 106, 0.1)' }]}>
                  <IconTrash />
                </View>
                <Text style={[s.actionLabel, { color: C.red }]}>Delete Account</Text>
                <IconChevronRight />
              </TouchableOpacity>

            </View>

            <Text style={s.sectionTitle}>App Info</Text>
            <View style={s.actionList}>
              <View style={s.actionRow}>
                <View style={s.actionIconWrap}>
                  <IconInfo />
                </View>
                <Text style={s.actionLabel}>Version</Text>
                <Text style={s.actionValue}>v1.0.0</Text>
              </View>
            </View>

          </View>
        </ScrollView>

        <Modal
          visible={!!modal}
          transparent={true}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalBox}>
              
              <View style={s.modalHeader}>
                {modal?.isDanger && (
                  <View style={s.modalDangerIcon}>
                    <IconAlertTriangle />
                  </View>
                )}
                <Text style={[s.modalTitle, modal?.isDanger && { color: C.red }]}>
                  {modal?.title}
                </Text>
              </View>

              <Text style={s.modalMessage}>{modal?.message}</Text>
              
              {modal?.showInput && (
                <View style={s.inputWrapper}>
                  <TextInput
                    style={[s.modalInput, modalError ? s.modalInputError : null]}
                    placeholder={modal.inputPlaceholder}
                    placeholderTextColor={C.gray}
                    secureTextEntry={modal.inputSecure}
                    value={inputValue}
                    onChangeText={(text) => {
                      setInputValue(text);
                      setModalError(''); 
                    }}
                    autoCapitalize="none"
                    autoFocus={true}
                  />
                  {modalError ? <Text style={s.inlineErrorText}>{modalError}</Text> : null}
                </View>
              )}
              
              <View style={s.modalBtnRow}>
                {modal?.buttons.map((btn, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      s.modalBtn,
                      btn.style === 'cancel' && { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
                      btn.style === 'destructive' && { backgroundColor: C.red },
                      btn.style === 'default' && { backgroundColor: C.teal },
                    ]}
                    onPress={() => btn.onPress(inputValue)}
                  >
                    <Text style={[
                      s.modalBtnText,
                      btn.style === 'cancel' && { color: C.white },
                      btn.style === 'destructive' && { color: C.white },
                      btn.style === 'default' && { color: C.bg },
                    ]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: C.bg },

  toast: {
    position: 'absolute', top: IS_WEB ? 20 : 60, alignSelf: 'center',
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30,
    zIndex: 1000, elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  toastText: { color: C.white, fontWeight: '800', fontSize: 14 },

  header: {
    paddingTop: IS_WEB ? 40 : 20, paddingHorizontal: 24, paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: C.white, letterSpacing: -0.5 },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 60, flexGrow: 1 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  authContainer: { flex: 1, paddingTop: 10 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: C.surface, padding: 20, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, marginBottom: 24,
  },
  avatarWrap: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: 'rgba(0, 194, 212, 0.15)',
    borderWidth: 1, borderColor: 'rgba(0, 194, 212, 0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '900', color: C.teal, letterSpacing: 1 },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 4 },
  userEmail: { fontSize: 14, color: C.gray, fontWeight: '500' },

  statsContainer: {
    flexDirection: 'row', backgroundColor: C.surface, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, paddingVertical: 20, marginBottom: 36,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: C.border },
  statValue: { fontSize: 24, fontWeight: '900', color: C.cyan, marginBottom: 4 },
  statLabel: { fontSize: 13, color: C.gray, fontWeight: '600' },

  sectionTitle: { color: C.white, fontSize: 16, fontWeight: '800', marginBottom: 16, paddingLeft: 4 },
  actionList: { gap: 12, marginBottom: 36 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.surface, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
  },
  actionIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, justifyContent: 'center', alignItems: 'center',
  },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: C.white },
  actionValue: { fontSize: 14, fontWeight: '600', color: C.gray },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalBox: {
    width: '100%', maxWidth: 360, backgroundColor: C.surface,
    borderRadius: 24, padding: 28, borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  modalDangerIcon: { 
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255, 77, 106, 0.1)', 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 77, 106, 0.2)' 
  },
  modalTitle: { color: C.white, fontSize: 20, fontWeight: '800' },
  modalMessage: { color: C.gray, fontSize: 15, lineHeight: 22, marginBottom: 24, fontWeight: '500' },
  
  inputWrapper: { marginBottom: 24 },
  modalInput: {
    width: '100%', backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1, borderColor: 'rgba(255, 77, 106, 0.4)', borderRadius: 14,
    color: C.white, fontSize: 16, paddingHorizontal: 16, paddingVertical: 16,
  },
  modalInputError: {
    borderColor: C.red,
    backgroundColor: 'rgba(255, 77, 106, 0.05)',
  },
  inlineErrorText: {
    color: C.red, fontSize: 13, fontWeight: '600', marginTop: 8, marginLeft: 4,
  },

  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '800' },
});