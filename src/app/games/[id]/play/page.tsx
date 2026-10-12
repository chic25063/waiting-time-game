"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getGameById } from "@/lib/supabase";
import { Game, Player } from "@/types/game";
import { MatchEngineType } from "@/types/session";
import { ALL_GAMES } from "@/data/games";
import { useGameSession } from "@/hooks/useGameSession";
import SessionScoreHeader from "@/components/session/SessionScoreHeader";
import QuickEliminationView from "@/components/match/QuickEliminationView";
import ToolAssistedMatchView from "@/components/match/ToolAssistedMatchView";
import MatchWinnerModal from "@/components/match/MatchWinnerModal";
import PlayerRegistrationModal from "@/components/players/PlayerRegistrationModal";
import {
  loadStoredPlayers,
  saveStoredPlayers,
  syncPlayersWithCount,
} from "@/lib/playerStorage";
import { sound } from "@/lib/sound";
import {
  ArrowLeft,
  HelpCircle,
  MessageSquare,
  Users,
  UserCog,
  RotateCcw,
} from "lucide-react";

function GamePlayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const shouldOpenSetup = searchParams?.get("setup") === "1";
  const countParam = searchParams?.get("count");
  const targetCount = countParam ? parseInt(countParam, 10) : null;

  const { players: sessionPlayers, setPlayerCount } = useGameSession();

  const initialGame = ALL_GAMES.find((g) => g.id === id) || null;
  const [game, setGame] = useState<Game | null>(initialGame);
  const [loading, setLoading] = useState<boolean>(!initialGame);
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [showPlayerModal, setShowPlayerModal] = useState<boolean>(shouldOpenSetup);
  const [isSetupMode, setIsSetupMode] = useState<boolean>(shouldOpenSetup);

  // 勝者状態
  const [winner, setWinner] = useState<{ id: string; name: string } | null>(null);

  // プレイヤー管理状態
  const [players, setPlayers] = useState<Player[]>(() => {
    const minP = initialGame?.min_players || 2;
    const maxP = initialGame?.max_players || 8;
    const current = loadStoredPlayers(targetCount || minP);
    if (targetCount && !isNaN(targetCount)) {
      return syncPlayersWithCount(current, targetCount, minP, maxP, shouldOpenSetup);
    }
    return current;
  });

  // セッションのプレイヤー名・人数と初回同期
  useEffect(() => {
    if (sessionPlayers.length > 0 && players.length === sessionPlayers.length) {
      // 名前の相違があればセッション側の名前に更新
      setPlayers((prev) =>
        prev.map((p, idx) => {
          const sessionP = sessionPlayers[idx];
          if (sessionP && sessionP.name !== p.name) {
            return { ...p, name: sessionP.name };
          }
          return p;
        })
      );
    }
  }, [sessionPlayers]);

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

          const minP = data?.min_players || 2;
          const maxP = data?.max_players || 8;
          const current = loadStoredPlayers(minP);
          let adjusted: Player[];

          if (targetCount && !isNaN(targetCount)) {
            adjusted = syncPlayersWithCount(current, targetCount, minP, maxP, shouldOpenSetup);
          } else if (current.length < minP) {
            adjusted = syncPlayersWithCount(current, minP, minP, maxP, shouldOpenSetup);
          } else if (current.length > maxP) {
            adjusted = syncPlayersWithCount(current, maxP, minP, maxP, shouldOpenSetup);
          } else {
            adjusted = current;
          }

          setPlayers(adjusted);
          saveStoredPlayers(adjusted);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id, targetCount, shouldOpenSetup]);

  // 脱落トグル
  const handleToggleEliminate = (playerId: string) => {
    sound.playClick();
    setPlayers((prev) => {
      const updated = prev.map((p) =>
        p.id === playerId ? { ...p, isOut: !p.isOut } : p
      );
      saveStoredPlayers(updated);
      return updated;
    });
  };

  // 全員復活
  const handleResetElimination = () => {
    sound.playRevive();
    setPlayers((prev) => {
      const updated = prev.map((p) => ({ ...p, isOut: false }));
      saveStoredPlayers(updated);
      return updated;
    });
    setWinner(null);
  };

  // スコア変更
  const handleScoreChange = (playerId: string, delta: number) => {
    sound.playClick(true);
    setPlayers((prev) => {
      const updated = prev.map((p) =>
        p.id === playerId ? { ...p, score: Math.max(0, p.score + delta) } : p
      );
      saveStoredPlayers(updated);
      return updated;
    });
  };

  // 勝者決定処理
  const handleSelectWinner = (playerId: string, playerName: string) => {
    sound.playWin();
    setWinner({ id: playerId, name: playerName });
  };

  // 生存者が1名になった時の自動勝者決定
  useEffect(() => {
    if (players.length < 2) return;
    const alive = players.filter((p) => !p.isOut);
    if (alive.length === 1 && !winner) {
      handleSelectWinner(alive[0].id, alive[0].name);
    }
  }, [players, winner]);

  // もう1戦！（リベンジ）
  const handleRematch = () => {
    sound.playRevive();
    setPlayers((prev) => {
      const updated = prev.map((p) => ({ ...p, isOut: false }));
      saveStoredPlayers(updated);
      return updated;
    });
    setWinner(null);
  };

  // プレイヤー登録保存
  const handleSavePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    saveStoredPlayers(newPlayers);
    setShowPlayerModal(false);
    setIsSetupMode(false);
    // セッションの人数も同期
    setPlayerCount(newPlayers.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">対戦エンジンを起動中...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-red-400 mb-2">ゲームが見つかりません</h2>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 text-white text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>トップへ戻る</span>
          </Link>
        </div>
      </div>
    );
  }

  // 対戦エンジンの判定
  const engineType: MatchEngineType =
    game.matchEngineType ||
    game.metadata?.matchEngineType ||
    (game.master_tools?.includes("elimination_tracker") ||
    game.metadata?.tools?.includes("elimination")
      ? "quick_elimination"
      : "tool_assisted");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col">
      {/* 🏆 通算成績スコアヘッダー（常に上部に常設） */}
      <SessionScoreHeader />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between">
        <div className="space-y-4">
          {/* ナビゲーションバー */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ゲーム一覧へ</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPlayerModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold border border-gray-700 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>{players.length}名で対戦中</span>
              </button>
            </div>
          </div>

          {/* 対戦エンジンに応じた最適化ビュー */}
          {engineType === "quick_elimination" ? (
            <QuickEliminationView
              game={game}
              players={players}
              onToggleEliminate={handleToggleEliminate}
              onResetElimination={handleResetElimination}
              onSelectWinner={handleSelectWinner}
              onOpenRules={() => setShowRuleModal(true)}
            />
          ) : (
            <ToolAssistedMatchView
              game={game}
              players={players}
              onToggleEliminate={handleToggleEliminate}
              onResetElimination={handleResetElimination}
              onSelectWinner={handleSelectWinner}
              onScoreChange={handleScoreChange}
              onOpenRules={() => setShowRuleModal(true)}
            />
          )}
        </div>

        {/* プレイヤー登録モーダル */}
        <PlayerRegistrationModal
          isOpen={showPlayerModal}
          onClose={() => setShowPlayerModal(false)}
          initialPlayers={players}
          onSave={handleSavePlayers}
          minPlayers={game.min_players || 2}
          maxPlayers={game.max_players || 8}
          gameTitle={game.title}
          isInitialSetup={isSetupMode}
        />

        {/* ルール・コール確認モーダル */}
        {showRuleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl p-6 text-white max-h-[85vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold">{game.title} のルール</h3>
                </div>
                <button
                  onClick={() => setShowRuleModal(false)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  閉じる
                </button>
              </div>

              {/* コール例 */}
              {(game.call_examples || game.metadata?.callExample) && (
                <div>
                  <h4 className="text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>かけ声・コール例</span>
                  </h4>
                  <div className="text-xs bg-gray-950 p-3 rounded-xl border border-gray-800 space-y-1 text-gray-200">
                    {game.call_examples ? (
                      game.call_examples.map((ex, i) => (
                        <div key={i} className="py-0.5">{ex}</div>
                      ))
                    ) : (
                      <pre className="font-sans whitespace-pre-wrap">{game.metadata?.callExample}</pre>
                    )}
                  </div>
                </div>
              )}

              {/* ルール要点 */}
              {(game.rules || game.metadata?.ruleSummary) && (
                <div>
                  <h4 className="text-xs font-bold text-gray-300 mb-1.5">
                    遊び方の流れ
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    {(game.rules || game.metadata?.ruleSummary || []).map((r, i) => (
                      <li key={i} className="flex items-start gap-2 bg-gray-950/60 p-2 rounded-lg border border-gray-800/60">
                        <span className="text-amber-400 font-bold shrink-0">{i + 1}.</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setShowRuleModal(false)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-sm rounded-xl transition-all cursor-pointer"
              >
                分かった！ゲームに戻る
              </button>
            </div>
          </div>
        )}

        {/* 🏆 勝者表彰＆リベンジ・次ゲーム選択モーダル */}
        <MatchWinnerModal
          winnerId={winner?.id || ""}
          winnerName={winner?.name || ""}
          isOpen={!!winner}
          onRematch={handleRematch}
        />
      </main>
    </div>
  );
}

export default function GamePlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">対戦エンジンを起動中...</p>
          </div>
        </div>
      }
    >
      <GamePlayContent />
    </Suspense>
  );
}
