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

// プレイヤーごとのアバターバッジ色
const AVATAR_COLORS = [
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-purple-500 to-indigo-500",
  "from-fuchsia-500 to-pink-600",
  "from-lime-400 to-emerald-600",
  "from-violet-500 to-purple-600",
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

  // モーダルが開かれた時に親の初期値を反映
  useEffect(() => {
    if (isOpen) {
      if (initialPlayers && initialPlayers.length >= 2) {
        setLocalPlayers(initialPlayers);
      } else {
        // 最低人数分用意
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

  // ESCキーで閉じる
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

  // プレイヤー名更新
  const handleNameChange = (id: string, name: string) => {
    setLocalPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  // プレイヤー追加
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

  // プレイヤー削除
  const handleRemovePlayer = (id: string) => {
    if (localPlayers.length <= minPlayers) return;
    setLocalPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  // サンプルニックネーム適用
  const handleApplyPresetNames = () => {
    setLocalPlayers((prev) =>
      prev.map((p, idx) => ({
        ...p,
        name: PRESET_NICKNAMES[idx % PRESET_NICKNAMES.length] || `プレイヤー ${idx + 1}`,
      }))
    );
  };

  // デフォルト名にリセット
  const handleResetDefault = () => {
    setLocalPlayers((prev) =>
      prev.map((p, idx) => ({
        ...p,
        name: `プレイヤー ${idx + 1}`,
      }))
    );
  };

  // 保存して閉じる
  const handleSave = () => {
    // 空白の名前があれば「プレイヤー N」で補完
    const sanitized = localPlayers.map((p, idx) => ({
      ...p,
      name: p.name.trim() !== "" ? p.name.trim() : `プレイヤー ${idx + 1}`,
    }));
    onSave(sanitized);
    onClose();
  };

  // デフォルト名ですぐ遊ぶ（スキップ）
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-gradient-to-br from-slate-900 via-indigo-950/90 to-purple-950/90 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-2xl text-white max-h-[90vh] flex flex-col relative"
      >
        {/* クローズボタン */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all active:scale-95"
          aria-label="閉じる"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ヘッダー */}
        <div className="mb-4 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>{isInitialSetup ? "ゲーム開始前セットアップ" : "参加プレイヤー登録"}</span>
          </div>
          <h2 id="player-registration-title" className="text-xl font-black text-white">
            {isInitialSetup ? "参加プレイヤーの登録" : "プレイヤー設定"}
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {gameTitle ? `「${gameTitle}」` : "ゲーム"}に参加するメンバーの名前を入力してください。
            （{minPlayers}〜{maxPlayers}名まで対応）
          </p>

          {isInitialSetup && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center gap-2 text-[11px] text-amber-200">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                登録をスキップしても大丈夫！デフォルト名のまますぐに遊べます。
              </span>
            </div>
          )}
        </div>

        {/* アクションボタンバー */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs text-purple-200 font-semibold">
            参加人数: <strong className="text-amber-300 font-bold">{localPlayers.length}</strong> 人
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyPresetNames}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-400/30 flex items-center gap-1 transition-all active:scale-95"
              title="ランダムな名前を割り当てます"
            >
              <Sparkles className="w-3 h-3 text-pink-400" />
              <span>おまかせ名前</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 flex items-center gap-1 transition-all active:scale-95"
              title="プレイヤー1, 2... に戻します"
            >
              <RotateCcw className="w-3 h-3" />
              <span>リセット</span>
            </button>
          </div>
        </div>

        {/* プレイヤー一覧フォーム（スクロール領域） */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 mb-4 custom-scrollbar">
          {localPlayers.map((player, index) => {
            const avatarGrad = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const canRemove = localPlayers.length > minPlayers;

            return (
              <div
                key={player.id}
                className="flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all focus-within:border-purple-400 focus-within:bg-white/10"
              >
                {/* プレイヤー番号・アバター */}
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white text-xs font-black shadow-md shrink-0`}
                >
                  {index + 1}
                </div>

                {/* プレイヤー名入力 */}
                <div className="flex-1 min-w-0">
                  <label htmlFor={`player-input-${player.id}`} className="sr-only">
                    プレイヤー{index + 1}の名前
                  </label>
                  <input
                    id={`player-input-${player.id}`}
                    type="text"
                    value={player.name}
                    placeholder={`プレイヤー ${index + 1}`}
                    maxLength={15}
                    onChange={(e) => handleNameChange(player.id, e.target.value)}
                    onKeyDown={(e) => {
                      // IME変換中のEnterで保存・送信が走らないよう保護
                      if (e.key === "Enter" && !e.shiftKey) {
                        if (e.nativeEvent.isComposing || (e as unknown as { keyCode: number }).keyCode === 229) {
                          return;
                        }
                        handleSave();
                      }
                    }}
                    className="w-full bg-transparent text-sm sm:text-base font-bold text-white placeholder-slate-400 focus:outline-none px-1"
                  />
                </div>

                {/* 削除ボタン */}
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(player.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0 active:scale-95"
                    title="このプレイヤーを削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* プレイヤー追加ボタン（最大人数未満のとき） */}
        {localPlayers.length < maxPlayers && (
          <button
            type="button"
            onClick={handleAddPlayer}
            className="w-full py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.99] text-purple-200 border border-dashed border-purple-400/40 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all mb-4"
          >
            <UserPlus className="w-4 h-4 text-purple-300" />
            <span>プレイヤーを追加する（最大 {maxPlayers} 人）</span>
          </button>
        )}

        {/* フッター操作ボタン */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          {isInitialSetup ? (
            <>
              <button
                type="button"
                onClick={handleSkip}
                className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-98 text-amber-200 hover:text-amber-100 border border-amber-400/30 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all text-center shrink-0"
                title="名前の登録をスキップし、デフォルト名で開始します"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                <span>スキップして開始</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-300 hover:via-orange-400 hover:to-pink-400 active:scale-98 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-orange-500/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <Play className="w-4 h-4 fill-current text-slate-950" />
                <span>このメンバーで開始！</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-98 text-slate-200 text-xs sm:text-sm font-semibold transition-all text-center"
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:via-purple-500 hover:to-indigo-500 active:scale-98 text-white text-xs sm:text-sm font-black shadow-lg shadow-purple-500/30 flex items-center justify-center gap-1.5 transition-all"
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
