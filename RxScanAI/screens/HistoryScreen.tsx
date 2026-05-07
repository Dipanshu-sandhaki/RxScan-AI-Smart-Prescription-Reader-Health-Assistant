/**
 * RxScan AI — History Screen
 *
 * BUGS FIXED:
 * 1. Cancel button race condition.
 * 2. Delete confirmation reset state fix.
 * 3. Cross-Platform Delete Modal applied.
 * 4. Replaced hardcoded 'Dr. Prescription' fallback with a dynamic check.
 * 5. WEB LAYOUT FIX: Added `overflow: 'hidden'` to the container.
 * 6. UI SPACING FIX: Increased paddingTop on the header so it doesn't 
 * stick weirdly to the absolute top of the web browser.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Polyline } from 'react-native-svg';

import { getScanHistory, deleteScanHistory, ScanHistoryItem } from '../services/ocr.service';

const { width: SCREEN_W } = Dimensions.get('window');
const W = Math.min(SCREEN_W, 480);
const IS_WEB = Platform.OS === 'web';

// ─── Brand Tokens ─────────────────────────────────────────────
const C = {
  bg:      '#03101F',
  surface: '#071828',
  card:    '#0D2035',
  teal:    '#00C2D4',
  cyan:    '#00EDFF',
  green:   '#06D68A',
  red:     '#FF4D6A',
  white:   '#FFFFFF',
  gray:    '#7A8490',
  border:  'rgba(255,255,255,0.08)',
};

// ─── SVG Icons ────────────────────────────────────────────────
const IconTrash = ({ color = C.white, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconCheck = ({ color = C.white, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconChevronRight = ({ color = C.gray, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconFileEmpty = ({ color = C.gray, size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Utility ──────────────────────────────────────────────────
const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (diff === 0) return `Today, ${time}`;
  if (diff === 1) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${time}`;
};

// ─── Component ────────────────────────────────────────────────
export default function HistoryScreen({ navigation }: any) {
  const [history,      setHistory]      = useState<ScanHistoryItem[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  const deleteBarY = useRef(new Animated.Value(100)).current;

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
      resetSelectionMode(/* animate = */ false);
    }, [])
  );

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getScanHistory();
      setHistory(
        [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const resetSelectionMode = (animate = true) => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
    setIsAlertVisible(false);
    if (animate) {
      Animated.timing(deleteBarY, { toValue: 100, duration: 200, useNativeDriver: true }).start();
    } else {
      deleteBarY.setValue(100);
    }
  };

  useEffect(() => {
    if (selectedIds.size > 0) {
      Animated.spring(deleteBarY, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }).start();
    } else {
      Animated.timing(deleteBarY, { toValue: 100, duration: 200, useNativeDriver: true }).start();
    }
  }, [selectedIds.size]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCardPress = (item: ScanHistoryItem) => {
    if (isSelectMode) {
      toggleSelection(item.id);
    } else {
      navigation.push('Results', { data: item });
    }
  };

  const handleLongPress = (id: string) => {
    if (!isSelectMode) {
      setIsSelectMode(true);
      toggleSelection(id);
    }
  };

  const handleDeleteInit = () => {
    setIsAlertVisible(true);
  };

  const confirmDelete = async () => {
    setIsAlertVisible(false);
    try {
      await deleteScanHistory(Array.from(selectedIds));
      resetSelectionMode();
      fetchHistory();
    } catch {
      if (IS_WEB) {
        window.alert('Failed to delete the selected records. Please try again.');
      } else {
        // Alert.alert fallback just in case
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === history.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(history.map(i => i.id)));
    }
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.container}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Prescription History</Text>
            <Text style={s.sub}>{history.length} scan{history.length !== 1 ? 's' : ''} saved securely</Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity
              style={s.editBtn}
              onPress={isSelectMode ? () => resetSelectionMode() : () => setIsSelectMode(true)}
            >
              <Text style={s.editBtnText}>{isSelectMode ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Select All Row (only in select mode) ── */}
        {isSelectMode && history.length > 0 && (
          <TouchableOpacity style={s.selectAllRow} onPress={toggleSelectAll}>
            <View style={[s.checkbox, selectedIds.size === history.length && s.checkboxActive]}>
              {selectedIds.size === history.length && <IconCheck size={12} />}
            </View>
            <Text style={s.selectAllText}>
              {selectedIds.size === history.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Main List ── */}
        {isLoading ? (
          <View style={s.centerScreen}>
            <ActivityIndicator size="large" color={C.teal} />
          </View>
        ) : history.length === 0 ? (
          <View style={s.centerScreen}>
            <IconFileEmpty />
            <Text style={s.emptyTitle}>No Scans Yet</Text>
            <Text style={s.emptySub}>Your scanned prescriptions will appear here.</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          >
            {history.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const cost       = (item.medicines || []).reduce(
                (sum, m) => sum + (m.estimated_total_cost ?? m.cost ?? 0), 0
              );
              const confPct    = Math.round((item.scan_confidence || 0) * 100);
              
              // DYNAMIC NAME CHECK
              const rawDocName = item.doctor_info?.name?.trim();
              const displayDocName = rawDocName ? rawDocName : 'Unknown Provider';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[s.card, isSelected && s.cardSelected]}
                  onPress={() => handleCardPress(item)}
                  onLongPress={() => handleLongPress(item.id)}
                  activeOpacity={0.7}
                >
                  {isSelectMode && (
                    <View style={[s.checkbox, isSelected && s.checkboxActive]}>
                      {isSelected && <IconCheck size={12} />}
                    </View>
                  )}

                  <View style={s.rxIcon}>
                    <Text style={s.rxIconText}>Rx</Text>
                  </View>

                  <View style={s.cardMid}>
                    <Text style={s.cardDoctor} numberOfLines={1}>
                      {displayDocName}
                    </Text>
                    <Text style={s.cardDate}>{formatDate(item.created_at)}</Text>
                    <View style={s.cardTags}>
                      <View style={s.tag}>
                        <Text style={s.tagText}>{item.medicines?.length ?? 0} Med{item.medicines?.length !== 1 ? 's' : ''}</Text>
                      </View>
                      <View style={s.tag}>
                        <Text style={s.tagText}>₹ {cost}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={s.cardRight}>
                    <Text style={[s.confText, { color: confPct > 80 ? C.green : '#FFB800' }]}>
                      {confPct}%
                    </Text>
                    <Text style={s.confLabel}>AI Accuracy</Text>
                    {!isSelectMode && <IconChevronRight />}
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 120 }} />
          </ScrollView>
        )}

        {/* ── Floating Bulk Delete Bar ── */}
        {history.length > 0 && (
          <Animated.View style={[s.floatingActionBar, { transform: [{ translateY: deleteBarY }] }]}>
            <View style={s.fabContent}>
              <Text style={s.fabText}>{selectedIds.size} Selected</Text>
              <TouchableOpacity style={s.fabDeleteBtn} onPress={handleDeleteInit}>
                <IconTrash size={18} color={C.bg} />
                <Text style={s.fabDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ── Custom Professional Alert Modal ── */}
        <Modal
          visible={isAlertVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsAlertVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalBox}>
              
              <View style={s.modalHeader}>
                <View style={s.modalIconWrap}>
                  <IconTrash size={24} color={C.red} />
                </View>
                <Text style={s.modalTitle}>Delete Scans</Text>
              </View>

              <Text style={s.modalMessage}>
                Are you sure you want to delete {selectedIds.size} record{selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.
              </Text>

              <View style={s.modalActions}>
                <TouchableOpacity
                  style={s.modalBtnCancel}
                  onPress={() => setIsAlertVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={s.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.modalBtnConfirm}
                  onPress={confirmDelete}
                  activeOpacity={0.7}
                >
                  <Text style={s.modalBtnConfirmText}>Delete</Text>
                </TouchableOpacity>
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
  
  container: { 
    flex: 1, 
    width: '100%', 
    maxWidth: 480, 
    alignSelf: 'center', 
    backgroundColor: C.bg,
    overflow: 'hidden', 
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    // ── FIXED SPACING ── 
    // Increased from 20 to 50 on web so it doesn't stick to the top!
    paddingTop: IS_WEB ? 50 : 60, 
    paddingHorizontal: 20, paddingBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  sub:   { fontSize: 13, color: C.gray, marginTop: 4, fontWeight: '500' },
  editBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
  },
  editBtnText: { color: C.teal, fontSize: 13, fontWeight: '700' },

  selectAllRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, gap: 12,
  },
  selectAllText: { color: C.white, fontSize: 14, fontWeight: '600' },

  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: C.gray,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: C.teal, borderColor: C.teal },

  centerScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 50 },
  emptyTitle:   { color: C.white, fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  emptySub:     { color: C.gray,  fontSize: 14, textAlign: 'center' },

  list: { paddingHorizontal: 20, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 16,
    padding: 14, gap: 14,
    borderWidth: 1, borderColor: C.border,
  },
  cardSelected: {
    borderColor: C.teal,
    backgroundColor: 'rgba(0, 194, 212, 0.08)',
  },
  rxIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(0, 194, 212, 0.1)',
    borderWidth: 1, borderColor: 'rgba(0, 194, 212, 0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  rxIconText:  { fontSize: 15, fontWeight: '900', color: C.teal },
  cardMid:     { flex: 1 },
  cardDoctor:  { fontSize: 15, fontWeight: '800', color: C.white, marginBottom: 2 },
  cardDate:    { fontSize: 11, color: C.gray, fontWeight: '500', marginBottom: 8 },
  cardTags:    { flexDirection: 'row', gap: 6 },
  tag: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  tagText:   { fontSize: 10, color: C.cyan, fontWeight: '600' },
  cardRight: { alignItems: 'center', gap: 4 },
  confText:  { fontFamily: 'monospace', fontSize: 15, fontWeight: '800' },
  confLabel: { fontSize: 9, color: C.gray, fontWeight: '600', marginBottom: 2 },

  floatingActionBar: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 15,
  },
  fabContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  fabText:       { color: C.white, fontSize: 15, fontWeight: '700' },
  fabDeleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.red, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  fabDeleteText: { color: C.bg, fontSize: 14, fontWeight: '800' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 77, 106, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 106, 0.2)',
  },
  modalTitle: {
    color: C.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalMessage: {
    color: C.gray,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.red,
    alignItems: 'center',
  },
  modalBtnConfirmText: {
    color: C.bg,
    fontSize: 15,
    fontWeight: '800',
  },
});