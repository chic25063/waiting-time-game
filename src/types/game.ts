export interface Game {
  id: string;
  title: string;
  min_players: number;
  max_players: number;
  description: string;
  created_at: string;
}

export type PlayerCountOption = 2 | 3 | 4 | 5 | 6;
