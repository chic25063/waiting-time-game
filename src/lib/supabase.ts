import { createClient } from "@supabase/supabase-js";
import { Game } from "@/types/game";

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

// Supabase接続前やオフライン時のためのフォールバック用シードデータ
export const FALLBACK_GAMES: Game[] = [
  {
    id: "1",
    title: "古今東西（山手線ゲーム）",
    min_players: 2,
    max_players: 10,
    description:
      "お題（例：「赤いもの」「アトラクションの名前」など）を決め、手拍子のリズムに合わせて順番に1つずつ答えていきます。答えに詰まったり、すでに言われたものを言ったら負けです。",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "指スマ（いっせーのせ）",
    min_players: 2,
    max_players: 6,
    description:
      "両手の親指を前に出し、順番に「いっせーの、〇！」と宣言しながら好きな数だけ親指を立てます。宣言した数と全員の上がった親指の合計が一致したら片手を引っ込めます。両手が先に上がった人の勝ちです。",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "マジカルバナナ",
    min_players: 2,
    max_players: 8,
    description:
      "「マジカルバナナ、バナナと言ったら黄色」「黄色と言ったらレモン」と、リズムに合わせて連想ゲームを繋げていきます。テンポ良く言えなかったり、連想に無理があったらアウトです。",
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    title: "カタカナ禁止ゲーム",
    min_players: 2,
    max_players: 8,
    description:
      "日常会話の中でカタカナ語（外来語）を使ってはいけないゲームです。特定の人がカタカナを合計3回言ったら負けなどのルールで競います。",
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    title: "20の扉（ウミガメのスープ簡易版）",
    min_players: 2,
    max_players: 8,
    description:
      "出題者が心の中でモノや事象を1つ決めます。回答者は出題者に「はい」か「いいえ」で答えられる質問を最大20回まで行い、正解を当てる推理ゲームです。",
    created_at: new Date().toISOString(),
  },
  {
    id: "6",
    title: "うろ覚えお絵描きクイズ（空中ジェスチャー版）",
    min_players: 3,
    max_players: 6,
    description:
      "出題者が有名なキャラクターやロゴを空中（または手のひら）に指先で描き、周りの人が何を描いているか当てるゲームです。道具不要で楽しめます。",
    created_at: new Date().toISOString(),
  },
  {
    id: "7",
    title: "ワードウルフ（道具なし・耳打ち版）",
    min_players: 3,
    max_players: 8,
    description:
      "多数派（市民）と少数派（人狼）に分かれ、微妙に違うお題について会話します。スマホ1台を回し見するか、代表者が耳打ちでお題を伝えます。話し合いの後、誰が人狼か投票で当てます。",
    created_at: new Date().toISOString(),
  },
];
