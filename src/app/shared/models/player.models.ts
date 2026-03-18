export interface Player {
  id: number;
  last_name: string;
  first_name: string;
  licence_number: string;
  phone: string;
  ranking: number;
}

export interface Pair {
  id: number;
  player1: Player;
  player2: Player;
  weight: number;
}
