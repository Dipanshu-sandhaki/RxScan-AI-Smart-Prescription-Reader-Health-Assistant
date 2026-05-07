/**
 * RxScan AI — Results Screen
 *
 * UI/UX OVERHAUL & TRANSLATION FIX:
 * 1. Custom Premium Dropdown: Replaced the horizontal strip with a sleek,
 * interactive custom dropdown menu.
 * 2. Explicit Translate Action: Translation only triggers when the user actively
 * clicks the "Translate" button after selecting a language.
 * 3. Premium PDF Engine: Integrated a high-end HTML/CSS template for PDF generation
 * with dynamic timestamp-based file naming.
 */

import React, { useRef, useEffect, useState } from "react";
import * as Print from "expo-print";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Svg, { Path, Circle, Line, Polyline } from "react-native-svg";

import {
  translatePrescriptionData,
} from "../services/ocr.service";

const { width: SCREEN_W } = Dimensions.get("window");
const IS_WEB = Platform.OS === "web";
const ND = !IS_WEB;

// ─── Brand Tokens ─────────────────────────────────────────────
const C = {
  bg: "#03101F",
  surface: "#071828",
  card: "#0D2035",
  teal: "#00C2D4",
  cyan: "#00EDFF",
  ocean: "#013270",
  green: "#06D68A",
  warning: "#FFB800",
  white: "#FFFFFF",
  gray: "#7A8490",
  border: "rgba(255,255,255,0.08)",
};

// ─── Languages Config ─────────────────────────────────────────
const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "mr", name: "Marathi", native: "मराठी" },
];

