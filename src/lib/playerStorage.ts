import { Player } from "@/types/game";

export const PLAYER_STORAGE_KEY = "waiting_game_players";

// サンプルで使えるランダムニックネーム（友人同士・合コン・飲み会・待ち時間で盛り上がる）
export const PRESET_NICKNAMES = [
  "たろう",
  "はなこ",
  "そうた",
  "ゆい",
  "れん",
  "あおい",
  "ひなた",
  "りく",
  "さくら",
  "こうき",
];

// デフォルトプレイヤー生成関数
export function generateDefaultPlayers(count: number = 3): Player[] {
  const safeCount = Math.max(2, Math.min(8, count));
  return Array.from({ length: safeCount }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `プレイヤー ${i + 1}`,
    score: 0,
    isOut: false,
  }));
}

// ローカルストレージからプレイヤー一覧を取得
export function loadStoredPlayers(fallbackCount: number = 3): Player[] {
  if (typeof window === "undefined") {
    return generateDefaultPlayers(fallbackCount);
  }

  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return generateDefaultPlayers(fallbackCount);

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 2) {
      return generateDefaultPlayers(fallbackCount);
    }

    // データのバリデーションとサニタイズ
    return parsed.map((p, idx) => ({
      id: typeof p.id === "string" ? p.id : `p-${Date.now()}-${idx}`,
      name: typeof p.name === "string" && p.name.trim() !== "" ? p.name.trim() : `プレイヤー ${idx + 1}`,
      score: typeof p.score === "number" ? p.score : 0,
      isOut: Boolean(p.isOut),
    }));
  } catch (e) {
    console.error("Failed to load players from localStorage:", e);
    return generateDefaultPlayers(fallbackCount);
  }
}

// ローカルストレージへプレイヤー一覧を保存
export function saveStoredPlayers(players: Player[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(players));
  } catch (e) {
    console.error("Failed to save players to localStorage:", e);
  }
}

// 指定した目標人数に合わせてプレイヤーリストを調整（既存の名前を活かしつつ過不足を調整）
export function syncPlayersWithCount(
  existing: Player[],
  targetCount: number,
  minCount: number = 2,
  maxCount: number = 8,
  resetGameStatus: boolean = false
): Player[] {
  const safeCount = Math.max(minCount, Math.min(maxCount, targetCount));

  if (!existing || existing.length === 0) {
    return generateDefaultPlayers(safeCount);
  }

  let result: Player[] = [];

  if (existing.length >= safeCount) {
    result = existing.slice(0, safeCount);
  } else {
    result = [...existing];
    for (let i = existing.length; i < safeCount; i++) {
      result.push({
        id: `player-${Date.now()}-${i + 1}`,
        name: `プレイヤー ${i + 1}`,
        score: 0,
        isOut: false,
      });
    }
  }

  if (resetGameStatus) {
    return result.map((p) => ({
      ...p,
      score: 0,
      isOut: false,
    }));
  }

  return result;
}

