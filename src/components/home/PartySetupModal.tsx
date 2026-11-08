"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MultiRuleType,
  PointRaceGoal,
  MatchSessionConfig,
  PENALTY_PRESETS,
} from "@/types/matchMode";
import { useActiveMatch } from "@/context/ActiveMatchContext";
import GameExclusionSelector from "./GameExclusionSelector";
import { Users, X, Flame, Trophy, Skull, Target, Sparkles } from "lucide-react";

interface PartySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PARTY_PLAYERS_STORAGE_KEY = "machajikan_party_players_v1";
const PENALTY_STORAGE_KEY = "machajikan_party_penalty_v1";

export default function PartySetupModal({ isOpen, onClose }: PartySetupModalProps) {
  const router = useRouter();
  const { startMatch } = useActiveMatch();

  const [playerCount, setPlayerCount] = useState<number>(4);
  const [playerNames, setPlayerNames] = useState<string[]>([
    "プレイヤー 1",
    "プレイヤー 2",
    "プレイヤー 3",
    "プレイヤー 4",
  ]);
  const [multiRuleType, setMultiRuleType] = useState<MultiRuleType>("survival_knockout");
  const [pointRaceGoal, setPointRaceGoal] = useState<PointRaceGoal>("rounds_5");
  const [hasPenalty, setHasPenalty] = useState<boolean>(false); // 罰ゲームのON/OFF（初期値: OFF）
  const [loserPenaltyText, setLoserPenaltyText] = useState<string>("🍹 ジュース奢り");
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  // 前回のプレイヤー名や罰ゲームを復元
  useEffect(() => {
    try {
      const savedNames = localStorage.getItem(PARTY_PLAYERS_STORAGE_KEY);
      if (savedNames) {
        const parsed = JSON.parse(savedNames);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          setPlayerNames(parsed);
          setPlayerCount(Math.min(8, Math.max(3, parsed.length)));
        }
      }
      const savedPenalty = localStorage.getItem(PENALTY_STORAGE_KEY);
      if (savedPenalty) {
        setLoserPenaltyText(savedPenalty);
      }
    } catch (e) {
      console.error("Failed to load party setup:", e);
    }
  }, []);

  // 人数変更時の名前配列の調整
  const handleCountChange = (count: number) => {
    setPlayerCount(count);
    setPlayerNames((prev) => {
      const updated = [...prev];
      while (updated.length < count) {
        updated.push(`プレイヤー ${updated.length + 1}`);
      }
      return updated.slice(0, count);
    });
  };

  const handleNameChange = (index: number, newName: string) => {
    setPlayerNames((prev) => {
      const updated = [...prev];
      updated[index] = newName;
      return updated;
    });
  };

  if (!isOpen) return null;

  const handleStart = () => {
    const finalPlayers = Array.from({ length: playerCount }).map((_, i) => ({
      id: `p-${i + 1}`,
      name: playerNames[i]?.trim() || `プレイヤー ${i + 1}`,
    }));

    try {
      localStorage.setItem(
        PARTY_PLAYERS_STORAGE_KEY,
        JSON.stringify(finalPlayers.map((p) => p.name))
      );
      if (loserPenaltyText) {
        localStorage.setItem(PENALTY_STORAGE_KEY, loserPenaltyText);
      }
    } catch (e) {
      console.error("Failed to save party setup:", e);
    }

    const config: MatchSessionConfig = {
      mode: "party_multi",
      players: finalPlayers,
      multiRuleType,
      pointRaceGoal: multiRuleType === "point_race" ? pointRaceGoal : undefined,
      loserPenaltyText:
        multiRuleType === "loser_king" && hasPenalty
          ? loserPenaltyText.trim() || "罰ゲーム"
          : undefined,
      excludedGameIds: excludedIds,
    };

    startMatch(config);
    onClose();
    router.push("/arena");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#FAF6EB] border-2 border-[#2B2D42] rounded-3xl p-5 sm:p-6 text-[#2B2D42] shadow-[6px_7px_0_#2B2D42] max-h-[92vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2B2D42]/25">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#E8F655] border-2 border-[#2B2D42] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#2B2D42]" />
            </span>
            <h3 className="text-lg font-black text-[#2B2D42]">
              多人数 対戦モード設定
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white border-2 border-[#2B2D42] text-[#2B2D42] hover:bg-amber-100 cursor-pointer"
            aria-label="閉じる"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 参加人数ピル選択 */}
        <div className="space-y-2">
          <div className="text-xs font-black text-[#2B2D42]">
            参加人数（3〜8人）:
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[3, 4, 5, 6, 7, 8].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => handleCountChange(num)}
                className={`flex-1 min-w-[50px] py-2.5 rounded-xl border-2 border-[#2B2D42] text-center font-black text-sm transition-all cursor-pointer ${
                  playerCount === num
                    ? "bg-[#E8F655] text-[#2B2D42] shadow-[2px_3px_0_#2B2D42]"
                    : "bg-white text-[#2B2D42]/70 hover:bg-slate-50"
                }`}
              >
                {num}人
              </button>
            ))}
          </div>
        </div>

        {/* プレイヤー名入力 */}
        <div className="space-y-2">
          <div className="text-xs font-black text-[#2B2D42]">プレイヤー名:</div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: playerCount }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border-2 border-[#2B2D42] p-2 rounded-xl shadow-[2px_2px_0_#2B2D42]"
              >
                <label className="text-[10px] px-1.5 py-0.2 rounded bg-[#CBC8FA] text-[#2B2D42] font-black inline-block mb-0.5">
                  プレイヤー {idx + 1}
                </label>
                <input
                  type="text"
                  value={playerNames[idx] || ""}
                  onChange={(e) => handleNameChange(idx, e.target.value)}
                  className="w-full bg-transparent text-sm font-black text-[#2B2D42] focus:outline-none"
                  placeholder={`プレイヤー ${idx + 1}`}
                  maxLength={10}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 対戦ルール選択 */}
        <div className="space-y-2">
          <div className="text-xs font-black text-[#2B2D42]">
            対戦形式（ルール）:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMultiRuleType("survival_knockout")}
              className={`p-3 rounded-2xl border-2 border-[#2B2D42] text-center transition-all cursor-pointer ${
                multiRuleType === "survival_knockout"
                  ? "bg-[#E8F655] text-[#2B2D42] font-black shadow-[2px_3px_0_#2B2D42]"
                  : "bg-white text-[#2B2D42]/70 hover:bg-slate-50"
              }`}
            >
              <Trophy className="w-4 h-4 mx-auto mb-1 text-[#2B2D42]" />
              <div className="text-xs font-black">勝ち残り制</div>
              <div className="text-[9px] font-bold opacity-75 mt-0.5">
                敗者脱落サバイバル
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMultiRuleType("point_race")}
              className={`p-3 rounded-2xl border-2 border-[#2B2D42] text-center transition-all cursor-pointer ${
                multiRuleType === "point_race"
                  ? "bg-[#7CE8DC] text-[#2B2D42] font-black shadow-[2px_3px_0_#2B2D42]"
                  : "bg-white text-[#2B2D42]/70 hover:bg-slate-50"
              }`}
            >
              <Target className="w-4 h-4 mx-auto mb-1 text-[#2B2D42]" />
              <div className="text-xs font-black">点数制</div>
              <div className="text-[9px] font-bold opacity-75 mt-0.5">
                最多得点者が優勝
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMultiRuleType("loser_king")}
              className={`p-3 rounded-2xl border-2 border-[#2B2D42] text-center transition-all cursor-pointer ${
                multiRuleType === "loser_king"
                  ? "bg-[#FFADAD] text-[#2B2D42] font-black shadow-[2px_3px_0_#2B2D42]"
                  : "bg-white text-[#2B2D42]/70 hover:bg-slate-50"
              }`}
            >
              <Skull className="w-4 h-4 mx-auto mb-1 text-[#2B2D42]" />
              <div className="text-xs font-black">最弱王決定戦</div>
              <div className="text-[9px] font-bold opacity-75 mt-0.5">
                負け残り脱落
              </div>
            </button>
          </div>
        </div>

        {/* 点数制の追加オプション */}
        {multiRuleType === "point_race" && (
          <div className="p-3 bg-white border-2 border-[#2B2D42] rounded-2xl space-y-2 shadow-[2px_3px_0_#2B2D42]">
            <div className="text-xs font-black text-[#2B2D42]">
              点数制の勝利条件:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPointRaceGoal("rounds_3")}
                className={`py-2 px-2 rounded-xl border-2 border-[#2B2D42] text-center text-xs font-black transition-all cursor-pointer ${
                  pointRaceGoal === "rounds_3"
                    ? "bg-[#7CE8DC] text-[#2B2D42]"
                    : "bg-[#FAF6EB] text-[#2B2D42]/70"
                }`}
              >
                全3回戦
              </button>
              <button
                type="button"
                onClick={() => setPointRaceGoal("rounds_5")}
                className={`py-2 px-2 rounded-xl border-2 border-[#2B2D42] text-center text-xs font-black transition-all cursor-pointer ${
                  pointRaceGoal === "rounds_5"
                    ? "bg-[#7CE8DC] text-[#2B2D42]"
                    : "bg-[#FAF6EB] text-[#2B2D42]/70"
                }`}
              >
                全5回戦
              </button>
              <button
                type="button"
                onClick={() => setPointRaceGoal("points_3")}
                className={`py-2 px-2 rounded-xl border-2 border-[#2B2D42] text-center text-xs font-black transition-all cursor-pointer ${
                  pointRaceGoal === "points_3"
                    ? "bg-[#7CE8DC] text-[#2B2D42]"
                    : "bg-[#FAF6EB] text-[#2B2D42]/70"
                }`}
              >
                3点先取
              </button>
            </div>
            <div className="text-[11px] font-bold text-[#2B2D42]/75">
              ※ 同点の場合は、同点者同士の【サドンデス延長戦】で完全決着！
            </div>
          </div>
        )}

        {/* 最弱王の罰ゲーム設定 ＆ プリセット */}
        {multiRuleType === "loser_king" && (
          <div className="p-3 bg-white border-2 border-[#2B2D42] rounded-2xl space-y-3 shadow-[2px_3px_0_#2B2D42]">
            {/* ON/OFF 切り替えトグル */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#2B2D42]">
                <Skull className="w-3.5 h-3.5 text-[#2B2D42]" />
                <span>最弱王の罰ゲーム:</span>
              </div>
              <div className="flex items-center gap-1 bg-[#FAF6EB] p-0.5 rounded-xl border-2 border-[#2B2D42]">
                <button
                  type="button"
                  onClick={() => setHasPenalty(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    !hasPenalty
                      ? "bg-[#2B2D42] text-white"
                      : "text-[#2B2D42]/70 hover:text-[#2B2D42]"
                  }`}
                >
                  なし (OFF)
                </button>
                <button
                  type="button"
                  onClick={() => setHasPenalty(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    hasPenalty
                      ? "bg-[#FFADAD] text-[#2B2D42] border border-[#2B2D42]"
                      : "text-[#2B2D42]/70 hover:text-[#2B2D42]"
                  }`}
                >
                  あり (ON)
                </button>
              </div>
            </div>

            {/* 罰ゲーム ON 時の入力フォーム */}
            {hasPenalty ? (
              <div className="space-y-2.5 pt-2 border-t-2 border-dashed border-[#2B2D42]/20 animate-in fade-in">
                <input
                  type="text"
                  value={loserPenaltyText}
                  onChange={(e) => setLoserPenaltyText(e.target.value)}
                  className="w-full bg-[#FAF6EB] border-2 border-[#2B2D42] p-2.5 rounded-xl text-sm font-black text-[#2B2D42] focus:outline-none"
                  placeholder="例: ジュース奢り、変顔写真など"
                />
                {/* ワンタップ候補プリセット */}
                <div className="space-y-1">
                  <div className="text-[10px] text-[#2B2D42]/75 font-black flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#2B2D42]" />
                    <span>おすすめ候補（タップで即セット）:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PENALTY_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setLoserPenaltyText(preset)}
                        className="text-[11px] px-2.5 py-1 bg-[#FAF6EB] hover:bg-[#FFADAD]/60 border border-[#2B2D42] rounded-lg text-[#2B2D42] font-bold transition-all cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[11px] font-bold text-[#2B2D42]/70 pt-0.5">
                ※ 罰ゲームなしで「本日の最弱王」の称号決定のみを競います。
              </div>
            )}
          </div>
        )}

        {/* 除外ゲーム設定（人数連動） */}
        <GameExclusionSelector
          playerCount={playerCount}
          excludedGameIds={excludedIds}
          onChangeExcludedIds={setExcludedIds}
        />

        {/* スタートボタン */}
        <button
          onClick={handleStart}
          className="w-full py-4 px-6 bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] font-black text-lg rounded-2xl shadow-[4px_5px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_2px_0_#2B2D42] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Flame className="w-5 h-5 fill-current" />
          <span>多人数 対戦スタート！</span>
        </button>
      </div>
    </div>
  );
}
