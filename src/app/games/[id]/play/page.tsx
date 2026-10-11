"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getGameById } from "@/lib/supabase";
import { Game, ToolType, Player } from "@/types/game";
import PromptTool from "@/components/tools/PromptTool";
import BpmTool from "@/components/tools/BpmTool";
import TimerTool from "@/components/tools/TimerTool";
import ScoreTool from "@/components/tools/ScoreTool";
import EliminationTracker from "@/components/tools/EliminationTracker";
import PlayerRegistrationModal from "@/components/players/PlayerRegistrationModal";
import { ALL_GAMES } from "@/data/games";
import {
  loadStoredPlayers,
  saveStoredPlayers,
  syncPlayersWithCount,
} from "@/lib/playerStorage";
import {
  ArrowLeft,
  HelpCircle,
  MessageSquare,
  Activity,
  Shuffle,
  Clock,
  Trophy,
  LayoutGrid,
  Skull,
  Users,
  UserCog,
} from "lucide-react";

function GamePlayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const shouldOpenSetup = searchParams?.get("setup") === "1";
  const countParam = searchParams?.get("count");
  const targetCount = countParam ? parseInt(countParam, 10) : null;

  const initialGame = ALL_GAMES.find((g) => g.id === id) || null;

  const initialTools = (initialGame?.metadata?.tools || []).map((t) =>
    t === "elimination_tracker" ? "elimination" : t
  );

  const [game, setGame] = useState<Game | null>(initialGame);
  const [loading, setLoading] = useState<boolean>(!initialGame);
  const [activeTab, setActiveTab] = useState<ToolType | "all">(
    initialTools.length === 1 ? (initialTools[0] as ToolType) : "all"
  );
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);

  // 初期セットアップモードか通常モードか
  const [isSetupMode, setIsSetupMode] = useState<boolean>(shouldOpenSetup);
  const [showPlayerModal, setShowPlayerModal] = useState<boolean>(shouldOpenSetup);

  // プレイヤー管理状態（State）
  const [players, setPlayers] = useState<Player[]>(() => {
    const minP = initialGame?.min_players || 2;
    const maxP = initialGame?.max_players || 8;
    const current = loadStoredPlayers(targetCount || minP);
    if (targetCount && !isNaN(targetCount)) {
      return syncPlayersWithCount(current, targetCount, minP, maxP, shouldOpenSetup);
    }
    return current;
  });

  // ゲームデータのフェッチと人数同期
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      try {
        const data = await getGameById(id);
        if (isMounted) {
          setGame(data);
          setLoading(false);

          const tools = (data?.metadata?.tools || []).map((t) =>
            t === "elimination_tracker" ? ("elimination" as ToolType) : t
          );
          if (tools.length === 1) {
            setActiveTab(tools[0]);
          } else {
            setActiveTab("all");
          }

          // ゲームの対応人数に合わせてプレイヤー数を同期・調整
          const minP = data?.min_players || 2;
          const maxP = data?.max_players || 8;
          const current = loadStoredPlayers(minP);
          let adjusted: Player[];

          if (targetCount && !isNaN(targetCount)) {
            // トップページ等から指定人数が渡された場合、その人数に合わせる
            adjusted = syncPlayersWithCount(current, targetCount, minP, maxP, shouldOpenSetup);
          } else if (current.length < minP) {
            adjusted = syncPlayersWithCount(current, minP, minP, maxP, false);
          } else if (current.length > maxP) {
            adjusted = syncPlayersWithCount(current, maxP, minP, maxP, false);
          } else {
            adjusted = current;
          }

          setPlayers(adjusted);
          saveStoredPlayers(adjusted);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [id, targetCount, shouldOpenSetup]);

  // モーダルを閉じる（URLの ?setup=1 もクリーンアップして再読み込み時の重複表示を防止）
  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
    setIsSetupMode(false);
    if (typeof window !== "undefined" && window.history.replaceState) {
      const url = new URL(window.location.href);
      if (url.searchParams.has("setup")) {
        url.searchParams.delete("setup");
        window.history.replaceState({}, "", url.toString());
      }
    }
  };

  // 手動でプレイヤー設定を開く（ヘッダーやボタンから）
  const handleOpenManualModal = () => {
    setIsSetupMode(false);
    setShowPlayerModal(true);
  };

  // プレイヤー登録保存
  const handleSavePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    saveStoredPlayers(newPlayers);
    handleClosePlayerModal();
  };

  // 生存人数カウント
  const activePlayersCount = useMemo(() => {
    return players.filter((p) => !p.isOut).length;
  }, [players]);

  // プレイヤー操作ハンドラー
  const handleToggleOut = (playerId: string) => {
    setPlayers((prev) => {
      const updated = prev.map((p) =>
        p.id === playerId ? { ...p, isOut: !p.isOut } : p
      );
      saveStoredPlayers(updated);
      return updated;
    });
  };

  const handleUpdateScore = (playerId: string, delta: number) => {
    setPlayers((prev) => {
      const updated = prev.map((p) =>
        p.id === playerId ? { ...p, score: Math.max(0, p.score + delta) } : p
      );
      saveStoredPlayers(updated);
      return updated;
    });
  };

  const handleUpdateName = (playerId: string, name: string) => {
    setPlayers((prev) => {
      const updated = prev.map((p) =>
        p.id === playerId ? { ...p, name } : p
      );
      saveStoredPlayers(updated);
      return updated;
    });
  };

  const handleReviveAll = () => {
    setPlayers((prev) => {
      const updated = prev.map((p) => ({ ...p, isOut: false }));
      saveStoredPlayers(updated);
      return updated;
    });
  };

  const handleFullReset = () => {
    setPlayers((prev) => {
      const updated = prev.map((p) => ({ ...p, isOut: false, score: 0 }));
      saveStoredPlayers(updated);
      return updated;
    });
  };

  const handleAddPlayer = () => {
    const maxP = game?.max_players || 8;
    setPlayers((prev) => {
      if (prev.length >= maxP) return prev;
      const nextNum = prev.length + 1;
      const updated = [
        ...prev,
        {
          id: `p-${Date.now()}`,
          name: `プレイヤー ${nextNum}`,
          score: 0,
          isOut: false,
        },
      ];
      saveStoredPlayers(updated);
      return updated;
    });
  };

  const handleRemovePlayer = (playerId: string) => {
    const minP = game?.min_players || 2;
    setPlayers((prev) => {
      if (prev.length <= minP) return prev;
      const updated = prev.filter((p) => p.id !== playerId);
      saveStoredPlayers(updated);
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-pink-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">ゲームマスターを起動中...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-rose-400 mb-2">ゲームが見つかりません</h2>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>トップへ戻る</span>
          </Link>
        </div>
      </div>
    );
  }

  const meta = game.metadata;
  // 利用可能ツールリスト（elimination_tracker は elimination として扱う）
  const baseTools: ToolType[] = (meta?.tools || ["score"]).map((t) =>
    t === "elimination_tracker" ? "elimination" : t
  );
  // score がある場合は elimination（脱落カウンター）もタブで選べるように拡張
  const enabledTools: ToolType[] =
    baseTools.includes("score") && !baseTools.includes("elimination")
      ? [...baseTools, "elimination"]
      : baseTools;

  const toolLabels: Record<ToolType, { label: string; icon: React.ReactNode; color: string }> = {
    prompt: { label: "お題ガチャ", icon: <Shuffle className="w-4 h-4" />, color: "text-pink-300" },
    bpm: { label: "BPM", icon: <Activity className="w-4 h-4" />, color: "text-amber-300" },
    timer: { label: "タイマー", icon: <Clock className="w-4 h-4" />, color: "text-cyan-300" },
    score: { label: "勝敗・スコア", icon: <Trophy className="w-4 h-4" />, color: "text-emerald-300" },
    elimination: { label: "脱落カウンター", icon: <Skull className="w-4 h-4" />, color: "text-rose-400" },
    elimination_tracker: { label: "脱落カウンター", icon: <Skull className="w-4 h-4" />, color: "text-rose-400" },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white p-3 sm:p-5 lg:p-8 flex flex-col justify-between">
      {/* 背景装飾 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 opacity-25">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col">
        {/* 上部ヘッダー・ナビゲーション */}
        <header className="flex items-center justify-between gap-2 mb-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/games/${game.id}`}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 active:scale-95 transition-all shrink-0"
              title="詳細画面へ戻る"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                GAME MASTER
              </span>
              <h1 className="text-base sm:text-lg font-black text-white truncate">
                {game.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* プレイヤー管理ボタン */}
            <button
              type="button"
              onClick={handleOpenManualModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/30 to-indigo-500/30 hover:from-purple-500/50 hover:to-indigo-500/50 text-purple-200 text-xs font-bold border border-purple-400/40 active:scale-95 transition-all"
              title="参加プレイヤーの登録・編集"
            >
              <Users className="w-3.5 h-3.5 text-pink-300" />
              <span>{players.length}名</span>
              <span className="hidden sm:inline text-[10px] text-amber-300">
                (生存{activePlayersCount})
              </span>
            </button>

            {/* ルール確認ボタン */}
            <button
              type="button"
              onClick={() => setShowRuleModal((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 text-xs font-semibold border border-white/10 active:scale-95 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-pink-300" />
              <span className="hidden sm:inline">ルール</span>
            </button>
          </div>
        </header>

        {/* 参加中プレイヤーのクイック確認・変更バー */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/10 mb-4 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] text-purple-300 font-bold shrink-0">参加者:</span>
            {players.map((p, idx) => (
              <span
                key={p.id}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border shrink-0 flex items-center gap-1 transition-all ${
                  p.isOut
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30 line-through opacity-70"
                    : "bg-white/10 text-white border-white/10"
                }`}
              >
                <span className="text-[9px] text-amber-300/80 font-bold">{idx + 1}.</span>
                <span>{p.name}</span>
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={handleOpenManualModal}
            className="text-[11px] text-purple-200 hover:text-white font-bold shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 transition-all active:scale-95"
            title="プレイヤー名や人数を変更"
          >
            <UserCog className="w-3.5 h-3.5 text-pink-300" />
            <span className="text-xs">名前変更</span>
          </button>
        </div>

        {/* プレイヤー登録モーダル */}
        <PlayerRegistrationModal
          isOpen={showPlayerModal}
          onClose={handleClosePlayerModal}
          initialPlayers={players}
          onSave={handleSavePlayers}
          minPlayers={game.min_players || 2}
          maxPlayers={game.max_players || 8}
          gameTitle={game.title}
          isInitialSetup={isSetupMode}
        />

        {/* ルール・コール確認アコーディオン */}
        {showRuleModal && (
          <div className="mb-4 p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 backdrop-blur-xl animate-in fade-in zoom-in-95 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-pink-400" />
                <span>ルール＆コール早見表</span>
              </span>
              <button
                type="button"
                onClick={() => setShowRuleModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded-lg bg-white/10"
              >
                閉じる
              </button>
            </div>

            {meta?.callExample && (
              <div>
                <div className="text-[11px] font-bold text-amber-300 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>かけ声・コール例</span>
                </div>
                <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap bg-white/5 p-2.5 rounded-xl leading-relaxed">
                  {meta.callExample}
                </pre>
              </div>
            )}

            {meta?.ruleSummary && (
              <div>
                <div className="text-[11px] font-bold text-slate-300 mb-1">
                  遊び方の要点
                </div>
                <ul className="space-y-1 text-xs text-slate-300">
                  {meta.ruleSummary.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-pink-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ツール切り替えタブ */}
        {enabledTools.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/40 rounded-2xl border border-white/10 mb-4 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "all"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>全ツール表示</span>
            </button>

            {enabledTools.map((tool) => {
              const info = toolLabels[tool];
              if (!info) return null;
              const isSelected = activeTab === tool;
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => setActiveTab(tool)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? "bg-white/20 text-white shadow-md border border-white/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className={info.color}>{info.icon}</span>
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ツール描画エリア */}
        <div className="space-y-4">
          {/* お題ガチャ */}
          {enabledTools.includes("prompt") && (activeTab === "all" || activeTab === "prompt") && (
            <section aria-label="お題ガチャツール">
              <PromptTool
                prompts={meta?.promptList || []}
                gameTitle={game.title}
              />
            </section>
          )}

          {/* BPMメトロノーム */}
          {enabledTools.includes("bpm") && (activeTab === "all" || activeTab === "bpm") && (
            <section aria-label="BPMメトロノームツール">
              <BpmTool defaultBpm={meta?.defaultBpm || 110} />
            </section>
          )}

          {/* タイマー */}
          {enabledTools.includes("timer") && (activeTab === "all" || activeTab === "timer") && (
            <section aria-label="タイマーツール">
              <TimerTool
                defaultDuration={meta?.timerDuration || 10}
                isBlindDefault={meta?.blindTimer ?? false}
              />
            </section>
          )}

          {/* 脱落トラッカー（サバイバルモード） */}
          {(enabledTools.includes("elimination") || baseTools.includes("score")) &&
            (activeTab === "all" || activeTab === "elimination") && (
              <section aria-label="脱落カウンタツール">
                <EliminationTracker
                  players={players}
                  onToggleOut={handleToggleOut}
                  onReviveAll={handleReviveAll}
                  onOpenPlayerSetup={handleOpenManualModal}
                  gameTitle={game.title}
                />
              </section>
            )}

          {/* スコア・勝敗カウンター */}
          {baseTools.includes("score") && (activeTab === "all" || activeTab === "score") && (
            <section aria-label="勝敗・スコアカウンタツール">
              <ScoreTool
                initialPlayerCount={game.min_players || 3}
                players={players}
                onToggleOut={handleToggleOut}
                onUpdateScore={handleUpdateScore}
                onUpdateName={handleUpdateName}
                onAddPlayer={handleAddPlayer}
                onRemovePlayer={handleRemovePlayer}
                onReviveAll={handleReviveAll}
                onFullReset={handleFullReset}
                onOpenPlayerSetup={handleOpenManualModal}
              />
            </section>
          )}
        </div>
      </div>

      {/* フッター */}
      <footer className="mt-8 flex items-center justify-between text-xs text-slate-500 py-2 border-t border-white/10">
        <Link href={`/games/${game.id}`} className="hover:text-purple-300">
          ← ゲーム詳細へ
        </Link>
        <button
          type="button"
          onClick={handleOpenManualModal}
          className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
        >
          <UserCog className="w-3.5 h-3.5" />
          <span>プレイヤー設定</span>
        </button>
        <Link href="/" className="hover:text-purple-300">
          別のゲームを探す →
        </Link>
      </footer>
    </main>
  );
}

export default function GamePlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-pink-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">ゲームマスターを起動中...</p>
          </div>
        </div>
      }
    >
      <GamePlayContent />
    </Suspense>
  );
}