// ─── SVG Icons ────────────────────────────────────────────────
const IconBack = ({ color = C.white, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconCheckCircle = ({ color = C.green, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" />
    <Path d="M8 12l3 3 5-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconWarning = ({ color = C.warning, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

const IconDownload = ({ color = C.bg, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconPill = ({ color = C.teal, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.5 20.5l-6-6a4.95 4.95 0 1 1 7-7l6 6a4.95 4.95 0 1 1-7 7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const IconChevronDown = ({ color = C.white, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="6 9 12 15 18 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconTranslate = ({ color = C.teal, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Helpers ─────────────────────────────────────────────────
const handleBack = (navigation: any) => {
  navigation?.navigate("MainTabs", { screen: "Home" });
};

// ─── Main Component ───────────────────────────────────────────
export default function ResultsScreen({ route, navigation }: any) {
  const originalData = route?.params?.data;

  // Translation & Dropdown States
  const [displayData, setDisplayData] = useState(originalData);
  const [activeLang, setActiveLang] = useState("en"); 
  const [selectedLang, setSelectedLang] = useState("en"); 
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [isTranslating, setIsTranslating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: ND }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: ND }),
    ]).start();
  }, []);

  // ─── Handle Translation Submit ───
  const handleTranslateSubmit = async () => {
    if (selectedLang === activeLang) {
      setDropdownOpen(false);
      return;
    }

    setDropdownOpen(false);

    if (selectedLang === "en") {
      setDisplayData(originalData);
      setActiveLang("en");
      return;
    }

    try {
      setIsTranslating(true);
      const translated = await translatePrescriptionData(originalData, selectedLang);
      setDisplayData(translated);
      setActiveLang(selectedLang);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Translation Failed",
        "Could not translate the document. Please check your backend connection.",
      );
      setSelectedLang(activeLang);
    } finally {
      setIsTranslating(false);
    }
  };

  const medicines = displayData?.medicines || [];

  if (!medicines.length) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={s.emptyContainer}>
          <View style={s.emptyIconWrap}>
            <IconWarning color={C.warning} size={36} />
          </View>
          <Text style={s.emptyTitle}>No Data Found</Text>
          <Text style={s.emptyText}>
            We couldn't detect any prescription data in this scan.{"\n"}Please
            try capturing the image again.
          </Text>
          <TouchableOpacity onPress={() => handleBack(navigation)} style={s.emptyBtn}>
            <Text style={s.emptyBtnText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalCost = medicines.reduce(
    (sum: number, m: any) => sum + (m.estimated_total_cost ?? m.cost ?? 0),
    0,
  );

  const rawDocName = displayData?.doctor_info?.name?.trim();
  const displayDocName = rawDocName ? rawDocName : "Unknown Provider";

  // ─── HIGH-END PREMIUM PDF ENGINE (Frontend Generation) ───
  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);

      // --- 1. Dynamic Premium Styling & HTML Content ---
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
              
              /* Base Setup */
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #1e293b;
                background-color: #ffffff;
                padding: 40px;
                margin: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              /* Main Card Container */
              .document-container {
                background-color: #ffffff;
                border-radius: 12px;
                padding: 20px 40px;
                max-width: 800px;
                margin: 0 auto;
                border: 1px solid #e2e8f0;
              }

              /* Header Layout */
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 3px solid #00C2D4;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .brand-title {
                font-size: 32px;
                font-weight: 800;
                color: #03101F;
                margin: 0;
                letter-spacing: -0.5px;
              }
              .brand-title span { color: #00C2D4; }
              .report-type {
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #64748b;
                margin-bottom: 4px;
              }
              
              /* Modern Info Box */
              .info-grid {
                display: flex;
                justify-content: space-between;
                background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
                border-left: 4px solid #013270;
                padding: 20px 24px;
                border-radius: 8px;
                margin-bottom: 40px;
              }
              .info-block p { margin: 0; }
              .info-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px !important; }
              .info-value { font-size: 18px; font-weight: 700; color: #0f172a; }
              .info-value-small { font-size: 14px; font-weight: 600; color: #334155; }

              /* Typography */
              .section-header {
                font-size: 16px;
                font-weight: 800;
                color: #03101F;
                margin-bottom: 16px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .section-header::before {
                content: "";
                display: inline-block;
                width: 8px;
                height: 18px;
                background-color: #00C2D4;
                border-radius: 4px;
              }

              /* Premium Table Design */
              table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                margin-bottom: 40px;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #e2e8f0;
              }
              th {
                background-color: #013270;
                color: #ffffff;
                font-weight: 600;
                font-size: 13px;
                letter-spacing: 0.5px;
                padding: 14px 16px;
                text-align: left;
              }
              td {
                padding: 14px 16px;
                font-size: 14px;
                color: #334155;
                border-bottom: 1px solid #f1f5f9;
              }
              tr:nth-child(even) { background-color: #f8fafc; }
              .med-name { font-weight: 700; color: #0f172a; font-size: 15px; }
              
              /* Grand Total Row */
              .total-row td {
                background-color: #0f172a !important;
                color: #ffffff !important;
                font-size: 15px;
                font-weight: 700;
                border: none;
                padding: 16px;
              }
              
              /* Analytics Dashboard Style */
              .metrics-grid {
                display: flex;
                gap: 16px;
                margin-bottom: 40px;
              }
              .metric-card {
                flex: 1;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
              }
              .metric-value { font-size: 28px; font-weight: 800; color: #00C2D4; margin-bottom: 6px; }
              .metric-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

              /* Footer */
              .footer {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px dashed #cbd5e1;
                font-size: 11px;
                color: #94a3b8;
                line-height: 1.6;
                text-align: center;
              }
              .footer b { color: #64748b; }
            </style>
          </head>
          <body>
            <div class="document-container">
              
              <div class="header">
                <div>
                  <div class="report-type">Medical Extraction Report</div>
                  <h1 class="brand-title"><span>Rx</span>Scan AI</h1>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-block">
                  <p class="info-label">Prescribing Provider</p>
                  <p class="info-value">${displayDocName}</p>
                </div>
                <div class="info-block" style="text-align: right;">
                  <p class="info-label">Generated On</p>
                  <p class="info-value-small">${new Date().toLocaleString()}</p>
                </div>
              </div>

              <div class="section-header">Prescribed Medications</div>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th style="text-align: right;">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${medicines.map((med: any, i: number) => `
                    <tr>
                      <td style="font-weight: 600; color: #94a3b8;">0${i + 1}</td>
                      <td class="med-name">${med.name || "N/A"}</td>
                      <td>${med.dose || med.dosage || "-"}</td>
                      <td>${med.frequency || med.instructions || "-"}</td>
                      <td>${med.duration || "-"}</td>
                      <td style="text-align: right; font-weight: 600; color: #0f172a;">₹ ${med.estimated_total_cost ?? med.cost ?? 0}</td>
                    </tr>
                  `).join("")}
                  <tr class="total-row">
                    <td colspan="5" style="text-align: right; padding-right: 24px;">TOTAL ESTIMATE:</td>
                    <td style="text-align: right;">₹ ${totalCost}</td>
                  </tr>
                </tbody>
              </table>

              <div class="section-header">Scan Analytics</div>
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-value">${Math.round((displayData?.scan_confidence || 0) * 100)}%</div>
                  <div class="metric-label">AI Accuracy</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${medicines.length}</div>
                  <div class="metric-label">Meds Found</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${activeLang.toUpperCase()}</div>
                  <div class="metric-label">Language</div>
                </div>
              </div>

              <div class="footer">
                <b>IMPORTANT MEDICAL DISCLAIMER:</b><br/>
                This document was automatically generated by RxScan AI using optical character recognition. 
                Estimated costs are based on standard NPPA ceiling prices and may vary by pharmacy and brand. 
                Always verify medications, dosages, and actual prices with your doctor or pharmacist before consumption.
              </div>
              
            </div>
          </body>
        </html>
      `;

      // --- 2. Dynamic Unique Naming using Timestamps ---
      const now = new Date();
      const timestamp = now.getFullYear().toString() + 
                       (now.getMonth() + 1).toString().padStart(2, '0') + 
                       now.getDate().toString().padStart(2, '0') + '_' + 
                       now.getHours().toString().padStart(2, '0') + 
                       now.getMinutes().toString().padStart(2, '0') + 
                       now.getSeconds().toString().padStart(2, '0');
      
      const fileNameStr = `RxScan_Report_${timestamp}_${activeLang}.pdf`;

      if (IS_WEB) {
        // Web flow: uses an iframe to print, sets dynamic title
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        iframe.contentDocument?.write(htmlContent);
        iframe.contentDocument?.close();
        
        const originalTitle = document.title;
        document.title = fileNameStr.replace('.pdf', ''); 
        
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        setTimeout(() => {
          document.title = originalTitle;
          document.body.removeChild(iframe);
        }, 1000);

      } else {
        // Mobile flow: Generate PDF and rename it before sharing
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        
        const newUri = `${FileSystem.cacheDirectory}${fileNameStr}`;
        await FileSystem.moveAsync({
          from: uri,
          to: newUri
        });

        await Sharing.shareAsync(newUri, {
          mimeType: "application/pdf",
          dialogTitle: "Share RxScan Report",
          UTI: "com.adobe.pdf",
        });
      }

      setIsDownloading(false);
    } catch (error) {
      setIsDownloading(false);
      Alert.alert(
        "Download Failed",
        "Could not generate PDF document. Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={s.container}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* ── Header Top Row ── */}
            <View style={s.headerTop}>
              <TouchableOpacity
                onPress={() => handleBack(navigation)}
                style={s.backBtn}
              >
                <IconBack />
              </TouchableOpacity>

              <View style={s.successPill}>
                <IconCheckCircle size={14} color={C.green} />
                <Text style={s.successText}>Scan Complete</Text>
              </View>

              <View style={{ width: 44 }} />
            </View>

            {/* ── Centralized Title Area ── */}
            <View style={s.titleContainer}>
              <Text style={s.docTitle}>{displayDocName}</Text>
              <Text style={s.docSub}>
                Successfully parsed{" "}
                <Text style={s.docSubHighlight}>
                  {medicines.length} medicine{medicines.length !== 1 ? "s" : ""}
                </Text>{" "}
                • Est. Cost <Text style={s.docSubHighlight}>₹{totalCost}</Text>
              </Text>
            </View>

            {/* ── Custom Dropdown Translation Engine ── */}
            <View style={s.translateSection}>
              <View style={s.translateHeaderRow}>
                <IconTranslate size={14} color={C.gray} />
                <Text style={s.translateTitle}>Translate Results</Text>
              </View>

              <View style={s.translateControls}>
                {/* Custom Dropdown */}
                <View style={s.dropdownContainer}>
                  <TouchableOpacity
                    style={s.dropdownHeader}
                    activeOpacity={0.8}
                    onPress={() => setDropdownOpen(!dropdownOpen)}
                    disabled={isTranslating}
                  >
                    <Text style={s.dropdownHeaderText}>
                      {LANGUAGES.find((l) => l.code === selectedLang)?.native ||
                        "Select Language"}
                    </Text>
                    <IconChevronDown color={C.cyan} size={16} />
                  </TouchableOpacity>

                  {/* Dropdown Menu (Inline Expansion) */}
                  {dropdownOpen && (
                    <View style={s.dropdownMenu}>
                      {LANGUAGES.map((lang) => (
                        <TouchableOpacity
                          key={lang.code}
                          style={[
                            s.dropdownItem,
                            selectedLang === lang.code && s.dropdownItemActive,
                          ]}
                          onPress={() => {
                            setSelectedLang(lang.code);
                            setDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              s.dropdownItemText,
                              selectedLang === lang.code && { color: C.teal },
                            ]}
                          >
                            {lang.native}{" "}
                            <Text style={{ color: C.gray, fontSize: 12 }}>
                              ({lang.name})
                            </Text>
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Translate Button */}
                <TouchableOpacity
                  style={[
                    s.translateBtn,
                    (isTranslating || selectedLang === activeLang) && {
                      opacity: 0.5,
                    },
                  ]}
                  onPress={handleTranslateSubmit}
                  disabled={isTranslating || selectedLang === activeLang}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[C.teal, C.ocean]}
                    style={s.translateBtnGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isTranslating ? (
                      <ActivityIndicator color={C.white} size="small" />
                    ) : (
                      <Text style={s.translateBtnTxt}>Translate</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Main Content Wrapper (Dims when fetching translation) */}
            <View style={[s.contentWrapper, isTranslating && { opacity: 0.3 }]}>
              {/* Warnings */}
              {displayData?.warnings?.length > 0 && (
                <View style={s.warningBox}>
                  <IconWarning size={20} />
                  <Text style={s.warningText}>{displayData.warnings[0]}</Text>
                </View>
              )}

              {/* Confidence Score */}
              <View style={s.confContainer}>
                <View style={s.confRow}>
                  <Text style={s.confLabel}>AI Confidence Score</Text>
                  <Text style={s.confPct}>
                    {Math.round((displayData?.scan_confidence || 0) * 100)}%
                  </Text>
                </View>
                <View style={s.confTrack}>
                  <LinearGradient
                    colors={[C.teal, C.cyan]}
                    style={[
                      s.confFill,
                      {
                        width: `${Math.round((displayData?.scan_confidence || 0) * 100)}%`,
                      },
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
              </View>

              {/* Download PDF */}
              <TouchableOpacity
                style={[s.downloadBtn, isDownloading && { opacity: 0.7 }]}
                onPress={handleDownloadPDF}
                disabled={isDownloading || isTranslating}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[C.teal, "#009CC0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.downloadGrad}
                >
                  {isDownloading ? (
                    <>
                      <ActivityIndicator color={C.white} size="small" />
                      <Text style={s.downloadBtnText}>
                        Generating Document…
                      </Text>
                    </>
                  ) : (
                    <>
                      <IconDownload color={C.white} />
                      <Text style={s.downloadBtnText}>
                        Download Official PDF
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Medicines List */}
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Prescribed Medications</Text>
                <View style={s.sectionLine} />
              </View>

              <View style={s.medList}>
                {medicines.map((med: any, i: number) => (
                  <View key={med.id || i} style={s.medCard}>
                    <View style={s.medAccentBar} />
                    <View style={s.medContent}>
                      <View style={s.medTopRow}>
                        <View style={s.medNameWrap}>
                          <View style={s.medIconBadge}>
                            <IconPill />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.medName} numberOfLines={1}>
                              {med.name}
                            </Text>
                            <Text style={s.medGeneric} numberOfLines={1}>
                              {med.generic_name || med.generic || "Generic N/A"}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            s.medAccuracyBadge,
                            {
                              backgroundColor:
                                (med.confidence || 0) > 0.8
                                  ? "rgba(6, 214, 138, 0.1)"
                                  : "rgba(255, 184, 0, 0.1)",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              s.medAccuracyTxt,
                              {
                                color:
                                  (med.confidence || 0) > 0.8
                                    ? C.green
                                    : C.warning,
                              },
                            ]}
                          >
                            {Math.round((med.confidence || 0) * 100)}% Match
                          </Text>
                        </View>
                      </View>

                      <View style={s.tagsRow}>
                        {[
                          med.dose || med.dosage,
                          med.frequency,
                          med.timing || med.instructions,
                          med.duration,
                        ]
                          .filter(Boolean)
                          .map((t: string, ti: number) => (
                            <View key={ti} style={s.tag}>
                              <Text style={s.tagText}>{t}</Text>
                            </View>
                          ))}
                      </View>

                      <View style={s.medBottomRow}>
                        <Text style={s.medCostLabel}>Estimated Cost</Text>
                        <Text style={s.medCostVal}>
                          ₹ {med.estimated_total_cost ?? med.cost ?? 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: C.bg,
  },

  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: IS_WEB ? 40 : 20,
    paddingBottom: 60,
  },

  contentWrapper: {
    transition: "opacity 0.3s ease",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 184, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    color: C.white,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyText: {
    color: C.gray,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyBtnText: { color: C.white, fontWeight: "700", fontSize: 15 },

  // Header Area
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  successPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(6, 214, 138, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(6, 214, 138, 0.2)",
  },
  successText: {
    color: C.green,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  titleContainer: { alignItems: "center", marginBottom: 32 },
  docTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: C.white,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  docSub: {
    fontSize: 14,
    color: C.gray,
    textAlign: "center",
    fontWeight: "500",
  },
  docSubHighlight: { color: C.white, fontWeight: "700" },

  // ── Custom Translation Dropdown ──
  translateSection: {
    marginBottom: 32,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  translateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  translateTitle: {
    fontSize: 12,
    color: C.gray,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  translateControls: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  dropdownContainer: {
    flex: 1,
    position: "relative",
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: "rgba(0, 194, 212, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  dropdownHeaderText: {
    color: C.white,
    fontSize: 15,
    fontWeight: "600",
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  dropdownItemActive: {
    backgroundColor: "rgba(0, 194, 212, 0.1)",
  },
  dropdownItemText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "500",
  },
  translateBtn: {
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    width: 110,
  },
  translateBtnGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  translateBtnTxt: {
    color: C.white,
    fontSize: 14,
    fontWeight: "800",
  },

  // Info Boxes
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255, 184, 0, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 184, 0, 0.3)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  warningText: {
    color: C.warning,
    fontSize: 14,
    flex: 1,
    fontWeight: "600",
    lineHeight: 22,
  },

  confContainer: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 24,
  },
  confRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  confLabel: { color: C.gray, fontSize: 14, fontWeight: "600" },
  confPct: { color: C.cyan, fontSize: 15, fontWeight: "800" },
  confTrack: {
    height: 8,
    backgroundColor: C.card,
    borderRadius: 4,
    overflow: "hidden",
  },
  confFill: { height: "100%", borderRadius: 4 },

  downloadBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 40,
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  downloadGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
  },
  downloadBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Med List section
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.border },

  medList: { gap: 16 },
  medCard: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  medAccentBar: { width: 4, backgroundColor: C.teal },
  medContent: { flex: 1, padding: 20 },
  medTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  medNameWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
    paddingRight: 10,
  },
  medIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  medName: { fontSize: 17, fontWeight: "800", color: C.white, marginBottom: 4 },
  medGeneric: { fontSize: 13, color: C.gray, fontWeight: "500" },

  medAccuracyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  medAccuracyTxt: { fontSize: 11, fontWeight: "800" },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  tag: {
    backgroundColor: C.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  tagText: { color: C.cyan, fontSize: 12, fontWeight: "600" },

  medBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  medCostLabel: { color: C.gray, fontSize: 13, fontWeight: "500" },
  medCostVal: { color: C.white, fontSize: 16, fontWeight: "800" },
});