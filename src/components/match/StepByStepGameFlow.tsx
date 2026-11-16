"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Game, Player, PromptItem } from "@/types/game";
import { sound } from "@/lib/sound";
import { useGameSession } from "@/hooks/useGameSession";
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
 * ユーザー手書きイラスト準拠の8種オリジナルマスコットアイコン
 * （丸枠に入れず、キャラクター自身の輪郭＋パステルマーカーのワンポイントで表現）
 * 0: クマ / 1: ネコ / 2: ウサギ(ブチ) / 3: トリ / 4: ライオン / 5: コウモリ / 6: 長鼻 / 7: ニコニコもち
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
  const accent = isOut ? "#CBD5E1" : STAMP_COLORS[index % STAMP_COLORS.length];
  const charType = index % 8;

  const sizeClass =
    size === "lg"
      ? "w-14 h-14 sm:w-16 sm:h-16"
      : size === "md"
      ? "w-11 h-11"
      : "w-9 h-9";

  return (
    <div
      className={`${sizeClass} relative flex items-center justify-center shrink-0 select-none transition-transform ${
        isOut ? "opacity-50 grayscale" : ""
      }`}
    >
      {/* 背面の蛍光マーカー風パステル座布団（丸枠ではなく斜めハイライト） */}
      <span
        className="absolute inset-1.5 rounded-2xl -rotate-3 pointer-events-none"
        style={{ backgroundColor: accent, opacity: 0.55 }}
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 56 52"
        className="relative z-10 w-full h-full overflow-visible"
        fill="none"
        stroke="#2B2D42"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 0: クマ（丸耳＋ちょこん足＋楕円マズル） */}
        {charType === 0 && (
          <g>
            {/* 耳 */}
            <path d="M16 16 C15 10, 22 10, 22 15" fill="#FFFFFF" />
            <path d="M34 15 C34 10, 41 10, 40 16" fill="#FFFFFF" />
            {/* 足 */}
            <path d="M13 38 C8 38, 8 44, 15 43" fill="#FFFFFF" />
            <path d="M42 39 C47 40, 46 46, 40 43" fill="#FFFFFF" />
            {/* もちっとした胴体 */}
            <path
              d="M11 35 C9 20, 17 13, 28 13 C39 13, 47 20, 45 35 C44 43, 12 43, 11 35 Z"
              fill="#FFFFFF"
            />
            {/* 目 */}
            <circle cx="21" cy="24" r="1.8" fill="#2B2D42" />
            <circle cx="35" cy="25" r="1.8" fill="#2B2D42" />
            {/* 鼻周りの楕円 */}
            <ellipse cx="27.5" cy="31.5" rx="6.8" ry="4.4" fill="#FFFFFF" />
            <ellipse cx="27.5" cy="31.5" rx="2.1" ry="1.4" fill="#2B2D42" />
          </g>
        )}

        {/* 1: ネコ（三角耳＋ヒゲ＋逆三角鼻＋ω口） */}
        {charType === 1 && (
          <g>
            {/* 足 */}
            <path d="M14 40 C10 41, 10 46, 16 44" fill="#FFFFFF" />
            <path d="M41 40 C46 40, 46 45, 40 43" fill="#FFFFFF" />
            {/* 胴体 */}
            <path
              d="M11 35 C9 21, 17 14, 28 14 C39 14, 47 21, 45 35 C44 43, 12 43, 11 35 Z"
              fill="#FFFFFF"
            />
            {/* 三角耳 */}
            <path d="M17 17 L21 9 L25 15" fill="#FFFFFF" />
            <path d="M31 15 L35 9 L39 17" fill="#FFFFFF" />
            {/* 目 */}
            <circle cx="23" cy="22.5" r="1.7" fill="#2B2D42" />
            <circle cx="33" cy="22.5" r="1.7" fill="#2B2D42" />
            {/* 逆三角の鼻 */}
            <polygon points="25,26.5 31,26.5 28,31" fill="#FFFFFF" />
            {/* ωの口 */}
            <path d="M25.5 33.5 C25.5 36.5, 28 36.5, 28 34 C28 36.5, 30.5 36.5, 30.5 33.5" />
            {/* 左右のヒゲ */}
            <line x1="14" y1="27" x2="21" y2="26.5" />
            <line x1="13.5" y1="30.5" x2="20.5" y2="30.5" />
            <line x1="14" y1="34" x2="21" y2="34" />
            <line x1="35" y1="26.5" x2="42" y2="27" />
            <line x1="35.5" y1="30.5" x2="42.5" y2="30.5" />
            <line x1="36" y1="33.5" x2="41.5" y2="36" />
          </g>
        )}

        {/* 2: ウサギ・ブチ犬（長い耳＋ブチ模様＋への字口） */}
        {charType === 2 && (
          <g>
            {/* 長い耳 */}
            <path d="M18 16 C17 3, 24 2, 25 14" fill="#FFFFFF" />
            <path d="M32 14 C34 2, 42 3, 38 16" fill="#FFFFFF" />
            {/* 足 */}
            <path d="M13 38 C8 38, 8 43, 14 42" fill="#FFFFFF" />
            <path d="M41 39 C46 39, 46 44, 40 42" fill="#FFFFFF" />
            {/* 胴体 */}
            <path
              d="M12 34 C11 20, 18 13, 28 13 C38 13, 45 20, 44 34 C43 43, 13 43, 12 34 Z"
              fill="#FFFFFF"
            />
            {/* ブチ模様の線 */}
            <path d="M31 13.5 C27 24, 21 30, 12.5 32" />
            <path d="M43 21 C38 22, 38 28, 44 29" />
            {/* 目・鼻・口 */}
            <circle cx="22.5" cy="22.5" r="1.6" fill="#2B2D42" />
            <circle cx="33" cy="22.5" r="1.4" fill="#2B2D42" />
            <circle cx="28" cy="29.5" r="1.2" />
            <path d="M20 40 C23 33.5, 33 33.5, 36 40" />
          </g>
        )}

        {/* 3: トリ（トサカ＋左右の羽＋笑顔） */}
        {charType === 3 && (
          <g>
            {/* トサカ */}
            <path
              d="M20 19 C17 11, 24 8, 26 14 C28 5, 36 5, 35 14 C40 9, 44 15, 38 20"
              fill="#FFFFFF"
            />
            {/* 足 */}
            <path d="M18 42 C16 46, 21 47, 21 43" fill="#FFFFFF" />
            <path d="M35 43 C35 47, 40 46, 38 42" fill="#FFFFFF" />
            {/* 胴体 */}
            <path
              d="M13 33 C13 21, 20 17, 28 17 C36 17, 43 21, 43 33 C43 43, 13 43, 13 33 Z"
              fill="#FFFFFF"
            />
            {/* 左右の丸い羽 */}
            <path d="M16 28 C8 27, 8 39, 17 37" fill="#FFFFFF" />
            <path d="M40 28 C47 27, 47 39, 39 37" fill="#FFFFFF" />
            {/* 目・笑顔の口 */}
            <circle cx="23" cy="26" r="1.8" fill="#2B2D42" />
            <circle cx="33" cy="26" r="1.8" fill="#2B2D42" />
            <path d="M23 32 Q28 33.5 33 32 Q28 38.5 23 32 Z" fill="#FFFFFF" />
          </g>
        )}

        {/* 4: ライオン（もこもこタテガミ＋三角鼻ヒゲ） */}
        {charType === 4 && (
          <g>
            {/* もこもこタテガミ */}
            <path
              d="M11 36 C6 33, 6 26, 10 23 C8 17, 13 13, 18 14 C21 9, 28 9, 31 12 C36 9, 42 12, 43 17 C48 19, 49 25, 45 29 C48 33, 46 38, 41 38"
              fill="#FFFFFF"
            />
            {/* 足 */}
            <path d="M16 40 C13 43, 16 46, 19 42" fill="#FFFFFF" />
            <path d="M36 42 C38 46, 42 43, 39 39" fill="#FFFFFF" />
            {/* 丸い顔 */}
            <path
              d="M14 33 C14 21, 20 17, 28 17 C36 17, 41 22, 41 33 C41 42, 14 42, 14 33 Z"
              fill="#FFFFFF"
            />
            {/* 目 */}
            <circle cx="24" cy="26.5" r="1.6" fill="#2B2D42" />
            <circle cx="31.5" cy="26.5" r="1.6" fill="#2B2D42" />
            {/* 三角鼻＋ヒゲ＋口 */}
            <polygon points="28,30 24.5,34.5 31.5,34.5" fill="#FFFFFF" />
            <line x1="21" y1="31.5" x2="25" y2="32" />
            <line x1="20.5" y1="34" x2="24.5" y2="34" />
            <line x1="31" y1="32" x2="35" y2="31.5" />
            <line x1="31.5" y1="34" x2="35.5" y2="34" />
            <path d="M26 39 L28 36 L30 39" />
          </g>
        )}

        {/* 5: コウモリ（小さなツノ＋左右のコウモリ羽＋w口） */}
        {charType === 5 && (
          <g>
            {/* 左右のコウモリ羽 */}
            <path
              d="M15 26 C10 19, 6 24, 8 36 L12 31 L15 33"
              fill="#FFFFFF"
            />
            <path
              d="M41 26 C46 19, 50 24, 48 36 L44 31 L41 33"
              fill="#FFFFFF"
            />
            {/* 足 */}
            <path d="M18 41 C15 45, 19 47, 21 42" fill="#FFFFFF" />
            <path d="M37 40 C41 42, 43 45, 38 43" fill="#FFFFFF" />
            {/* 胴体 */}
            <path
              d="M14 33 C14 21, 20 17, 28 17 C36 17, 42 21, 42 33 C42 42, 14 42, 14 33 Z"
              fill="#FFFFFF"
            />
            {/* 小さな三角ツノ */}
            <path d="M21.5 18 L23 13.5 L24.8 17.5" fill="#FFFFFF" />
            <path d="M31.2 17.5 L33 13.5 L34.5 18" fill="#FFFFFF" />
            {/* 目＋w口 */}
            <circle cx="24" cy="25" r="1.7" fill="#2B2D42" />
            <circle cx="32" cy="25" r="1.7" fill="#2B2D42" />
            <path d="M24.5 31.5 L26.3 35.5 L28 32.5 L29.7 35.5 L31.5 31.5" />
          </g>
        )}

        {/* 6: 長鼻キャラ（とんがり鼻＋にっこり口） */}
        {charType === 6 && (
          <g>
            {/* 足 */}
            <path d="M13 39 C9 41, 10 46, 15 42" fill="#FFFFFF" />
            <path d="M42 39 C45 41, 45 45, 41 42" fill="#FFFFFF" />
            {/* 胴体 */}
            <path
              d="M12 35 C10 19, 18 12, 28 12 C39 12, 46 20, 44 35 C43 43, 13 43, 12 35 Z"
              fill="#FFFFFF"
            />
            {/* 目 */}
            <circle cx="22.5" cy="21" r="1.8" fill="#2B2D42" />
            <circle cx="33.5" cy="21" r="1.8" fill="#2B2D42" />
            {/* 左下へ伸びるとんがり鼻 */}
            <path d="M27.5 24.5 L18.5 34.5 L28.5 31.5" fill="#FFFFFF" />
            {/* にっこり口 */}
            <path d="M23 36 Q31 38 36 31.5" />
            <path d="M34.5 29.5 L37.5 33" />
          </g>
        )}

        {/* 7: ニコニコもち（アーチ目＋にっこり笑顔） */}
        {charType === 7 && (
          <g>
            {/* 足 */}
            <path d="M13 38 C8 39, 9 44, 15 42" fill="#FFFFFF" />
            <path d="M42 39 C47 39, 47 44, 41 42" fill="#FFFFFF" />
            {/* 胴体 */}
            <path
              d="M12 35 C11 21, 18 14, 28 14 C38 14, 45 21, 44 35 C43 43, 13 43, 12 35 Z"
              fill="#FFFFFF"
            />
            {/* アーチ目 (^ ^) */}
            <path d="M20 25 Q22 19.5 24 25" />
            <path d="M32 25 Q34 19.5 36 25" />
            {/* 口 */}
            <path d="M22.5 32.5 Q28 37.5 33.5 32.5" />
          </g>
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
  const isStarterOnlyGame =
    game.id === "chin-chin-samurai" || game.id === "rhythm-shiritori";
  const { players: sessionPlayers, resetSessionWins } = useGameSession();
  const [step, setStep] = useState<FlowStep>("standby");
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());
  const [showRulePopup, setShowRulePopup] = useState<boolean>(false);

  // 「誰から始めるか」専用ステート（ちんちん侍・○○から始まるリズムに合わせて用）
  const [starterId, setStarterId] = useState<string>(
    () => players[0]?.id || "p-1"
  );

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

  // 「誰から始めるか」をランダム抽選
  const handlePickRandomStarter = () => {
    sound.playGacha();
    if (players.length === 0) return;
    if (players.length === 1) {
      setStarterId(players[0].id);
      return;
    }
    const candidates = players.filter((p) => p.id !== starterId);
    const pool = candidates.length > 0 ? candidates : players;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setStarterId(picked.id);
  };

  const starterPlayer = useMemo(() => {
    return (
      players.find((p) => p.id === starterId) ||
      orderedPlayers[0] ||
      players[0]
    );
  }, [players, starterId, orderedPlayers]);

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

          {/* 上段：横幅いっぱいの「ノート見出しゲームカード」（オリジナリティのある見出し構成） */}
          <div className="relative w-full rounded-3xl bg-white border-[2.5px] border-[#2B2D42] p-4 sm:p-5 shadow-[4px_5px_0_#2B2D42] overflow-hidden">
            {/* 右側の斜め蛍光マーカー帯 */}
            <div
              className="absolute inset-y-0 right-0 w-[38%] pointer-events-none"
              style={{
                backgroundColor: game.isCustom
                  ? "#FFE066"
                  : cardTheme.markerColor,
                clipPath: "polygon(34% 0, 100% 0, 100% 100%, 0% 100%)",
              }}
            />

            <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-[#2B2D42] text-white text-[11px] font-black">
                  👥{" "}
                  {game.min_players === game.max_players
                    ? `${game.min_players}人専用`
                    : `${game.min_players}〜${game.max_players}人`}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FAF6EB] border border-[#2B2D42] text-[#2B2D42] text-[11px] font-black">
                  ⏱️ 約3分
                </span>
                {arenaContext?.onRerollGame && (
                  <button
                    type="button"
                    onClick={arenaContext.onRerollGame}
                    className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#FFE066] border border-[#2B2D42] flex items-center gap-1 text-[11px] font-black cursor-pointer"
                  >
                    <Dices className="w-3 h-3" />
                    <span>別ゲーム抽選</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowRulePopup(true)}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#FFE066] border-2 border-[#2B2D42] shadow-[1px_2px_0_#2B2D42] flex items-center gap-1 text-[#2B2D42] font-black text-xs cursor-pointer shrink-0"
                title="ルールを見る"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>ルール</span>
              </button>
            </div>

            <div className="relative z-10 pr-14">
              <h2 className="font-black text-[#2B2D42] text-xl sm:text-2xl leading-tight tracking-tight">
                {game.title}
              </h2>
              <p className="text-xs font-bold text-[#2B2D42]/75 mt-1 line-clamp-2">
                {game.short_description || game.description}
              </p>
            </div>

            {/* 右下：ノートの落書きスタンプ */}
            <div className="absolute bottom-1.5 right-2 z-10 pointer-events-none">
              <NotebookDoodle
                type={doodleType}
                inkColor={game.isCustom ? "#2B2D42" : cardTheme.inkAccent}
              />
            </div>
          </div>

          {/* 中段：「参加メンバー」ノート付箋グリッド（左の3ボタンを廃止し、2列の名札タグ構成に） */}
          <div className="bg-white border-[2.5px] border-[#2B2D42] rounded-3xl p-4 sm:p-5 shadow-[4px_5px_0_#2B2D42] relative flex-1 flex flex-col justify-between">
            {/* カード上部：左に「参加メンバー X人」、右に「★リセット」「人数・名前変更 ⚙️」ボタン */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-dashed border-[#2B2D42]/20 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-5 rounded-xs bg-[#FFE066] border border-[#2B2D42]" />
                <h3 className="text-base sm:text-lg font-black text-[#2B2D42]">
                  参加メンバー（{players.length}人）
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("全員の通算★数を 0 にリセットしますか？")) {
                      sound.playTick();
                      resetSessionWins();
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[#FAF6EB] hover:bg-[#FFADAD] border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] flex items-center gap-1 text-[#2B2D42] text-[11px] font-black active:translate-y-0.5 transition-all cursor-pointer"
                  title="通算の星(★)をリセット"
                >
                  <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                  <span>★リセット</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenPlayerModal}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF6EB] hover:bg-[#FFE066] border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] flex items-center gap-1.5 text-[#2B2D42] text-xs font-black active:translate-y-0.5 transition-all cursor-pointer"
                  title="プレイヤー人数・名前を変更"
                >
                  <Settings className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>人数・名前</span>
                </button>
              </div>
            </div>

            {/* 2列のノート付箋風名札カードグリッド（現在の通算★数も表示） */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 my-auto py-1">
              {orderedPlayers.map((player, idx) => {
                const sessionStat =
                  sessionPlayers.find((sp) => sp.id === player.id) ||
                  sessionPlayers.find((sp) => sp.name === player.name) ||
                  sessionPlayers[idx];
                const wins = sessionStat?.totalWins || 0;

                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={onOpenPlayerModal}
                    className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-[#FAF6EB] hover:bg-[#FFF275]/45 border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] text-left transition-all active:translate-y-0.5 cursor-pointer"
                  >
                    <PlayerStampAvatar
                      index={idx}
                      size="md"
                      isOut={player.isOut}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black text-[#2B2D42]/60">
                          メンバー {idx + 1}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-full bg-[#FFE066] border border-[#2B2D42] text-[10px] font-black text-[#2B2D42] shrink-0">
                          ★{wins}
                        </span>
                      </div>
                      <span className="block text-xs sm:text-sm font-black text-[#2B2D42] truncate mt-0.5">
                        {player.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] font-bold text-[#2B2D42]/60 text-center pt-2">
              名札または右上のボタンから人数・名前を変更できます
            </p>
          </div>

          {/* 下段：ノート風「このメンバーで始める ➔」ボタン */}
          <div className="pt-1 pb-2">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setStep("settings");
              }}
              className="w-full py-4 px-6 rounded-2xl bg-[#9AF0A8] hover:bg-[#82e893] border-[2.5px] border-[#2B2D42] shadow-[4px_5px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_3px_0_#2B2D42] text-[#2B2D42] font-black text-lg sm:text-xl tracking-wide transition-all cursor-pointer"
            >
              このメンバーで始める ➔
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

              {/* 「誰から始めるか」（ちんちん侍・○○から始まるリズムに合わせて） または 「プレイの順番」（あぶりカルビ等） */}
              {isStarterOnlyGame ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h2 className="text-sm font-black text-[#2B2D42]">
                      {isRhythmNameGame
                        ? "誰から始めるか・2文字ネーム"
                        : "誰から始めるか"}
                    </h2>
                    <button
                      type="button"
                      onClick={handlePickRandomStarter}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#FFE066] border-2 border-[#2B2D42] shadow-[1px_2px_0_#2B2D42] text-xs font-black text-[#2B2D42] active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>ランダムで決める</span>
                    </button>
                  </div>
                  <p className="text-[11px] font-bold text-[#2B2D42]/70 mb-2.5">
                    {isRhythmNameGame
                      ? "最初に始める人を選び、2文字の呼び名（例：えび・まる・ガリ）を入力できます"
                      : "最初に指差しを始める人（親）をタップして選ぶか、ランダムで決められます"}
                  </p>

                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {players.map((player, idx) => {
                      const isStarter = starterPlayer?.id === player.id;
                      return (
                        <div
                          key={player.id}
                          onClick={() => {
                            sound.playTick();
                            setStarterId(player.id);
                          }}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border-2 border-[#2B2D42] transition-all cursor-pointer ${
                            isStarter
                              ? "bg-[#FFE066] shadow-[3px_3px_0_#2B2D42]"
                              : "bg-[#FAF6EB] hover:bg-[#FFF275]/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                            <PlayerStampAvatar
                              index={idx}
                              size="sm"
                              isOut={player.isOut}
                            />
                            <div className="min-w-0 flex-1">
                              {onRenamePlayer && isRhythmNameGame ? (
                                <input
                                  type="text"
                                  value={player.name}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    onRenamePlayer(player.id, e.target.value)
                                  }
                                  placeholder={
                                    ["えび", "まる", "ガリ", "たろ"][idx % 4]
                                  }
                                  className="w-full px-2 py-0.5 rounded-lg bg-white border border-[#2B2D42]/40 focus:border-[#2B2D42] focus:outline-none text-sm font-black text-[#2B2D42]"
                                />
                              ) : (
                                <div className="text-sm font-black text-[#2B2D42] truncate">
                                  {player.name}
                                </div>
                              )}
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full border-2 border-[#2B2D42] text-xs font-black shrink-0 ${
                              isStarter
                                ? "bg-white text-[#2B2D42]"
                                : "bg-white/60 text-[#2B2D42]/60"
                            }`}
                          >
                            {isStarter ? "★ この人から始める" : "タップで選択"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h2 className="text-sm font-black text-[#2B2D42]">
                      プレイの順番
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
                    1番目 ➔ 2番目 ➔ 3番目…の順番で回します（矢印で入れ替え可能）
                  </p>

                  {/* 番号付きプレイヤーリスト */}
                  <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
                    {orderedPlayers.map((player, idx) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42]"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          <span className="px-2 py-0.5 rounded-lg bg-[#FFE066] border border-[#2B2D42] text-center font-black text-xs text-[#2B2D42] shrink-0">
                            {idx + 1}番目
                          </span>
                          <PlayerStampAvatar
                            index={idx}
                            size="sm"
                            isOut={player.isOut}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-black text-[#2B2D42] truncate">
                              {player.name}
                            </div>
                            <div className="text-[11px] font-bold text-[#2B2D42]/65 mt-0.5">
                              {game.id === "aburi-karubi"
                                ? `${idx + 1}巡目（まずは${idx + 1}回言う）`
                                : getRoleLabel(idx, orderedPlayers.length)}
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
              )}
            </div>

            {/* 下部：最初の人（親）または開始掛け声表示 */}
            <div className="pt-3 border-t-2 border-dashed border-[#2B2D42]/20 text-center text-xs sm:text-sm font-black text-[#2B2D42]">
              {isRhythmNameGame ? (
                <div>
                  開始掛け声：{" "}
                  <span className="px-2 py-0.5 rounded bg-[#FFE066] border border-[#2B2D42]">
                    「{starterPlayer?.name}」から始まるリズムに合わせて！
                  </span>
                </div>
              ) : isStarterOnlyGame ? (
                <div>
                  始める人（親）：{" "}
                  <span className="px-2.5 py-0.5 rounded bg-[#FFE066] border border-[#2B2D42]">
                    {starterPlayer?.name} からスタート！
                  </span>
                </div>
              ) : (
                <div>
                  1番目（スタート）：{" "}
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

          {/* メイン白カード（順番確認 or 始める人確認 ＋ ルール説明） */}
          <div className="bg-white border-[2.5px] border-[#2B2D42] rounded-3xl p-5 shadow-[4px_5px_0_#2B2D42] space-y-5 flex-1 flex flex-col justify-between">
            {/* 上段：「誰から始めるか」 または 「プレイの順番」 */}
            {isStarterOnlyGame ? (
              <div>
                <div className="text-center pb-2 border-b-2 border-[#2B2D42]">
                  <h2 className="text-sm font-black text-[#2B2D42]">
                    誰から始めるか
                  </h2>
                </div>

                <div className="mt-3 p-3.5 rounded-2xl bg-[#FFE066] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] flex items-center justify-center gap-3">
                  <PlayerStampAvatar
                    index={Math.max(
                      0,
                      players.findIndex((p) => p.id === starterPlayer?.id)
                    )}
                    size="md"
                  />
                  <div className="text-left">
                    <div className="text-[11px] font-black text-[#2B2D42]/75">
                      最初に始める人（スタート）
                    </div>
                    <div className="text-lg sm:text-xl font-black text-[#2B2D42]">
                      {starterPlayer?.name}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center pb-2 border-b-2 border-[#2B2D42]">
                  <h2 className="text-sm font-black text-[#2B2D42]">
                    プレイの順番
                  </h2>
                </div>

                <div className="space-y-2 mt-3 max-h-[175px] overflow-y-auto pr-1">
                  {orderedPlayers.map((player, idx) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42]"
                    >
                      <span className="px-2 py-0.5 rounded-lg bg-[#FFE066] border border-[#2B2D42] text-center font-black text-xs text-[#2B2D42] shrink-0">
                        {idx + 1}番目
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
                          {game.id === "aburi-karubi"
                            ? `${idx + 1}巡目（まずは${idx + 1}回言う）`
                            : getRoleLabel(idx, orderedPlayers.length)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-center text-xs sm:text-sm font-black text-[#2B2D42]">
                  1番目（スタート）：{" "}
                  <span className="text-rose-600 underline decoration-2 underline-offset-4">
                    {orderedPlayers[0]?.name}
                  </span>
                </div>
              </div>
            )}

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
                    📢「{starterPlayer?.name}」から始まるリズムに合わせて！
                  </div>
                  <div className="text-[11px] font-bold text-[#2B2D42]/85 text-center">
                    名前＋1〜4でパス ／「ちぇけ」➔「よう・チェケ・ラッ・チョ！」
                  </div>
                </div>
              ) : (
                (game.call_examples?.length || game.metadata?.callExample) && (
                  <div className="px-3 py-2 rounded-2xl bg-[#FFF275]/45 border-2 border-[#2B2D42] text-[11px] font-bold text-[#2B2D42] whitespace-pre-wrap leading-snug space-y-1">
                    {isStarterOnlyGame && (
                      <div className="font-black text-[#2B2D42] pb-1 border-b border-[#2B2D42]/20">
                        📢 最初は「{starterPlayer?.name}」からスタート！
                      </div>
                    )}
                    <div>
                      {game.call_examples
                        ? game.call_examples.join("\n")
                        : game.metadata?.callExample}
                    </div>
                  </div>
                )
              )}

              {/* 順番制ゲーム（あぶりカルビ等）のプレイ順番バー */}
              {!isStarterOnlyGame && orderedPlayers.length >= 2 && (
                <div className="px-3 py-2 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42] flex items-center gap-1.5 overflow-x-auto text-xs font-black text-[#2B2D42]">
                  <span className="px-2 py-0.5 rounded bg-[#FFE066] border border-[#2B2D42] shrink-0 text-[10px]">
                    順番
                  </span>
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    {orderedPlayers.map((p, idx) => (
                      <React.Fragment key={p.id}>
                        <span className={p.isOut ? "line-through opacity-45" : ""}>
                          {idx + 1}.{p.name}
                        </span>
                        {idx < orderedPlayers.length - 1 && (
                          <span className="text-[#2B2D42]/45">➔</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
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
                {(isStarterOnlyGame ? players : orderedPlayers).map(
                  (player, idx) => {
                    const isStarter =
                      isStarterOnlyGame && starterPlayer?.id === player.id;
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border-[2.5px] border-[#2B2D42] transition-all ${
                          player.isOut
                            ? "bg-[#2B2D42]/10 opacity-55"
                            : "bg-[#FAF6EB] shadow-[3px_4px_0_#2B2D42]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {!isStarterOnlyGame && (
                            <span className="px-2 py-0.5 rounded-lg bg-[#FFE066] border border-[#2B2D42] text-center font-black text-xs text-[#2B2D42] shrink-0">
                              {idx + 1}番目
                            </span>
                          )}
                          <PlayerStampAvatar
                            index={idx}
                            size="md"
                            isOut={player.isOut}
                          />
                          <div className="min-w-0">
                            <span
                              className={`block text-base sm:text-lg font-black text-[#2B2D42] truncate ${
                                player.isOut ? "line-through" : ""
                              }`}
                            >
                              {player.name}
                            </span>
                            {isStarter && (
                              <span className="inline-block text-[10px] font-black px-2 py-0.2 rounded-full bg-[#FFE066] border border-[#2B2D42] text-[#2B2D42]">
                                ★ 最初に始める人
                              </span>
                            )}
                          </div>
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
                );
              })}
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

