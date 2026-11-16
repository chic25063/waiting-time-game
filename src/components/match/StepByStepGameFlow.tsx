"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Game, Player, PromptItem } from "@/types/game";
import { sound } from "@/lib/sound";
import {
  CARD_THEMES,
  resolveDoodleType,
  NotebookDoodle,
} from "@/components/home/GameCatalogModal";
import {
  ChevronLeft,
  Volume2,
  VolumeX,
  HelpCircle,
  Settings,
  LayoutGrid,
  Shuffle,
  Music,
  ArrowUp,
  ArrowDown,
  Play,
  Square,
  RotateCcw,
  Crown,
  CheckCircle2,
  Skull,
  LogOut,
  Dices,
} from "lucide-react";

export type FlowStep = "standby" | "settings" | "rules" | "playing";

interface StepByStepGameFlowProps {
  game: Game;
  players: Player[];
  onOpenPlayerModal: () => void;
  onRenamePlayer?: (playerId: string, newName: string) => void;
  onToggleEliminate: (playerId: string) => void;
  onResetElimination: () => void;
  onSelectWinner: (playerId: string, playerName: string) => void;
  onBackToHome: () => void;
  /** アリーナ連続対戦モード時の追加オプション */
  arenaContext?: {
    roundNumber: number;
    subtitle: string;
    isLoserKingOrSurvival?: boolean;
    judgeLabel?: string;
    onRerollGame?: () => void;
    onRecordEliminated?: (playerId: string) => void;
  };
}

const STAMP_COLORS = [
  "#FFADAD", // コーラルピンク
  "#CBC8FA", // ラベンダー
  "#7CE8DC", // ミントブルー
  "#FFE066", // 蛍光イエロー
  "#9AF0A8", // 蛍光グリーン
  "#F9B8E0", // 蛍光ピンク
  "#FFD194", // アプリコット
  "#E8F655", // ライム
];

/**
 * ノート風・ボールペン手書きのオリジナル顔スタンプアイコン
 * プレイヤー番号(0〜7)ごとに異なる手書き表情を描く完全オリジナルSVG
 */
export function PlayerStampAvatar({
  index,
  size = "md",
  isOut = false,
}: {
  index: number;
  size?: "sm" | "md" | "lg";
  isOut?: boolean;
}) {
  const bg = isOut ? "#E2E8F0" : STAMP_COLORS[index % STAMP_COLORS.length];
  const faceVariant = index % 6;

  const sizeClass =
    size === "lg"
      ? "w-15 h-15 sm:w-16 sm:h-16"
      : size === "md"
      ? "w-11 h-11"
      : "w-9 h-9";

  return (
    <div
      className={`${sizeClass} rounded-full border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] flex items-center justify-center relative shrink-0 select-none transition-transform`}
      style={{ backgroundColor: bg }}
    >
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full p-1"
        fill="none"
        stroke="#2B2D42"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isOut ? (
          <>
            {/* バツ目（脱落時） */}
            <path d="M13 17 L19 23 M19 17 L13 23" />
            <path d="M29 17 L35 23 M35 17 L29 23" />
            <path d="M18 33 Q24 29 30 33" />
          </>
        ) : faceVariant === 0 ? (
          <>
            {/* 1. 元気な丸目スマイル */}
            <ellipse cx="17" cy="19" rx="3.2" ry="4.2" fill="#FFFFFF" />
            <circle cx="18" cy="19" r="1.5" fill="#2B2D42" />
            <ellipse cx="31" cy="19" rx="3.2" ry="4.2" fill="#FFFFFF" />
            <circle cx="32" cy="19" r="1.5" fill="#2B2D42" />
            <path d="M19 29 Q24 35 29 29" />
          </>
        ) : faceVariant === 1 ? (
          <>
            {/* 2. ジト目・クールスマイル */}
            <ellipse cx="17" cy="20" rx="3.8" ry="3" fill="#FFFFFF" />
            <line x1="13" y1="18" x2="21" y2="18" strokeWidth="2.8" />
            <circle cx="17" cy="20.5" r="1.3" fill="#2B2D42" />
            <ellipse cx="31" cy="20" rx="3.8" ry="3" fill="#FFFFFF" />
            <line x1="27" y1="18" x2="35" y2="18" strokeWidth="2.8" />
            <circle cx="31" cy="20.5" r="1.3" fill="#2B2D42" />
            <path d="M21 29 Q25 32 28 28" />
          </>
        ) : faceVariant === 2 ? (
          <>
            {/* 3. にっこりウィンク (><) */}
            <ellipse cx="17" cy="20" rx="4" ry="3.8" fill="#FFFFFF" />
            <path d="M15 18.5 L19 20 L15 21.5" strokeWidth="2.2" />
            <ellipse cx="31" cy="20" rx="4" ry="3.8" fill="#FFFFFF" />
            <path d="M33 18.5 L29 20 L33 21.5" strokeWidth="2.2" />
            <path d="M21 29 Q24 34 27 29" />
          </>
        ) : faceVariant === 3 ? (
          <>
            {/* 4. メガネっ子スタンプ */}
            <circle cx="16.5" cy="20" r="4.8" fill="#FFFFFF" />
            <circle cx="31.5" cy="20" r="4.8" fill="#FFFFFF" />
            <line x1="21.3" y1="20" x2="26.7" y2="20" />
            <circle cx="16.5" cy="20" r="1.4" fill="#2B2D42" />
            <circle cx="31.5" cy="20" r="1.4" fill="#2B2D42" />
            <path d="M19 30 Q24 34 29 30" />
          </>
        ) : faceVariant === 4 ? (
          <>
            {/* 5. キラキラ目＆猫ヒゲ */}
            <circle cx="17" cy="19" r="3" fill="#FFFFFF" />
            <circle cx="17" cy="19" r="1.3" fill="#2B2D42" />
            <circle cx="31" cy="19" r="3" fill="#FFFFFF" />
            <circle cx="31" cy="19" r="1.3" fill="#2B2D42" />
            <path d="M19 28 Q21.5 32 24 28 Q26.5 32 29 28" />
            <line x1="8" y1="23" x2="12" y2="24" strokeWidth="2" />
            <line x1="40" y1="23" x2="36" y2="24" strokeWidth="2" />
          </>
        ) : (
          <>
            {/* 6. ニカッと笑顔 */}
            <path d="M14 20 Q17 16 20 20" strokeWidth="2.8" />
            <path d="M28 20 Q31 16 34 20" strokeWidth="2.8" />
            <path d="M16 27 H32 C32 33 28 36 24 36 C20 36 16 33 16 27 Z" fill="#FFFFFF" />
          </>
        )}
      </svg>
    </div>
  );
}

