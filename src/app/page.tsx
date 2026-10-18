"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Swords,
  Users,
  Play,
  ListFilter,
  Search,
  Database,
  Info,
  Sparkles,
  Flame,
  Plus,
  Edit2,
  Trash2,
  Star,
  Zap,
} from "lucide-react";
import { isSupabaseConfigured, getAllGames } from "@/lib/supabase";
import { ALL_GAMES } from "@/data/games";
import { Game } from "@/types/game";
import {
  getAllGamesWithCustom,
  deleteCustomGame,
} from "@/lib/customGames";
import DuelSetupModal from "@/components/home/DuelSetupModal";
import PartySetupModal from "@/components/home/PartySetupModal";
import CustomGameModal from "@/components/home/CustomGameModal";

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

export default function Home() {
  const [allGameList, setAllGameList] = useState<Game[]>([]);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isDuelModalOpen, setIsDuelModalOpen] = useState<boolean>(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState<boolean>(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);

  // カタログ用ステート
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [catalogPlayerFilter, setCatalogPlayerFilter] = useState<number | null>(null);
  const [showCatalog, setShowCatalog] = useState<boolean>(false);

  // ゲームリストの読み込み（自作ゲームを含む）
  const refreshGames = useCallback(async () => {
    const defaultGames = await getAllGames();
    const custom = getAllGamesWithCustom().filter((g) => g.isCustom);
    setAllGameList([...custom, ...defaultGames]);
  }, []);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
    refreshGames();

    const handleCustomUpdate = () => {
      refreshGames();
    };
    window.addEventListener("customGamesUpdated", handleCustomUpdate);
    return () => window.removeEventListener("customGamesUpdated", handleCustomUpdate);
  }, [refreshGames]);

  // 自作ゲームの削除
  const handleDeleteCustomGame = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    if (confirm(`「${game.title}」を削除してもよろしいですか？`)) {
      deleteCustomGame(game.id);
      refreshGames();
    }
  };

  // 自作ゲームの編集
  const handleEditCustomGame = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setGameToEdit(game);
    setIsCustomModalOpen(true);
  };

  // カタログの絞り込み
  const filteredCatalog = useMemo(() => {
    return allGameList.filter((g) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = g.title.toLowerCase().includes(q);
        const matchTags = g.metadata?.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchTags) return false;
      }
      if (catalogPlayerFilter !== null) {
        if (g.min_players > catalogPlayerFilter || g.max_players < catalogPlayerFilter) {
          return false;
        }
      }
      return true;
    });
  }, [allGameList, searchQuery, catalogPlayerFilter]);

  const customGameCount = allGameList.filter((g) => g.isCustom).length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="w-full max-w-xl mx-auto space-y-6 pt-4">
        {/* ロゴ＆タグライン */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-wide animate-pulse">
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            <span>対戦型ゲームマスター 2.0</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-rose-400 via-amber-300 to-indigo-400 bg-clip-text text-transparent">
            マチジカン！
          </h1>
        </div>

        {/* 2大対戦モードカード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1対1 対戦モード */}
          <button
            type="button"
            onClick={() => setIsDuelModalOpen(true)}
            className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-rose-950/80 via-gray-900 to-slate-950 border-2 border-rose-500/40 hover:border-rose-400 text-left transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-rose-500/20 hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
          >
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                <Swords className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                2人対戦
              </span>
            </div>

            <h2 className="text-xl font-black text-white group-hover:text-rose-200 transition-colors flex items-center gap-1.5">
              <span>1対1 対戦</span>
              <span className="text-xs text-rose-400 font-bold">DUEL</span>
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-1.5 leading-relaxed">
              3本先取 or 5本先取！ 1戦ごとに異なるゲームがランダム抽選！
            </p>

            <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-center justify-between text-xs font-bold text-rose-400">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                <span>真剣勝負を始める</span>
              </span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          {/* 多人数 対戦モード */}
          <button
            type="button"
            onClick={() => setIsPartyModalOpen(true)}
            className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-gray-900 to-slate-950 border-2 border-indigo-500/40 hover:border-indigo-400 text-left transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
          >
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />

            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                3〜8人対応
              </span>
            </div>

            <h2 className="text-xl font-black text-white group-hover:text-indigo-200 transition-colors flex items-center gap-1.5">
              <span>多人数 対戦</span>
              <span className="text-xs text-indigo-400 font-bold">PARTY</span>
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-1.5 leading-relaxed">
              点数制・勝ち残り・負け残り最弱王決定戦！ 罰ゲーム付きで大熱狂！
            </p>

            <div className="mt-4 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-xs font-bold text-indigo-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>グループで盛り上がる</span>
              </span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        </div>

        {/* 特徴ハイライトチップ */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="text-amber-400 text-base font-black">🎲 スロット</div>
            <div className="text-[10px] text-slate-400 mt-0.5">1戦ごとに競技抽選</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="text-rose-400 text-base font-black">💀 罰ゲーム</div>
            <div className="text-[10px] text-slate-400 mt-0.5">最弱王を決定</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="text-indigo-400 text-base font-black">⚙️ BAN機能</div>
            <div className="text-[10px] text-slate-400 mt-0.5">苦手ゲームを除外</div>
          </div>
        </div>

        {/* 全ゲーム カタログ展開トグル & オリジナルゲーム作成ボタン */}
        <div className="pt-2 space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowCatalog((prev) => !prev)}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-bold text-slate-300 hover:text-white flex items-center justify-between transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-amber-400" />
                <span>全{allGameList.length}タイトル一覧</span>
                {customGameCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    自作 {customGameCount}件
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-400 font-normal">
                {showCatalog ? "一覧を閉じる ▲" : "一覧を見る ▼"}
              </span>
            </button>

            {/* ＋ 自作ゲーム追加ボタン */}
            <button
              type="button"
              onClick={() => {
                setGameToEdit(null);
                setIsCustomModalOpen(true);
              }}
              className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              title="新しいゲームを自作して対戦に混ぜる！"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>ゲーム自作</span>
            </button>
          </div>

          {/* カタログ展開エリア */}
          {showCatalog && (
            <div className="p-4 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-xl animate-in fade-in space-y-4">
              {/* 検索・絞り込みバー */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ゲーム名、タグで検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                  />
                </div>

                {/* 人数絞り込みチップ */}
                <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-1">
                  <span className="text-slate-400 shrink-0 pr-1">人数:</span>
                  <button
                    type="button"
                    onClick={() => setCatalogPlayerFilter(null)}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                      catalogPlayerFilter === null
                        ? "bg-indigo-600 text-white"
                        : "bg-white/10 text-slate-300 hover:text-white"
                    }`}
                  >
                    全員
                  </button>
                  {PLAYER_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setCatalogPlayerFilter(catalogPlayerFilter === p ? null : p)
                      }
                      className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                        catalogPlayerFilter === p
                          ? "bg-indigo-600 text-white"
                          : "bg-white/10 text-slate-300 hover:text-white"
                      }`}
                    >
                      {p}人
                    </button>
                  ))}
                </div>
              </div>

              {/* ゲームカードリスト */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredCatalog.map((g) => (
                  <div
                    key={g.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                      g.isCustom
                        ? "bg-gradient-to-r from-amber-950/30 to-gray-900 border-amber-500/40 hover:border-amber-400"
                        : "bg-white/[0.03] hover:bg-white/[0.06] border-white/5"
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
                      {/* 自作ゲームの場合の編集・削除ボタン */}
                      {g.isCustom && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleEditCustomGame(e, g)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-amber-300 text-xs transition-all cursor-pointer"
                            title="編集する"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomGame(e, g)}
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
                          catalogPlayerFilter || g.min_players
                        }`}
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
        <div className="pt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          {isConfigured ? (
            <span className="text-emerald-300 font-medium">
              Supabase データベース接続中
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3 text-amber-400" />
              シードデータ（全{ALL_GAMES.length}タイトル・お題完備）動作中
            </span>
          )}
        </div>
      </div>

      {/* フッター */}
      <footer className="text-center text-[10px] text-slate-500 py-3">
        マチジカン！ - 対戦特化ゲームマスター v2.0
      </footer>

      {/* 設定モーダル群 */}
      <DuelSetupModal
        isOpen={isDuelModalOpen}
        onClose={() => setIsDuelModalOpen(false)}
      />
      <PartySetupModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
      />

      {/* 自作ゲーム作成・編集モーダル */}
      <CustomGameModal
        isOpen={isCustomModalOpen}
        gameToEdit={gameToEdit}
        onClose={() => setIsCustomModalOpen(false)}
        onSaved={() => refreshGames()}
      />
    </main>
  );
}
