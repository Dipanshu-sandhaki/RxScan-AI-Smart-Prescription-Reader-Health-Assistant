/**
 * RxScan AI — Dynamic Schedule Screen
 *
 * UI/UX POLISH & NEW FEATURES:
 * 1. WEB DRAG-TO-SCROLL: Injected a custom Mouse Drag Engine for React Native Web.
 * Users can now click and drag the dates horizontally using a mouse, mimicking native touch.
 * 2. DYNAMIC DATE LABEL: The "Today" button accurately reads relative days.
 * 3. PREMIUM MINI SLIDER: Custom animated scrollbar track under the calendar.
 * 4. GAP REMOVED: Perfectly compressed margins between header and timeline.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, ActivityIndicator, StatusBar, Platform, Alert,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

import { getScanHistory } from '../services/ocr.service';

const IS_WEB = Platform.OS === 'web';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Brand Tokens ─────────────────────────────────────────────
const C = {
  bg:      '#03101F',
  surface: '#071828',
  card:    '#0D2035',
  teal:    '#00C2D4',
  cyan:    '#00EDFF',
  ocean:   '#016096',
  green:   '#06D68A',
  warning: '#FFB800',
  purple:  '#A78BFA',
  white:   '#FFFFFF',
  gray:    '#7A8490',
  border:  'rgba(255,255,255,0.08)',
};

// ─── SVG Icons ────────────────────────────────────────────────
const IconSunrise = ({ size = 20, color = C.warning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2v4M4.93 7.93l2.83 2.83M2 14h4M22 14h-4M19.07 7.93l-2.83 2.83" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M5 19a7 7 0 0 1 14 0" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="2" y1="19" x2="22" y2="19" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const IconSun = ({ size = 20, color = C.cyan }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="12" y1="2"  x2="12" y2="4"  stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="12" y1="20" x2="12" y2="22" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="4.93" y1="4.93"   x2="6.34" y2="6.34"   stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="17.66" y1="17.66" x2="19.07" y2="19.07" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="2"  y1="12" x2="4"  y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="20" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="4.93" y1="19.07"  x2="6.34" y2="17.66"  stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="17.66" y1="6.34"  x2="19.07" y2="4.93"  stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const IconMoon = ({ size = 20, color = C.purple }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconCheck = ({ size = 14, color = C.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconBell = ({ size = 16, color = C.gray }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconInfo = ({ size = 16, color = C.cyan }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="8" r="1.5" fill={color} />
  </Svg>
);

const IconFileEmpty = ({ size = 48, color = C.gray }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconCalendar = ({ size = 14, color = C.teal }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2.5" />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2.5" />
  </Svg>
);

const IconRefreshCCW = ({ size = 14, color = C.teal }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 3v5h5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Dynamic Helpers ──────────────────────────────────────────
const generateCalendarDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = -3; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      fullDate: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNum: d.getDate().toString(),
      month: d.toLocaleDateString('en-US', { month: 'long' }),
      year: d.getFullYear(),
      isToday: i === 0,
    });
  }
  return dates;
};

const parseDurationDays = (durationStr: string | undefined): number => {
  if (!durationStr) return 7; 
  const str = durationStr.toLowerCase();
  const numMatch = str.match(/\d+/);
  const num = numMatch ? parseInt(numMatch[0], 10) : 1;

  if (str.includes('month')) return num * 30;
  if (str.includes('week')) return num * 7;
  if (str.includes('day')) return num;
  return 7;
};

// ─── Main Component ───────────────────────────────────────────
export default function ScheduleScreen() {
  const [calendar] = useState(generateCalendarDates());
  const todayDateObj = calendar.find(d => d.isToday);
  const [selectedDate, setSelectedDate] = useState(todayDateObj?.fullDate || calendar[3].fullDate);
  const [notifs, setNotifs] = useState(false);
  
  const [allParsedMeds, setAllParsedMeds] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [takenMap, setTakenMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Custom Slider Animation States
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [sliderProps, setSliderProps] = useState({ contentWidth: 1, layoutWidth: 1 });

  // Web Mouse Drag Engine Refs
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const currentOffset = useRef(0);

  useEffect(() => {
    AsyncStorage.getItem('rxscan_notifs').then(val => {
      if (val === 'true') setNotifs(true);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchAndParse = async () => {
        setIsLoading(true);
        try {
          const history = await getScanHistory();
          if (!isActive) return;

          let rawMeds: any[] = [];
          history.forEach(scan => {
            const rxDate = new Date(scan.created_at || new Date());
            rxDate.setHours(0,0,0,0);

            if (scan.medicines && Array.isArray(scan.medicines)) {
              scan.medicines.forEach((med, index) => {
                const durationDays = parseDurationDays(med.duration);
                const endDate = new Date(rxDate);
                endDate.setDate(rxDate.getDate() + durationDays);

                rawMeds.push({
                  id: `${scan.id}_${index}`,
                  name: med.name || 'Unknown Med',
                  dose: med.dose || med.dosage || '1 dose',
                  frequency: (med.frequency || med.instructions || med.dosage || '').toLowerCase(),
                  startDate: rxDate.getTime(),
                  endDate: endDate.getTime(),
                });
              });
            }
          });

          setAllParsedMeds(rawMeds);
        } catch (error) {
          console.error("Error loading schedule:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchAndParse();
      return () => { isActive = false; };
    }, [])
  );

  useEffect(() => {
    if (allParsedMeds.length === 0 && !isLoading) {
      setTimeline([]);
      return;
    }

    const currentTargetDate = new Date(selectedDate).getTime();
    
    const activeMedsToday = allParsedMeds.filter(med => {
      return currentTargetDate >= med.startDate && currentTargetDate <= med.endDate;
    });

    const morningMeds: any[] = [];
    const afternoonMeds: any[] = [];
    const nightMeds: any[] = [];

    activeMedsToday.forEach(med => {
      const freq = med.frequency;
      
      if (freq.match(/\b(tds|tid|3x|3 times|thrice|8 hourly)\b/)) {
        morningMeds.push(med); afternoonMeds.push(med); nightMeds.push(med);
      } 
      else if (freq.match(/\b(bd|bid|2x|twice|2 times|12 hourly)\b/)) {
        morningMeds.push(med); nightMeds.push(med);
      } 
      else if (freq.match(/\b(hs|night|bedtime|dinner)\b/)) {
        nightMeds.push(med);
      } 
      else if (freq.match(/\b(afternoon|lunch)\b/)) {
        afternoonMeds.push(med);
      } 
      else {
        morningMeds.push(med);
      }
    });

    const dynamicTimeline = [
      {
        id: 'morning', label: 'Morning', time: '08:00 AM', Icon: IconSunrise, color: C.warning,
        iconBg: 'rgba(255, 184, 0, 0.1)', iconBorder: 'rgba(255, 184, 0, 0.25)', medicines: morningMeds,
      },
      {
        id: 'afternoon', label: 'Afternoon', time: '01:00 PM', Icon: IconSun, color: C.cyan,
        iconBg: 'rgba(0, 194, 212, 0.1)', iconBorder: 'rgba(0, 194, 212, 0.25)', medicines: afternoonMeds,
      },
      {
        id: 'night', label: 'Night', time: '09:00 PM', Icon: IconMoon, color: C.purple,
        iconBg: 'rgba(167, 139, 250, 0.1)', iconBorder: 'rgba(167, 139, 250, 0.25)', medicines: nightMeds,
      },
    ].filter(slot => slot.medicines.length > 0);

    setTimeline(dynamicTimeline);

    AsyncStorage.getItem(`rxscan_doses_${selectedDate}`).then(savedData => {
      if (savedData) setTakenMap(JSON.parse(savedData));
      else setTakenMap({});
    });

  }, [selectedDate, allParsedMeds]);


  const toggleTaken = async (medId: string, slotId: string) => {
    const key = `${slotId}_${medId}`;
    const newMap = { ...takenMap, [key]: !takenMap[key] };
    setTakenMap(newMap);
    
    try {
      await AsyncStorage.setItem(`rxscan_doses_${selectedDate}`, JSON.stringify(newMap));
    } catch (e) { console.error("Failed to save dose", e); }
  };

  const handleNotifToggle = async (val: boolean) => {
    setNotifs(val);
    AsyncStorage.setItem('rxscan_notifs', val.toString());

    if (IS_WEB) {
      if (val) alert('Push notifications are simulated on Web. Install the mobile app to receive real background reminders!');
      return;
    }

    if (val) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable notifications in your phone settings to receive reminders.');
        setNotifs(false);
        return;
      }
      
      await Notifications.scheduleNotificationAsync({
        content: { title: "RxScan Reminder 🌅", body: "It's time to take your Morning medicines!" },
        trigger: { hour: 8, minute: 0, repeats: true } as any,
      });
      await Notifications.scheduleNotificationAsync({
        content: { title: "RxScan Reminder 🌙", body: "It's time to take your Night medicines!" },
        trigger: { hour: 21, minute: 0, repeats: true } as any,
      });

    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const jumpToToday = () => {
    if (todayDateObj) {
      setSelectedDate(todayDateObj.fullDate);
      scrollRef.current?.scrollTo({ x: 0, animated: true }); 
    }
  };

  const getRelativeDateLabel = () => {
    if (!todayDateObj) return 'Today';
    const target = new Date(selectedDate);
    const current = new Date(todayDateObj.fullDate);
    target.setHours(0,0,0,0);
    current.setHours(0,0,0,0);
    const diffTime = target.getTime() - current.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  const relativeLabel = getRelativeDateLabel();
  const isToday = relativeLabel === 'Today';

  // ── Web Mouse Drag Engine ──
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => { currentOffset.current = event.nativeEvent.contentOffset.x; }
    }
  );

  const webDragProps = IS_WEB ? {
    // @ts-ignore
    onMouseDown: (e: any) => {
      isDragging.current = true;
      startX.current = e.nativeEvent.pageX;
      scrollLeft.current = currentOffset.current;
    },
    // @ts-ignore
    onMouseMove: (e: any) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.nativeEvent.pageX;
      const walk = (startX.current - x) * 1.5; // Scroll speed multiplier
      scrollRef.current?.scrollTo({ x: scrollLeft.current + walk, animated: false });
    },
    // @ts-ignore
    onMouseUp: () => { isDragging.current = false; },
    // @ts-ignore
    onMouseLeave: () => { isDragging.current = false; },
  } : {};

  // Calculate Progress
  let totalDoses = 0;
  let takenDoses = 0;
  timeline.forEach(slot => {
    slot.medicines.forEach((med: any) => {
      totalDoses++;
      if (takenMap[`${slot.id}_${med.id}`]) takenDoses++;
    });
  });
  const progressPct = totalDoses === 0 ? 0 : Math.round((takenDoses / totalDoses) * 100);

  const activeDateObj = calendar.find(d => d.fullDate === selectedDate);

  // ── SLIDER MATH ──
  const trackWidth = 60; 
  const thumbWidth = Math.max((sliderProps.layoutWidth / sliderProps.contentWidth) * trackWidth, 16);
  const maxScroll = Math.max(sliderProps.contentWidth - sliderProps.layoutWidth, 1);
  const maxTranslate = trackWidth - thumbWidth;
  const thumbTranslateX = scrollX.interpolate({
    inputRange: [0, maxScroll],
    outputRange: [0, maxTranslate],
    extrapolate: 'clamp'
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      
      <LinearGradient colors={[C.surface, C.bg]} style={s.container}>

        {/* ── Dynamic Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Dose Schedule</Text>
            <Text style={s.subMonth}>{activeDateObj?.month} {activeDateObj?.year}</Text>
          </View>
          <TouchableOpacity onPress={jumpToToday} style={s.todayBtn} activeOpacity={0.7}>
            {isToday ? <IconCalendar /> : <IconRefreshCCW />}
            <Text style={s.todayTxt}>{relativeLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Infinite Premium Date Slider ── */}
        <View style={s.calendarWrapper}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.dateStrip}
            style={[s.dateScroll, IS_WEB && { cursor: 'grab' } as any]} 
            snapToInterval={68} 
            decelerationRate="fast"
            onContentSizeChange={(w, h) => setSliderProps(p => ({ ...p, contentWidth: w }))}
            onLayout={e => setSliderProps(p => ({ ...p, layoutWidth: e.nativeEvent.layout.width }))}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            {...webDragProps}
          >
            {calendar.map((d) => {
              const isActive = d.fullDate === selectedDate;
              return (
                <TouchableOpacity key={d.fullDate} activeOpacity={0.8} onPress={() => setSelectedDate(d.fullDate)}>
                  {isActive ? (
                    <LinearGradient colors={[C.teal, C.ocean]} style={s.dateChip}>
                      <Text style={s.dateDayActive}>{d.dayName}</Text>
                      <Text style={s.dateNumActive}>{d.dayNum}</Text>
                      {d.isToday && <View style={s.todayDotActive} />}
                    </LinearGradient>
                  ) : (
                    <View style={[s.dateChip, s.dateChipInactive]}>
                      <Text style={s.dateDayInactive}>{d.dayName}</Text>
                      <Text style={s.dateNumInactive}>{d.dayNum}</Text>
                      {d.isToday && <View style={s.todayDotInactive} />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Sleek Custom Scrollbar / Slider Track ── */}
        <View style={s.sliderTrackWrap}>
          <View style={[s.sliderTrack, { width: trackWidth }]}>
            <Animated.View style={[s.sliderThumb, { width: thumbWidth, transform: [{ translateX: thumbTranslateX }] }]} />
          </View>
        </View>

        {/* ── Notification Toggle ── */}
        <View style={s.notifRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <IconBell color={notifs ? C.green : C.gray} />
            <Text style={s.notifText}>Device Reminders</Text>
          </View>
          <Switch
            value={notifs}
            onValueChange={handleNotifToggle}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: C.green }}
            thumbColor={C.white}
          />
        </View>

        {/* ── Timeline Content ── */}
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          
          {isLoading ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={C.teal} />
            </View>
          ) : timeline.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}>
                <IconFileEmpty color={C.gray} size={36} />
              </View>
              <Text style={s.emptyTitle}>No Medicines Scheduled</Text>
              <Text style={s.emptySub}>
                There are no active prescriptions for {activeDateObj?.month} {activeDateObj?.dayNum}. 
                Go to the Home tab and scan a prescription to auto-generate your schedule.
              </Text>
            </View>
          ) : (
            <>
              {/* ── UX INSTRUCTION BANNER ── */}
              <View style={s.instructionBanner}>
                <IconInfo size={16} color={C.cyan} />
                <Text style={s.instructionText}>
                  Tap on a medicine to mark your dose as taken.
                </Text>
              </View>

              {timeline.map((block, bi) => (
                <View key={block.id} style={s.timeBlock}>
                  {bi < timeline.length - 1 && <View style={s.connector} />}

                  <View style={[s.timeIconWrap, { backgroundColor: block.iconBg, borderColor: block.iconBorder }]}>
                    <block.Icon color={block.color} size={20} />
                  </View>

                  <View style={s.timeContent}>
                    <View style={s.timeHeader}>
                      <Text style={[s.timeLabel, { color: block.color }]}>{block.label}</Text>
                      <Text style={s.timeText}>{block.time}</Text>
                    </View>

                    <View style={s.medsRow}>
                      {block.medicines.map((med: any) => {
                        const isTaken = takenMap[`${block.id}_${med.id}`] || false;
                        return (
                          <TouchableOpacity
                            key={med.id}
                            style={[s.medChip, isTaken && s.medChipTaken]}
                            onPress={() => toggleTaken(med.id, block.id)}
                            activeOpacity={0.7}
                          >
                            <View style={s.medChipContent}>
                              <Text style={[s.medChipName, isTaken && { color: C.green }]}>{med.name}</Text>
                              <Text style={s.medChipDose}>{med.dose}</Text>
                            </View>
                            {isTaken && <IconCheck />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              ))}

              {/* ── Dynamic Progress Summary ── */}
              <LinearGradient
                colors={['rgba(6,214,138,0.1)', 'rgba(6,214,138,0.02)']}
                style={s.progressCard}
              >
                <Text style={s.progressTitle}>Daily Progress</Text>
                <View style={s.progressBarTrack}>
                  <LinearGradient
                    colors={[C.green, '#06FFA5']}
                    style={[s.progressBarFill, { width: `${progressPct}%` }]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={s.progressText}>
                  {takenDoses} of {totalDoses} doses taken  ·  {totalDoses - takenDoses} remaining
                </Text>
              </LinearGradient>
            </>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: IS_WEB ? 40 : 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  subMonth: { fontSize: 16, color: C.cyan, marginTop: 4, fontWeight: '700' },

  todayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0, 194, 212, 0.1)',
    borderWidth: 1, borderColor: 'rgba(0, 194, 212, 0.3)',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12,
  },
  todayTxt: { color: C.teal, fontSize: 13, fontWeight: '800' },

  calendarWrapper: {
    height: 80,
    marginBottom: 6, 
  },
  dateScroll: {
    flexGrow: 0,
  },
  dateStrip: { paddingHorizontal: 24, gap: 10 },
  dateChip: {
    width: 58, height: 75, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    position: 'relative',
  },
  dateChipInactive: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    shadowOpacity: 0, elevation: 0,
  },
  dateDayActive:   { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginBottom: 2 },
  dateNumActive:   { fontSize: 18, color: C.white, fontWeight: '800' },
  dateDayInactive: { fontSize: 10, color: C.gray, fontWeight: '600', marginBottom: 2 },
  dateNumInactive: { fontSize: 18, color: C.white, fontWeight: '700' },
  
  todayDotActive: {
    position: 'absolute', bottom: 6,
    width: 4, height: 4, borderRadius: 2, backgroundColor: C.white,
  },
  todayDotInactive: {
    position: 'absolute', bottom: 6,
    width: 4, height: 4, borderRadius: 2, backgroundColor: C.teal,
  },

  sliderTrackWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderThumb: {
    height: '100%',
    backgroundColor: C.teal,
    borderRadius: 2,
  },

  notifRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 24, marginBottom: 20, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
  },
  notifText: { fontSize: 14, color: C.white, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },

  instructionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(0, 194, 212, 0.08)',
    borderWidth: 1, borderColor: 'rgba(0, 194, 212, 0.25)',
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, marginBottom: 24,
  },
  instructionText: { color: C.cyan, fontSize: 13, fontWeight: '600', flex: 1 },

  emptyState: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, color: C.white, fontWeight: '800', marginBottom: 10 },
  emptySub: { fontSize: 14, color: C.gray, textAlign: 'center', paddingHorizontal: 10, lineHeight: 22 },

  timeBlock: { flexDirection: 'row', gap: 16, marginBottom: 24, position: 'relative' },
  connector: {
    position: 'absolute', left: 21, top: 48, bottom: -24,
    width: 2, backgroundColor: C.border, borderRadius: 1,
  },
  timeIconWrap: {
    width: 44, height: 44, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  timeContent: { flex: 1 },
  timeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  timeLabel: { fontSize: 11, letterSpacing: 1.5, fontWeight: '900', textTransform: 'uppercase' },
  timeText: { fontSize: 12, color: C.gray, fontWeight: '600' },
  
  medsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  medChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  medChipTaken: {
    backgroundColor: 'rgba(6,214,138,0.08)', borderColor: 'rgba(6,214,138,0.35)',
  },
  medChipContent: { flex: 1 },
  medChipName: { fontSize: 13, fontWeight: '800', color: C.white },
  medChipDose: { fontSize: 11, color: C.gray, marginTop: 2, fontWeight: '500' },

  progressCard: {
    padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(6,214,138,0.2)', marginTop: 10,
  },
  progressTitle: { fontSize: 15, fontWeight: '800', color: C.white, marginBottom: 12 },
  progressBarTrack: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 12,
  },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, color: C.gray, fontWeight: '600' },
});