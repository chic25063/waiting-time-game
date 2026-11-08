"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveMatch } from "@/context/ActiveMatchContext";
import { ALL_GAMES } from "@/data/games";
import { getAllGamesWithCustom } from "@/lib/customGames";
import ArenaHeader from "@/components/arena/ArenaHeader";
import ArenaGameHost from "@/components/arena/ArenaGameHost";
import ArenaJudgeBar from "@/components/arena/ArenaJudgeBar";
import ArenaMatchFinishedModal from "@/components/arena/ArenaMatchFinishedModal";
import GameRouletteOverlay from "@/components/arena/GameRouletteOverlay";

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

  return (
    <div
      className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex flex-col justify-between relative"
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

      {/* 対戦ヘッダー */}
      <ArenaHeader
        config={config}
        state={state}
        onReroll={rerollGame}
        onQuit={handleQuitToHome}
      />

      {/* メインゲームホスト（GMツール＆お題） */}
      <main className="relative z-10 flex-1 p-4 sm:p-6 overflow-y-auto max-w-xl mx-auto w-full space-y-5">
        <ArenaGameHost game={currentGame} />
      </main>

      {/* ラウンド結果判定バー（画面下部固定風） */}
      <footer className="sticky bottom-0 z-30 w-full">
        <ArenaJudgeBar
          config={config}
          state={state}
          onRecordWinner={recordRoundWinner}
          onRecordEliminated={recordRoundEliminated}
        />
      </footer>

      {/* スロット風ルーレット演出オーバーレイ */}
      <GameRouletteOverlay
        isOpen={isSpinning}
        targetGame={currentGame}
        roundNumber={state.currentRound}
        onFinish={() => setIsSpinning(false)}
      />

      {/* 決着モーダル（総合優勝 or 最弱王） */}
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
