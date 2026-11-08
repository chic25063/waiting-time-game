"use client";

import { useEffect, useState, Suspense } from "react";
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
import PrecisionRankMatchView from "@/components/match/PrecisionRankMatchView";
import TournamentDuelView from "@/components/match/TournamentDuelView";
import TurnRelayBlitzView from "@/components/match/TurnRelayBlitzView";
import ConsensusMatchView from "@/components/match/ConsensusMatchView";
import MatchWinnerModal from "@/components/match/MatchWinnerModal";
import PlayerRegistrationModal from "@/components/players/PlayerRegistrationModal";
import {
  loadStoredPlayers,
  saveStoredPlayers,
  syncPlayersWithCount,
} from "@/lib/playerStorage";
import { sound } from "@/lib/sound";
import { ArrowLeft, HelpCircle, MessageSquare, Users } from "lucide-react";

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
  const [showPlayerModal, setShowPlayerModal] =
    useState<boolean>(shouldOpenSetup);
  const [isSetupMode, setIsSetupMode] = useState<boolean>(shouldOpenSetup);

  const [winner, setWinner] = useState<{ id: string; name: string } | null>(
    null
  );

  const [players, setPlayers] = useState<Player[]>(() => {
    const minP = initialGame?.min_players || 2;
    const maxP = initialGame?.max_players || 8;
    const current = loadStoredPlayers(targetCount || minP);
    if (targetCount && !isNaN(targetCount)) {
      return syncPlayersWithCount(
        current,
        targetCount,
        minP,
        maxP,
        shouldOpenSetup
      );
    }
    return current;
  });

  useEffect(() => {
    if (sessionPlayers.length > 0 && players.length === sessionPlayers.length) {
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
            adjusted = syncPlayersWithCount(
              current,
              targetCount,
              minP,
              maxP,
              shouldOpenSetup
            );
          } else if (current.length < minP) {
            adjusted = syncPlayersWithCount(
              current,
              minP,
              minP,
              maxP,
              shouldOpenSetup
            );
          } else if (current.length > maxP) {
            adjusted = syncPlayersWithCount(
              current,
              maxP,
              minP,
              maxP,
              shouldOpenSetup
            );
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

  const handleResetElimination = () => {
    sound.playRevive();
    setPlayers((prev) => {
      const updated = prev.map((p) => ({ ...p, isOut: false }));
      saveStoredPlayers(updated);
      return updated;
    });
    setWinner(null);
  };

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

  const handleSelectWinner = (playerId: string, playerName: string) => {
    sound.playWin();
    setWinner({ id: playerId, name: playerName });
  };

  useEffect(() => {
    if (players.length < 2) return;
    const alive = players.filter((p) => !p.isOut);
    if (alive.length === 1 && !winner) {
      handleSelectWinner(alive[0].id, alive[0].name);
    }
  }, [players, winner]);

  const handleRematch = () => {
    sound.playRevive();
    setPlayers((prev) => {
      const updated = prev.map((p) => ({ ...p, isOut: false }));
      saveStoredPlayers(updated);
      return updated;
    });
    setWinner(null);
  };

  const handleSavePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    saveStoredPlayers(newPlayers);
    setShowPlayerModal(false);
    setIsSetupMode(false);
    setPlayerCount(newPlayers.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#2B2D42] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-black">ゲームを起動中...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex items-center justify-center p-4">
        <div className="text-center max-w-sm bg-white border-2 border-[#2B2D42] rounded-3xl p-6 shadow-[4px_5px_0_#2B2D42]">
          <h2 className="text-xl font-black text-rose-600 mb-2">
            ゲームが見つかりません
          </h2>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFE066] border-2 border-[#2B2D42] text-[#2B2D42] text-sm font-black"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>トップへ戻る</span>
          </Link>
        </div>
      </div>
    );
  }

  const engineType: MatchEngineType =
    game.matchEngineType ||
    game.metadata?.matchEngineType ||
    (game.master_tools?.includes("elimination_tracker") ||
    game.metadata?.tools?.includes("elimination")
      ? "quick_elimination"
      : "tool_assisted");

  return (
    <div
      className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex flex-col relative"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(116, 162, 209, 0.32) 27px, rgba(116, 162, 209, 0.32) 28px)",
        backgroundPosition: "0 16px",
      }}
    >
      {/* 大学ノートの左端：赤い縦マージン2本線 */}
      <div
        className="pointer-events-none fixed inset-y-0 left-4 sm:left-10 w-1 border-l-2 border-r border-rose-400/45 z-0"
        aria-hidden="true"
      />

      {/* 通算成績スコアヘッダー */}
      <SessionScoreHeader />

      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between">
        <div className="space-y-4">
          {/* ナビゲーションバー */}
          <div className="flex items-center justify-between pb-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-[#2B2D42] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] text-xs font-black transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ホームへ戻る</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPlayerModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7CE8DC] hover:brightness-95 text-[#2B2D42] text-xs font-black border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] transition-all cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{players.length}名で対戦中</span>
              </button>
            </div>
          </div>

          {engineType === "precision_time_attack" ? (
            <PrecisionRankMatchView
              game={game}
              players={players}
              onSelectWinner={handleSelectWinner}
              onOpenRules={() => setShowRuleModal(true)}
            />
          ) : engineType === "tournament_duel" ? (
            <TournamentDuelView
              game={game}
              players={players}
              onSelectWinner={handleSelectWinner}
              onOpenRules={() => setShowRuleModal(true)}
            />
          ) : engineType === "turn_relay_blitz" ? (
            <TurnRelayBlitzView
              game={game}
              players={players}
              onToggleEliminate={handleToggleEliminate}
              onSelectWinner={handleSelectWinner}
              onOpenRules={() => setShowRuleModal(true)}
            />
          ) : engineType === "consensus_coop" ? (
            <ConsensusMatchView
              game={game}
              players={players}
              onSelectWinner={handleSelectWinner}
              onOpenRules={() => setShowRuleModal(true)}
            />
          ) : engineType === "quick_elimination" ||
            engineType === "survival_elimination" ? (
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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setShowRuleModal(false)}
          >
            <div
              className="relative w-full max-w-lg bg-[#FAF6EB] border-2 border-[#2B2D42] rounded-3xl p-6 text-[#2B2D42] shadow-[6px_7px_0_#2B2D42] max-h-[85vh] overflow-y-auto space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2B2D42]/25">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  <h3 className="text-lg font-black">{game.title} のルール</h3>
                </div>
                <button
                  onClick={() => setShowRuleModal(false)}
                  className="text-xs bg-white hover:bg-slate-100 border-2 border-[#2B2D42] text-[#2B2D42] font-black px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  閉じる
                </button>
              </div>

              {(game.call_examples || game.metadata?.callExample) && (
                <div>
                  <h4 className="text-xs font-black text-[#2B2D42] mb-1.5 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>かけ声・コール例</span>
                  </h4>
                  <div className="text-xs bg-[#FFF275]/50 p-3 rounded-xl border-2 border-[#2B2D42] space-y-1 font-bold text-[#2B2D42]">
                    {game.call_examples ? (
                      game.call_examples.map((ex, i) => (
                        <div key={i} className="py-0.5">
                          {ex}
                        </div>
                      ))
                    ) : (
                      <pre className="font-sans whitespace-pre-wrap">
                        {game.metadata?.callExample}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {(game.rules || game.metadata?.ruleSummary) && (
                <div>
                  <h4 className="text-xs font-black text-[#2B2D42] mb-1.5">
                    遊び方の流れ
                  </h4>
                  <ul className="space-y-1.5 text-xs font-bold text-[#2B2D42]">
                    {(game.rules || game.metadata?.ruleSummary || []).map(
                      (r, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 bg-white p-2.5 rounded-xl border-2 border-[#2B2D42]"
                        >
                          <span className="font-black shrink-0">{i + 1}.</span>
                          <span>{r}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setShowRuleModal(false)}
                className="w-full py-3 bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] font-black text-sm rounded-xl transition-all cursor-pointer"
              >
                分かった！ゲームに戻る
              </button>
            </div>
          </div>
        )}

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
        <div className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#2B2D42] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black">ゲームを起動中...</p>
          </div>
        </div>
      }
    >
      <GamePlayContent />
    </Suspense>
  );
}
