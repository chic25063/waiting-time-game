export type ToolType = "prompt" | "bpm" | "timer" | "score" | "elimination" | "elimination_tracker";

export interface Player {
  id: string;
  name: string;
  score: number;
  isOut: boolean;
}

export interface RiddlePrompt {
  question: string;
  answer: string;
  hint?: string;
}

export type PromptItem = string | RiddlePrompt;

export interface GameMetadata {
  tools: ToolType[];
  defaultBpm?: number;
  timerDuration?: number; // 秒数
  blindTimer?: boolean; // ブラインドタイマーモードがデフォルトかどうか
  promptList?: PromptItem[];
  ruleSummary?: string[]; // 箇条書きルール
  callExample?: string; // かけ声・コールの例
  tags?: string[]; // カテゴリタグ
}

export interface Game {
  id: string;
  title: string;
  min_players: number;
  max_players: number;
  description: string;
  created_at: string;
  metadata?: GameMetadata;
  // Supabase等のフィールド互換用
  prompt_list?: PromptItem[];
  tools?: ToolType[];
  default_bpm?: number;
  // エイリアス用フィールド
  short_description?: string;
  rules?: string[];
  call_examples?: string[];
  master_tools?: (ToolType | string)[];
}

export type PlayerCountOption = 2 | 3 | 4 | 5 | 6;
