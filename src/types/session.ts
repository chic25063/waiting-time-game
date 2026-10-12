export interface PlayerStats {
  id: string;
  name: string;
  totalWins: number;      // 通算勝利数 (★)
  matchCount: number;     // 参加マッチ数
}

export interface SessionData {
  sessionId: string;
  players: PlayerStats[];
  lastUpdated: string;
}

export type MatchEngineType =
  | "quick_elimination"   // リアル完結型 (ちんちん侍、ほうれん草、あぶりカルビ等)
  | "tool_assisted";     // ツール連動型 (山手線、マジカルバナナ、しりとり等)
