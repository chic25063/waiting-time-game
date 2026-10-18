// 対戦モード
export type MatchMode = "duel_1v1" | "party_multi";

// 1vs1の勝利条件
export type DuelRule = "first_to_3" | "first_to_5";

// 多人数の対戦形式
export type MultiRuleType = "point_race" | "survival_knockout" | "loser_king";

// 多人数点数制の終了条件
export type PointRaceGoal = "rounds_3" | "rounds_5" | "points_3";

// プレイヤー情報
export interface MatchPlayer {
  id: string;
  name: string;
}

// 対戦セッション設定
export interface MatchSessionConfig {
  mode: MatchMode;
  players: MatchPlayer[];
  excludedGameIds: string[]; // BANリスト (除外ゲーム)

  // 1vs1設定
  duelRule?: DuelRule;

  // 多人数設定
  multiRuleType?: MultiRuleType;
  pointRaceGoal?: PointRaceGoal;
  loserPenaltyText?: string; // 最弱王の罰ゲーム内容
}

// リアルタイム対戦進行状態
export interface MatchProgressState {
  currentRound: number;
  currentGameId: string;
  isRouletteSpinning: boolean;
  
  // プレイヤー別スコア・生存状態
  playerScores: Record<string, number>; // playerId -> 勝利点
  eliminatedPlayerIds: string[];        // 勝ち残り制で脱落した人
  escapedPlayerIds: string[];           // 負け残り制で勝ち抜けた人

  // サドンデス状態（同点時の延長戦）
  isSuddenDeath?: boolean;
  suddenDeathPlayerIds?: string[];

  // 決着情報
  winnerPlayer?: MatchPlayer;
  loserPlayer?: MatchPlayer;
  isMatchFinished: boolean;
}

// 最弱王の罰ゲームおすすめプリセット一覧
export const PENALTY_PRESETS = [
  "🍹 ジュース奢り",
  "🤪 変顔で記念撮影",
  "🎤 全力モノマネ披露",
  "👑 次のゲームの専属GM担当",
  "🙏 全員を全力で褒めちぎる",
  "🔥 語尾に「〜にゃん」をつけて会話",
  "📱 待ち受けを勝者が選んだ画像にする",
];
