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
  recordWin: (winnerId: string, winnerName?: string) => WinResult;
  recordTeamWin: () => void;
  updatePlayerNames: (updated: { id: string; name: string }[]) => void;
  syncSessionPlayers: (roster: { id: string; name: string }[]) => void;
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
          setPlayers(
            parsed.players.map((p, i) => ({
              ...p,
              id: `p-${i + 1}`,
              consecutiveWins: p.consecutiveWins || 0,
              underdogWins: p.underdogWins || 0,
            }))
          );
          setIsInitialized(true);
          return;
        }
      }

      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const legacyParsed = JSON.parse(legacy);
        if (Array.isArray(legacyParsed) && legacyParsed.length >= 2) {
          const migrated: PlayerStats[] = legacyParsed.map((p, idx) => ({
            id: `p-${idx + 1}`,
            name:
              typeof p.name === "string" && p.name.trim() !== ""
                ? p.name.trim()
                : `プレイヤー ${idx + 1}`,
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

  // 勝者を記録（全プレイヤー1〜8人すべて確実に ★+1 を記録）
  const recordWin = useCallback((winnerId: string, winnerName?: string): WinResult => {
    const result: WinResult = {
      winnerId,
      isUnderdog: false,
      bonusStars: 1,
      streak: 1,
    };

    setPlayers((prev) => {
      const hasMatch = prev.some(
        (p) => p.id === winnerId || (winnerName && p.name === winnerName)
      );

      const baseList = hasMatch
        ? prev
        : [
            ...prev,
            {
              id: winnerId,
              name: winnerName || `プレイヤー ${prev.length + 1}`,
              totalWins: 0,
              matchCount: 0,
              consecutiveWins: 0,
              underdogWins: 0,
            },
          ];

      let matchedOnce = false;
      return baseList.map((p) => {
        const isWinner =
          !matchedOnce &&
          (p.id === winnerId || (Boolean(winnerName) && p.name === winnerName));
        if (isWinner) matchedOnce = true;

        return {
          ...p,
          totalWins: isWinner ? p.totalWins + 1 : p.totalWins,
          matchCount: p.matchCount + 1,
          consecutiveWins: isWinner ? (p.consecutiveWins || 0) + 1 : 0,
        };
      });
    });

    return result;
  }, []);

  // チーム全員勝利
  const recordTeamWin = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        totalWins: p.totalWins + 1,
        matchCount: p.matchCount + 1,
      }))
    );
  }, []);

  // プレイヤー名のみ更新
  const updatePlayerNames = useCallback((updated: { id: string; name: string }[]) => {
    setPlayers((prev) =>
      prev.map((p, idx) => {
        const found =
          updated.find((u) => u.id === p.id) || updated[idx];
        return found
          ? {
              ...p,
              name: found.name.trim() !== "" ? found.name.trim() : p.name,
            }
          : p;
      })
    );
  }, []);

  // ゲーム画面のプレイヤー配列(2〜8人)とセッション統計を完全同期（既存の★は維持）
  const syncSessionPlayers = useCallback((roster: { id: string; name: string }[]) => {
    if (!roster || roster.length < 2) return;
    setPlayers((prev) => {
      const next: PlayerStats[] = roster.map((r, idx) => {
        const normalizedId = `p-${idx + 1}`;
        const existing =
          prev.find((p) => p.id === r.id) ||
          prev.find((p) => p.id === normalizedId) ||
          prev[idx];
        return {
          id: normalizedId,
          name: r.name.trim() !== "" ? r.name.trim() : `プレイヤー ${idx + 1}`,
          totalWins: existing ? existing.totalWins : 0,
          matchCount: existing ? existing.matchCount : 0,
          consecutiveWins: existing ? existing.consecutiveWins || 0 : 0,
          underdogWins: existing ? existing.underdogWins || 0 : 0,
        };
      });
      return next;
    });
  }, []);

  // 人数変更時の安全な同期
  const setPlayerCount = useCallback((count: number) => {
    const safeCount = Math.max(2, Math.min(8, count));
    setPlayers((prev) => {
      if (prev.length === safeCount) return prev;
      if (prev.length > safeCount) {
        return prev.slice(0, safeCount).map((p, idx) => ({
          ...p,
          id: `p-${idx + 1}`,
        }));
      }
      const next = prev.map((p, idx) => ({
        ...p,
        id: `p-${idx + 1}`,
      }));
      for (let i = prev.length; i < safeCount; i++) {
        next.push({
          id: `p-${i + 1}`,
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
        syncSessionPlayers,
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
