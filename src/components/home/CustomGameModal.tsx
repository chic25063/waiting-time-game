"use client";

import React, { useState, useEffect } from "react";
import { Game } from "@/types/game";
import { saveCustomGame } from "@/lib/customGames";
import { X, PlusCircle, Save } from "lucide-react";

interface CustomGameModalProps {
  isOpen: boolean;
  gameToEdit?: Game | null;
  onClose: () => void;
  onSaved: (savedGame: Game) => void;
}

export default function CustomGameModal({
  isOpen,
  gameToEdit,
  onClose,
  onSaved,
}: CustomGameModalProps) {
  const [title, setTitle] = useState("");

  // モーダルが開いたときの初期化
  useEffect(() => {
    if (gameToEdit) {
      setTitle(gameToEdit.title);
    } else {
      setTitle("");
    }
  }, [gameToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      alert("ゲーム名を入力してください");
      return;
    }

    const id = gameToEdit?.id || `custom-${Date.now()}`;
    const trimmedTitle = title.trim();

    const newGame: Game = {
      id,
      title: trimmedTitle,
      short_description: "勝った・負けた（勝ち星★）を判定するシンプルモード",
      description: "自由に遊んで、勝った人・ミスした人をタップして勝ち星（★）を記録します。",
      min_players: 2,
      max_players: 8,
      created_at: gameToEdit?.created_at || new Date().toISOString(),
      isCustom: true,
      metadata: {
        tools: [],
        tags: ["追加ゲーム", "自作"],
      },
    };

    saveCustomGame(newGame);
    onSaved(newGame);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <form
        onSubmit={handleSave}
        className="relative w-full max-w-sm bg-[#FAF6EB] border-[2.5px] border-[#2B2D42] rounded-3xl p-5 sm:p-6 text-[#2B2D42] shadow-[6px_7px_0_#2B2D42] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2B2D42]/25">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#FFADAD] border-2 border-[#2B2D42] flex items-center justify-center shadow-[1px_2px_0_#2B2D42]">
              <PlusCircle className="w-4 h-4 text-[#2B2D42] stroke-[2.5]" />
            </span>
            <h3 className="text-lg font-black text-[#2B2D42]">
              {gameToEdit ? "ゲーム名を変更" : "ゲームを追加"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white border-2 border-[#2B2D42] text-[#2B2D42] hover:bg-amber-100 cursor-pointer"
            aria-label="閉じる"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* ゲーム名入力（シンプルにこれだけ！） */}
        <div className="space-y-2">
          <label className="text-xs font-black text-[#2B2D42] block">
            追加するゲーム名
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-white border-2 border-[#2B2D42] p-3.5 rounded-2xl text-base font-black text-[#2B2D42] shadow-[2px_3px_0_#2B2D42] focus:outline-none focus:bg-[#FFFDF7]"
            placeholder="例: 指スマ、山手線ゲーム など"
            maxLength={30}
          />
          <p className="text-[11px] font-bold text-[#2B2D42]/70 leading-relaxed">
            ※ 追加したゲームは、ゲーム名と「勝った・負けた（勝ち星★）」の判定だけでシンプルに遊べます！
          </p>
        </div>

        {/* 保存ボタン */}
        <button
          type="submit"
          className="w-full py-3.5 px-6 bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] font-black text-base rounded-2xl shadow-[4px_5px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_2px_0_#2B2D42] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Save className="w-5 h-5 stroke-[2.5]" />
          <span>{gameToEdit ? "ゲーム名を保存" : "このゲームを追加する！"}</span>
        </button>
      </form>
    </div>
  );
}
