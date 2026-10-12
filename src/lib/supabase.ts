import { createClient } from "@supabase/supabase-js";
import { Game } from "@/types/game";
import { ALL_GAMES } from "@/data/games";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes("placeholder-project") &&
    !supabaseAnonKey.includes("placeholder-anon-key")
  );
};

export const supabase = createClient(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

// 全17タイトルの対戦ゲームをフォールバック兼シードデータとして使用
export const FALLBACK_GAMES: Game[] = ALL_GAMES;

/**
 * IDからゲームを取得する関数
 * Supabaseが設定されていればSupabaseを優先し、なければローカルデータから取得
 */
export async function getGameById(id: string): Promise<Game | null> {
  const localGame = ALL_GAMES.find((g) => g.id === id);

  if (!isSupabaseConfigured()) {
    return localGame || null;
  }

  try {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return localGame || null;
    }

    // Supabaseから取得したデータにローカルのmetadataを補完
    const game = data as Game;
    if (!game.metadata && localGame?.metadata) {
      game.metadata = localGame.metadata;
    }
    return game;
  } catch (err) {
    console.warn("Error fetching game from Supabase, using local fallback:", err);
    return localGame || null;
  }
}

/**
 * 全ゲーム一覧を取得
 */
export async function getAllGames(): Promise<Game[]> {
  if (!isSupabaseConfigured()) {
    return ALL_GAMES;
  }

  try {
    const { data, error } = await supabase.from("games").select("*");
    if (error || !data || data.length === 0) {
      return ALL_GAMES;
    }

    // ローカルのmetadataをマージ
    return data.map((item) => {
      const local = ALL_GAMES.find((g) => g.id === item.id);
      return {
        ...item,
        metadata: item.metadata || local?.metadata,
      } as Game;
    });
  } catch (err) {
    console.warn("Error fetching games from Supabase, using local data:", err);
    return ALL_GAMES;
  }
}
