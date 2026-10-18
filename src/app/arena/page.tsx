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

  // 対戦セッションがない場合はトップへリダイレクト
  useEffect(() => {
    if (!config || !state) {
      router.replace("/");
    }
  }, [config, state, router]);

  if (!config || !state) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-pulse text-sm text-slate-400">
          対戦データを読み込み中...
        </div>
      </div>
    );
  }

  // 現在の抽選ゲーム（自作ゲームを含む全プールから取得）
  const allAvailable = getAllGamesWithCustom();
  const currentGame =
    allAvailable.find((g) => g.id === state.currentGameId) || allAvailable[0] || ALL_GAMES[0];

  const handleQuitToHome = () => {
    clearMatch();
    router.push("/");
  };

  const handleChangeSettings = () => {
    clearMatch();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between font-sans selection:bg-rose-500 selection:text-white">
      {/* 対戦ヘッダー */}
      <ArenaHeader
        config={config}
        state={state}
        onReroll={rerollGame}
        onQuit={handleQuitToHome}
      />

      {/* メインゲームホスト（GMツール＆お題） */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-xl mx-auto w-full space-y-6">
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
