export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  estimatedCost: number;
  confidence: number;
  timing: ('morning' | 'afternoon' | 'night')[];
}

export interface Prescription {
  id: string;
  doctorName: string;
  date: string;
  imageUri: string;
  medicines: Medicine[];
  totalCost: number;
  overallConfidence: number;
  language: string;
  rawText: string;
}

export interface DoseEntry {
  medicineId: string;
  medicineName: string;
  dosage: string;
  timing: 'morning' | 'afternoon' | 'night';
  taken: boolean;
  time: string;
}

export interface ScheduleDay {
  date: string;
  doses: DoseEntry[];
}
