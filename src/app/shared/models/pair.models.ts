export interface Player {
  id: number;
  last_name: string;
  first_name: string;
  license_number: string;
  phone?: string;
  ranking: number | null;
}

export interface Pair {
  id: number;
  player1: Player;
  player2: Player;
  weight: number | null;
}

export interface PlayerInPairRequest {
  last_name: string;
  first_name: string;
  license_number: string;
  phone?: string;
  ranking?: number | null;
}

export interface PairRequest {
  player1: PlayerInPairRequest;
  player2: PlayerInPairRequest;
  weight?: number | null;
}
