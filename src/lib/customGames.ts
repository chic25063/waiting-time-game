import { Game, ToolType } from "@/types/game";
import { ALL_GAMES } from "@/data/games";

export const CUSTOM_GAMES_STORAGE_KEY = "machajikan_custom_games_v1";

// おすすめテンプレート定義
export interface CustomGameTemplate {
  name: string;
  badge: string;
  title: string;
  short_description: string;
  description: string;
  rules: string[];
  min_players: number;
  max_players: number;
  selectedTool: "prompt" | "bpm" | "timer" | "none";
  promptListText?: string;
  defaultBpm?: number;
  timerDuration?: number;
}

export const CUSTOM_GAME_TEMPLATES: CustomGameTemplate[] = [
  {
    name: "古今東西（お題ガチャ）",
    badge: "🎴 お題",
    title: "オリジナル山手線ゲーム",
    short_description: "リズムに合わせてお題に沿った言葉を順番に言っていくゲーム！",
    description: "手拍子のリズムに乗って、画面に表示されたお題に当てはまる言葉を順番に答えます。被りや詰まり、リズムに乗れなかったらアウト！",
    rules: ["手拍子を2回叩いて答える", "直前と同じ答えはNG", "3秒以上止まったら負け"],
    min_players: 2,
    max_players: 8,
    selectedTool: "prompt",
    promptListText: "コンビニのお菓子\n赤い食べ物\nディズニーキャラクター\n4文字の言葉\n学校にあるもの\n夏といえば？\nジブリの登場人物\n家電製品",
  },
  {
    name: "一言大喜利バトル",
    badge: "🎤 お題",
    title: "スピード一言大喜利",
    short_description: "次々出るお題に一番面白い回答をした人が勝ち！",
    description: "表示されたお題に対して、プレイヤー全員が一言でボケます。一番笑いを取った人がこのラウンドの勝者！",
    rules: ["お題を見て30秒以内に回答", "全員が回答したら多数決で勝者を決定"],
    min_players: 3,
    max_players: 8,
    selectedTool: "prompt",
    promptListText: "こんな駅員さんは嫌だ\n先生が職員室でこっそり言ってそうなこと\n誰も買わない新商品の名前\nドラえもんが絶対に出さない秘密道具\n100年後の日本の流行語",
  },
  {
    name: "体内時計10秒当て",
    badge: "⏱️ タイマー",
    title: "体内時計ジャストチャレンジ",
    short_description: "画面を見ずに頭の中で10秒カウントしてストップ！",
    description: "タイマーをスタートさせたらスマホを伏せるか目を閉じ、10秒ピッタリだと思うタイミングでタップ。一番10秒に近かった人の勝利！",
    rules: ["時計を見るのは禁止", "「せーの」でスタートし、各自自分のタイミングで宣言する"],
    min_players: 2,
    max_players: 6,
    selectedTool: "timer",
    timerDuration: 10,
  },
  {
    name: "リズム連呼ゲーム",
    badge: "🎵 BPM",
    title: "高速リズムコール",
    short_description: "BPMのスピードに合わせて単語を噛まずに言い切れるか勝負！",
    description: "メトロノームのビートに合わせて順番に早口言葉や決め言葉を言っていきます。噛んだりテンポから遅れたら脱落！",
    rules: ["4拍子のリズムに合わせて発言", "噛んだら即アウト"],
    min_players: 2,
    max_players: 8,
    selectedTool: "bpm",
    defaultBpm: 120,
  },
];

// ローカルストレージから自作ゲーム一覧を取得
export function getCustomGames(): Game[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(CUSTOM_GAMES_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to load custom games:", e);
    return [];
  }
}

// 自作ゲームを保存（新規追加または更新）
export function saveCustomGame(game: Game): Game[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getCustomGames();
    const existingIndex = current.findIndex((g) => g.id === game.id);
    let updated: Game[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = game;
    } else {
      updated = [game, ...current];
    }

    localStorage.setItem(CUSTOM_GAMES_STORAGE_KEY, JSON.stringify(updated));
    // カスタムイベントを発火して同一画面内の他コンポーネントにも通知
    window.dispatchEvent(new Event("customGamesUpdated"));
    return updated;
  } catch (e) {
    console.error("Failed to save custom game:", e);
    return [];
  }
}

// 自作ゲームを削除
export function deleteCustomGame(id: string): Game[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getCustomGames();
    const filtered = current.filter((g) => g.id !== id);
    localStorage.setItem(CUSTOM_GAMES_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event("customGamesUpdated"));
    return filtered;
  } catch (e) {
    console.error("Failed to delete custom game:", e);
    return [];
  }
}

// ALL_GAMES + 自作ゲームを合体した全ゲーム配列を取得
export function getAllGamesWithCustom(): Game[] {
  const custom = getCustomGames();
  return [...custom, ...ALL_GAMES];
}
