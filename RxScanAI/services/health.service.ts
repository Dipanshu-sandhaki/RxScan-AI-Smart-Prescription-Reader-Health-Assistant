/**
 * RxScan AI — Health & Translation Service
 * Handles: translation, TTS, pharmacy search, language management.
 */

import axios from 'axios';
import * as Speech from 'expo-speech';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
const api = axios.create({ baseURL: API_BASE, timeout: 30000 });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Language {
  code: string;
  name: string;
}

export interface TranslateResult {
  original_text: string;
  translated_text: string;
  target_language: string;
  language_name: string;
  provider: string;
  success: boolean;
}

export interface Pharmacy {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  total_ratings: number;
  open_now: boolean | null;
  distance_meters: number;
  phone?: string;
  note?: string;
  delivery?: boolean;
  url?: string;
}

export interface PharmacyResult {
  success: boolean;
  count: number;
  pharmacies: Pharmacy[];
  user_location: { lat: number; lng: number };
}

// ─── Supported Languages ─────────────────────────────────────────────────────

export const INDIAN_LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'or', name: 'Odia' },
  { code: 'as', name: 'Assamese' },
  { code: 'ur', name: 'Urdu' },
];

// Map our language codes to expo-speech BCP-47 tags
const EXPO_SPEECH_LANGUAGE_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  ur: 'ur-IN',
};

// ─── Translation ──────────────────────────────────────────────────────────────

/**
 * Translate text to target language via backend.
 * Backend uses Bhashini (free) → MyMemory (free) as fallback.
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<TranslateResult> {
  const response = await api.post<TranslateResult>('/api/translate', {
    text,
    target_language: targetLanguage,
    source_language: sourceLanguage,
  });
  return response.data;
}

/**
 * Translate a full medicine summary to the user's preferred language.
 * Returns translated text or original if translation fails.
 */
export async function translateMedicineSummary(
  medicines: Array<{ name: string; dose: string; frequency: string; timing: string }>,
  targetLanguage: string
): Promise<string> {
  if (targetLanguage === 'en') {
    return medicines
      .map((m) => `${m.name} ${m.dose} — ${m.frequency}${m.timing ? ' ' + m.timing : ''}`)
      .join('\n');
  }

  const summaryText = medicines
    .map((m, i) => `${i + 1}. ${m.name} ${m.dose}: ${m.frequency}${m.timing ? ', ' + m.timing : ''}`)
    .join('. ');

  try {
    const result = await translateText(summaryText, targetLanguage);
    return result.translated_text;
  } catch {
    return summaryText; // fallback to English
  }
}

// ─── Text-to-Speech ──────────────────────────────────────────────────────────

/**
 * Speak text in the selected language.
 * Uses device TTS (expo-speech) — works fully offline, no API needed.
 */
export function speakText(text: string, languageCode: string = 'en'): void {
  const langTag = EXPO_SPEECH_LANGUAGE_MAP[languageCode] || 'en-IN';

  Speech.speak(text, {
    language: langTag,
    rate: 0.85,      // Slightly slower for medical terms
    pitch: 1.0,
    onError: (error) => {
      console.warn('TTS error:', error);
      // Fallback to English
      Speech.speak(text, { language: 'en-IN', rate: 0.85 });
    },
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

export function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

// ─── Pharmacy ─────────────────────────────────────────────────────────────────

/**
 * Find nearby pharmacies.
 * @param lat - User's latitude
 * @param lng - User's longitude
 * @param radius - Search radius in meters (default 2km)
 */
export async function getNearbyPharmacies(
  lat: number,
  lng: number,
  radius: number = 2000
): Promise<PharmacyResult> {
  const response = await api.get<PharmacyResult>('/api/pharmacies/nearby', {
    params: { lat, lng, radius },
  });
  return response.data;
}

// ─── Supported Languages from Backend ────────────────────────────────────────

export async function getSupportedLanguages(): Promise<Language[]> {
  try {
    const response = await api.get<{ languages: Language[] }>('/api/languages');
    return response.data.languages;
  } catch {
    return INDIAN_LANGUAGES; // fallback to static list
  }
}