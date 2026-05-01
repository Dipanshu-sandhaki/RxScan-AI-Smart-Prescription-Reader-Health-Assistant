/**
 * RxScan AI — OCR Service
 * Connects React Native frontend to FastAPI backend.
 * Handles: scan, drug lookup, API health check.
 */

import axios, { AxiosError } from 'axios';

// ─── Config ──────────────────────────────────────────────────────────────────
// Change this to your backend URL:
// Development:  http://localhost:8000  (iOS simulator)
//               http://10.0.2.2:8000   (Android emulator)
//               http://YOUR_IP:8000    (Real device on same WiFi)
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.47.238.159:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60s — TrOCR can be slow on first request
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
  rxnorm: {
    found: boolean;
    name: string;
    rxcui?: string;
    synonym?: string;
    drug_class?: string;
  };
  fda_info: {
    indications?: string;
    warnings?: string;
    storage?: string;
  };
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Scan a prescription image.
 * @param imageUri - Local file URI from camera/gallery
 * @param isHandwritten - true for handwriting, false for typed (default: true)
 * @returns Structured prescription data
 */
export async function scanPrescription(
  imageUri: string,
  isHandwritten: boolean = true
): Promise<ScanResult> {
  try {
    const formData = new FormData();

    // React Native file upload format
    const filename = imageUri.split('/').pop() || 'prescription.jpg';
    const fileType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: fileType,
    } as any);

    formData.append('is_handwritten', String(isHandwritten));

    const response = await api.post<ScanResult>('/api/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
    });

    return response.data;

  } catch (error) {
    const axiosError = error as AxiosError<{ detail: string }>;

    if (axiosError.response) {
      const detail = axiosError.response.data?.detail || 'Scan failed';
      throw new Error(detail);
    } else if (axiosError.code === 'ECONNABORTED') {
      throw new Error('Scan timed out. The image may be too complex. Try again.');
    } else if (axiosError.code === 'ECONNREFUSED') {
      throw new Error(
        'Cannot connect to server. Make sure backend is running.\n' +
        `Expected: ${API_BASE}`
      );
    }
    throw error;
  }
}

/**
 * Get drug information from RxNorm + OpenFDA (both free APIs).
 */
export async function getDrugInfo(drugName: string): Promise<DrugInfo> {
  const response = await api.get<DrugInfo>(`/api/drug/${encodeURIComponent(drugName)}`);
  return response.data;
}

/**
 * Check if backend is healthy and models are loaded.
 */
export async function checkBackendHealth(): Promise<{
  online: boolean;
  modelsLoaded: boolean;
  message: string;
}> {
  try {
    const healthResp = await api.get('/health', { timeout: 5000 });
    const ocrResp = await api.get('/api/scan/health', { timeout: 5000 });

    return {
      online: true,
      modelsLoaded: ocrResp.data?.models_loaded ?? false,
      message: ocrResp.data?.models_loaded
        ? '✅ Backend ready'
        : '⏳ Models loading (wait 30s)',
    };
  } catch {
    return {
      online: false,
      modelsLoaded: false,
      message: '❌ Backend offline. Start uvicorn.',
    };
  }
}

/**
 * Get format string for medicine display.
 * e.g., "Amoxicillin 500mg — Twice daily after meals"
 */
export function formatMedicineDisplay(med: MedicineResult): string {
  const parts = [med.name];
  if (med.dose) parts.push(med.dose);
  if (med.frequency) parts.push(`— ${med.frequency}`);
  if (med.timing) parts.push(med.timing);
  return parts.join(' ');
}

/**
 * Get confidence label and color for UI display.
 */
export function getConfidenceInfo(confidence: number): {
  label: string;
  color: string;
} {
  if (confidence >= 0.85) return { label: 'High Confidence', color: '#06FFA5' };
  if (confidence >= 0.70) return { label: 'Medium Confidence', color: '#FFB800' };
  return { label: 'Low — Please Verify', color: '#EF476F' };
}