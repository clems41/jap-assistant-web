export interface EnumChoice {
  value: string;
  label: string;
}

export interface Tournament {
  id: number;
  owner: number;
  name: string;
  category: string;
  start_date: string;
  location: string;
  league: string;
  gender: string;
  created_at: string;
  updated_at: string;
}

export interface TournamentRequest {
  name: string;
  category: string;
  start_date: string;
  location: string;
  league: string;
  gender: string;
}

export interface PaginatedTournamentList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tournament[];
}
