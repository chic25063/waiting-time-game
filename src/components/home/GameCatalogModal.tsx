"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  X,
  Search,
  Star,
  Edit2,
  Trash2,
  Play,
  ListFilter,
  Info,
} from "lucide-react";
import { Game } from "@/types/game";
import { deleteCustomGame } from "@/lib/customGames";

interface GameCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  allGameList: Game[];
  onRefresh: () => void;
  onEditCustomGame: (game: Game) => void;
}

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

export default function GameCatalogModal({
  isOpen,
  onClose,
  allGameList,
  onRefresh,
  onEditCustomGame,
}: GameCatalogModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [playerFilter, setPlayerFilter] = useState<number | null>(null);

  const filteredGames = useMemo(() => {
    return allGameList.filter((g) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = g.title.toLowerCase().includes(q);
        const matchTags = g.metadata?.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchTags) return false;
      }
      if (playerFilter !== null) {
        if (g.min_players > playerFilter || g.max_players < playerFilter) {
          return false;
        }
      }
      return true;
    });
  }, [allGameList, searchQuery, playerFilter]);

  const handleDelete = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    if (confirm(`「${game.title}」を削除してもよろしいですか？`)) {
      deleteCustomGame(game.id);
      onRefresh();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-catalog-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] bg-slate-900 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col text-white">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ListFilter className="w-4 h-4" />
            </div>
            <div>
              <h2 id="game-catalog-title" className="text-lg font-black text-white">ゲーム一覧</h2>
              <p className="text-[11px] text-slate-400">
                収録タイトル {allGameList.length} 件（自作: {allGameList.filter((g) => g.isCustom).length} 件）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 検索・人数フィルター */}
        <div className="py-3 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ゲーム名、タグで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-1">
            <span className="text-slate-400 shrink-0 pr-1 text-xs">人数:</span>
            <button
              type="button"
              onClick={() => setPlayerFilter(null)}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                playerFilter === null
                  ? "bg-amber-500 text-slate-950 font-black"
                  : "bg-white/10 text-slate-300 hover:text-white"
              }`}
            >
              全員
            </button>
            {PLAYER_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlayerFilter(playerFilter === p ? null : p)}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                  playerFilter === p
                    ? "bg-amber-500 text-slate-950 font-black"
                    : "bg-white/10 text-slate-300 hover:text-white"
                }`}
              >
                {p}人
              </button>
            ))}
          </div>
        </div>

        {/* ゲームリスト */}
        <div className="overflow-y-auto space-y-2 flex-1 pr-1 my-1">
          {filteredGames.map((g) => (
            <div
              key={g.id}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                g.isCustom
                  ? "bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/40 hover:border-amber-400"
                  : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {g.isCustom && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black shrink-0 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-300" />
                      <span>自作</span>
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-white truncate">{g.title}</h3>
                  <span className="text-[10px] text-slate-300 px-1.5 py-0.5 rounded bg-white/10 shrink-0">
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
                {g.isCustom && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEditCustomGame(g)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-amber-300 text-xs transition-all cursor-pointer"
                      title="編集する"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, g)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 text-xs transition-all cursor-pointer"
                      title="削除する"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {!g.isCustom && (
                  <Link
                    href={`/games/${g.id}`}
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold"
                  >
                    詳細
                  </Link>
                )}

                <Link
                  href={`/games/${g.id}/play?setup=1&count=${
                    playerFilter || g.min_players
                  }`}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>遊ぶ</span>
                </Link>
              </div>
            </div>
          ))}

          {filteredGames.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              該当するゲームが見つかりませんでした。
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>対戦モードでもこれらのゲームが自動抽選されます</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
