"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Users,
  Shuffle,
  Clock,
  HelpCircle,
  Database,
  PartyPopper,
  Info,
  Play,
  ArrowRight,
  ListFilter,
  Search,
  Tag,
} from "lucide-react";
import { supabase, isSupabaseConfigured, FALLBACK_GAMES, getAllGames } from "@/lib/supabase";
import { ALL_GAMES } from "@/data/games";
import { Game } from "@/types/game";
import SessionScoreHeader from "@/components/session/SessionScoreHeader";
import { useGameSession } from "@/hooks/useGameSession";

const PLAYER_OPTIONS = [2, 3, 4, 5, 6] as const;

export default function Home() {
  const { setPlayerCount } = useGameSession();
  const [selectedPlayers, setSelectedPlayers] = useState<number>(3);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [allGameList, setAllGameList] = useState<Game[]>(ALL_GAMES);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [catalogPlayerFilter, setCatalogPlayerFilter] = useState<number | null>(null);
  const [showCatalog, setShowCatalog] = useState<boolean>(false);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
    // 全ゲームリストをロード（Supabase連携時は最新を取得）
    async function initGames() {
      const games = await getAllGames();
      setAllGameList(games);
    }
    initGames();
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

        if (error || !data || data.length === 0) {
          candidateGames = allGameList.filter(
            (g) =>
              g.min_players <= selectedPlayers &&
              g.max_players >= selectedPlayers
          );
        } else {
          // metadata をローカルデータ等で補完
          candidateGames = data.map((item) => {
            const local = allGameList.find((g) => g.id === item.id);
            return {
              ...item,
              metadata: item.metadata || local?.metadata,
            } as Game;
          });
        }
      } else {
        // Supabase未設定時は最新の全ゲームデータを使用
        candidateGames = allGameList.filter(
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

  // カタログ用フィルター
  const filteredCatalog = useMemo(() => {
    return allGameList.filter((game) => {
      // 人数フィルター
      if (
        catalogPlayerFilter !== null &&
        (game.min_players > catalogPlayerFilter || game.max_players < catalogPlayerFilter)
      ) {
        return false;
      }
      // 検索ワードフィルター
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const titleMatch = game.title.toLowerCase().includes(q);
        const descMatch = game.description.toLowerCase().includes(q);
        const tagMatch = game.metadata?.tags?.some((t) => t.toLowerCase().includes(q));
        if (!titleMatch && !descMatch && !tagMatch) return false;
      }
      return true;
    });
  }, [allGameList, catalogPlayerFilter, searchQuery]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* 背景装飾 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 opacity-30">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-pink-500 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center py-4">
        {/* 通算スコアバー */}
        <SessionScoreHeader />

        {/* ヘッダーエリア */}
        <header className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-pink-300 to-indigo-200">
            マチジカン！
          </h1>
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
                    onClick={() => {
                      setSelectedPlayers(count);
                      setPlayerCount(count);
                    }}
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

            <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-wide">
              {selectedGame.title}
            </h2>

            {selectedGame.metadata?.tags && (
              <div className="flex flex-wrap gap-1 mb-3">
                {selectedGame.metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-purple-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/10 mb-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-pink-400" />
                <span>概要</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedGame.description}
              </p>
            </div>

            {/* ゲームマスター開始ボタン（超目立つCTA） */}
            <div className="space-y-2 mb-3">
              <Link
                href={`/games/${selectedGame.id}/play?setup=1&count=${selectedPlayers}`}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-300 hover:via-orange-400 hover:to-pink-400 text-slate-950 font-black text-base flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/30 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-current text-slate-950" />
                <span>このゲームを開始する！</span>
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/games/${selectedGame.id}`}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/15 transition-all text-center"
                >
                  <span>ルール詳細を見る</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={handleFindGame}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-semibold text-purple-100 flex items-center justify-center gap-1.5 border border-white/15"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>別のを引く</span>
                </button>
              </div>
            </div>
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
              メトロノームやお題ガチャなど、実際に遊べるGMツール付き！
            </p>
          </div>
        )}

        {/* 全ゲーム カタログ切り替えトグル */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowCatalog((prev) => !prev)}
            className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs sm:text-sm font-bold text-purple-200 flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-pink-400" />
              <span>全{allGameList.length}タイトルから選んで遊ぶ</span>
            </span>
            <span className="text-xs text-slate-400 font-normal">
              {showCatalog ? "一覧を隠す ▲" : "一覧を表示 ▼"}
            </span>
          </button>

          {/* カタログ展開エリア */}
          {showCatalog && (
            <div className="mt-3 p-4 rounded-3xl bg-slate-950/60 border border-white/15 backdrop-blur-xl animate-in fade-in space-y-4">
              {/* 検索・絞り込みバー */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ゲーム名、タグで検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* 人数絞り込みチップ */}
                <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-1">
                  <span className="text-slate-400 shrink-0 pr-1">人数:</span>
                  <button
                    type="button"
                    onClick={() => setCatalogPlayerFilter(null)}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                      catalogPlayerFilter === null
                        ? "bg-purple-500 text-white"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    全員
                  </button>
                  {PLAYER_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCatalogPlayerFilter(catalogPlayerFilter === p ? null : p)}
                      className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                        catalogPlayerFilter === p
                          ? "bg-purple-500 text-white"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {p}人
                    </button>
                  ))}
                </div>
              </div>

              {/* ゲームカードグリッド */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredCatalog.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white truncate">{g.title}</h3>
                        <span className="text-[10px] text-purple-300 px-1.5 py-0.5 rounded bg-white/10 shrink-0">
                          {g.min_players}〜{g.max_players}人
                        </span>
                      </div>
                      <div className="flex gap-1 mt-1 overflow-hidden">
                        {g.metadata?.tags?.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[9px] text-slate-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/games/${g.id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold"
                      >
                        詳細
                      </Link>
                      <Link
                        href={`/games/${g.id}/play?setup=1&count=${catalogPlayerFilter || selectedPlayers || g.min_players}`}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-sm active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>遊ぶ</span>
                      </Link>
                    </div>
                  </div>
                ))}

                {filteredCatalog.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    条件に一致するゲームが見つかりませんでした。
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
              シードデータ（全{allGameList.length}タイトル・お題完備）動作中
            </span>
          )}
        </div>
      </div>

      <footer className="text-center text-[10px] text-slate-500 py-2">
        マチジカン！ - ゲームマスターツール v0.2.0
      </footer>
    </main>
  );
}
