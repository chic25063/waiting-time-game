"use client";

import React, { useState } from "react";
import { Game, Player } from "@/types/game";
import { sound } from "@/lib/sound";
import {
  Crown,
  RotateCcw,
  HelpCircle,
  Flame,
} from "lucide-react";

interface TournamentDuelViewProps {
  game: Game;
  players: Player[];
  onSelectWinner: (playerId: string, playerName: string) => void;
  onOpenRules: () => void;
}

interface TournamentMatch {
  id: string;
  roundName: string;
  playerA?: Player;
  playerB?: Player;
  winner?: Player;
}

export default function TournamentDuelView({
  game,
  players,
  onSelectWinner,
  onOpenRules,
}: TournamentDuelViewProps) {
  const isDirectDuel = players.length === 2;

  const [scores, setScores] = useState<Record<string, number>>(() => ({
    [players[0]?.id || "p1"]: 0,
    [players[1]?.id || "p2"]: 0,
  }));
  const TARGET_POINTS = 3;

  const [matches, setMatches] = useState<TournamentMatch[]>(() => {
    if (players.length <= 2) return [];

    if (players.length <= 4) {
      return [
        {
          id: "m-semi-1",
          roundName: "準決勝 第1試合",
          playerA: players[0],
          playerB: players[1],
        },
        {
          id: "m-semi-2",
          roundName: "準決勝 第2試合",
          playerA: players[2],
          playerB: players[3] || undefined,
          winner: players[3] ? undefined : players[2],
        },
        {
          id: "m-final",
          roundName: "🏆 決勝戦",
          playerA: undefined,
          playerB: players.length === 3 ? players[2] : undefined,
        },
      ];
    }

    return [
      { id: "m-r1-1", roundName: "1回戦 ①", playerA: players[0], playerB: players[1] },
      { id: "m-r1-2", roundName: "1回戦 ②", playerA: players[2], playerB: players[3] },
      { id: "m-r1-3", roundName: "1回戦 ③", playerA: players[4], playerB: players[5] },
      { id: "m-r1-4", roundName: "1回戦 ④", playerA: players[6], playerB: players[7] },
      { id: "m-semi-1", roundName: "準決勝 ①", playerA: undefined, playerB: undefined },
      { id: "m-semi-2", roundName: "準決勝 ②", playerA: undefined, playerB: undefined },
      { id: "m-final", roundName: "🏆 決勝戦", playerA: undefined, playerB: undefined },
    ];
  });

  const handleAddPoint = (playerId: string) => {
    sound.playTick();
    const current = scores[playerId] || 0;
    const next = current + 1;
    setScores((prev) => ({ ...prev, [playerId]: next }));

    if (next >= TARGET_POINTS) {
      const winnerPlayer = players.find((p) => p.id === playerId);
      if (winnerPlayer) {
        sound.playWin();
        onSelectWinner(winnerPlayer.id, winnerPlayer.name);
      }
    }
  };

  const handleTournamentWin = (matchId: string, winner: Player) => {
    sound.playTick();

    setMatches((prev) => {
      const next = prev.map((m) => (m.id === matchId ? { ...m, winner } : m));

      if (players.length <= 4) {
        const semi1 = next.find((m) => m.id === "m-semi-1");
        const semi2 = next.find((m) => m.id === "m-semi-2");
        const finalMatch = next.find((m) => m.id === "m-final");

        if (finalMatch) {
          finalMatch.playerA = semi1?.winner || finalMatch.playerA;
          finalMatch.playerB = semi2?.winner || finalMatch.playerB;
        }

        if (matchId === "m-final") {
          sound.playWin();
          onSelectWinner(winner.id, winner.name);
        }
      } else {
        const r1_1 = next.find((m) => m.id === "m-r1-1");
        const r1_2 = next.find((m) => m.id === "m-r1-2");
        const r1_3 = next.find((m) => m.id === "m-r1-3");
        const r1_4 = next.find((m) => m.id === "m-r1-4");
        const semi1 = next.find((m) => m.id === "m-semi-1");
        const semi2 = next.find((m) => m.id === "m-semi-2");
        const finalMatch = next.find((m) => m.id === "m-final");

        if (semi1) {
          semi1.playerA = r1_1?.winner;
          semi1.playerB = r1_2?.winner;
        }
        if (semi2) {
          semi2.playerA = r1_3?.winner;
          semi2.playerB = r1_4?.winner;
        }
        if (finalMatch) {
          finalMatch.playerA = semi1?.winner;
          finalMatch.playerB = semi2?.winner;
        }

        if (matchId === "m-final") {
          sound.playWin();
          onSelectWinner(winner.id, winner.name);
        }
      }

      return [...next];
    });
  };

  const handleReset = () => {
    sound.playTick();
    setScores({
      [players[0]?.id || "p1"]: 0,
      [players[1]?.id || "p2"]: 0,
    });
    if (players.length > 2 && players.length <= 4) {
      setMatches([
        { id: "m-semi-1", roundName: "準決勝 第1試合", playerA: players[0], playerB: players[1] },
        { id: "m-semi-2", roundName: "準決勝 第2試合", playerA: players[2], playerB: players[3] || undefined, winner: players[3] ? undefined : players[2] },
        { id: "m-final", roundName: "🏆 決勝戦", playerA: undefined, playerB: players.length === 3 ? players[2] : undefined },
      ]);
    }
  };

  return (
    <div className="space-y-5">
      {/* ゲームタイトル ＆ ヘッダー情報 */}
      <div className="relative bg-white border-2 border-[#2B2D42] rounded-2xl p-4 sm:p-5 shadow-[3px_4px_0_#2B2D42] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden">
        <div
          className="absolute inset-y-0 right-0 w-[32%] pointer-events-none"
          style={{
            backgroundColor: "#FFADAD",
            clipPath: "polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-[#FFADAD] text-[#2B2D42] border-2 border-[#2B2D42]">
              {isDirectDuel ? "⚔️ 1対1 ラウンド勝負" : "🏆 勝ち抜きトーナメント"}
            </span>
            <span className="text-xs font-bold text-[#2B2D42]/70">
              {isDirectDuel ? `${TARGET_POINTS}本先取マッチ` : `${players.length}名 参加トーナメント`}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#2B2D42] mt-1">
            {game.title}
          </h2>
          <p className="text-xs font-bold text-[#2B2D42]/75 mt-0.5 line-clamp-1">
            {game.short_description || game.description}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenRules}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FAF6EB] text-[#2B2D42] text-xs font-black rounded-xl border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#2B2D42]" />
            <span>ルール</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FAF6EB] text-[#2B2D42] text-xs font-black rounded-xl border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] active:translate-y-0.5 transition-all cursor-pointer"
            title="リセット"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2名直接対戦の場合: 3本先取ポイントバトル */}
      {isDirectDuel ? (
        <div className="space-y-4">
          <div className="text-center text-xs font-black text-[#2B2D42] flex items-center justify-center gap-1.5">
            <span className="inline-flex items-center gap-1 bg-[#FFE066] px-3 py-1 rounded-full border-2 border-[#2B2D42]">
              <Flame className="w-4 h-4" />
              <span>先に {TARGET_POINTS} 本取った方の勝利！</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {players.map((p, idx) => {
              const score = scores[p.id] || 0;
              const isMatchPoint = score === TARGET_POINTS - 1;

              return (
                <div
                  key={p.id}
                  className="bg-white border-2 border-[#2B2D42] rounded-3xl p-5 text-center shadow-[3px_4px_0_#2B2D42] transition-all"
                >
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-[#2B2D42] ${
                      idx === 0 ? "bg-[#FFADAD] text-[#2B2D42]" : "bg-[#7CE8DC] text-[#2B2D42]"
                    }`}
                  >
                    {idx === 0 ? "プレイヤー 1" : "プレイヤー 2"}
                  </span>
                  <h3 className="text-lg font-black text-[#2B2D42] mt-1.5 truncate">
                    {p.name}
                  </h3>

                  <div className="text-6xl font-mono font-black text-[#2B2D42] my-3">
                    {score}
                    <span className="text-xs text-[#2B2D42]/60 font-bold ml-1">/{TARGET_POINTS}</span>
                  </div>

                  {isMatchPoint && (
                    <span className="inline-block text-[10px] bg-[#FFE066] text-[#2B2D42] border-2 border-[#2B2D42] px-2.5 py-0.5 rounded-full font-black mb-3 animate-pulse">
                      リーチ！あと1本
                    </span>
                  )}

                  <button
                    onClick={() => handleAddPoint(p.id)}
                    className={`w-full py-3.5 px-4 rounded-2xl font-black text-base border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] transition-all active:translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer ${
                      idx === 0
                        ? "bg-[#FFADAD] hover:bg-[#ff9494] text-[#2B2D42]"
                        : "bg-[#7CE8DC] hover:bg-[#5cdbd0] text-[#2B2D42]"
                    }`}
                  >
                    <span>1本取った！ (+1)</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3人以上のトーナメント表 */
        <div className="space-y-4">
          <div className="text-center text-xs font-bold text-[#2B2D42]/75">
            対戦カードの勝者をタップしてトーナメントを進めよう！
          </div>

          <div className="space-y-3">
            {matches.map((m) => {
              const isReady = m.playerA && m.playerB && !m.winner;
              const isFinal = m.id === "m-final";

              return (
                <div
                  key={m.id}
                  className={`bg-white border-2 border-[#2B2D42] rounded-2xl p-4 shadow-[3px_4px_0_#2B2D42] transition-all ${
                    isFinal ? "bg-[#FFFDF7]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span
                      className={`text-xs font-black flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-[#2B2D42] ${
                        isFinal ? "bg-[#FFE066] text-[#2B2D42]" : "bg-[#FAF6EB] text-[#2B2D42]"
                      }`}
                    >
                      {isFinal && <Crown className="w-3.5 h-3.5 text-[#2B2D42]" />}
                      <span>{m.roundName}</span>
                    </span>
                    {m.winner && (
                      <span className="text-[11px] font-black text-[#2B2D42] bg-[#9AF0A8] border-2 border-[#2B2D42] px-2.5 py-0.5 rounded-full">
                        勝者: {m.winner.name} ➔ 進出
                      </span>
                    )}
                  </div>

                  {/* 対戦枠 */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* プレイヤーA */}
                    <button
                      disabled={!isReady}
                      onClick={() => m.playerA && handleTournamentWin(m.id, m.playerA)}
                      className={`p-3 rounded-xl border-2 border-[#2B2D42] text-left transition-all ${
                        m.winner?.id === m.playerA?.id
                          ? "bg-[#FFE066] text-[#2B2D42] font-black shadow-[2px_2px_0_#2B2D42]"
                          : isReady
                          ? "bg-[#FAF6EB] hover:bg-[#FFF275]/50 text-[#2B2D42] cursor-pointer shadow-[2px_2px_0_#2B2D42] active:translate-y-0.5"
                          : "bg-[#FAF6EB]/50 border-dashed text-[#2B2D42]/45"
                      }`}
                    >
                      <div className="text-[10px] font-bold text-[#2B2D42]/65">左枠</div>
                      <div className="text-sm font-black truncate mt-0.5">
                        {m.playerA ? m.playerA.name : "待機中..."}
                      </div>
                      {isReady && (
                        <div className="text-[10px] text-[#2B2D42] font-black mt-1 underline">
                          タップで勝利 ➔
                        </div>
                      )}
                    </button>

                    {/* プレイヤーB */}
                    <button
                      disabled={!isReady}
                      onClick={() => m.playerB && handleTournamentWin(m.id, m.playerB)}
                      className={`p-3 rounded-xl border-2 border-[#2B2D42] text-left transition-all ${
                        m.winner?.id === m.playerB?.id
                          ? "bg-[#FFE066] text-[#2B2D42] font-black shadow-[2px_2px_0_#2B2D42]"
                          : isReady
                          ? "bg-[#FAF6EB] hover:bg-[#FFF275]/50 text-[#2B2D42] cursor-pointer shadow-[2px_2px_0_#2B2D42] active:translate-y-0.5"
                          : "bg-[#FAF6EB]/50 border-dashed text-[#2B2D42]/45"
                      }`}
                    >
                      <div className="text-[10px] font-bold text-[#2B2D42]/65">右枠</div>
                      <div className="text-sm font-black truncate mt-0.5">
                        {m.playerB ? m.playerB.name : "待機中..."}
                      </div>
                      {isReady && (
                        <div className="text-[10px] text-[#2B2D42] font-black mt-1 underline">
                          タップで勝利 ➔
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
