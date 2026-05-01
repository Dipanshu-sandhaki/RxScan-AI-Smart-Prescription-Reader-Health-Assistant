export interface Language {
  code: string;
  name: string;
  native: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'hi', name: 'Hindi',     native: 'हिन्दी',    flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali',   native: 'বাংলা',     flag: '🌐' },
  { code: 'te', name: 'Telugu',    native: 'తెలుగు',    flag: '🌐' },
  { code: 'mr', name: 'Marathi',   native: 'मराठी',     flag: '🌐' },
  { code: 'ta', name: 'Tamil',     native: 'தமிழ்',     flag: '🌐' },
  { code: 'gu', name: 'Gujarati',  native: 'ગુજરાતી',  flag: '🌐' },
  { code: 'kn', name: 'Kannada',   native: 'ಕನ್ನಡ',    flag: '🌐' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം',    flag: '🌐' },
  { code: 'pa', name: 'Punjabi',   native: 'ਪੰਜਾਬੀ',   flag: '🌐' },
  { code: 'or', name: 'Odia',      native: 'ଓଡ଼ିଆ',     flag: '🌐' },
  { code: 'as', name: 'Assamese',  native: 'অসমীয়া',   flag: '🌐' },
  { code: 'ur', name: 'Urdu',      native: 'اردو',       flag: '🌐' },
  { code: 'en', name: 'English',   native: 'English',   flag: '🇬🇧' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली',    flag: '🌐' },
  { code: 'sa', name: 'Sanskrit',  native: 'संस्कृत',   flag: '🌐' },
  { code: 'ne', name: 'Nepali',    native: 'नेपाली',    flag: '🌐' },
  { code: 'kok', name: 'Konkani',  native: 'कोंकणी',    flag: '🌐' },
  { code: 'doi', name: 'Dogri',    native: 'डोगरी',     flag: '🌐' },
  { code: 'mni', name: 'Manipuri', native: 'মৈতৈলোন্',  flag: '🌐' },
  { code: 'sd', name: 'Sindhi',    native: 'سنڌي',       flag: '🌐' },
  { code: 'ks', name: 'Kashmiri',  native: 'कॉशुर',     flag: '🌐' },
  { code: 'bho', name: 'Bhojpuri', native: 'भोजपुरी',   flag: '🌐' },
];
