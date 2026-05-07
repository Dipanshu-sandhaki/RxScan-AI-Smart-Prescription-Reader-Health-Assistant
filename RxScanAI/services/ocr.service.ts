/**
 * RxScan AI — OCR Service
 * Connects React Native frontend to FastAPI backend.
 * Handles: scan, drug lookup, API health check, HISTORY management, and TRANSLATION.
 */

import axios, { AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Config ──────────────────────────────────────────────────────────────────
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? "http://127.0.0.1:8000"
    : "http://192.168.8.104:8000");

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

// Automatically attach Auth Token to requests so history is linked to the user
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return config;
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MedicineResult {
  name: string;
  generic_name: string;
  dose: string;
  frequency: string;
  duration: string;
  timing: string;
  confidence: number;
  in_database: boolean;
  estimated_price_per_unit: number;
  total_units_needed: number;
  estimated_total_cost: number;
}

export interface LineResult {
  line_number: number;
  text: string;
  confidence: number;
}

export interface DoctorInfo {
  name: string;
  qualifications: string;
  reg_no: string;
}

export interface ScanResult {
  success: boolean;
  raw_text: string;
  medicines: MedicineResult[];
  doctor_info: DoctorInfo;
  patient_info: {
    name: string;
    age: string;
    gender: string;
  };
  total_cost_estimate: number;
  scan_confidence: number;
  medicine_count: number;
  warnings: string[];
  lines_detected: number;
  line_details: LineResult[];
  processing_time_seconds: number;
  message?: string;
}

export interface DrugInfo {
  drug_name: string;
  rxnorm: any;
  fda_info: any;
}

export interface ScanHistoryItem {
  id: string;
  doctor_info: { name: string };
  created_at: string;
  medicines: any[];
  scan_confidence: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function scanPrescription(
  imageUri: string,
  isHandwritten: boolean = true,
): Promise<ScanResult> {
  try {
    const formData = new FormData();
    const filename = imageUri.split("/").pop() || "prescription.jpg";
    const fileType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
    const isReactNative =
      typeof window === "undefined" ||
      (imageUri.startsWith("file://") && !imageUri.includes("blob"));

    if (isReactNative) {
      formData.append("file", {
        uri: imageUri,
        name: filename,
        type: fileType,
      } as any);
    } else {
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append("file", blob, filename);
      } catch (fetchErr) {
        formData.append("file", {
          uri: imageUri,
          name: filename,
          type: fileType,
        } as any);
      }
    }

    formData.append("is_handwritten", String(isHandwritten));
    console.log("📤 Uploading to backend:", API_BASE);

    const response = await api.post<ScanResult>("/api/scan", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // ── STRICT FILTERING LOGIC ──
    if (
      response.data.success &&
      response.data.medicines &&
      response.data.medicines.length > 0
    ) {
      console.log("✅ Scan successful & medicines found. Saving to history...");
      try {
        await api.post("/api/history", response.data);
      } catch (historyErr) {
        console.log(
          "⚠️ Could not save to history, but scan succeeded.",
          historyErr,
        );
      }
    } else {
      console.log(
        "⚠️ Scan produced no medicines. Discarding from history and schedule.",
      );
    }

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail: string }>;
    if (axiosError.response) {
      const detail = axiosError.response.data?.detail || "Scan failed";
      throw new Error(detail);
    } else if (axiosError.code === "ECONNABORTED") {
      throw new Error(
        "Scan timed out. The image may be too complex. Try again.",
      );
    } else if (axiosError.code === "ECONNREFUSED") {
      throw new Error(
        "Cannot connect to server. Make sure backend is running.",
      );
    }
    throw error;
  }
}

// ─── TRANSLATION API ────────────────────────────────────────────────────────────

export async function translatePrescriptionData(data: any, targetLang: string): Promise<any> {
  try {
    console.log(`🌐 Requesting translation to: ${targetLang}`);
    
    // Explicitly defining headers to prevent 422 format mismatch errors
    const response = await api.post('/api/translate/full', {
      target_lang: targetLang,
      data: data || {} 
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data.translated_data;
  } catch (error) {
    console.error("Translation API Error:", error);
    throw new Error('Failed to translate prescription');
  }
}

// ─── HISTORY APIs ──────────────────────────────────────────────────────────────

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  const response = await api.get("/api/history");
  return response.data;
}

export async function deleteScanHistory(ids: string[]): Promise<void> {
  await api.delete("/api/history", { data: { ids } });
}

// ─── UTILS ─────────────────────────────────────────────────────────────────────

export async function getDrugInfo(drugName: string): Promise<DrugInfo> {
  const response = await api.get<DrugInfo>(
    `/api/drug/${encodeURIComponent(drugName)}`,
  );
  return response.data;
}

export async function checkBackendHealth(): Promise<any> {
  try {
    const healthResp = await api.get("/health", { timeout: 5000 });
    return { online: true, modelsLoaded: true, message: "✅ Backend ready" };
  } catch {
    return {
      online: false,
      modelsLoaded: false,
      message: "❌ Backend offline",
    };
  }
}

export async function downloadPrescriptionPDF(
  prescriptionData: any,
): Promise<ArrayBuffer> {
  try {
    const response = await api.post(
      "/api/pdf/download",
      {
        medicines: prescriptionData.medicines || [],
        doctor_info: prescriptionData.doctor_info || null,
        scan_confidence: prescriptionData.scan_confidence || 0,
        processing_time_seconds: prescriptionData.processing_time_seconds || 0,
      },
      { responseType: "arraybuffer", timeout: 30000 },
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to generate PDF");
  }
}

export function formatMedicineDisplay(med: MedicineResult): string {
  const parts = [med.name];
  if (med.dose) parts.push(med.dose);
  if (med.frequency) parts.push(`— ${med.frequency}`);
  if (med.timing) parts.push(med.timing);
  return parts.join(" ");
}

export function getConfidenceInfo(confidence: number) {
  if (confidence >= 0.85) return { label: "High Confidence", color: "#06FFA5" };
  if (confidence >= 0.7)
    return { label: "Medium Confidence", color: "#FFB800" };
  return { label: "Low — Please Verify", color: "#EF476F" };
}
