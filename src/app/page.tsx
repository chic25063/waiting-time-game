"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Users,
  Sparkles,
  Shuffle,
  Clock,
  HelpCircle,
  Database,
  PartyPopper,
  Info,
} from "lucide-react";
import { supabase, isSupabaseConfigured, FALLBACK_GAMES } from "@/lib/supabase";
import { Game } from "@/types/game";

const PLAYER_OPTIONS = [2, 3, 4, 5, 6] as const;

export default function Home() {
  const [selectedPlayers, setSelectedPlayers] = useState<number>(3);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.75 },
        colors: ["#38bdf8", "#818cf8", "#f472b6", "#fbbf24"],
      });
    } catch {
      // Confetti fallback
    }
  };

  const handleFindGame = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      let candidateGames: Game[] = [];

      if (isConfigured) {
        // Supabase DB から該当人数にマッチするゲームを取得
        const { data, error } = await supabase
          .from("games")
          .select("*")
          .lte("min_players", selectedPlayers)
          .gte("max_players", selectedPlayers);

        if (error) {
          console.warn("Supabase fetch error, using fallback:", error);
          candidateGames = FALLBACK_GAMES.filter(
            (g) =>
              g.min_players <= selectedPlayers &&
              g.max_players >= selectedPlayers
          );
        } else if (data && data.length > 0) {
          candidateGames = data as Game[];
        }
      } else {
        // Supabase未設定時はフォールバックデータを使用
        candidateGames = FALLBACK_GAMES.filter(
          (g) =>
            g.min_players <= selectedPlayers &&
            g.max_players >= selectedPlayers
        );
      }

      if (candidateGames.length === 0) {
        setErrorMsg(`${selectedPlayers}人で遊べるゲームが見つかりませんでした。`);
        setSelectedGame(null);
      } else {
        // 現在選択中のゲームとできるだけ被らないようにランダム抽出
        const filtered =
          candidateGames.length > 1 && selectedGame
            ? candidateGames.filter((g) => g.id !== selectedGame.id)
            : candidateGames;

        const randomIndex = Math.floor(Math.random() * filtered.length);
        const chosen = filtered[randomIndex];
        setSelectedGame(chosen);
        triggerConfetti();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("ゲームの取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* 背景装飾 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 opacity-30">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-pink-500 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center py-6">
        {/* ヘッダーエリア */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium text-purple-200 mb-3 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>待ち時間を最高のアトラクションに！</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-pink-300 to-indigo-200">
            マチジカン！
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1.5">
            道具ゼロ・その場ですぐ遊べる暇つぶしゲーム提案
          </p>
        </header>

        {/* コントロールカード */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl transition-all">
          {/* 人数選択 */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-3">
              <Users className="w-4 h-4 text-purple-300" />
              <span>いま何人いる？</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PLAYER_OPTIONS.map((count) => {
                const isSelected = selectedPlayers === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setSelectedPlayers(count)}
                    className={`py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95 ${
                      isSelected
                        ? "bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 shadow-orange-500/30 shadow-lg scale-105 border border-amber-300 ring-2 ring-amber-300/40"
                        : "bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10"
                    }`}
                  >
                    <span>{count}</span>
                    <span className="text-[10px] font-normal opacity-80">人</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 検索ボタン */}
          <button
            type="button"
            disabled={loading}
            onClick={handleFindGame}
            className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all duration-200 shadow-xl active:scale-[0.98] ${
              loading
                ? "bg-purple-700/60 cursor-not-allowed opacity-80"
                : "bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:via-rose-400 hover:to-amber-400 text-white shadow-pink-500/25 hover:shadow-pink-500/40"
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>ゲームを選び中...</span>
              </>
            ) : (
              <>
                <Shuffle className="w-5 h-5 transition-transform group-hover:rotate-180" />
                <span>{hasSearched ? "別のゲームを探す" : "ゲームを探す！"}</span>
              </>
            )}
          </button>
        </div>

        {/* エラーメッセージ */}
        {errorMsg && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs sm:text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* 提案結果カード */}
        {selectedGame && !loading && (
          <div className="mt-6 bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-semibold">
                <PartyPopper className="w-3.5 h-3.5" />
                おすすめゲーム
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-purple-200 font-medium bg-white/10 px-2.5 py-1 rounded-full">
                <Users className="w-3.5 h-3.5" />
                {selectedGame.min_players}〜{selectedGame.max_players}人対応
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white mb-3 tracking-wide">
              {selectedGame.title}
            </h2>

            <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/10 mb-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-pink-400" />
                <span>ルール・あそび方</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedGame.description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleFindGame}
              className="w-full py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-xs sm:text-sm font-semibold text-purple-100 flex items-center justify-center gap-2 border border-white/20"
            >
              <Shuffle className="w-4 h-4" />
              <span>気に入らない？ 別のを引く</span>
            </button>
          </div>
        )}

        {/* 初期未検索時ガイド */}
        {!hasSearched && !loading && (
          <div className="mt-6 text-center p-6 rounded-3xl border border-dashed border-white/15 bg-white/[0.02]">
            <Clock className="w-8 h-8 text-purple-300/60 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">
              人数を選んで「ゲームを探す！」を押してね
            </p>
            <p className="text-xs text-slate-400 mt-1">
              並び時間も退屈知らず！何回でも引き直せます
            </p>
          </div>
        )}

        {/* Supabase 接続状況フッター */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          {isConfigured ? (
            <span className="text-emerald-300 font-medium">
              Supabase データベース接続中
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3 text-amber-400" />
              シードデータ動作中（.env.local で Supabase 接続可能）
            </span>
          )}
        </div>
      </div>

      <footer className="text-center text-[10px] text-slate-500 py-2">
        マチジカン！ - MVP v0.1.0
      </footer>
    </main>
  );
}
