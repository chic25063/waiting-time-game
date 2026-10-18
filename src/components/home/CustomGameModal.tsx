"use client";

import React, { useState, useEffect } from "react";
import { Game } from "@/types/game";
import {
  saveCustomGame,
  CUSTOM_GAME_TEMPLATES,
  CustomGameTemplate,
} from "@/lib/customGames";
import {
  X,
  Sparkles,
  Dices,
  Clock,
  Activity,
  MessageSquare,
  Plus,
  Save,
  Trash2,
  HelpCircle,
  FileText,
} from "lucide-react";

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
  const [shortDesc, setShortDesc] = useState("");
  const [ruleText, setRuleText] = useState("");
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [selectedTool, setSelectedTool] = useState<"prompt" | "bpm" | "timer" | "none">("prompt");
  const [promptListText, setPromptListText] = useState("");
  const [defaultBpm, setDefaultBpm] = useState(120);
  const [timerDuration, setTimerDuration] = useState(10);
  const [isBlindTimer, setIsBlindTimer] = useState(false);

  // 編集モード時の初期化
  useEffect(() => {
    if (gameToEdit) {
      setTitle(gameToEdit.title);
      setShortDesc(gameToEdit.short_description || gameToEdit.description);
      setRuleText(gameToEdit.description || "");
      setMinPlayers(gameToEdit.min_players);
      setMaxPlayers(gameToEdit.max_players);

      const meta = gameToEdit.metadata;
      if (meta?.tools?.includes("prompt") || meta?.promptList) {
        setSelectedTool("prompt");
        const list = meta.promptList || gameToEdit.prompt_list || [];
        setPromptListText(
          list
            .map((p) => (typeof p === "string" ? p : `${p.question} (答: ${p.answer})`))
            .join("\n")
        );
      } else if (meta?.tools?.includes("bpm") || meta?.defaultBpm) {
        setSelectedTool("bpm");
        setDefaultBpm(meta.defaultBpm || 120);
      } else if (meta?.tools?.includes("timer") || meta?.timerDuration) {
        setSelectedTool("timer");
        setTimerDuration(meta.timerDuration || 10);
        setIsBlindTimer(meta.blindTimer || false);
      } else {
        setSelectedTool("none");
      }
    } else {
      // 新規作成時の初期化（古今東西テンプレートを初期適用）
      applyTemplate(CUSTOM_GAME_TEMPLATES[0]);
    }
  }, [gameToEdit, isOpen]);

  // テンプレート適用
  const applyTemplate = (tpl: CustomGameTemplate) => {
    setTitle(tpl.title);
    setShortDesc(tpl.short_description);
    setRuleText(tpl.description);
    setMinPlayers(tpl.min_players);
    setMaxPlayers(tpl.max_players);
    setSelectedTool(tpl.selectedTool);
    if (tpl.promptListText) setPromptListText(tpl.promptListText);
    if (tpl.defaultBpm) setDefaultBpm(tpl.defaultBpm);
    if (tpl.timerDuration) setTimerDuration(tpl.timerDuration);
  };

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      alert("ゲームタイトルを入力してください");
      return;
    }

    const id = gameToEdit?.id || `custom-${Date.now()}`;
    const prompts =
      selectedTool === "prompt"
        ? promptListText
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : undefined;

    const newGame: Game = {
      id,
      title: title.trim(),
      short_description: shortDesc.trim() || title.trim(),
      description: ruleText.trim() || shortDesc.trim() || title.trim(),
      min_players: Math.min(minPlayers, maxPlayers),
      max_players: Math.max(minPlayers, maxPlayers),
      created_at: gameToEdit?.created_at || new Date().toISOString(),
      isCustom: true,
      metadata: {
        tools: selectedTool !== "none" ? [selectedTool] : [],
        promptList: prompts,
        defaultBpm: selectedTool === "bpm" ? defaultBpm : undefined,
        timerDuration: selectedTool === "timer" ? timerDuration : undefined,
        blindTimer: selectedTool === "timer" ? isBlindTimer : undefined,
        tags: ["オリジナル", "自作"],
      },
    };

    saveCustomGame(newGame);
    onSaved(newGame);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-gray-900 to-gray-950 border-2 border-amber-500/40 rounded-3xl p-6 text-white shadow-2xl max-h-[92vh] overflow-y-auto space-y-5">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-lg font-black text-white">
              {gameToEdit ? "オリジナルゲームを編集" : "オリジナルゲームを作成"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* テンプレート選択（新規時のみ） */}
        {!gameToEdit && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-400 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>おすすめテンプレートから作る（ワンタップ入力）:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CUSTOM_GAME_TEMPLATES.map((tpl) => (
                <button
                  type="button"
                  key={tpl.name}
                  onClick={() => applyTemplate(tpl)}
                  className="p-2.5 rounded-xl bg-gray-950/60 hover:bg-amber-950/30 border border-gray-800 hover:border-amber-500/40 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white group-hover:text-amber-300">
                      {tpl.name}
                    </span>
                    <span className="text-[10px] text-gray-400">{tpl.badge}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ゲームタイトル */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300 block">
            ゲームタイトル <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-950/80 border border-gray-800 focus:border-amber-400 p-2.5 rounded-xl text-sm font-bold text-white focus:outline-none"
            placeholder="例: オリジナル古今東西、一言大喜利など"
            maxLength={30}
          />
        </div>

        {/* 簡単な説明 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300 block">
            簡単な説明（スロット・一覧に表示）
          </label>
          <input
            type="text"
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            className="w-full bg-gray-950/80 border border-gray-800 focus:border-amber-400 p-2.5 rounded-xl text-sm text-white focus:outline-none"
            placeholder="例: リズムに合わせてお題を答えていくゲーム！"
            maxLength={60}
          />
        </div>

        {/* プレイ可能人数 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300 block">
            プレイ可能人数
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-950/80 border border-gray-800 p-2.5 rounded-xl flex items-center justify-between">
              <span className="text-xs text-gray-400">最小人数:</span>
              <select
                value={minPlayers}
                onChange={(e) => setMinPlayers(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
              >
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n} className="bg-gray-900 text-white">
                    {n}人
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-950/80 border border-gray-800 p-2.5 rounded-xl flex items-center justify-between">
              <span className="text-xs text-gray-400">最大人数:</span>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
              >
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n} className="bg-gray-900 text-white">
                    {n}人
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 連動GMツール選択 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300 block">
            連動させるゲームマスター（GM）ツール:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setSelectedTool("prompt")}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                selectedTool === "prompt"
                  ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                  : "bg-gray-950/50 border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4 mx-auto mb-1 text-amber-400" />
              <div className="text-xs">お題ガチャ</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTool("bpm")}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                selectedTool === "bpm"
                  ? "bg-purple-500/20 border-purple-400 text-purple-300 font-bold"
                  : "bg-gray-950/50 border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4 mx-auto mb-1 text-purple-400" />
              <div className="text-xs">BPMリズム</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTool("timer")}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                selectedTool === "timer"
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
                  : "bg-gray-950/50 border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              <Clock className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
              <div className="text-xs">タイマー</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTool("none")}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                selectedTool === "none"
                  ? "bg-rose-500/20 border-rose-400 text-rose-300 font-bold"
                  : "bg-gray-950/50 border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              <HelpCircle className="w-4 h-4 mx-auto mb-1 text-rose-400" />
              <div className="text-xs">ツールなし</div>
            </button>
          </div>
        </div>

        {/* ツール別設定エリア */}
        {selectedTool === "prompt" && (
          <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
              <span>お題リスト（1行に1つ入力）:</span>
              <span className="text-[10px] text-gray-400">
                {promptListText.split("\n").filter((s) => s.trim().length > 0).length}個
              </span>
            </div>
            <textarea
              rows={4}
              value={promptListText}
              onChange={(e) => setPromptListText(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              placeholder="お題1&#10;お題2&#10;お題3..."
            />
            <div className="text-[10px] text-gray-400">
              ※ 対戦中にお題ガチャを引くと、このリストからランダムで出題されます！
            </div>
          </div>
        )}

        {selectedTool === "bpm" && (
          <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-purple-300">
              デフォルトテンポ（BPM）: <span className="text-white">{defaultBpm}</span>
            </div>
            <input
              type="range"
              min={60}
              max={180}
              step={5}
              value={defaultBpm}
              onChange={(e) => setDefaultBpm(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>ゆったり (60)</span>
              <span>普通 (120)</span>
              <span>超高速 (180)</span>
            </div>
          </div>
        )}

        {selectedTool === "timer" && (
          <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300">タイマー秒数:</span>
              <div className="flex items-center gap-1.5">
                {[5, 10, 15, 30, 60].map((sec) => (
                  <button
                    type="button"
                    key={sec}
                    onClick={() => setTimerDuration(sec)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      timerDuration === sec
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-gray-800 text-gray-300 hover:text-white"
                    }`}
                  >
                    {sec}秒
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer pt-1 border-t border-gray-800">
              <input
                type="checkbox"
                checked={isBlindTimer}
                onChange={(e) => setIsBlindTimer(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <span>ブラインドタイマー（カウント開始後に秒数を非表示にする）</span>
            </label>
          </div>
        )}

        {/* 詳しいルール */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300 block">
            詳しいルール・遊び方（任意）
          </label>
          <textarea
            rows={2}
            value={ruleText}
            onChange={(e) => setRuleText(e.target.value)}
            className="w-full bg-gray-950/80 border border-gray-800 focus:border-amber-400 p-2.5 rounded-xl text-xs text-white focus:outline-none"
            placeholder="例: 手拍子2回で答える。被り・詰まりは即アウト！"
          />
        </div>

        {/* 保存ボタン */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Save className="w-5 h-5" />
          <span>{gameToEdit ? "変更を保存する" : "オリジナルゲームを登録する！"}</span>
        </button>
      </div>
    </div>
  );
}
