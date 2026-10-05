export interface TimeSlotOption {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  votes: string[]; // Voter names (e.g. ["ตึงตัง", "หยก", "พลอย"])
}

export interface CourtSchedulePoll {
  id: string;
  courtName: string; // Venue / Court name e.g. "Winner Badminton Court"
  title: string;
  notes?: string;
  createdAt: string;
  status: 'voting' | 'confirmed' | 'closed';
  confirmedSlotId?: string;
  options: TimeSlotOption[];
}