export default function StepByStepGameFlow({
  game,
  players,
  onOpenPlayerModal,
  onRenamePlayer,
  onToggleEliminate,
  onResetElimination,
  onSelectWinner,
  onBackToHome,
  arenaContext,
}: StepByStepGameFlowProps) {
  const isRhythmNameGame = game.id === "rhythm-shiritori";
  const [step, setStep] = useState<FlowStep>("standby");
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());
  const [compactPlayerView, setCompactPlayerView] = useState<boolean>(false);
  const [showRulePopup, setShowRulePopup] = useState<boolean>(false);

  // ゲームが変わったらStep 1(standby)へ戻す
  useEffect(() => {
    setStep("standby");
  }, [game.id, arenaContext?.roundNumber]);

  // Step 2: 設定ステート
  // お題モード: "app" (アプリのお題) | "free" (自由)
  const [promptMode, setPromptMode] = useState<"app" | "free">("app");
  // タイマー秒数
  const [timerSeconds, setTimerSeconds] = useState<number>(
    game.metadata?.timerDuration || 10
  );
  // BPMテンポ
  const [bpmValue, setBpmValue] = useState<number>(
    game.metadata?.defaultBpm || 110
  );

  // 順番管理（プレイヤーID配列）
  const [orderIds, setOrderIds] = useState<string[]>(() =>
    players.map((p) => p.id)
  );

  // プレイヤー配列が変更されたら順番リストを同期
  const orderedPlayers = useMemo(() => {
    const validIds = orderIds.filter((id) => players.some((p) => p.id === id));
    const missing = players
      .filter((p) => !validIds.includes(p.id))
      .map((p) => p.id);
    const mergedIds = [...validIds, ...missing];
    return mergedIds
      .map((id) => players.find((p) => p.id === id)!)
      .filter(Boolean);
  }, [orderIds, players]);

  // 順番をランダムシャッフル
  const handleShuffleOrder = () => {
    sound.playGacha();
    const ids = orderedPlayers.map((p) => p.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setOrderIds(ids);
  };

  // 順番を上下に入れ替え
  const handleMoveOrder = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= orderedPlayers.length) return;
    sound.playTick();
    const ids = orderedPlayers.map((p) => p.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    setOrderIds(ids);
  };

  // 効果音ON/OFF切替
  const handleToggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sound.playTick();
    }
  };

  // ゲームの特徴判定
  const hasPrompt = Boolean(
    game.metadata?.tools?.includes("prompt") ||
      (game.metadata?.promptList && game.metadata.promptList.length > 0)
  );
  const hasTimer = Boolean(
    game.metadata?.tools?.includes("timer") ||
      game.matchEngineType === "precision_time_attack" ||
      game.matchEngineType === "turn_relay_blitz"
  );
  const hasBpm = Boolean(game.metadata?.tools?.includes("bpm"));
  const isPrecisionTimer = game.matchEngineType === "precision_time_attack";

  // お題リスト
  const promptList: PromptItem[] = useMemo(() => {
    if (game.metadata?.promptList && game.metadata.promptList.length > 0) {
      return game.metadata.promptList;
    }
    return [
      "コンビニで買えるもの",
      "赤いもの",
      "夏といえば連想するもの",
      "学校にあるもの",
      "丸いもの",
      "冷蔵庫に入っているもの",
      "動物といえば",
      "おにぎりの具といえば",
    ];
  }, [game]);

  // Step 4: 本番プレイ用ステート
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [promptIndex, setPromptIndex] = useState<number>(0);

  // タイマー（カウントダウン or ブラインド計測）
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(timerSeconds);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [measuredRecords, setMeasuredRecords] = useState<
    Record<string, { actual: number; diff: number }>
  >({});
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // BPMメトロノーム
  const [isBpmPlaying, setIsBpmPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  // Step 4開始時にリセット
  const handleStartMatch = () => {
    sound.playWin();
    onResetElimination();
    setTurnIndex(0);
    setPromptIndex((prev) => prev + 1);
    setTimeLeft(timerSeconds);
    setIsTimerRunning(false);
    setElapsedMs(0);
    setMeasuredRecords({});
    setIsBpmPlaying(false);
    setStep("playing");
  };

  // カウントダウンタイマー処理（通常タイマー時）
  useEffect(() => {
    if (!isTimerRunning || isPrecisionTimer) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          sound.playTimeUp();
          return 0;
        }
        if (prev <= 4) sound.playTick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isPrecisionTimer]);

  // ブラインド精密計測タイマー処理
  useEffect(() => {
    if (!isTimerRunning || !isPrecisionTimer) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    startTimeRef.current = performance.now();
    const loop = () => {
      setElapsedMs(performance.now() - startTimeRef.current);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isTimerRunning, isPrecisionTimer]);

  // BPMメトロノーム処理
  useEffect(() => {
    if (!isBpmPlaying) {
      setCurrentBeat(0);
      return;
    }
    const intervalMs = (60 / bpmValue) * 1000;
    let beat = 0;
    sound.playClick(true);
    setCurrentBeat(1);

    const timer = setInterval(() => {
      beat = (beat + 1) % 4;
      sound.playClick(beat === 0);
      setCurrentBeat(beat + 1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isBpmPlaying, bpmValue]);

  // ゲームカードのテーマ算出
  const cardTheme = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < game.id.length; i++) {
      hash = (hash + game.id.charCodeAt(i)) % CARD_THEMES.length;
    }
    return CARD_THEMES[hash];
  }, [game.id]);

  const doodleType = useMemo(
    () => resolveDoodleType(game, cardTheme.defaultDoodle),
    [game, cardTheme]
  );

  // 生存中のプレイヤー（順番通り）
  const aliveOrderedPlayers = useMemo(
    () => orderedPlayers.filter((p) => !p.isOut),
    [orderedPlayers]
  );

  const currentTurnPlayer =
    aliveOrderedPlayers[turnIndex % (aliveOrderedPlayers.length || 1)] ||
    orderedPlayers[0];

  const currentPromptItem = promptList[promptIndex % promptList.length];
  const currentPromptText =
    typeof currentPromptItem === "string"
      ? currentPromptItem
      : currentPromptItem?.question;

  // 各プレイヤーの役割ラベル（Step 2 & Step 3用）
  const getRoleLabel = (idx: number, total: number): string => {
    if (idx === 0) {
      return hasPrompt && promptMode === "free"
        ? "最初の人（お題を出題）"
        : "最初の人（親・スタート）";
    }
    if (idx === total - 1 && total >= 3) {
      return "最後の人（アンカー）";
    }
    return `${idx + 1}番目`;
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col min-h-[calc(100dvh-2rem)] justify-between py-2 select-none">
      {/* =========================================================
          STEP 1: スタンバイ画面（1枚目の画像準拠）
         ========================================================= */}
      {step === "standby" && (
        <div className="flex flex-col flex-1 justify-between space-y-5 animate-in fade-in duration-200">
          {/* 上部バー：戻る ＜ | マチジカン！ロゴ | 音量ボタン */}
          <header className="flex items-center justify-between px-1 pt-1">
            <button
              type="button"
              onClick={onBackToHome}
              className="w-11 h-11 rounded-2xl bg-white hover:bg-[#FFF275] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] active:translate-y-0.5 transition-all cursor-pointer"
              aria-label="戻る"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.8]" />
            </button>

            <div className="text-center">
              {arenaContext && (
                <div className="text-[11px] font-black text-[#2B2D42] bg-[#FFE066] px-2.5 py-0.5 rounded-full border border-[#2B2D42] inline-block mb-0.5">
                  第{arenaContext.roundNumber}戦 ・ {arenaContext.subtitle}
                </div>
              )}
              <div className="relative inline-block">
                <span
                  className="absolute inset-x-0 bottom-0.5 h-3 bg-[#FFE066]/90 -rotate-1 rounded-xs pointer-events-none"
                  aria-hidden="true"
                />
                <h1 className="relative text-2xl sm:text-3xl font-black tracking-tight text-[#2B2D42] px-1">
                  マチジカン！
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              className="w-11 h-11 rounded-2xl bg-white hover:bg-[#FFF275] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] active:translate-y-0.5 transition-all cursor-pointer"
              aria-label="効果音切替"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 stroke-[2.5] text-rose-500" />
              ) : (
                <Volume2 className="w-5 h-5 stroke-[2.5]" />
              )}
            </button>
          </header>

          {/* 上段：選択されたゲームのノートカード ＋ 人数・時間・？ボタン */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative h-[96px] w-[240px] sm:w-[260px] rounded-2xl bg-white border-[2.5px] border-[#2B2D42] overflow-hidden text-left flex items-center pl-4 pr-14 shadow-[4px_5px_0_#2B2D42]">
              <div
                className="absolute inset-y-0 right-0 w-[52%] pointer-events-none"
                style={{
                  backgroundColor: game.isCustom
                    ? "#FFE066"
                    : cardTheme.markerColor,
                  clipPath: "polygon(40% 0, 100% 0, 100% 100%, 0% 100%)",
                }}
              />
              <span className="relative z-10 font-black text-[#2B2D42] text-base sm:text-lg leading-snug tracking-tight line-clamp-2">
                {game.title}
              </span>
              <div className="absolute bottom-1 right-1.5 z-10 pointer-events-none">
                <NotebookDoodle
                  type={doodleType}
                  inkColor={game.isCustom ? "#2B2D42" : cardTheme.inkAccent}
                />
              </div>
            </div>

            {/* ゲーム基本情報（人数・時間・？ルールボタン・アリーナ時引き直し） */}
            <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-black text-[#2B2D42]">
              <span>
                👥 {game.min_players}-{game.max_players}人
              </span>
              <span>⏱️ 約3分</span>
              <button
                type="button"
                onClick={() => setShowRulePopup(true)}
                className="w-7 h-7 rounded-full bg-white hover:bg-[#FFE066] border-2 border-[#2B2D42] shadow-[1px_2px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] font-black text-xs cursor-pointer"
                title="ルールを見る"
              >
                ?
              </button>
              {arenaContext?.onRerollGame && (
                <button
                  type="button"
                  onClick={arenaContext.onRerollGame}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-[#FFE066] border-2 border-[#2B2D42] shadow-[1px_2px_0_#2B2D42] flex items-center gap-1 text-[11px] font-black cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>別ゲーム抽選</span>
                </button>
              )}
            </div>
          </div>

          {/* 中段：「プレイヤーX人」カード（1枚目の画像準拠） */}
          <div className="bg-white border-[2.5px] border-[#2B2D42] rounded-3xl p-5 shadow-[4px_5px_0_#2B2D42] relative">
            {/* カード上部：中央に「プレイヤーX人」、右上に⚙️ボタン */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-9" />
              <h2 className="text-lg sm:text-xl font-black text-[#2B2D42]">
                プレイヤー{players.length}人
              </h2>
              <button
                type="button"
                onClick={onOpenPlayerModal}
                className="w-9 h-9 rounded-full bg-[#FAF6EB] hover:bg-[#FFE066] border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] active:translate-y-0.5 transition-all cursor-pointer"
                title="プレイヤー人数・名前を変更"
              >
                <Settings className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* 左側3連ボタン ＋ 中央プレイヤーアイコン並び */}
            <div className="flex items-center gap-3">
              {/* 左側の縦3連サブボタン */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setCompactPlayerView((v) => !v);
                  }}
                  className={`w-10 h-10 rounded-xl border-2 border-[#2B2D42] flex items-center justify-center transition-all cursor-pointer ${
                    !compactPlayerView
                      ? "bg-[#2B2D42] text-white"
                      : "bg-[#FAF6EB] text-[#2B2D42] hover:bg-[#FFE066]"
                  }`}
                  title="表示切替"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleShuffleOrder}
                  className="w-10 h-10 rounded-xl bg-[#FAF6EB] hover:bg-[#FFE066] border-2 border-[#2B2D42] flex items-center justify-center text-[#2B2D42] transition-all cursor-pointer"
                  title="順番をシャッフル"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`w-10 h-10 rounded-xl border-2 border-[#2B2D42] flex items-center justify-center transition-all cursor-pointer ${
                    !isMuted
                      ? "bg-[#FAF6EB] text-[#2B2D42] hover:bg-[#FFE066]"
                      : "bg-[#FFADAD] text-[#2B2D42]"
                  }`}
                  title="サウンド切替"
                >
                  <Music className="w-4 h-4" />
                </button>
              </div>

              {/* プレイヤー一覧（丸スタンプアイコン＋名前） */}
              <div className="flex-1 min-w-0">
                {!compactPlayerView ? (
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-2">
                    {orderedPlayers.map((player, idx) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={onOpenPlayerModal}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      >
                        <PlayerStampAvatar
                          index={idx}
                          size="lg"
                          isOut={player.isOut}
                        />
                        <span className="text-xs font-black text-[#2B2D42] max-w-[76px] truncate group-hover:underline">
                          {player.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 py-1">
                    {orderedPlayers.map((player, idx) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={onOpenPlayerModal}
                        className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF6EB] border-2 border-[#2B2D42] text-left cursor-pointer"
                      >
                        <PlayerStampAvatar
                          index={idx}
                          size="sm"
                          isOut={player.isOut}
                        />
                        <span className="text-xs font-black text-[#2B2D42] truncate">
                          {player.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 下段：特大「スタート」ボタン（1枚目の画像のグリーンのSTARTボタン準拠） */}
          <div className="pt-1 pb-2 flex justify-center">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setStep("settings");
              }}
              className="w-full max-w-[280px] py-4 px-8 rounded-3xl bg-[#9AF0A8] hover:bg-[#82e893] border-[3px] border-[#2B2D42] shadow-[4px_6px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_3px_0_#2B2D42] text-[#2B2D42] font-black text-2xl tracking-wider transition-all cursor-pointer"
            >
              スタート
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STEP 2: 「設定」＆「順番決め」画面（2枚目の画像準拠）
         ========================================================= */}
      {step === "settings" && (
        <div className="flex flex-col flex-1 justify-between space-y-4 animate-in fade-in duration-200">
          {/* 上部ヘッダー：退出ボタン | ゲームタイトル＋「設定」 | ？ボタン */}
          <header className="flex items-center justify-between px-1 pt-1">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setStep("standby");
              }}
              className="w-10 h-10 rounded-xl bg-white hover:bg-[#FAF6EB] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] cursor-pointer"
              aria-label="戻る"
            >
              <LogOut className="w-5 h-5 stroke-[2.5] rotate-180" />
            </button>

            <div className="text-center px-2">
              <h1 className="text-lg sm:text-xl font-black text-[#2B2D42] leading-tight">
                {game.title}
              </h1>
              <p className="text-xs font-black text-[#2B2D42]/70 mt-0.5">
                設定
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRulePopup(true)}
              className="w-10 h-10 rounded-full bg-white hover:bg-[#FFE066] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] cursor-pointer"
              aria-label="ルール"
            >
              <HelpCircle className="w-5 h-5 stroke-[2.5]" />
            </button>
          </header>

          {/* メイン白カード（お題設定 ＋ 順番リスト） */}
          <div className="bg-white border-[2.5px] border-[#2B2D42] rounded-3xl p-5 shadow-[4px_5px_0_#2B2D42] space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* お題モード切替（お題対応ゲームのみ表示） */}
              {hasPrompt && (
                <div>
                  <h2 className="text-sm font-black text-[#2B2D42] mb-2">お題</h2>
                  <div className="grid grid-cols-2 p-1 rounded-full bg-[#FAF6EB] border-2 border-[#2B2D42]">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTick();
                        setPromptMode("app");
                      }}
                      className={`py-2 rounded-full text-xs sm:text-sm font-black transition-all cursor-pointer ${
                        promptMode === "app"
                          ? "bg-[#2B2D42] text-white shadow-xs"
                          : "text-[#2B2D42] hover:bg-white/60"
                      }`}
                    >
                      アプリ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTick();
                        setPromptMode("free");
                      }}
                      className={`py-2 rounded-full text-xs sm:text-sm font-black transition-all cursor-pointer ${
                        promptMode === "free"
                          ? "bg-[#2B2D42] text-white shadow-xs"
                          : "text-[#2B2D42] hover:bg-white/60"
                      }`}
                    >
                      自由
                    </button>
                  </div>
                  <p className="text-[11px] font-bold text-[#2B2D42]/75 mt-2 leading-relaxed">
                    アプリが用意したお題にするか、最初の人が自由に決めるかを選びます
                  </p>
                </div>
              )}

              {/* タイマー秒数設定（タイマー対応ゲームのみ） */}
              {hasTimer && (
                <div className={hasPrompt ? "pt-2 border-t-2 border-dashed border-[#2B2D42]/15" : ""}>
                  <h2 className="text-sm font-black text-[#2B2D42] mb-2">
                    {isPrecisionTimer ? "目標秒数" : "制限時間"}
                  </h2>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 10, 15, 20].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          sound.playTick();
                          setTimerSeconds(sec);
                        }}
                        className={`py-1.5 rounded-full text-xs font-black border-2 border-[#2B2D42] transition-all cursor-pointer ${
                          timerSeconds === sec
                            ? "bg-[#7CE8DC] text-[#2B2D42] shadow-[1px_2px_0_#2B2D42]"
                            : "bg-[#FAF6EB] text-[#2B2D42]/75"
                        }`}
                      >
                        {sec}秒
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* BPM設定（リズム系ゲームのみ） */}
              {hasBpm && (
                <div className={hasPrompt || hasTimer ? "pt-2 border-t-2 border-dashed border-[#2B2D42]/15" : ""}>
                  <h2 className="text-sm font-black text-[#2B2D42] mb-2">
                    リズムの速さ (BPM)
                  </h2>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: "ゆっくり", val: 90 },
                      { label: "ふつう", val: 110 },
                      { label: "はやい", val: 135 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => {
                          sound.playTick();
                          setBpmValue(opt.val);
                        }}
                        className={`py-1.5 rounded-full text-xs font-black border-2 border-[#2B2D42] transition-all cursor-pointer ${
                          bpmValue === opt.val
                            ? "bg-[#CBC8FA] text-[#2B2D42] shadow-[1px_2px_0_#2B2D42]"
                            : "bg-[#FAF6EB] text-[#2B2D42]/75"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(hasPrompt || hasTimer || hasBpm) && (
                <hr className="border-t-2 border-[#2B2D42]/15" />
              )}

              {/* プレイの順番セクション */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h2 className="text-sm font-black text-[#2B2D42]">
                    {isRhythmNameGame ? "プレイの順番・2文字ネーム" : "プレイの順番"}
                  </h2>
                  <button
                    type="button"
                    onClick={handleShuffleOrder}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#FFE066] border-2 border-[#2B2D42] shadow-[1px_2px_0_#2B2D42] text-xs font-black text-[#2B2D42] active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>ランダム</span>
                  </button>
                </div>
                <p className="text-[11px] font-bold text-[#2B2D42]/70 mb-2.5">
                  {isRhythmNameGame
                    ? "通常の名前から2文字取った呼び名（例：えび・まる・ガリ）を入力・並べ替えできます"
                    : "名前をタップして編集、矢印ボタンで順番を並べ替えられます"}
                </p>

                {/* 番号付きプレイヤーリスト */}
                <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
                  {orderedPlayers.map((player, idx) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                        <span className="w-4 text-center font-black text-sm text-[#2B2D42] shrink-0">
                          {idx + 1}
                        </span>
                        <PlayerStampAvatar
                          index={idx}
                          size="sm"
                          isOut={player.isOut}
                        />
                        <div className="min-w-0 flex-1">
                          {onRenamePlayer ? (
                            <input
                              type="text"
                              value={player.name}
                              onChange={(e) =>
                                onRenamePlayer(player.id, e.target.value)
                              }
                              placeholder={
                                isRhythmNameGame
                                  ? ["えび", "まる", "ガリ", "たろ"][idx % 4]
                                  : `プレイヤー${idx + 1}`
                              }
                              className="w-full px-2 py-0.5 rounded-lg bg-white border border-[#2B2D42]/40 focus:border-[#2B2D42] focus:outline-none text-sm font-black text-[#2B2D42]"
                            />
                          ) : (
                            <div className="text-sm font-black text-[#2B2D42] truncate">
                              {player.name}
                            </div>
                          )}
                          <div className="text-[11px] font-bold text-[#2B2D42]/65 mt-0.5">
                            {getRoleLabel(idx, orderedPlayers.length)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveOrder(idx, -1)}
                          className="p-1.5 rounded-lg bg-white hover:bg-[#FFE066] disabled:opacity-30 border border-[#2B2D42] text-[#2B2D42] cursor-pointer"
                          aria-label="上へ"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === orderedPlayers.length - 1}
                          onClick={() => handleMoveOrder(idx, 1)}
                          className="p-1.5 rounded-lg bg-white hover:bg-[#FFE066] disabled:opacity-30 border border-[#2B2D42] text-[#2B2D42] cursor-pointer"
                          aria-label="下へ"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 下部：最初の人（親）または開始掛け声表示 */}
            <div className="pt-3 border-t-2 border-dashed border-[#2B2D42]/20 text-center text-xs sm:text-sm font-black text-[#2B2D42]">
              {isRhythmNameGame ? (
                <div>
                  開始掛け声：{" "}
                  <span className="px-2 py-0.5 rounded bg-[#FFE066] border border-[#2B2D42]">
                    「{orderedPlayers[0]?.name}」から始まるリズムに合わせて！
                  </span>
                </div>
              ) : (
                <div>
                  最初の人（スタート）：{" "}
                  <span className="px-2 py-0.5 rounded bg-[#FFE066] border border-[#2B2D42]">
                    {orderedPlayers[0]?.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 下部ボタン：「次へ」 */}
          <div className="pt-1 pb-2">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setStep("rules");
              }}
              className="w-full py-4 px-6 rounded-2xl bg-[#CBC8FA] hover:bg-[#b8b4f7] border-[2.5px] border-[#2B2D42] shadow-[4px_5px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_3px_0_#2B2D42] text-[#2B2D42] font-black text-base sm:text-lg transition-all cursor-pointer"
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STEP 3: 「順番」＆「ルール」確認画面（3枚目の画像準拠）
         ========================================================= */}
      {step === "rules" && (
        <div className="flex flex-col flex-1 justify-between space-y-4 animate-in fade-in duration-200">
          {/* 上部ヘッダー：退出ボタン | ゲームタイトル＋「ルール」 | ？ボタン */}
          <header className="flex items-center justify-between px-1 pt-1">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setStep("standby");
              }}
              className="w-10 h-10 rounded-xl bg-white hover:bg-[#FAF6EB] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] cursor-pointer"
              aria-label="スタンバイへ戻る"
            >
              <LogOut className="w-5 h-5 stroke-[2.5] rotate-180" />
            </button>

            <div className="text-center px-2">
              <h1 className="text-lg sm:text-xl font-black text-[#2B2D42] leading-tight">
                {game.title}
              </h1>
              <p className="text-xs font-black text-[#2B2D42]/70 mt-0.5">
                ルール
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRulePopup(true)}
              className="w-10 h-10 rounded-full bg-white hover:bg-[#FFE066] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] cursor-pointer"
              aria-label="詳細ルール"
            >
              <HelpCircle className="w-5 h-5 stroke-[2.5]" />
            </button>
          </header>

          {/* メイン白カード（順番確認 ＋ ルール説明） */}
          <div className="bg-white border-[2.5px] border-[#2B2D42] rounded-3xl p-5 shadow-[4px_5px_0_#2B2D42] space-y-5 flex-1 flex flex-col justify-between">
            {/* 上段：順番セクション */}
            <div>
              <div className="text-center pb-2 border-b-2 border-[#2B2D42]">
                <h2 className="text-sm font-black text-[#2B2D42]">順番</h2>
              </div>

              <div className="space-y-2 mt-3 max-h-[175px] overflow-y-auto pr-1">
                {orderedPlayers.map((player, idx) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42]"
                  >
                    <span className="w-4 text-center font-black text-sm text-[#2B2D42] shrink-0">
                      {idx + 1}
                    </span>
                    <PlayerStampAvatar
                      index={idx}
                      size="sm"
                      isOut={player.isOut}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-black text-[#2B2D42] truncate">
                        {player.name}
                      </div>
                      <div className="text-[11px] font-bold text-[#2B2D42]/65">
                        {getRoleLabel(idx, orderedPlayers.length)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-center text-xs sm:text-sm font-black text-[#2B2D42]">
                最初の人：{" "}
                <span className="text-rose-600 underline decoration-2 underline-offset-4">
                  {orderedPlayers[0]?.name}
                </span>
              </div>
            </div>

            {/* 下段：ルール説明セクション */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center pb-2 border-b-2 border-[#2B2D42]">
                <h2 className="text-sm font-black text-[#2B2D42]">ルール</h2>
              </div>

              <div className="py-4 px-2 text-center space-y-3">
                <p className="text-xs sm:text-sm font-bold text-[#2B2D42] leading-relaxed whitespace-pre-wrap">
                  {game.description}
                </p>

                {(game.call_examples?.[0] || game.metadata?.callExample) && (
                  <div className="p-3 rounded-2xl bg-[#FFF275]/50 border-2 border-[#2B2D42] text-xs font-black text-[#2B2D42] text-left whitespace-pre-wrap">
                    {game.call_examples
                      ? game.call_examples.join("\n")
                      : game.metadata?.callExample}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 下部2列ボタン：左「戻る」 | 右「スタート」 */}
          <div className="grid grid-cols-2 gap-3 pt-1 pb-2">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setStep("settings");
              }}
              className="py-4 px-4 rounded-2xl bg-white hover:bg-[#FAF6EB] border-[2.5px] border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] text-[#2B2D42] font-black text-base transition-all cursor-pointer"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={handleStartMatch}
              className="py-4 px-4 rounded-2xl bg-[#9AF0A8] hover:bg-[#82e893] border-[2.5px] border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] text-[#2B2D42] font-black text-base transition-all cursor-pointer"
            >
              スタート
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STEP 4: 本番プレイ画面（1枚の大きな白カード＋下部ボタン）
         ========================================================= */}
      {step === "playing" && (
        <div className="flex flex-col flex-1 justify-between space-y-4 animate-in fade-in duration-200">
          {/* 上部ヘッダー */}
          <header className="flex items-center justify-between px-1 pt-1">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setIsTimerRunning(false);
                setIsBpmPlaying(false);
                setStep("rules");
              }}
              className="w-10 h-10 rounded-xl bg-white hover:bg-[#FAF6EB] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] cursor-pointer"
              aria-label="ルール確認へ戻る"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="text-center px-2">
              <h1 className="text-lg sm:text-xl font-black text-[#2B2D42] leading-tight">
                {game.title}
              </h1>
              <p className="text-xs font-black text-[#2B2D42]/70 mt-0.5">
                プレイ中
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRulePopup(true)}
              className="w-10 h-10 rounded-full bg-white hover:bg-[#FFE066] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] cursor-pointer"
              aria-label="ルール"
            >
              <HelpCircle className="w-5 h-5 stroke-[2.5]" />
            </button>
          </header>

          {/* メイン1枚白カード（プレイヤー勝敗・ミス判定をメインに大きく配置） */}
          <div className="bg-white border-[2.5px] border-[#2B2D42] rounded-3xl p-4 sm:p-5 shadow-[4px_5px_0_#2B2D42] space-y-3.5 flex-1 flex flex-col">
            {/* 上部：コンパクトな補助情報（お題 / かけ声早見 / タイマー / BPM） */}
            <div className="space-y-2 shrink-0">
              {hasPrompt ? (
                <div className="px-3.5 py-2.5 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42] flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-[10px] font-black px-1.5 py-0.2 rounded bg-[#F9B8E0] border border-[#2B2D42] mr-1.5">
                      {promptMode === "app" ? "お題" : "自由お題"}
                    </span>
                    <span className="text-sm sm:text-base font-black text-[#2B2D42]">
                      {promptMode === "app"
                        ? `「${currentPromptText}」`
                        : "最初の人が自由にお題を決めてスタート！"}
                    </span>
                  </div>
                  {promptMode === "app" && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playGacha();
                        setPromptIndex((prev) => prev + 1);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FFE066] border-2 border-[#2B2D42] text-[11px] font-black shrink-0 cursor-pointer"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>変更</span>
                    </button>
                  )}
                </div>
              ) : isRhythmNameGame ? (
                <div className="px-3 py-2 rounded-2xl bg-[#FFF275]/55 border-2 border-[#2B2D42] text-xs text-[#2B2D42] space-y-1">
                  <div className="font-black text-center">
                    📢「{orderedPlayers[0]?.name}」から始まるリズムに合わせて！
                  </div>
                  <div className="text-[11px] font-bold text-[#2B2D42]/85 text-center">
                    名前＋1〜4でパス ／「ちぇけ」➔「よう・チェケ・ラッ・チョ！」
                  </div>
                </div>
              ) : (
                (game.call_examples?.length || game.metadata?.callExample) && (
                  <div className="px-3 py-2 rounded-2xl bg-[#FFF275]/45 border-2 border-[#2B2D42] text-[11px] font-bold text-[#2B2D42] whitespace-pre-wrap leading-snug">
                    {game.call_examples
                      ? game.call_examples.join("\n")
                      : game.metadata?.callExample}
                  </div>
                )
              )}

              {/* コンパクトなタイマー・BPM行 */}
              {(hasTimer || hasBpm) && (
                <div className="flex flex-wrap items-center gap-2">
                  {hasTimer && (
                    <div className="flex-1 min-w-[180px] px-3 py-2 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42] flex items-center justify-between">
                      <span className="font-mono text-lg font-black text-[#2B2D42]">
                        ⏱️ {timeLeft}秒
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            sound.playTick();
                            if (!isTimerRunning) {
                              if (timeLeft === 0) setTimeLeft(timerSeconds);
                              setIsTimerRunning(true);
                            } else {
                              setIsTimerRunning(false);
                            }
                          }}
                          className={`px-3 py-1 rounded-xl border-2 border-[#2B2D42] font-black text-xs cursor-pointer ${
                            isTimerRunning ? "bg-[#FFADAD]" : "bg-[#7CE8DC]"
                          }`}
                        >
                          {isTimerRunning ? "停止" : "開始"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playTick();
                            setIsTimerRunning(false);
                            setTimeLeft(timerSeconds);
                          }}
                          className="p-1 rounded-lg bg-white border border-[#2B2D42] text-[#2B2D42] cursor-pointer"
                          title="リセット"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {hasBpm && (
                    <div className="flex-1 min-w-[180px] px-3 py-2 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4].map((b) => (
                          <span
                            key={b}
                            className={`w-5 h-5 rounded-full border border-[#2B2D42] flex items-center justify-center text-[10px] font-black ${
                              currentBeat === b
                                ? "bg-[#FFE066] scale-110"
                                : "bg-white text-[#2B2D42]/45"
                            }`}
                          >
                            {b}
                          </span>
                        ))}
                        <span className="text-[11px] font-black text-[#2B2D42] ml-1">
                          {bpmValue}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsBpmPlaying((v) => !v)}
                        className={`px-3 py-1 rounded-xl border-2 border-[#2B2D42] font-black text-xs cursor-pointer ${
                          isBpmPlaying ? "bg-[#FFADAD]" : "bg-[#CBC8FA]"
                        }`}
                      >
                        {isBpmPlaying ? "停止" : "リズム"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* メイン領域：プレイヤー勝敗・脱落ワンタップ塊（大きく表示） */}
            <div className="flex-1 flex flex-col pt-1">
              <div className="flex items-center justify-between mb-3 px-0.5">
                <h2 className="text-sm sm:text-base font-black text-[#2B2D42] flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#FFE066] border-2 border-[#2B2D42]">
                    {arenaContext?.judgeLabel ||
                      "勝った人・ミスした人をタップ"}
                  </span>
                  <span className="text-xs font-bold text-[#2B2D42]/70">
                    （残り {aliveOrderedPlayers.length}/{orderedPlayers.length}人）
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={onResetElimination}
                  className="px-2.5 py-1 rounded-xl bg-[#FAF6EB] hover:bg-[#FFE066] border-2 border-[#2B2D42] text-xs font-black text-[#2B2D42] cursor-pointer"
                >
                  全員復活
                </button>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {orderedPlayers.map((player, idx) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border-[2.5px] border-[#2B2D42] transition-all ${
                      player.isOut
                        ? "bg-[#2B2D42]/10 opacity-55"
                        : "bg-[#FAF6EB] shadow-[3px_4px_0_#2B2D42]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 text-center font-black text-sm sm:text-base text-[#2B2D42] shrink-0">
                        {idx + 1}
                      </span>
                      <PlayerStampAvatar
                        index={idx}
                        size="md"
                        isOut={player.isOut}
                      />
                      <span
                        className={`text-base sm:text-lg font-black text-[#2B2D42] truncate ${
                          player.isOut ? "line-through" : ""
                        }`}
                      >
                        {player.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* ミス・脱落ボタン */}
                      <button
                        type="button"
                        onClick={() => {
                          if (arenaContext?.onRecordEliminated) {
                            arenaContext.onRecordEliminated(player.id);
                          } else {
                            onToggleEliminate(player.id);
                          }
                        }}
                        className={`px-4 py-2.5 rounded-xl border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] active:translate-y-0.5 text-xs sm:text-sm font-black transition-all cursor-pointer ${
                          player.isOut
                            ? "bg-white text-[#2B2D42]"
                            : "bg-[#FFADAD] hover:bg-[#ff9494] text-[#2B2D42]"
                        }`}
                      >
                        {player.isOut ? "復活" : "ミス"}
                      </button>

                      {/* 勝利決定ボタン */}
                      <button
                        type="button"
                        onClick={() => onSelectWinner(player.id, player.name)}
                        className="px-4 py-2.5 rounded-xl bg-[#FFE066] hover:bg-[#ffd633] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] active:translate-y-0.5 text-xs sm:text-sm font-black text-[#2B2D42] flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Crown className="w-4 h-4" />
                        <span>勝ち</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ルール確認ポップアップモーダル（？ボタンを押した時） */}
      {showRulePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2D42]/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowRulePopup(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#FAF6EB] border-[3px] border-[#2B2D42] rounded-3xl p-6 text-[#2B2D42] shadow-[6px_8px_0_#2B2D42] space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#2B2D42]">
              <h3 className="text-lg font-black">{game.title} のルール</h3>
              <button
                type="button"
                onClick={() => setShowRulePopup(false)}
                className="px-3 py-1 rounded-xl bg-white border-2 border-[#2B2D42] text-xs font-black cursor-pointer"
              >
                閉じる
              </button>
            </div>

            <p className="text-xs sm:text-sm font-bold leading-relaxed whitespace-pre-wrap">
              {game.description}
            </p>

            {(game.rules || game.metadata?.ruleSummary) && (
              <div className="space-y-1.5">
                <div className="text-xs font-black">手順:</div>
                {(game.rules || game.metadata?.ruleSummary || []).map(
                  (r, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border-2 border-[#2B2D42] text-xs font-bold"
                    >
                      {idx + 1}. {r}
                    </div>
                  )
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowRulePopup(false)}
              className="w-full py-3 rounded-2xl bg-[#9AF0A8] border-2 border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] font-black text-sm cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

