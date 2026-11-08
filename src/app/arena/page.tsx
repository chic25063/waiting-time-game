"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveMatch } from "@/context/ActiveMatchContext";
import { ALL_GAMES } from "@/data/games";
import { getAllGamesWithCustom } from "@/lib/customGames";
import { Player } from "@/types/game";
import StepByStepGameFlow from "@/components/match/StepByStepGameFlow";
import ArenaMatchFinishedModal from "@/components/arena/ArenaMatchFinishedModal";
import GameRouletteOverlay from "@/components/arena/GameRouletteOverlay";
import PlayerRegistrationModal from "@/components/players/PlayerRegistrationModal";

export default function ArenaPage() {
  const router = useRouter();
  const {
    config,
    state,
    isSpinning,
    setIsSpinning,
    recordRoundWinner,
    recordRoundEliminated,
    rerollGame,
    rematch,
    clearMatch,
  } = useActiveMatch();

  const [showPlayerModal, setShowPlayerModal] = useState(false);

  useEffect(() => {
    if (!config || !state) {
      router.replace("/");
    }
  }, [config, state, router]);

  if (!config || !state) {
    return (
      <div className="min-h-screen bg-[#FAF6EB] flex items-center justify-center text-[#2B2D42]">
        <div className="animate-pulse text-sm font-black">
          対戦データを読み込み中...
        </div>
      </div>
    );
  }

  const allAvailable = getAllGamesWithCustom();
  const currentGame =
    allAvailable.find((g) => g.id === state.currentGameId) ||
    allAvailable[0] ||
    ALL_GAMES[0];

  const handleQuitToHome = () => {
    clearMatch();
    router.push("/");
  };

  const handleChangeSettings = () => {
    clearMatch();
    router.push("/");
  };

  // アリーナのアクティブなプレイヤー一覧を StepByStepGameFlow 用に変換
  const activeArenaPlayers: Player[] = config.players
    .filter((p) => {
      if (config.multiRuleType === "survival_knockout") {
        return !state.eliminatedPlayerIds.includes(p.id);
      }
      if (config.multiRuleType === "loser_king") {
        return !state.escapedPlayerIds.includes(p.id);
      }
      return true;
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      score: state.playerScores[p.id] || 0,
      isOut: false,
    }));

  const subtitle =
    config.mode === "duel_1v1"
      ? `1on1 (${config.duelRule === "first_to_5" ? "5" : "3"}本先取)`
      : config.multiRuleType === "survival_knockout"
      ? "サバイバル勝ち残り"
      : config.multiRuleType === "loser_king"
      ? "負け残り王決定戦"
      : "ポイントレース";

  return (
    <div
      className="min-h-dvh bg-[#FAF6EB] text-[#2B2D42] flex flex-col justify-between relative px-4 py-2"
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

      {/* メイン進行フロー（①スタンバイ ➔ ②設定・順番 ➔ ③ルール確認 ➔ ④プレイ） */}
      <main className="relative z-10 flex-1 w-full">
        <StepByStepGameFlow
          game={currentGame}
          players={activeArenaPlayers}
          onOpenPlayerModal={() => setShowPlayerModal(true)}
          onToggleEliminate={(playerId) => {
            if (config.multiRuleType === "survival_knockout") {
              recordRoundEliminated(playerId);
            } else if (
              config.mode === "duel_1v1" &&
              activeArenaPlayers.length === 2
            ) {
              const other = activeArenaPlayers.find((p) => p.id !== playerId);
              if (other) recordRoundWinner(other.id);
            }
          }}
          onResetElimination={() => {}}
          onSelectWinner={(playerId) => {
            recordRoundWinner(playerId);
          }}
          onBackToHome={handleQuitToHome}
          arenaContext={{
            roundNumber: state.currentRound,
            subtitle,
            onRerollGame: rerollGame,
            onRecordEliminated:
              config.multiRuleType === "survival_knockout"
                ? recordRoundEliminated
                : undefined,
            judgeLabel:
              config.multiRuleType === "loser_king"
                ? "このゲームで勝ち抜けた人をタップ"
                : config.multiRuleType === "survival_knockout"
                ? "このゲームで負けた人（ミス）または勝者をタップ"
                : "このラウンドの勝者をタップ",
          }}
        />
      </main>

      {/* プレイヤー確認モーダル */}
      <PlayerRegistrationModal
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        initialPlayers={activeArenaPlayers}
        onSave={() => setShowPlayerModal(false)}
        minPlayers={2}
        maxPlayers={8}
        gameTitle={currentGame.title}
        isInitialSetup={false}
      />

      {/* スロット風ルーレット演出オーバーレイ */}
      <GameRouletteOverlay
        isOpen={isSpinning}
        targetGame={currentGame}
        roundNumber={state.currentRound}
        onFinish={() => setIsSpinning(false)}
      />

      {/* 決着モーダル（総合優勝 or 負け残り王） */}
      <ArenaMatchFinishedModal
        isOpen={state.isMatchFinished}
        config={config}
        state={state}
        onRematch={rematch}
        onChangeSettings={handleChangeSettings}
        onGoHome={handleQuitToHome}
      />
    </div>
  );
}
