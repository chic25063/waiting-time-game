export interface PlayerStats {
  id: string;
  name: string;
  totalWins: number;      // 通算勝利数 (★)
  matchCount: number;     // 参加マッチ数
  consecutiveWins?: number; // 現在の連勝数 (2以上で🔥)
  underdogWins?: number;    // 下克上勝利数
}

export interface SessionData {
  sessionId: string;
  players: PlayerStats[];
  lastUpdated: string;
}

// 5大マッチエンジン種別（後方互換あり）
export type MatchEngineType =
  | "quick_elimination"     // サバイバル脱落型 (ちんちん侍、ほうれん草、めちゃギントン等)
  | "survival_elimination"  // (エイリアス)
  | "tool_assisted"         // ツール連動汎用型
  | "precision_time_attack" // 体内時計・秒数あてランキング型 (秒数あてゲーム、キムチ等)
  | "tournament_duel"       // 1vs1 デュエル＆勝ち抜きトーナメント型 (CCレモン、戦争、グリンピース、カレーライス)
  | "turn_relay_blitz"      // ターン制リレー＆プレッシャー型 (○○から始まるリズム、頭お尻ゲーム、後出しじゃんけん)
  | "consensus_coop";       // パーティー一致＆異端児判定型 (解答が一致するまで終われまてん)
