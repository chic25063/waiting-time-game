"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { PlayerStats, SessionData } from "@/types/session";

const SESSION_STORAGE_KEY = "machajikan_session_v2";
const LEGACY_STORAGE_KEY = "waiting_game_players";

interface WinResult {
  winnerId: string;
  isUnderdog: boolean;
  bonusStars: number;
  streak: number;
}

interface GameSessionContextType {
  players: PlayerStats[];
  recordWin: (winnerId: string) => WinResult;
  recordTeamWin: () => void;
  updatePlayerNames: (updated: { id: string; name: string }[]) => void;
  setPlayerCount: (count: number) => void;
  resetSessionWins: () => void;
  isInitialized: boolean;
}

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);

function createDefaultPlayers(count: number = 3): PlayerStats[] {
  const safe = Math.max(2, Math.min(8, count));
  return Array.from({ length: safe }, (_, i) => ({
    id: `p-${i + 1}`,
    name: `プレイヤー ${i + 1}`,
    totalWins: 0,
    matchCount: 0,
    consecutiveWins: 0,
    underdogWins: 0,
  }));
}

export function GameSessionProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<PlayerStats[]>(() => createDefaultPlayers(3));
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // 初回マウント時にlocalStorageからロード
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SessionData;
        if (parsed.players && Array.isArray(parsed.players) && parsed.players.length >= 2) {
          setPlayers(parsed.players.map((p, i) => ({
            ...p,
            consecutiveWins: p.consecutiveWins || 0,
            underdogWins: p.underdogWins || 0,
          })));
          setIsInitialized(true);
          return;
        }
      }

      // レガシーストレージからの移行チェック
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const legacyParsed = JSON.parse(legacy);
        if (Array.isArray(legacyParsed) && legacyParsed.length >= 2) {
          const migrated: PlayerStats[] = legacyParsed.map((p, idx) => ({
            id: typeof p.id === "string" ? p.id : `p-${idx + 1}`,
            name: typeof p.name === "string" && p.name.trim() !== "" ? p.name.trim() : `プレイヤー ${idx + 1}`,
            totalWins: 0,
            matchCount: 0,
            consecutiveWins: 0,
            underdogWins: 0,
          }));
          setPlayers(migrated);
          setIsInitialized(true);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load session from storage:", e);
    }

    setIsInitialized(true);
  }, []);

  // プレイヤー状態変更時にlocalStorageへ永続化
  useEffect(() => {
    if (!isInitialized || typeof window === "undefined") return;

    try {
      const data: SessionData = {
        sessionId: "default-session",
        players,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save session to storage:", e);
    }
  }, [players, isInitialized]);

  // 勝者を記録 (★+1、下克上時は★+2、連勝カウント)
  const recordWin = useCallback((winnerId: string): WinResult => {
    let result: WinResult = { winnerId, isUnderdog: false, bonusStars: 1, streak: 1 };

    setPlayers((prev) => {
      const winnerPlayer = prev.find((p) => p.id === winnerId);
      const isUnderdog = winnerPlayer ? winnerPlayer.totalWins === 0 : false;
      const starsToAdd = isUnderdog ? 2 : 1;
      const newStreak = (winnerPlayer?.consecutiveWins || 0) + 1;

      result = {
        winnerId,
        isUnderdog,
        bonusStars: starsToAdd,
        streak: newStreak,
      };

      return prev.map((p) => {
        const isWinner = p.id === winnerId;
        return {
          ...p,
          totalWins: isWinner ? p.totalWins + starsToAdd : p.totalWins,
          matchCount: p.matchCount + 1,
          consecutiveWins: isWinner ? (p.consecutiveWins || 0) + 1 : 0,
          underdogWins: isWinner && isUnderdog ? (p.underdogWins || 0) + 1 : (p.underdogWins || 0),
        };
      });
    });

    return result;
  }, []);

  // チーム全員勝利 (解答一致など協力ゲーム用: 全員★+1)
  const recordTeamWin = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        totalWins: p.totalWins + 1,
        matchCount: p.matchCount + 1,
      }))
    );
  }, []);

  // プレイヤー名のみ更新 (★成績は維持)
  const updatePlayerNames = useCallback((updated: { id: string; name: string }[]) => {
    setPlayers((prev) =>
      prev.map((p) => {
        const found = updated.find((u) => u.id === p.id);
        return found ? { ...p, name: found.name.trim() !== "" ? found.name.trim() : p.name } : p;
      })
    );
  }, []);

  // 人数変更時の安全な同期 (名前・★を維持しつつ過不足を調整)
  const setPlayerCount = useCallback((count: number) => {
    const safeCount = Math.max(2, Math.min(8, count));
    setPlayers((prev) => {
      if (prev.length === safeCount) return prev;
      if (prev.length > safeCount) {
        return prev.slice(0, safeCount);
      }
      const next = [...prev];
      for (let i = prev.length; i < safeCount; i++) {
        next.push({
          id: `p-${Date.now()}-${i + 1}`,
          name: `プレイヤー ${i + 1}`,
          totalWins: 0,
          matchCount: 0,
          consecutiveWins: 0,
          underdogWins: 0,
        });
      }
      return next;
    });
  }, []);

  // 通算勝利数をリセット (名前と人数は維持)
  const resetSessionWins = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        totalWins: 0,
        matchCount: 0,
        consecutiveWins: 0,
        underdogWins: 0,
      }))
    );
  }, []);

  return (
    <GameSessionContext.Provider
      value={{
        players,
        recordWin,
        recordTeamWin,
        updatePlayerNames,
        setPlayerCount,
        resetSessionWins,
        isInitialized,
      }}
    >
      {children}
    </GameSessionContext.Provider>
  );
}

export function useGameSession() {
  const context = useContext(GameSessionContext);
  if (!context) {
    throw new Error("useGameSession must be used within a GameSessionProvider");
  }
  return context;
}
