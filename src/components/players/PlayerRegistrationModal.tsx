"use client";

import { useState, useEffect, useRef } from "react";
import { Player } from "@/types/game";
import { PRESET_NICKNAMES } from "@/lib/playerStorage";
import {
  Users,
  UserPlus,
  Trash2,
  Sparkles,
  X,
  Check,
  RotateCcw,
  Zap,
  Play,
} from "lucide-react";

interface PlayerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlayers: Player[];
  onSave: (players: Player[]) => void;
  minPlayers?: number;
  maxPlayers?: number;
  gameTitle?: string;
  isInitialSetup?: boolean;
}

const BADGE_COLORS = [
  "#FFADAD",
  "#7CE8DC",
  "#FFE066",
  "#9AF0A8",
  "#CBC8FA",
  "#F9B8E0",
  "#E8F655",
  "#B8E1FF",
];

export default function PlayerRegistrationModal({
  isOpen,
  onClose,
  initialPlayers,
  onSave,
  minPlayers = 2,
  maxPlayers = 8,
  gameTitle,
  isInitialSetup = false,
}: PlayerRegistrationModalProps) {
  const [localPlayers, setLocalPlayers] = useState<Player[]>(initialPlayers);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialPlayers && initialPlayers.length >= 2) {
        setLocalPlayers(initialPlayers);
      } else {
        const count = Math.max(2, minPlayers);
        setLocalPlayers(
          Array.from({ length: count }, (_, i) => ({
            id: `p-${Date.now()}-${i}`,
            name: `プレイヤー ${i + 1}`,
            score: 0,
            isOut: false,
          }))
        );
      }
    }
  }, [isOpen, initialPlayers, minPlayers]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNameChange = (id: string, name: string) => {
    setLocalPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  const handleAddPlayer = () => {
    if (localPlayers.length >= maxPlayers) return;
    const nextNum = localPlayers.length + 1;
    setLocalPlayers((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        name: `プレイヤー ${nextNum}`,
        score: 0,
        isOut: false,
      },
    ]);
  };

  const handleRemovePlayer = (id: string) => {
    if (localPlayers.length <= minPlayers) return;
    setLocalPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleApplyPresetNames = () => {
    setLocalPlayers((prev) =>
      prev.map((p, idx) => ({
        ...p,
        name:
          PRESET_NICKNAMES[idx % PRESET_NICKNAMES.length] ||
          `プレイヤー ${idx + 1}`,
      }))
    );
  };

  const handleResetDefault = () => {
    setLocalPlayers((prev) =>
      prev.map((p, idx) => ({
        ...p,
        name: `プレイヤー ${idx + 1}`,
      }))
    );
  };

  const handleSave = () => {
    const sanitized = localPlayers.map((p, idx) => ({
      ...p,
      name: p.name.trim() !== "" ? p.name.trim() : `プレイヤー ${idx + 1}`,
    }));
    onSave(sanitized);
    onClose();
  };

  const handleSkip = () => {
    const sanitized = localPlayers.map((p, idx) => ({
      ...p,
      name: p.name.trim() !== "" ? p.name.trim() : `プレイヤー ${idx + 1}`,
      score: 0,
      isOut: false,
    }));
    onSave(sanitized);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-registration-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-[#FAF6EB] border-2 border-[#2B2D42] rounded-3xl p-5 sm:p-6 shadow-[6px_7px_0_#2B2D42] text-[#2B2D42] max-h-[90vh] flex flex-col relative"
      >
        {/* クローズボタン */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white hover:bg-amber-100 border-2 border-[#2B2D42] text-[#2B2D42] transition-all cursor-pointer"
          aria-label="閉じる"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* ヘッダー */}
        <div className="mb-4 pr-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7CE8DC] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>
              {isInitialSetup ? "ゲーム開始前セットアップ" : "参加プレイヤー登録"}
            </span>
          </div>
          <h2
            id="player-registration-title"
            className="text-xl font-black text-[#2B2D42]"
          >
            {isInitialSetup ? "参加プレイヤーの登録" : "プレイヤー設定"}
          </h2>
          <p className="text-xs font-bold text-[#2B2D42]/80 mt-1 leading-relaxed">
            {gameTitle ? `「${gameTitle}」` : "ゲーム"}
            に参加するメンバーの名前を入力してください。（{minPlayers}〜
            {maxPlayers}名まで対応）
          </p>

          {isInitialSetup && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-[#FFF275] border-2 border-[#2B2D42] flex items-center gap-2 text-[11px] font-black text-[#2B2D42]">
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>
                登録をスキップしても大丈夫！デフォルト名のまますぐに遊べます。
              </span>
            </div>
          )}
        </div>

        {/* アクションボタンバー */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs text-[#2B2D42] font-black">
            参加人数:{" "}
            <strong className="px-1.5 py-0.2 rounded bg-[#FFE066] border border-[#2B2D42]">
              {localPlayers.length}
            </strong>{" "}
            人
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyPresetNames}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-[#F9B8E0] hover:brightness-95 text-[#2B2D42] border-2 border-[#2B2D42] font-black flex items-center gap-1 transition-all cursor-pointer"
              title="ランダムな名前を割り当てます"
            >
              <Sparkles className="w-3 h-3" />
              <span>おまかせ名前</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-[#2B2D42] border-2 border-[#2B2D42] font-black flex items-center gap-1 transition-all cursor-pointer"
              title="プレイヤー1, 2... に戻します"
            >
              <RotateCcw className="w-3 h-3" />
              <span>リセット</span>
            </button>
          </div>
        </div>

        {/* プレイヤー一覧フォーム */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 mb-4">
          {localPlayers.map((player, index) => {
            const badgeColor = BADGE_COLORS[index % BADGE_COLORS.length];
            const canRemove = localPlayers.length > minPlayers;

            return (
              <div
                key={player.id}
                className="flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl bg-white border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42]"
              >
                <div
                  className="w-8 h-8 rounded-xl border-2 border-[#2B2D42] flex items-center justify-center text-[#2B2D42] text-xs font-black shrink-0"
                  style={{ backgroundColor: badgeColor }}
                >
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`player-input-${player.id}`}
                    className="sr-only"
                  >
                    プレイヤー{index + 1}の名前
                  </label>
                  <input
                    id={`player-input-${player.id}`}
                    type="text"
                    value={player.name}
                    placeholder={`プレイヤー ${index + 1}`}
                    maxLength={15}
                    onChange={(e) =>
                      handleNameChange(player.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        if (
                          e.nativeEvent.isComposing ||
                          (e as unknown as { keyCode: number }).keyCode === 229
                        ) {
                          return;
                        }
                        handleSave();
                      }
                    }}
                    className="w-full bg-transparent text-sm sm:text-base font-black text-[#2B2D42] placeholder-[#2B2D42]/40 focus:outline-none px-1"
                  />
                </div>

                {canRemove && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(player.id)}
                    className="p-1.5 rounded-xl text-[#2B2D42]/60 hover:text-rose-600 hover:bg-rose-100 transition-all shrink-0 cursor-pointer"
                    title="このプレイヤーを削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* プレイヤー追加ボタン */}
        {localPlayers.length < maxPlayers && (
          <button
            type="button"
            onClick={handleAddPlayer}
            className="w-full py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-50 text-[#2B2D42] border-2 border-dashed border-[#2B2D42] text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all mb-4 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>プレイヤーを追加する（最大 {maxPlayers} 人）</span>
          </button>
        )}

        {/* フッター操作ボタン */}
        <div className="flex items-center gap-2.5 pt-3 border-t-2 border-dashed border-[#2B2D42]/25">
          {isInitialSetup ? (
            <>
              <button
                type="button"
                onClick={handleSkip}
                className="py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-[#2B2D42] border-2 border-[#2B2D42] text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-[2px_3px_0_#2B2D42] transition-all shrink-0 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>スキップして開始</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] text-xs sm:text-sm font-black shadow-[3px_4px_0_#2B2D42] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>このメンバーで開始！</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-[#2B2D42] border-2 border-[#2B2D42] text-xs sm:text-sm font-black transition-all text-center cursor-pointer"
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] text-xs sm:text-sm font-black shadow-[3px_4px_0_#2B2D42] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>変更を反映する</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
