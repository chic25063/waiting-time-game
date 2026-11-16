import { createClient } from "@supabase/supabase-js";
import { Game } from "@/types/game";
import { ALL_GAMES } from "@/data/games";
import { getCustomGames } from "@/lib/customGames";

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
  const localGame =
    ALL_GAMES.find((g) => g.id === id) ||
    getCustomGames().find((g) => g.id === id);

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

    // ローカルの最新定義（description, rules, call_examples, metadata）を優先してマージ
    if (localGame) {
      return {
        ...(data as Game),
        ...localGame,
      };
    }
    return data as Game;
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

    // ALL_GAMESの最新定義を常に優先して返却
    return ALL_GAMES.map((local) => {
      const dbItem = data.find((item) => item.id === local.id);
      return dbItem ? ({ ...dbItem, ...local } as Game) : local;
    });
  } catch (err) {
    console.warn("Error fetching games from Supabase, using local data:", err);
    return ALL_GAMES;
  }
}
