# 📘 マチジカン！ 拡張機能（1on1・みんなで遊ぶ・ゲームを作る）完全コード解説ガイド

このファイルは、現在トップ画面で一時的に非表示（内部保持）にしている **3つの拡張機能** と、それに関連する **アリーナ連戦システム** のすべてのコードを1つにまとめ、**プログラミング初心者でも1行ずつ仕組みがわかるように解説をつけた別冊ガイドブック** です。

---

## 🧭 目次と全体のつながり

1. **【第0章】非表示にしている3つのボタンを復活させる方法**
   - `src/app/page.tsx` の `SHOW_EXTRA_MODES` スイッチの仕組み
2. **【第1部】「1on1」「みんなで遊ぶ」＆ アリーナ連戦システムのコード解説**
   - **① `src/types/matchMode.ts`**：対戦モード・勝利条件・罰ゲーム候補の「型（設計図）」
   - **② `src/context/ActiveMatchContext.tsx`**：連戦のスコア・脱落・ルーレット抽選・同点サドンデスを計算する「頭脳」
   - **③ `src/components/home/GameExclusionSelector.tsx`**：やりたくないゲームを抽選から外す（BANリスト）部品
   - **④ `src/components/home/DuelSetupModal.tsx`**：「1on1（2人ガチ勝負）」の設定画面モーダル
   - **⑤ `src/components/home/PartySetupModal.tsx`**：「みんなで遊ぶ（勝ち残り / 点数制 / 最弱王＆罰ゲーム）」の設定画面モーダル
   - **⑥ `src/app/arena/page.tsx`**：ランダムに選ばれたゲームを次々に遊ぶ「アリーナ連戦ページ」
   - **⑦ `src/components/arena/GameRouletteOverlay.tsx`**：「第〇戦 競技抽選！」のドラムロール風ルーレット演出
   - **⑧ `src/components/arena/ArenaMatchFinishedModal.tsx`**：連戦が決着したときの「総合優勝 / 本日の負け残り」発表画面
3. **【第2部】「ゲームを作る（オリジナル自作ゲーム機能）」のコード解説**
   - **⑨ `src/lib/customGames.ts`**：自作ゲームをブラウザ（`localStorage`）に保存・削除する仕組みと4つのテンプレート
   - **⑩ `src/components/home/CustomGameModal.tsx`**：お題・BPM・タイマーを自由に組み合わせてゲームを作る画面モーダル

---

## 💡 【第0章】非表示にしている3つのボタンを復活させる方法

現在、トップ画面（`src/app/page.tsx`）では「ゲーム一覧」だけを中央に大きく表示し、**「1on1」「みんなで遊ぶ」「ゲームを作る」の3つは `SHOW_EXTRA_MODES` という1つの変数（スイッチ）で非表示** にしています。

### 復活させる手順（たった1箇所！）
`src/app/page.tsx` の **200行目付近** にある以下の1行を書き換えるだけで、いつでも4つのカードが並んだトップ画面に戻せます。

```tsx
// 【現在】非表示（ゲーム一覧のみ表示）
const SHOW_EXTRA_MODES = false;

// 👇 これを true に書き換えるだけで3つのボタンがすべて復活します！
const SHOW_EXTRA_MODES = true;
```

### トップ画面（`src/app/page.tsx`）で3つのボタンを制御している部分の抜粋解説

```tsx
// true にすると「2列グリッド（4枚のカード）」になり、false だと「中央に1枚（ゲーム一覧のみ）」になります
<div
  className={
    SHOW_EXTRA_MODES
      ? "grid grid-cols-2 gap-x-3.5 gap-y-4 sm:gap-x-4 sm:gap-y-5 my-auto px-1"
      : "flex justify-center my-auto px-3"
  }
>
  {/* ① 左上: 「1on1」ボタン（タップすると isDuelModalOpen が true になり、DuelSetupModal が開きます） */}
  {SHOW_EXTRA_MODES && (
    <button onClick={() => setIsDuelModalOpen(true)}>
      1on1（3本 / 5本先取バトル）
    </button>
  )}

  {/* ② 右上: 「みんなで遊ぶ」ボタン（タップすると isPartyModalOpen が true になり、PartySetupModal が開きます） */}
  {SHOW_EXTRA_MODES && (
    <button onClick={() => setIsPartyModalOpen(true)}>
      みんなで遊ぶ（点数 / 生存 / 最弱王）
    </button>
  )}

  {/* ③ 左下: 「ゲームを作る」ボタン（タップすると CustomGameModal が開きます） */}
  {SHOW_EXTRA_MODES && (
    <button onClick={handleOpenCustomCreate}>
      ゲームを作る（お題・タイマー自由自在）
    </button>
  )}

  {/* ④ 右下（または中央）: 「ゲーム一覧」ボタン */}
  <button onClick={() => setIsCatalogModalOpen(true)}>
    ゲーム一覧
  </button>
</div>
```

---

## ⚔️ 【第1部】「1on1」「みんなで遊ぶ」＆ アリーナ連戦システムのコード解説

### 🔄 1on1・みんなで遊ぶの全体の流れ
1. トップ画面で **「1on1」**（`DuelSetupModal`）または **「みんなで遊ぶ」**（`PartySetupModal`）を開き、メンバーとルール（3本先取、サバイバル、最弱王など）を決めて「対戦スタート！」を押します。
2. `ActiveMatchContext.tsx` の `startMatch(config)` が呼ばれ、参加人数に合ったゲームの中から最初のゲームがランダムに抽選され、**`/arena`（アリーナ画面）** に移動します。
3. アリーナ画面では、まず **ルーレット演出（`GameRouletteOverlay`）** が回り、「今回の対戦競技」が発表されます。
4. 競技が決まると、通常のゲームと同じ **4ステップ進行画面（`StepByStepGameFlow`）** でそのゲームを遊びます。
5. そのラウンドの勝者（または脱落者）をタップすると、`ActiveMatchContext` が自動でスコアや残り人数を計算します。
   - **まだ決着していない場合** ➔ 自動で「第2戦」のゲームをランダム抽選し、再びルーレットが回ります！
   - **決着がついた場合（3本先取達成、最後の1人生き残りなど）** ➔ **決着モーダル（`ArenaMatchFinishedModal`）** が開き、総合優勝者や罰ゲームが発表されます！

---

## ① `src/types/matchMode.ts`（連戦モードの型定義と罰ゲーム候補）

### 💡 初心者向け解説
- **このファイルの役割**：
  - 「1on1」と「みんなで遊ぶ」で使う設定データ（`MatchSessionConfig`）や、試合の途中経過データ（`MatchProgressState`）の形（型）を定義しています。
  - また、「最弱王決定戦」で使える **おすすめの罰ゲーム候補（`PENALTY_PRESETS`）** もここに入っています。

```ts
// 対戦モードの種類
// "duel_1v1" = 2人で戦う1on1モード
// "party_multi" = 3〜8人で戦うみんなで遊ぶモード
export type MatchMode = "duel_1v1" | "party_multi";

// 1vs1の勝利条件
// "first_to_3" = 3本先取（先に3勝した人が優勝）
// "first_to_5" = 5本先取（先に5勝した人が優勝）
export type DuelRule = "first_to_3" | "first_to_5";

// 多人数（みんなで遊ぶ）の対戦形式
// "point_race"        = 点数制（全3回戦・全5回戦・3点先取で一番多く勝った人が優勝）
// "survival_knockout" = 勝ち残りサバイバル制（負けた人が脱落していき、最後の1人が優勝）
// "loser_king"        = 最弱王決定戦（勝った人から抜けていき、最後まで残った1人が負け残り）
export type MultiRuleType = "point_race" | "survival_knockout" | "loser_king";

// 多人数「点数制」の終了条件
export type PointRaceGoal = "rounds_3" | "rounds_5" | "points_3";

// アリーナ対戦用のプレイヤー情報
export interface MatchPlayer {
  id: string;   // "p-1", "p-2" などのID
  name: string; // プレイヤー名
}

// 対戦スタート時に決める「設定データ」の設計図
export interface MatchSessionConfig {
  mode: MatchMode;            // "duel_1v1" または "party_multi"
  players: MatchPlayer[];     // 参加プレイヤーの配列
  excludedGameIds: string[];  // 抽選から外す（やりたくない）ゲームのIDリスト

  // 1vs1のときだけ使う設定
  duelRule?: DuelRule;

  // みんなで遊ぶのときだけ使う設定
  multiRuleType?: MultiRuleType;
  pointRaceGoal?: PointRaceGoal;
  loserPenaltyText?: string;  // 最弱王決定戦で設定した「罰ゲーム」の文章
}

// 試合中にリアルタイムで変化する「進行状態データ」の設計図
export interface MatchProgressState {
  currentRound: number;          // 現在何回戦か（1, 2, 3...）
  currentGameId: string;         // 今回のラウンドで選ばれたゲームのID
  isRouletteSpinning: boolean;   // ルーレット演出中かどうか

  // プレイヤー別の成績・状態
  playerScores: Record<string, number>; // { "p-1": 2, "p-2": 1 } のような勝利数マップ
  eliminatedPlayerIds: string[];        // 「勝ち残り制」で負けて脱落した人のIDリスト
  escapedPlayerIds: string[];           // 「最弱王決定戦」で勝って勝ち抜けた人のIDリスト

  // 点数制で最終戦が終わったときに1位が複数人いた場合の「同点サドンデス延長戦」フラグ
  isSuddenDeath?: boolean;
  suddenDeathPlayerIds?: string[];

  // 決着がついたときの情報
  winnerPlayer?: MatchPlayer;    // 総合優勝したプレイヤー
  loserPlayer?: MatchPlayer;     // 最弱王（負け残り）になったプレイヤー
  isMatchFinished: boolean;      // 試合全体が終了したかどうか
}

// 最弱王決定戦でワンタップで選べる「おすすめ罰ゲーム」一覧
export const PENALTY_PRESETS = [
  "🍹 ジュース奢り",
  "🤪 変顔で記念撮影",
  "🎤 全力モノマネ披露",
  "👑 次のゲームの専属GM担当",
  "🙏 全員を全力で褒めちぎる",
  "🔥 語尾に「〜にゃん」をつけて会話",
  "📱 待ち受けを勝者が選んだ画像にする",
];
```

---

## ② `src/context/ActiveMatchContext.tsx`（アリーナ連戦の頭脳・抽選エンジン）

### 💡 初心者向け解説
- **このファイルの役割**：
  - 「1on1」や「みんなで遊ぶ」の連戦データをアプリ全体で管理する司令塔（React Context）です。
- **特に注目したい3つの賢い仕組み**：
  1. **人数に合わせたランダム抽選（`pickRandomGame`）**：
     - たとえば4人でサバイバルを始めて、1人脱落して残り3人になったとします。すると次のラウンドでは「3人で遊べるゲーム」だけを自動的に候補にして抽選します（2人専用の『CCレモン』『カレーライス』は3人のときは絶対に選ばれず、残り2人になった瞬間に解禁されます！）。
     - また、直前に遊んだゲームと同じゲームが連続で出ないように工夫されています。
  2. **3つのルールの自動判定（`recordRoundWinner` / `recordRoundEliminated`）**：
     - 1on1の先取判定、点数制のラウンド消化、勝ち残りサバイバルの脱落処理、最弱王決定戦の勝ち抜け処理をすべて自動で計算します。
  3. **同点サドンデス機能**：
     - 点数制（3回戦・5回戦）が終わった時点でトップの点数が並んでいた場合、自動的にトップの人たちだけで **「同点サドンデス延長戦」** に突入します！

```tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  MatchMode,
  MatchSessionConfig,
  MatchProgressState,
  MatchPlayer,
} from "@/types/matchMode";
import { ALL_GAMES } from "@/data/games";
import { getAllGamesWithCustom } from "@/lib/customGames";

// ブラウザのlocalStorageに保存するときのキー名（リロードしても連戦が消えないようにするため）
const ACTIVE_MATCH_STORAGE_KEY = "machajikan_active_match_v1";

// 他の画面から呼び出せるデータと関数のリスト
interface ActiveMatchContextType {
  config: MatchSessionConfig | null;                  // 現在の対戦設定
  state: MatchProgressState | null;                   // 現在の試合経過
  startMatch: (newConfig: MatchSessionConfig) => void; // 新しく連戦を開始する関数
  spinNextGame: () => void;                           // 次のラウンドのゲームを抽選する関数
  rerollGame: () => void;                             // 今のラウンドのゲームを引き直す（リロール）関数
  recordRoundWinner: (winnerId: string) => void;      // ラウンドの「勝者」を記録する関数
  recordRoundEliminated: (eliminatedId: string) => void; // ラウンドの「脱落者」を記録する関数
  rematch: () => void;                                // 同じ設定でもう1試合やり直す関数
  clearMatch: () => void;                             // 対戦データを消去して終了する関数
  isSpinning: boolean;                                // ルーレット画面を表示中かどうか
  setIsSpinning: (spinning: boolean) => void;         // ルーレット表示のON/OFFを切り替える関数
}

const ActiveMatchContext = createContext<ActiveMatchContextType | undefined>(undefined);

/**
 * 🎲 条件に合うゲームをランダムに1つ選ぶヘルパー関数
 * @param playerCount 現在の参加人数（サバイバル等で減った後の人数）
 * @param excludedIds 除外（BAN）されたゲームのIDリスト
 * @param previousGameId 直前に遊んだゲームのID（連続被り防止用）
 */
function pickRandomGame(
  playerCount: number,
  excludedIds: string[],
  previousGameId?: string
): string {
  // 標準の7ゲーム＋自作ゲームをすべて取得
  const allAvailableGames = getAllGamesWithCustom();

  // ① 除外リストに入っておらず、かつ現在の人数（min_players〜max_players）で遊べるゲームだけを絞り込む
  const pool = allAvailableGames.filter((g) => {
    if (excludedIds.includes(g.id)) return false;
    return g.min_players <= playerCount && g.max_players >= playerCount;
  });

  // もし除外しすぎて候補が0個になってしまった場合の安全対策（人数が合う最初のゲームを返す）
  if (pool.length === 0) {
    const fallback = allAvailableGames.find(
      (g) => g.min_players <= playerCount && g.max_players >= playerCount
    );
    return fallback ? fallback.id : allAvailableGames[0]?.id || ALL_GAMES[0].id;
  }

  // ② 候補が2個以上あるなら、直前に遊んだゲーム（previousGameId）を除いて抽選する
  const candidate =
    pool.length > 1 && previousGameId
      ? pool.filter((g) => g.id !== previousGameId)
      : pool;

  // Math.random() でランダムに1つ選ぶ
  const picked = candidate[Math.floor(Math.random() * candidate.length)];
  return picked.id;
}

export function ActiveMatchProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<MatchSessionConfig | null>(null);
  const [state, setState] = useState<MatchProgressState | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // 画面を開いたときに localStorage から前回の連戦データがあれば復元する
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(ACTIVE_MATCH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.config && parsed.state) {
          setConfig(parsed.config);
          setState(parsed.state);
        }
      }
    } catch (e) {
      console.error("Failed to load active match:", e);
    }
    setIsInitialized(true);
  }, []);

  // config や state が変わるたびに localStorage に自動保存する
  useEffect(() => {
    if (!isInitialized || typeof window === "undefined") return;
    try {
      if (config && state) {
        localStorage.setItem(ACTIVE_MATCH_STORAGE_KEY, JSON.stringify({ config, state }));
      } else {
        localStorage.removeItem(ACTIVE_MATCH_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save active match:", e);
    }
  }, [config, state, isInitialized]);

  // 🏁 新しく対戦を開始する関数
  const startMatch = useCallback((newConfig: MatchSessionConfig) => {
    const playerCount = newConfig.players.length;
    // 第1戦のゲームをランダム抽選
    const firstGameId = pickRandomGame(playerCount, newConfig.excludedGameIds);

    // 全員のスコアを 0 点で初期化
    const initialScores: Record<string, number> = {};
    newConfig.players.forEach((p) => {
      initialScores[p.id] = 0;
    });

    const initialState: MatchProgressState = {
      currentRound: 1,
      currentGameId: firstGameId,
      isRouletteSpinning: true,
      playerScores: initialScores,
      eliminatedPlayerIds: [],
      escapedPlayerIds: [],
      isMatchFinished: false,
    };

    setConfig(newConfig);
    setState(initialState);
    setIsSpinning(true); // ルーレット演出をスタート！
  }, []);

  // 次のラウンドのゲームを抽選する関数
  const spinNextGame = useCallback(() => {
    if (!config || !state) return;
    const playerCount = config.players.length;
    const nextGameId = pickRandomGame(playerCount, config.excludedGameIds, state.currentGameId);

    setIsSpinning(true);
    setState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentRound: prev.currentRound + 1,
        currentGameId: nextGameId,
        isRouletteSpinning: true,
      };
    });
  }, [config, state]);

  // 🔄 現在のラウンドのゲームを「別のゲーム」に引き直す（リロール）関数
  const rerollGame = useCallback(() => {
    if (!config || !state) return;
    // 現在生き残っている（参加している）人数を計算
    const currentParticipantCount =
      config.mode === "duel_1v1"
        ? 2
        : config.multiRuleType === "survival_knockout"
        ? config.players.length - state.eliminatedPlayerIds.length
        : config.multiRuleType === "loser_king"
        ? config.players.length - state.escapedPlayerIds.length
        : state.isSuddenDeath && state.suddenDeathPlayerIds
        ? state.suddenDeathPlayerIds.length
        : config.players.length;

    const nextGameId = pickRandomGame(
      currentParticipantCount,
      config.excludedGameIds,
      state.currentGameId
    );
    setIsSpinning(true);
    setState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentGameId: nextGameId,
        isRouletteSpinning: true,
      };
    });
  }, [config, state]);

  // 👑 ラウンドの「勝者」が選ばれたときの処理
  const recordRoundWinner = useCallback((winnerId: string) => {
    if (!config || !state) return;

    setState((prev) => {
      if (!prev) return null;

      // 勝った人のスコアを +1 する
      const newScores = {
        ...prev.playerScores,
        [winnerId]: (prev.playerScores[winnerId] || 0) + 1,
      };

      const winnerPlayer = config.players.find((p) => p.id === winnerId);

      // ==========================================
      // パターンA：【1vs1 モードの場合】
      // ==========================================
      if (config.mode === "duel_1v1") {
        // 3本先取なら3点、5本先取なら5点に到達したかチェック
        const targetWins = config.duelRule === "first_to_5" ? 5 : 3;
        const reached = newScores[winnerId] >= targetWins;

        if (reached) {
          // 目標本数に達したら試合終了（総合優勝決定！）
          return {
            ...prev,
            playerScores: newScores,
            winnerPlayer,
            isMatchFinished: true,
          };
        }

        // まだ決着していなければ次のゲームを抽選して次ラウンドへ
        const nextGameId = pickRandomGame(2, config.excludedGameIds, prev.currentGameId);
        setIsSpinning(true);
        return {
          ...prev,
          currentRound: prev.currentRound + 1,
          currentGameId: nextGameId,
          playerScores: newScores,
          isRouletteSpinning: true,
        };
      }

      // ==========================================
      // パターンB：【みんなで遊ぶ モードの場合】
      // ==========================================
      if (config.mode === "party_multi") {
        // ① 点数制（ポイントレース）
        if (config.multiRuleType === "point_race") {
          // すでに同点サドンデス延長戦だった場合は、このラウンドで勝った人が即座に総合優勝！
          if (prev.isSuddenDeath) {
            return {
              ...prev,
              playerScores: newScores,
              winnerPlayer,
              isMatchFinished: true,
            };
          }

          const goal = config.pointRaceGoal || "rounds_5";

          // 「3点先取」ルールの場合
          if (goal === "points_3") {
            if (newScores[winnerId] >= 3) {
              return {
                ...prev,
                playerScores: newScores,
                winnerPlayer,
                isMatchFinished: true,
              };
            }
          } else {
            // 「全3回戦」または「全5回戦」ルールの場合
            const maxRounds = goal === "rounds_3" ? 3 : 5;
            if (prev.currentRound >= maxRounds) {
              // 全ラウンド終了！一番高い得点を調べる
              let maxScore = -1;
              config.players.forEach((p) => {
                const s = newScores[p.id] || 0;
                if (s > maxScore) maxScore = s;
              });

              // 最高得点に並んでいるプレイヤーを全員リストアップ
              const topPlayers = config.players.filter(
                (p) => (newScores[p.id] || 0) === maxScore
              );

              // トップが2人以上いる場合は【同点サドンデス延長戦】へ突入！
              if (topPlayers.length > 1) {
                const suddenGameId = pickRandomGame(
                  topPlayers.length,
                  config.excludedGameIds,
                  prev.currentGameId
                );
                setIsSpinning(true);
                return {
                  ...prev,
                  currentRound: prev.currentRound + 1,
                  currentGameId: suddenGameId,
                  playerScores: newScores,
                  isSuddenDeath: true,
                  suddenDeathPlayerIds: topPlayers.map((p) => p.id),
                  isRouletteSpinning: true,
                };
              }

              // 1人だけ単独トップならその人が完全優勝！
              return {
                ...prev,
                playerScores: newScores,
                winnerPlayer: topPlayers[0],
                isMatchFinished: true,
              };
            }
          }

          // まだ最終ラウンドでなければ次のラウンドへ
          const nextGameId = pickRandomGame(
            config.players.length,
            config.excludedGameIds,
            prev.currentGameId
          );
          setIsSpinning(true);
          return {
            ...prev,
            currentRound: prev.currentRound + 1,
            currentGameId: nextGameId,
            playerScores: newScores,
            isRouletteSpinning: true,
          };
        }

        // ③ 負け残り制（最弱王決定戦）
        if (config.multiRuleType === "loser_king") {
          // 勝った人を「勝ち抜けリスト（escapedPlayerIds）」に追加する
          const newEscaped = Array.from(new Set([...prev.escapedPlayerIds, winnerId]));
          // まだ勝ち抜けていない残りのメンバーを調べる
          const remainingPlayers = config.players.filter((p) => !newEscaped.includes(p.id));

          // 残りが最後の1人になったら、その人が「最弱王（負け残り）」に決定！
          if (remainingPlayers.length === 1) {
            return {
              ...prev,
              escapedPlayerIds: newEscaped,
              loserPlayer: remainingPlayers[0],
              isMatchFinished: true,
            };
          }

          // まだ2人以上残っていれば、残りの人数に合ったゲームを抽選して次戦へ
          const nextGameId = pickRandomGame(
            remainingPlayers.length,
            config.excludedGameIds,
            prev.currentGameId
          );
          setIsSpinning(true);
          return {
            ...prev,
            currentRound: prev.currentRound + 1,
            currentGameId: nextGameId,
            escapedPlayerIds: newEscaped,
            isRouletteSpinning: true,
          };
        }
      }

      return prev;
    });
  }, [config, state]);

  // 💀 ラウンドの「敗者（脱落者）」が選ばれたときの処理（多人数・勝ち残りサバイバル制用）
  const recordRoundEliminated = useCallback((eliminatedId: string) => {
    if (!config || !state) return;

    setState((prev) => {
      if (!prev) return null;

      // 負けた人を「脱落者リスト（eliminatedPlayerIds）」に追加する
      const newEliminated = Array.from(new Set([...prev.eliminatedPlayerIds, eliminatedId]));
      // まだ脱落していない「生き残りメンバー」を調べる
      const alivePlayers = config.players.filter((p) => !newEliminated.includes(p.id));

      // 生き残りが最後の1人になったら、その人が「総合優勝」！
      if (alivePlayers.length === 1) {
        return {
          ...prev,
          eliminatedPlayerIds: newEliminated,
          winnerPlayer: alivePlayers[0],
          isMatchFinished: true,
        };
      }

      // まだ2人以上生き残っていれば、生き残り人数に合ったゲームを抽選して次ラウンドへ
      const nextGameId = pickRandomGame(
        alivePlayers.length,
        config.excludedGameIds,
        prev.currentGameId
      );
      setIsSpinning(true);
      return {
        ...prev,
        currentRound: prev.currentRound + 1,
        currentGameId: nextGameId,
        eliminatedPlayerIds: newEliminated,
        isRouletteSpinning: true,
      };
    });
  }, [config, state]);

  // 🔁 同じ設定でもう1試合やり直す（リベンジ）関数
  const rematch = useCallback(() => {
    if (!config) return;
    startMatch(config);
  }, [config, startMatch]);

  // 🧹 対戦データをリセットして終了する関数
  const clearMatch = useCallback(() => {
    setConfig(null);
    setState(null);
    setIsSpinning(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACTIVE_MATCH_STORAGE_KEY);
    }
  }, []);

  return (
    <ActiveMatchContext.Provider
      value={{
        config,
        state,
        startMatch,
        spinNextGame,
        rerollGame,
        recordRoundWinner,
        recordRoundEliminated,
        rematch,
        clearMatch,
        isSpinning,
        setIsSpinning,
      }}
    >
      {children}
    </ActiveMatchContext.Provider>
  );
}

export function useActiveMatch() {
  const context = useContext(ActiveMatchContext);
  if (!context) {
    throw new Error("useActiveMatch must be used within an ActiveMatchProvider");
  }
  return context;
}
```

---

## ③ `src/components/home/GameExclusionSelector.tsx`（除外ゲーム設定セレクター）

### 💡 初心者向け解説
- **このファイルの役割**：
  - 「1on1」や「みんなで遊ぶ」の設定画面の下部に表示される **「やりたくないゲームを抽選から外す（OFFにする）」** チェックリスト部品です。
  - ルーレット抽選ですべてのゲームがOFFになって抽選不能になるのを防ぐため、**「最低1つは必ずONのまま残る」** という安全ロック（66行目）が入っています。

```tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { getAllGamesWithCustom } from "@/lib/customGames";
import { CheckSquare, Square, Filter } from "lucide-react";

interface GameExclusionSelectorProps {
  playerCount: number;                        // 現在の設定人数（2人、4人など）
  excludedGameIds: string[];                  // 現在OFF（除外）にされているゲームIDの配列
  onChangeExcludedIds: (ids: string[]) => void; // 除外リストが変わったときに親へ伝える関数
}

export default function GameExclusionSelector({
  playerCount,
  excludedGameIds,
  onChangeExcludedIds,
}: GameExclusionSelectorProps) {
  // 全ゲーム（自作ゲーム含む）を取得
  const [allGames, setAllGames] = useState(() => getAllGamesWithCustom());

  // 自作ゲームが追加・削除されたらリストを更新する
  useEffect(() => {
    const handleUpdate = () => {
      setAllGames(getAllGamesWithCustom());
    };
    window.addEventListener("customGamesUpdated", handleUpdate);
    return () => window.removeEventListener("customGamesUpdated", handleUpdate);
  }, []);

  // この人数（playerCount）で遊べるゲームだけを抽出して表示する
  const eligibleGames = useMemo(() => {
    return allGames.filter(
      (g) => g.min_players <= playerCount && g.max_players >= playerCount
    );
  }, [allGames, playerCount]);

  const EXCLUSION_STORAGE_KEY = "machajikan_excluded_games_v1";

  // 前回OFFにしたゲーム設定をlocalStorageから復元する
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(EXCLUSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onChangeExcludedIds(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load excluded games:", e);
    }
  }, []);

  // 変更された除外リストをlocalStorageに保存する関数
  const saveToStorage = (ids: string[]) => {
    onChangeExcludedIds(ids);
    try {
      localStorage.setItem(EXCLUSION_STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.error("Failed to save excluded games:", e);
    }
  };

  // ゲームをタップしてON/OFFを切り替える関数
  const toggleGame = (id: string) => {
    if (excludedGameIds.includes(id)) {
      // すでに除外されていたら、除外リストから外して「ON」に戻す
      saveToStorage(excludedGameIds.filter((item) => item !== id));
    } else {
      // 全部OFFになると抽選できなくなるので、最低1個は必ずONで残すガード処理
      if (excludedGameIds.length >= eligibleGames.length - 1) {
        return;
      }
      // 除外リストに追加して「OFF」にする
      saveToStorage([...excludedGameIds, id]);
    }
  };

  // 「全ON」ボタン
  const handleSelectAll = () => {
    saveToStorage([]);
  };

  // 「全OFF」ボタン（最初の1個だけ残して他をすべてOFFにする）
  const handleDeselectAll = () => {
    if (eligibleGames.length > 1) {
      saveToStorage(eligibleGames.slice(1).map((g) => g.id));
    }
  };

  const activeCount = eligibleGames.length - excludedGameIds.length;

  return (
    <div className="bg-white border-2 border-[#2B2D42] rounded-2xl p-3.5 space-y-2.5 shadow-[2px_3px_0_#2B2D42]">
      <div className="flex items-center justify-between text-xs">
        <span className="font-black text-[#2B2D42] flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#2B2D42]" />
          <span>除外設定 (やりたくないゲームをOFF)</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[11px] px-2 py-0.5 rounded bg-[#FFF275] border border-[#2B2D42] text-[#2B2D42] font-black cursor-pointer hover:brightness-95"
          >
            全ON
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-[11px] px-2 py-0.5 rounded bg-[#FAF6EB] border border-[#2B2D42]/40 text-[#2B2D42]/70 hover:text-[#2B2D42] font-bold cursor-pointer"
          >
            全OFF
          </button>
        </div>
      </div>

      <div className="text-[11px] font-bold text-[#2B2D42]/75">
        抽選対象:{" "}
        <strong className="px-1.5 py-0.2 rounded bg-[#FFF275] text-[#2B2D42] font-black">
          {activeCount}
        </strong>{" "}
        / {eligibleGames.length} 種類
      </div>

      <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
        {eligibleGames.map((g) => {
          const isExcluded = excludedGameIds.includes(g.id);
          const isIncluded = !isExcluded;

          return (
            <button
              type="button"
              key={g.id}
              onClick={() => toggleGame(g.id)}
              className={`p-2 rounded-xl text-left border-2 text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                isIncluded
                  ? "bg-[#FAF6EB] border-[#2B2D42] text-[#2B2D42] font-extrabold hover:bg-[#FFF275]/40"
                  : "bg-slate-100 border-[#2B2D42]/25 text-[#2B2D42]/40 line-through"
              }`}
            >
              {isIncluded ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#2B2D42] shrink-0" />
              ) : (
                <Square className="w-3.5 h-3.5 text-[#2B2D42]/35 shrink-0" />
              )}
              <span className="truncate flex-1">{g.title}</span>
              {g.isCustom && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#FFE066] border border-[#2B2D42] text-[#2B2D42] font-black shrink-0">
                  ★自作
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

---

## ④ `src/components/home/DuelSetupModal.tsx`（「1on1」設定モーダル）

### 💡 初心者向け解説
- **このファイルの役割**：
  - トップ画面の「1on1」ボタンを押したときに開く設定画面です。
  - **2人のプレイヤー名**、**勝利条件（3本先取 / 5本先取）**、**除外ゲーム設定** を選び、「1vs1 対戦スタート！」を押すと `startMatch(config)` を呼び出して `/arena` ページへジャンプします。

```tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DuelRule, MatchSessionConfig } from "@/types/matchMode";
import { useActiveMatch } from "@/context/ActiveMatchContext";
import { useGameSession } from "@/hooks/useGameSession";
import GameExclusionSelector from "./GameExclusionSelector";
import { Swords, X, Flame } from "lucide-react";

interface DuelSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DuelSetupModal({ isOpen, onClose }: DuelSetupModalProps) {
  const router = useRouter();
  const { startMatch } = useActiveMatch();
  const { players: sessionPlayers } = useGameSession();

  const DUEL_PLAYERS_STORAGE_KEY = "machajikan_duel_players_v1";

  // プレイヤー1・2の名前（初期値は現在のセッションの1人目・2人目の名前）
  const [p1Name, setP1Name] = useState<string>(
    sessionPlayers[0]?.name || "プレイヤー 1"
  );
  const [p2Name, setP2Name] = useState<string>(
    sessionPlayers[1]?.name || "プレイヤー 2"
  );
  // 勝利条件（初期値は "first_to_3" = 3本先取）
  const [duelRule, setDuelRule] = useState<DuelRule>("first_to_3");
  // 除外するゲームのID配列
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  // 前回1on1で入力した名前があればlocalStorageから読み込む
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(DUEL_PLAYERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.p1) setP1Name(parsed.p1);
        if (parsed.p2) setP2Name(parsed.p2);
      }
    } catch (e) {
      console.error("Failed to load duel player names:", e);
    }
  }, []);

  if (!isOpen) return null;

  // 「1vs1 対戦スタート！」ボタンを押したときの処理
  const handleStart = () => {
    const finalP1 = p1Name.trim() || "プレイヤー 1";
    const finalP2 = p2Name.trim() || "プレイヤー 2";

    // 次回のために名前を保存
    try {
      localStorage.setItem(
        DUEL_PLAYERS_STORAGE_KEY,
        JSON.stringify({ p1: finalP1, p2: finalP2 })
      );
    } catch (e) {
      console.error("Failed to save duel players:", e);
    }

    // 1on1の対戦設定オブジェクトを組み立てる
    const config: MatchSessionConfig = {
      mode: "duel_1v1",
      players: [
        { id: "p-1", name: finalP1 },
        { id: "p-2", name: finalP2 },
      ],
      duelRule,
      excludedGameIds: excludedIds,
    };

    // 連戦を開始し、モーダルを閉じて /arena へ移動！
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
        className="relative w-full max-w-md bg-[#FAF6EB] border-2 border-[#2B2D42] rounded-3xl p-5 sm:p-6 text-[#2B2D42] shadow-[6px_7px_0_#2B2D42] max-h-[90vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2B2D42]/25">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#7CE8DC] border-2 border-[#2B2D42] flex items-center justify-center">
              <Swords className="w-4 h-4 text-[#2B2D42]" />
            </span>
            <h3 className="text-lg font-black text-[#2B2D42]">
              1対1 対戦モード設定
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

        {/* プレイヤー名入力 */}
        <div className="space-y-2.5">
          <div className="text-xs font-black text-[#2B2D42]">
            対戦プレイヤー名:
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white border-2 border-[#2B2D42] p-2.5 rounded-xl shadow-[2px_2px_0_#2B2D42]">
              <label className="text-[10px] px-1.5 py-0.2 rounded bg-[#FFADAD] text-[#2B2D42] font-black inline-block mb-1">
                プレイヤー 1
              </label>
              <input
                type="text"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                className="w-full bg-transparent text-sm font-black text-[#2B2D42] focus:outline-none"
                placeholder="名前"
                maxLength={10}
              />
            </div>

            <div className="bg-white border-2 border-[#2B2D42] p-2.5 rounded-xl shadow-[2px_2px_0_#2B2D42]">
              <label className="text-[10px] px-1.5 py-0.2 rounded bg-[#7CE8DC] text-[#2B2D42] font-black inline-block mb-1">
                プレイヤー 2
              </label>
              <input
                type="text"
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                className="w-full bg-transparent text-sm font-black text-[#2B2D42] focus:outline-none"
                placeholder="名前"
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* 勝利条件選択（3本先取 / 5本先取） */}
        <div className="space-y-2">
          <div className="text-xs font-black text-[#2B2D42]">勝利条件:</div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDuelRule("first_to_3")}
              className={`p-3 rounded-2xl border-2 border-[#2B2D42] text-center transition-all cursor-pointer ${
                duelRule === "first_to_3"
                  ? "bg-[#7CE8DC] text-[#2B2D42] font-black shadow-[3px_3px_0_#2B2D42]"
                  : "bg-white text-[#2B2D42]/70 hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-black">3本先取</div>
              <div className="text-[10px] font-bold opacity-80 mt-0.5">
                サクッと決着！
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDuelRule("first_to_5")}
              className={`p-3 rounded-2xl border-2 border-[#2B2D42] text-center transition-all cursor-pointer ${
                duelRule === "first_to_5"
                  ? "bg-[#7CE8DC] text-[#2B2D42] font-black shadow-[3px_3px_0_#2B2D42]"
                  : "bg-white text-[#2B2D42]/70 hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-black">5本先取</div>
              <div className="text-[10px] font-bold opacity-80 mt-0.5">
                じっくり白熱勝負！
              </div>
            </button>
          </div>
        </div>

        {/* 除外ゲーム設定（2人対応ゲームのみ表示） */}
        <GameExclusionSelector
          playerCount={2}
          excludedGameIds={excludedIds}
          onChangeExcludedIds={setExcludedIds}
        />

        {/* スタートボタン */}
        <button
          onClick={handleStart}
          className="w-full py-4 px-6 bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] font-black text-lg rounded-2xl shadow-[4px_5px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_2px_0_#2B2D42] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Flame className="w-5 h-5 fill-current" />
          <span>1vs1 対戦スタート！</span>
        </button>
      </div>
    </div>
  );
}
```

---

## ⑤ `src/components/home/PartySetupModal.tsx`（「みんなで遊ぶ」設定モーダル）

### 💡 初心者向け解説
- **このファイルの役割**：
  - 3〜8人で遊ぶパーティ連戦モードの設定画面です。
  - **参加人数（3〜8人）** と **それぞれの名前** を設定し、さらに **3種類のルール** から好きな遊び方を選べます：
    1. **勝ち残り制（サバイバル）**：各ゲームで負けた人が1人ずつ脱落し、最後の1人になるまで戦うモード。
    2. **点数制（ポイントレース）**：「全3回戦」「全5回戦」「3点先取」から選び、一番多く勝った人が優勝するモード（同点の場合はサドンデス延長戦！）。
    3. **最弱王決定戦（負け残り）**：各ゲームで勝った人から抜けていき、最後まで残ってしまった1人が「本日の最弱王」になるモード。ここでは **「罰ゲーム（なし / あり＋おすすめ候補）」** も設定できます！

```tsx
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

  // 参加人数（3〜8人、初期値は4人）
  const [playerCount, setPlayerCount] = useState<number>(4);
  // プレイヤー名の配列
  const [playerNames, setPlayerNames] = useState<string[]>([
    "プレイヤー 1",
    "プレイヤー 2",
    "プレイヤー 3",
    "プレイヤー 4",
  ]);
  // 対戦形式（初期値: 勝ち残りサバイバル "survival_knockout"）
  const [multiRuleType, setMultiRuleType] = useState<MultiRuleType>("survival_knockout");
  // 点数制を選んだときのゴール条件（初期値: 全5回戦 "rounds_5"）
  const [pointRaceGoal, setPointRaceGoal] = useState<PointRaceGoal>("rounds_5");
  // 最弱王決定戦のときの「罰ゲームあり・なし」スイッチ
  const [hasPenalty, setHasPenalty] = useState<boolean>(false);
  // 罰ゲームの内容テキスト
  const [loserPenaltyText, setLoserPenaltyText] = useState<string>("🍹 ジュース奢り");
  // 除外ゲームのIDリスト
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  // 前回遊んだときのプレイヤー名や罰ゲームをlocalStorageから復元する
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

  // 参加人数ボタン（3人〜8人）を押したときに名前入力欄の数を増減させる関数
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

  // 各プレイヤーの名前が書き換えられたときの関数
  const handleNameChange = (index: number, newName: string) => {
    setPlayerNames((prev) => {
      const updated = [...prev];
      updated[index] = newName;
      return updated;
    });
  };

  if (!isOpen) return null;

  // 「多人数 対戦スタート！」ボタンを押したときの処理
  const handleStart = () => {
    // 1人目から順番に p-1, p-2, ... のIDを振って配列を作る
    const finalPlayers = Array.from({ length: playerCount }).map((_, i) => ({
      id: `p-${i + 1}`,
      name: playerNames[i]?.trim() || `プレイヤー ${i + 1}`,
    }));

    // 名前と罰ゲームをlocalStorageに保存
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

    // 多人数モードの設定オブジェクトを組み立てる
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

    // 連戦を開始して /arena へ移動！
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

        {/* 参加人数ピル選択（3〜8人） */}
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

        {/* プレイヤー名入力欄 */}
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

        {/* 対戦ルール選択（勝ち残り制 / 点数制 / 最弱王決定戦） */}
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

        {/* 点数制を選んだときだけ表示される追加オプション */}
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

        {/* 最弱王決定戦を選んだときだけ表示される「罰ゲーム設定」 */}
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

            {/* 罰ゲーム ON 時のテキスト入力＆おすすめプリセット */}
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

        {/* 除外ゲーム設定（選択した参加人数に対応するゲームを表示） */}
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
```

---

## ⑥ `src/app/arena/page.tsx`（アリーナ連戦ページ本体）

### 💡 初心者向け解説
- **このファイルの役割**：
  - 「1on1」や「みんなで遊ぶ」をスタートしたときに開く **`/arena` ページ** です。
  - 普段のゲーム画面と同じ `StepByStepGameFlow`（4ステップ画面）に **`arenaContext`** という特別なデータ（現在のラウンド数、引き直しボタン、勝敗記録関数など）を渡すことで、**1戦終わるごとに自動で次のゲームがルーレット抽選される連戦モード** として動かしています。

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveMatch } from "@/context/ActiveMatchContext";
import { ALL_GAMES } from "@/data/games";
import { getAllGamesWithCustom } from "@/lib/customGames";
import { Player } from "@/types/game";
import StepByStepGameFlow from "@/components/match/StepByStepGameFlow";
import ArenaMatchFinishedModal from "@/components/arena/ArenaMatchFinishedModal";
import GameRouletteOverlay from "@/components/arena/GameRouletteOverlay";
import PlayerRegistrationModal from "@/components/players/PlayerRegistrationModal";

export default function ArenaPage() {
  const router = useRouter();
  const {
    config,
    state,
    isSpinning,
    setIsSpinning,
    recordRoundWinner,
    recordRoundEliminated,
    rerollGame,
    rematch,
    clearMatch,
  } = useActiveMatch();

  const [showPlayerModal, setShowPlayerModal] = useState(false);

  // もし対戦設定データがない状態で直接 /arena を開いた場合はトップ画面に戻す
  useEffect(() => {
    if (!config || !state) {
      router.replace("/");
    }
  }, [config, state, router]);

  if (!config || !state) {
    return (
      <div className="min-h-screen bg-[#FAF6EB] flex items-center justify-center text-[#2B2D42]">
        <div className="animate-pulse text-sm font-black">
          対戦データを読み込み中...
        </div>
      </div>
    );
  }

  // 今回のラウンドで抽選されたゲーム（currentGameId）の情報を取得
  const allAvailable = getAllGamesWithCustom();
  const currentGame =
    allAvailable.find((g) => g.id === state.currentGameId) ||
    allAvailable[0] ||
    ALL_GAMES[0];

  // 対戦を終了してトップ画面へ戻る関数
  const handleQuitToHome = () => {
    clearMatch();
    router.push("/");
  };

  // 設定変更のためにトップ画面へ戻る関数
  const handleChangeSettings = () => {
    clearMatch();
    router.push("/");
  };

  // 現在このラウンドに参加しているメンバー一覧を作る
  // （勝ち残り制なら脱落した人を除き、最弱王決定戦ならすでに勝ち抜けた人を除く）
  const activeArenaPlayers: Player[] = config.players
    .filter((p) => {
      if (config.multiRuleType === "survival_knockout") {
        return !state.eliminatedPlayerIds.includes(p.id);
      }
      if (config.multiRuleType === "loser_king") {
        return !state.escapedPlayerIds.includes(p.id);
      }
      return true;
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      score: state.playerScores[p.id] || 0,
      isOut: false,
    }));

  // 画面上部に表示するモード名のラベル
  const subtitle =
    config.mode === "duel_1v1"
      ? `1on1 (${config.duelRule === "first_to_5" ? "5" : "3"}本先取)`
      : config.multiRuleType === "survival_knockout"
      ? "サバイバル勝ち残り"
      : config.multiRuleType === "loser_king"
      ? "負け残り王決定戦"
      : "ポイントレース";

  return (
    <div
      className="min-h-dvh bg-[#FAF6EB] text-[#2B2D42] flex flex-col justify-between relative px-4 py-2"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(116, 162, 209, 0.32) 27px, rgba(116, 162, 209, 0.32) 28px)",
        backgroundPosition: "0 16px",
      }}
    >
      {/* 大学ノートの左端：赤い縦マージン2本線 */}
      <div
        className="pointer-events-none fixed inset-y-0 left-4 sm:left-10 w-1 border-l-2 border-r border-rose-400/45 z-0"
        aria-hidden="true"
      />

      {/* メイン進行フロー（①スタンバイ ➔ ②設定・順番 ➔ ③ルール確認 ➔ ④プレイ） */}
      <main className="relative z-10 flex-1 w-full">
        <StepByStepGameFlow
          game={currentGame}
          players={activeArenaPlayers}
          onOpenPlayerModal={() => setShowPlayerModal(true)}
          onToggleEliminate={(playerId) => {
            // 「× ミス」が押されたときの処理
            if (config.multiRuleType === "survival_knockout") {
              // 勝ち残りサバイバルならその人を脱落記録
              recordRoundEliminated(playerId);
            } else if (
              config.mode === "duel_1v1" &&
              activeArenaPlayers.length === 2
            ) {
              // 1on1なら、ミスした人の「相手」に1勝を記録
              const other = activeArenaPlayers.find((p) => p.id !== playerId);
              if (other) recordRoundWinner(other.id);
            }
          }}
          onResetElimination={() => {}}
          onSelectWinner={(playerId) => {
            // 「★ 勝者」が押されたときの処理
            recordRoundWinner(playerId);
          }}
          onBackToHome={handleQuitToHome}
          arenaContext={{
            roundNumber: state.currentRound,
            subtitle,
            onRerollGame: rerollGame,
            onRecordEliminated:
              config.multiRuleType === "survival_knockout"
                ? recordRoundEliminated
                : undefined,
            judgeLabel:
              config.multiRuleType === "loser_king"
                ? "このゲームで勝ち抜けた人をタップ"
                : config.multiRuleType === "survival_knockout"
                ? "このゲームで負けた人（ミス）または勝者をタップ"
                : "このラウンドの勝者をタップ",
          }}
        />
      </main>

      {/* プレイヤー確認モーダル */}
      <PlayerRegistrationModal
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        initialPlayers={activeArenaPlayers}
        onSave={() => setShowPlayerModal(false)}
        minPlayers={2}
        maxPlayers={8}
        gameTitle={currentGame.title}
        isInitialSetup={false}
      />

      {/* スロット風ルーレット演出オーバーレイ（isSpinningがtrueのときに前面に出る） */}
      <GameRouletteOverlay
        isOpen={isSpinning}
        targetGame={currentGame}
        roundNumber={state.currentRound}
        onFinish={() => setIsSpinning(false)}
      />

      {/* 決着モーダル（総合優勝 or 負け残り王が決まったときに開く） */}
      <ArenaMatchFinishedModal
        isOpen={state.isMatchFinished}
        config={config}
        state={state}
        onRematch={rematch}
        onChangeSettings={handleChangeSettings}
        onGoHome={handleQuitToHome}
      />
    </div>
  );
}
```

---

## ⑦ `src/components/arena/GameRouletteOverlay.tsx`（スロット風ルーレット抽選演出）

### 💡 初心者向け解説
- **このファイルの役割**：
  - アリーナ連戦で各ラウンドが始まる前に、画面中央でゲーム名がカタカタと高速で切り替わり、だんだんゆっくりになって「🔥 今回の対戦競技に決定！ 🔥」と発表する演出コンポーネントです。
  - **だんだん遅くなる仕組み（48〜50行目）**：
    - 最初は `speed = 60`（0.06秒ごと）で高速回転し、最後の8回（`count > maxCount - 8`）になると1回ごとに `speed += 35` ずつ待ち時間を長くすることで、本物のルーレットが止まるような減速感を表現しています！
  - 画面のどこかをタップすると即座にスキップ（`handleSkip`）することもできます。

```tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Game } from "@/types/game";
import { ALL_GAMES } from "@/data/games";
import { getAllGamesWithCustom } from "@/lib/customGames";
import { sound } from "@/lib/sound";
import { Dices, Flame, FastForward } from "lucide-react";

interface GameRouletteOverlayProps {
  isOpen: boolean;          // ルーレットを表示するかどうか
  targetGame: Game;         // 最終的に止まる（当選した）ゲーム
  roundNumber: number;      // 第何戦か
  onFinish: () => void;     // 演出が終わったときに呼ぶ関数
}

export default function GameRouletteOverlay({
  isOpen,
  targetGame,
  roundNumber,
  onFinish,
}: GameRouletteOverlayProps) {
  // ルーレット回転中に画面に一瞬ずつ表示するゲーム
  const [displayGame, setDisplayGame] = useState<Game>(targetGame);
  // ルーレットが止まって競技が決定したかどうか
  const [isDecided, setIsDecided] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsDecided(false);
      return;
    }

    setIsDecided(false);
    let speed = 60;       // 初期の切り替えスピード（60ミリ秒）
    let count = 0;        // 何回切り替えたか
    const maxCount = 28;  // 合計28回切り替えたら止まる
    const pool = getAllGamesWithCustom();

    const spin = () => {
      intervalRef.current = setTimeout(() => {
        // ランダムなゲームを画面に表示して「カチッ」と音を鳴らす
        const randomIndex = Math.floor(Math.random() * pool.length);
        setDisplayGame(pool[randomIndex] || ALL_GAMES[0]);
        sound.playTick();
        count++;

        if (count < maxCount) {
          // 最後の8回になったら少しずつスピードを遅くする（減速演出）
          if (count > maxCount - 8) {
            speed += 35;
          }
          spin();
        } else {
          // 28回回ったら、本来の当選ゲーム（targetGame）をピタッと表示して効果音を鳴らす！
          setDisplayGame(targetGame);
          setIsDecided(true);
          sound.playGacha();
          // 1.1秒間「決定！」を見せてから自動でルーレット画面を閉じる
          timerRef.current = setTimeout(() => {
            onFinish();
          }, 1100);
        }
      }, speed);
    };

    spin();

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, targetGame, onFinish]);

  // 画面をタップしてルーレット演出を即スキップする関数
  const handleSkip = () => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayGame(targetGame);
    setIsDecided(true);
    sound.playGacha();
    setTimeout(() => {
      onFinish();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleSkip}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer select-none"
    >
      <div className="w-full max-w-md text-center space-y-5">
        {/* ラウンドバッジ */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFE066] border-2 border-[#2B2D42] text-[#2B2D42] text-sm font-black shadow-[3px_3px_0_#2B2D42] animate-bounce">
          <Flame className="w-4 h-4 fill-current" />
          <span>第{roundNumber}戦 競技抽選</span>
        </div>

        {/* スロットルーレット表示カード（ノート風白カード＋斜め蛍光マーカー） */}
        <div
          className={`relative overflow-hidden p-8 rounded-3xl bg-white border-2 border-[#2B2D42] text-[#2B2D42] transition-all duration-300 ${
            isDecided
              ? "shadow-[8px_9px_0_#2B2D42] scale-105"
              : "shadow-[5px_6px_0_#2B2D42]"
          }`}
        >
          {/* 斜め蛍光マーカー（回転中はシアン、決定したらイエローに変化！） */}
          <div
            className="absolute inset-y-0 right-0 w-[52%] pointer-events-none transition-colors duration-200"
            style={{
              backgroundColor: isDecided ? "#FFE066" : "#7CE8DC",
              clipPath: "polygon(42% 0, 100% 0, 100% 100%, 0% 100%)",
            }}
          />

          <div className="relative z-10 w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42] flex items-center justify-center text-[#2B2D42] shadow-[2px_3px_0_#2B2D42]">
            <Dices
              className={`w-8 h-8 ${!isDecided ? "animate-spin" : "scale-110"}`}
            />
          </div>

          <div className="relative z-10 text-xs font-black text-[#2B2D42]/70 mb-1">
            {isDecided ? "🔥 今回の対戦競技に決定！ 🔥" : "ルーレット回転中..."}
          </div>

          <h2
            className={`relative z-10 text-2xl sm:text-3xl font-black text-[#2B2D42] transition-all ${
              isDecided ? "scale-105" : ""
            }`}
          >
            {displayGame.title}
          </h2>

          {displayGame.isCustom && (
            <div className="relative z-10 inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-[#FFE066] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black">
              <span>★ オリジナル自作ゲーム</span>
            </div>
          )}

          <p className="relative z-10 text-xs sm:text-sm font-bold text-[#2B2D42]/80 mt-3 line-clamp-2 leading-relaxed">
            {displayGame.short_description || displayGame.description}
          </p>

          {isDecided && displayGame.metadata?.tags && (
            <div className="relative z-10 flex flex-wrap justify-center gap-1.5 mt-4">
              {displayGame.metadata.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#2B2D42] text-[#2B2D42]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* スキップガイド */}
        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#2B2D42] text-xs text-[#2B2D42] font-black">
          <FastForward className="w-3.5 h-3.5" />
          <span>画面タップでスキップ</span>
        </div>
      </div>
    </div>
  );
}
```

---

## ⑧ `src/components/arena/ArenaMatchFinishedModal.tsx`（アリーナ決着発表モーダル）

### 💡 初心者向け解説
- **このファイルの役割**：
  - 1on1やみんなで遊ぶの連戦がすべて終わったときに開く、最終結果発表画面です。
  - 通常の優勝ルールでは **紙吹雪（confetti）＋手書きトロフィーイラスト** で優勝者を讃え、「最弱王決定戦」のときは **手書きドクロイラスト＋執行される罰ゲームカード** を表示します。
  - LINEやSNSにそのまま貼り付けられる「結果をコピー」機能もついています。

```tsx
"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { MatchSessionConfig, MatchProgressState } from "@/types/matchMode";
import {
  RotateCcw,
  SlidersHorizontal,
  Home,
  Share2,
  Check,
  Flame,
} from "lucide-react";

interface ArenaMatchFinishedModalProps {
  isOpen: boolean;
  config: MatchSessionConfig;
  state: MatchProgressState;
  onRematch: () => void;
  onChangeSettings: () => void;
  onGoHome: () => void;
}

/** ボールペン手書き風トロフィー＆ドクロスタンプSVG */
function ResultStampDoodle({
  isLoserKing,
  className = "w-14 h-14",
}: {
  isLoserKing: boolean;
  className?: string;
}) {
  if (isLoserKing) {
    // 最弱王モードのときは手書きのドクロマークを描画
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className={className}
        stroke="#2B2D42"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M16 28 C16 15 48 15 48 28 C48 36 43 40 42 46 H22 C21 40 16 36 16 28 Z"
          fill="#FFFFFF"
        />
        <circle cx="25" cy="29" r="3.5" fill="#2B2D42" />
        <circle cx="39" cy="29" r="3.5" fill="#2B2D42" />
        <path d="M30 36 L32 33 L34 36" />
        <path d="M26 42 V46 M32 42 V46 M38 42 V46" />
      </svg>
    );
  }

  // 通常優勝モードのときは手書きのトロフィーを描画
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      stroke="#2B2D42"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 14 H46 V28 C46 37 39 43 32 43 C25 43 18 37 18 28 Z" fill="#FFFFFF" />
      <path d="M18 18 H11 C11 26 14 30 18 30" />
      <path d="M46 18 H53 C53 26 50 30 46 30" />
      <path d="M32 43 V51" />
      <path d="M22 51 H42 V56 H22 Z" fill="#FFFFFF" />
      <path
        d="M32 21 L34 26 L39 26 L35 29 L36.5 34 L32 31 L27.5 34 L29 29 L25 26 L30 26 Z"
        fill="#FFE066"
      />
    </svg>
  );
}

export default function ArenaMatchFinishedModal({
  isOpen,
  config,
  state,
  onRematch,
  onChangeSettings,
  onGoHome,
}: ArenaMatchFinishedModalProps) {
  const [copied, setCopied] = useState(false);

  const isLoserKingMode = config.multiRuleType === "loser_king";
  const winner = state.winnerPlayer;
  const loser = state.loserPlayer;

  // 優勝が決まった瞬間に紙吹雪を飛ばす（最弱王モード以外）
  useEffect(() => {
    if (!isOpen) return;

    if (!isLoserKingMode) {
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isOpen, isLoserKingMode]);

  if (!isOpen) return null;

  // 試合結果をクリップボードにコピーする関数
  const handleCopyResult = () => {
    let text = "";
    if (isLoserKingMode) {
      const penaltyLine = config.loserPenaltyText
        ? `\n罰ゲーム: ${config.loserPenaltyText}`
        : "";
      text = `【マチジカン！負け残り王決定戦】\n本日の負け残り: ${
        loser?.name || "???"
      }${penaltyLine}\n#マチジカン`;
    } else {
      text = `【マチジカン！対戦結果】\n優勝: ${
        winner?.name || "???"
      }\n総ラウンド数: ${state.currentRound}回戦\n#マチジカン`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2D42]/60 backdrop-blur-xs animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-md p-5 sm:p-7 rounded-3xl bg-[#FAF6EB] border-[3px] border-[#2B2D42] text-[#2B2D42] shadow-[6px_8px_0_#2B2D42] space-y-5 overflow-hidden"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, #C5D6E8 27px, #C5D6E8 28px)",
          backgroundPosition: "0 12px",
        }}
      >
        {/* 勝者 / 負け残りメインカード */}
        <div className="relative bg-white border-[2.5px] border-[#2B2D42] rounded-2xl p-5 shadow-[3px_4px_0_#2B2D42] overflow-hidden text-left">
          <div
            className="absolute inset-y-0 right-0 w-[38%] pointer-events-none"
            style={{
              backgroundColor: isLoserKingMode ? "#FFADAD" : "#FFE066",
              clipPath: "polygon(32% 0%, 100% 0%, 100% 100%, 0% 100%)",
            }}
          />

          <div className="relative z-10 pr-16">
            <span
              className={`inline-block text-xs font-black text-[#2B2D42] px-2.5 py-0.5 rounded-md border-2 border-[#2B2D42] mb-2 ${
                isLoserKingMode ? "bg-[#FFADAD]" : "bg-[#FFF275]"
              }`}
            >
              {isLoserKingMode ? "本日の負け残り決定" : "優勝決定！"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2B2D42] leading-tight break-words">
              {isLoserKingMode ? loser?.name || "???" : winner?.name || "???"}
            </h2>
            <p className="text-xs font-black text-[#2B2D42]/75 mt-1.5">
              {isLoserKingMode
                ? "最後まで勝ち抜けならず…！"
                : config.mode === "duel_1v1"
                ? `${config.duelRule === "first_to_5" ? 5 : 3}本先取で見事勝利！`
                : `全${state.currentRound}戦を制して優勝！`}
            </p>
          </div>

          <div className="absolute right-3 bottom-2 z-10 pointer-events-none">
            <ResultStampDoodle
              isLoserKing={isLoserKingMode}
              className="w-14 h-14 sm:w-16 sm:h-16"
            />
          </div>
        </div>

        {/* 罰ゲームが設定されている場合の表示カード */}
        {isLoserKingMode && Boolean(config.loserPenaltyText) && (
          <div className="p-4 rounded-2xl bg-white border-[2.5px] border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] space-y-1 text-center">
            <div className="text-[11px] font-black text-[#2B2D42] flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              <span>執行される罰ゲーム</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-[#2B2D42]">
              {config.loserPenaltyText}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={onRematch}
            className="w-full py-4 px-4 rounded-2xl bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-[2.5px] border-[#2B2D42] font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>もう1戦プレイ（同じ設定で再戦）</span>
          </button>

          <button
            type="button"
            onClick={onChangeSettings}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-[#FAF6EB] border-[2.5px] border-[#2B2D42] text-[#2B2D42] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
            <span>設定やルールを変えて遊ぶ</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCopyResult}
              className="py-3 px-3 rounded-xl bg-white hover:bg-[#FAF6EB] border-[2.5px] border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] text-xs font-black text-[#2B2D42] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>コピー完了！</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>結果をコピー</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onGoHome}
              className="py-3 px-3 rounded-xl bg-white hover:bg-[#FAF6EB] border-[2.5px] border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] text-xs font-black text-[#2B2D42] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>トップへ戻る</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🛠️ 【第2部】「ゲームを作る（オリジナル自作ゲーム機能）」のコード解説

### 🔄 「ゲームを作る」の全体の流れ
1. トップ画面の **「ゲームを作る」** を押すと、`CustomGameModal.tsx` が開きます。
2. ゼロから入力するのが大変な人のために、上部に **4つのおすすめテンプレート**（「古今東西」「一言大喜利」「体内時計10秒当て」「リズム連呼ゲーム」）があり、ワンタップで自動入力できます。
3. ゲームに連動させる **GM（ゲームマスター）ツール** を次の4つから選べます：
   - **🎴 お題ガチャ（`prompt`）**：改行区切りで好きなお題を入力すると、プレイ画面で「次のお題へ」ボタンとしてランダムに出題されます。
   - **🎵 BPMリズム（`bpm`）**：設定したテンポ（60〜180 BPM）でプレイ画面のメトロノームが鳴ります。
   - **⏱️ タイマー（`timer`）**：設定した秒数（5秒〜60秒）のカウントダウンタイマー（または秒数を隠すブラインドタイマー）が動きます。
   - **🙌 ツールなし（`none`）**：ルール表示と勝敗記録だけでシンプルに遊べます。
4. 「登録する！」を押すと、`customGames.ts` の `saveCustomGame` によってブラウザの `localStorage` に保存され、「ゲーム一覧」や「1on1・みんなで遊ぶのルーレット」に自動的に追加されます！

---

## ⑨ `src/lib/customGames.ts`（自作ゲームの保存・削除・テンプレート定義）

### 💡 初心者向け解説
- **このファイルの役割**：
  - ユーザーが作ったオリジナルゲームをブラウザの保存領域（`localStorage`）に読み書きする関数群と、4つのおすすめテンプレート（`CUSTOM_GAME_TEMPLATES`）を定義しています。
  - 保存・削除した瞬間に `window.dispatchEvent(new Event("customGamesUpdated"))` という合図（カスタムイベント）を画面全体に飛ばすことで、ページをリロードしなくても即座に「ゲーム一覧」に自作ゲームが反映される仕組みになっています。

```ts
import { Game, ToolType } from "@/types/game";
import { ALL_GAMES } from "@/data/games";

// ブラウザのlocalStorageに保存するときのキー名
export const CUSTOM_GAMES_STORAGE_KEY = "machajikan_custom_games_v1";

// おすすめテンプレートの設計図
export interface CustomGameTemplate {
  name: string;
  badge: string;
  title: string;
  short_description: string;
  description: string;
  rules: string[];
  min_players: number;
  max_players: number;
  selectedTool: "prompt" | "bpm" | "timer" | "none";
  promptListText?: string;
  defaultBpm?: number;
  timerDuration?: number;
}

// ワンタップで入力できる4つのおすすめテンプレート
export const CUSTOM_GAME_TEMPLATES: CustomGameTemplate[] = [
  {
    name: "古今東西（お題ガチャ）",
    badge: "🎴 お題",
    title: "オリジナル山手線ゲーム",
    short_description: "リズムに合わせてお題に沿った言葉を順番に言っていくゲーム！",
    description: "手拍子のリズムに乗って、画面に表示されたお題に当てはまる言葉を順番に答えます。被りや詰まり、リズムに乗れなかったらアウト！",
    rules: ["手拍子を2回叩いて答える", "直前と同じ答えはNG", "3秒以上止まったら負け"],
    min_players: 2,
    max_players: 8,
    selectedTool: "prompt",
    promptListText: "コンビニのお菓子\n赤い食べ物\nディズニーキャラクター\n4文字の言葉\n学校にあるもの\n夏といえば？\nジブリの登場人物\n家電製品",
  },
  {
    name: "一言大喜利バトル",
    badge: "🎤 お題",
    title: "スピード一言大喜利",
    short_description: "次々出るお題に一番面白い回答をした人が勝ち！",
    description: "表示されたお題に対して、プレイヤー全員が一言でボケます。一番笑いを取った人がこのラウンドの勝者！",
    rules: ["お題を見て30秒以内に回答", "全員が回答したら多数決で勝者を決定"],
    min_players: 3,
    max_players: 8,
    selectedTool: "prompt",
    promptListText: "こんな駅員さんは嫌だ\n先生が職員室でこっそり言ってそうなこと\n誰も買わない新商品の名前\nドラえもんが絶対に出さない秘密道具\n100年後の日本の流行語",
  },
  {
    name: "体内時計10秒当て",
    badge: "⏱️ タイマー",
    title: "体内時計ジャストチャレンジ",
    short_description: "画面を見ずに頭の中で10秒カウントしてストップ！",
    description: "タイマーをスタートさせたらスマホを伏せるか目を閉じ、10秒ピッタリだと思うタイミングでタップ。一番10秒に近かった人の勝利！",
    rules: ["時計を見るのは禁止", "「せーの」でスタートし、各自自分のタイミングで宣言する"],
    min_players: 2,
    max_players: 6,
    selectedTool: "timer",
    timerDuration: 10,
  },
  {
    name: "リズム連呼ゲーム",
    badge: "🎵 BPM",
    title: "高速リズムコール",
    short_description: "BPMのスピードに合わせて単語を噛まずに言い切れるか勝負！",
    description: "メトロノームのビートに合わせて順番に早口言葉や決め言葉を言っていきます。噛んだりテンポから遅れたら脱落！",
    rules: ["4拍子のリズムに合わせて発言", "噛んだら即アウト"],
    min_players: 2,
    max_players: 8,
    selectedTool: "bpm",
    defaultBpm: 120,
  },
];

// 📥 ローカルストレージから自作ゲーム一覧を読み込む関数
export function getCustomGames(): Game[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(CUSTOM_GAMES_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to load custom games:", e);
    return [];
  }
}

// 💾 自作ゲームを保存（新規追加または上書き編集）する関数
export function saveCustomGame(game: Game): Game[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getCustomGames();
    // すでに同じIDのゲームがあるか探す（編集モードかどうかの判定）
    const existingIndex = current.findIndex((g) => g.id === game.id);
    let updated: Game[];

    if (existingIndex >= 0) {
      // 既存のゲームを編集した場合はその場所を上書き
      updated = [...current];
      updated[existingIndex] = game;
    } else {
      // 新規作成の場合はリストの先頭に追加
      updated = [game, ...current];
    }

    localStorage.setItem(CUSTOM_GAMES_STORAGE_KEY, JSON.stringify(updated));
    // 画面内の他コンポーネントに「自作ゲームが更新されたよ！」と通知する
    window.dispatchEvent(new Event("customGamesUpdated"));
    return updated;
  } catch (e) {
    console.error("Failed to save custom game:", e);
    return [];
  }
}

// 🗑️ 自作ゲームを削除する関数
export function deleteCustomGame(id: string): Game[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getCustomGames();
    const filtered = current.filter((g) => g.id !== id);
    localStorage.setItem(CUSTOM_GAMES_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event("customGamesUpdated"));
    return filtered;
  } catch (e) {
    console.error("Failed to delete custom game:", e);
    return [];
  }
}

// 📚 自作ゲーム＋公式7ゲームを合体した全ゲーム配列を返す関数
export function getAllGamesWithCustom(): Game[] {
  const custom = getCustomGames();
  return [...custom, ...ALL_GAMES];
}
```

---

## ⑩ `src/components/home/CustomGameModal.tsx`（「ゲームを作る・編集する」モーダル）

### 💡 初心者向け解説
- **このファイルの役割**：
  - オリジナルゲームの新規作成と編集を行うフォーム画面です。
  - お題リストのテキストエリア（`promptListText`）に入力された文章を、`split("\n")` で1行ずつ切り分けて配列に変換し、`Game` オブジェクトとして保存します（107〜111行目）。
  - 保存された自作ゲームは、公式ゲームとまったく同じ `Game` 型を持っているため、`StepByStepGameFlow`（4ステップ画面）でそのまま違和感なく遊ぶことができます！

```tsx
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
  Clock,
  Activity,
  MessageSquare,
  Save,
  HelpCircle,
  FileText,
} from "lucide-react";

interface CustomGameModalProps {
  isOpen: boolean;                  // モーダルが開いているか
  gameToEdit?: Game | null;         // 編集したいゲーム（新規作成のときは null）
  onClose: () => void;              // 閉じる関数
  onSaved: (savedGame: Game) => void; // 保存完了時に呼ばれる関数
}

export default function CustomGameModal({
  isOpen,
  gameToEdit,
  onClose,
  onSaved,
}: CustomGameModalProps) {
  // 入力フォームの各状態（State）
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [ruleText, setRuleText] = useState("");
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(8);
  // 選んだGMツール（"prompt" = お題ガチャ, "bpm" = リズム, "timer" = タイマー, "none" = なし）
  const [selectedTool, setSelectedTool] = useState<
    "prompt" | "bpm" | "timer" | "none"
  >("prompt");
  // お題ガチャ用のテキスト（改行区切り）
  const [promptListText, setPromptListText] = useState("");
  // BPMリズム用のテンポ数値
  const [defaultBpm, setDefaultBpm] = useState(120);
  // タイマー用の秒数とブラインド設定
  const [timerDuration, setTimerDuration] = useState(10);
  const [isBlindTimer, setIsBlindTimer] = useState(false);

  // モーダルが開いたとき、編集モードなら既存データをセットし、新規ならテンプレート1番目をセットする
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
            .map((p) =>
              typeof p === "string" ? p : `${p.question} (答: ${p.answer})`
            )
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
      // 新規作成時は「古今東西（お題ガチャ）」テンプレートを初期値として入れておく
      applyTemplate(CUSTOM_GAME_TEMPLATES[0]);
    }
  }, [gameToEdit, isOpen]);

  // テンプレートボタンを押したときにフォームへ一括入力する関数
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

  // 「オリジナルゲームを登録する！」ボタンを押したときの保存処理
  const handleSave = () => {
    if (!title.trim()) {
      alert("ゲームタイトルを入力してください");
      return;
    }

    // 新規作成なら現在時刻を使ったユニークID（custom-171...）を作る
    const id = gameToEdit?.id || `custom-${Date.now()}`;

    // 改行（\n）で区切られたお題テキストを配列に変換し、空行を取り除く
    const prompts =
      selectedTool === "prompt"
        ? promptListText
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : undefined;

    // 新しいGameオブジェクトを組み立てる
    const newGame: Game = {
      id,
      title: title.trim(),
      short_description: shortDesc.trim() || title.trim(),
      description: ruleText.trim() || shortDesc.trim() || title.trim(),
      min_players: Math.min(minPlayers, maxPlayers),
      max_players: Math.max(minPlayers, maxPlayers),
      created_at: gameToEdit?.created_at || new Date().toISOString(),
      isCustom: true, // 自作ゲームの目印フラグ
      metadata: {
        tools: selectedTool !== "none" ? [selectedTool] : [],
        promptList: prompts,
        defaultBpm: selectedTool === "bpm" ? defaultBpm : undefined,
        timerDuration: selectedTool === "timer" ? timerDuration : undefined,
        blindTimer: selectedTool === "timer" ? isBlindTimer : undefined,
        tags: ["オリジナル", "自作"],
      },
    };

    // localStorageに保存してモーダルを閉じる
    saveCustomGame(newGame);
    onSaved(newGame);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#FAF6EB] border-2 border-[#2B2D42] rounded-3xl p-5 sm:p-6 text-[#2B2D42] shadow-[6px_7px_0_#2B2D42] max-h-[92vh] overflow-y-auto space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2B2D42]/25">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#FFADAD] border-2 border-[#2B2D42] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#2B2D42]" />
            </span>
            <h3 className="text-lg font-black text-[#2B2D42]">
              {gameToEdit ? "オリジナルゲームを編集" : "オリジナルゲームを作成"}
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

        {/* テンプレート選択（新規作成時のみ表示） */}
        {!gameToEdit && (
          <div className="space-y-2">
            <div className="text-xs font-black text-[#2B2D42] flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#2B2D42]" />
              <span>おすすめテンプレートから作る（ワンタップ入力）:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CUSTOM_GAME_TEMPLATES.map((tpl) => (
                <button
                  type="button"
                  key={tpl.name}
                  onClick={() => applyTemplate(tpl)}
                  className="p-2.5 rounded-xl bg-white hover:bg-[#FFF275]/60 border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-black text-[#2B2D42] truncate">
                      {tpl.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FAF6EB] border border-[#2B2D42]/30 shrink-0">
                      {tpl.badge}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ゲームタイトル入力 */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-[#2B2D42] block">
            ゲームタイトル <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white border-2 border-[#2B2D42] p-2.5 rounded-xl text-sm font-black text-[#2B2D42] shadow-[2px_2px_0_#2B2D42] focus:outline-none"
            placeholder="例: オリジナル古今東西、一言大喜利など"
            maxLength={30}
          />
        </div>

        {/* 簡単な説明入力 */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-[#2B2D42] block">
            簡単な説明（スロット・一覧に表示）
          </label>
          <input
            type="text"
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            className="w-full bg-white border-2 border-[#2B2D42] p-2.5 rounded-xl text-sm font-bold text-[#2B2D42] shadow-[2px_2px_0_#2B2D42] focus:outline-none"
            placeholder="例: リズムに合わせてお題を答えていくゲーム！"
            maxLength={60}
          />
        </div>

        {/* プレイ可能人数選択 */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-[#2B2D42] block">
            プレイ可能人数
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border-2 border-[#2B2D42] p-2.5 rounded-xl shadow-[2px_2px_0_#2B2D42] flex items-center justify-between">
              <span className="text-xs font-bold text-[#2B2D42]/75">
                最小人数:
              </span>
              <select
                value={minPlayers}
                onChange={(e) => setMinPlayers(Number(e.target.value))}
                className="bg-transparent text-sm font-black text-[#2B2D42] focus:outline-none cursor-pointer"
              >
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}人
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white border-2 border-[#2B2D42] p-2.5 rounded-xl shadow-[2px_2px_0_#2B2D42] flex items-center justify-between">
              <span className="text-xs font-bold text-[#2B2D42]/75">
                最大人数:
              </span>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="bg-transparent text-sm font-black text-[#2B2D42] focus:outline-none cursor-pointer"
              >
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}人
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 連動GMツール選択（お題ガチャ / BPMリズム / タイマー / ツールなし） */}
        <div className="space-y-2">
          <label className="text-xs font-black text-[#2B2D42] block">
            連動させるゲームマスター（GM）ツール:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setSelectedTool("prompt")}
              className={`p-2.5 rounded-xl border-2 border-[#2B2D42] text-center transition-all cursor-pointer ${
                selectedTool === "prompt"
                  ? "bg-[#FFE066] text-[#2B2D42] font-black shadow-[2px_2px_0_#2B2D42]"
                  : "bg-white text-[#2B2D42]/70"
              }`}
            >
              <MessageSquare className="w-4 h-4 mx-auto mb-1 text-[#2B2D42]" />
              <div className="text-xs">お題ガチャ</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTool("bpm")}
              className={`p-2.5 rounded-xl border-2 border-[#2B2D42] text-center transition-all cursor-pointer ${
                selectedTool === "bpm"
                  ? "bg-[#CBC8FA] text-[#2B2D42] font-black shadow-[2px_2px_0_#2B2D42]"
                  : "bg-white text-[#2B2D42]/70"
              }`}
            >
              <Activity className="w-4 h-4 mx-auto mb-1 text-[#2B2D42]" />
              <div className="text-xs">BPMリズム</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTool("timer")}
              className={`p-2.5 rounded-xl border-2 border-[#2B2D42] text-center transition-all cursor-pointer ${
                selectedTool === "timer"
                  ? "bg-[#7CE8DC] text-[#2B2D42] font-black shadow-[2px_2px_0_#2B2D42]"
                  : "bg-white text-[#2B2D42]/70"
              }`}
            >
              <Clock className="w-4 h-4 mx-auto mb-1 text-[#2B2D42]" />
              <div className="text-xs">タイマー</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTool("none")}
              className={`p-2.5 rounded-xl border-2 border-[#2B2D42] text-center transition-all cursor-pointer ${
                selectedTool === "none"
                  ? "bg-[#FFADAD] text-[#2B2D42] font-black shadow-[2px_2px_0_#2B2D42]"
                  : "bg-white text-[#2B2D42]/70"
              }`}
            >
              <HelpCircle className="w-4 h-4 mx-auto mb-1 text-[#2B2D42]" />
              <div className="text-xs">ツールなし</div>
            </button>
          </div>
        </div>

        {/* ツール別設定エリア：① お題ガチャを選んだとき */}
        {selectedTool === "prompt" && (
          <div className="p-3 bg-white border-2 border-[#2B2D42] rounded-2xl space-y-2 shadow-[2px_2px_0_#2B2D42]">
            <div className="text-xs font-black text-[#2B2D42] flex items-center justify-between">
              <span>お題リスト（1行に1つ入力）:</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FFE066] border border-[#2B2D42]">
                {
                  promptListText
                    .split("\n")
                    .filter((s) => s.trim().length > 0).length
                }
                個
              </span>
            </div>
            <textarea
              rows={4}
              value={promptListText}
              onChange={(e) => setPromptListText(e.target.value)}
              className="w-full bg-[#FAF6EB] border-2 border-[#2B2D42]/30 rounded-xl p-2.5 text-xs font-bold text-[#2B2D42] focus:outline-none focus:border-[#2B2D42]"
              placeholder="お題1&#10;お題2&#10;お題3..."
            />
          </div>
        )}

        {/* ツール別設定エリア：② BPMリズムを選んだとき */}
        {selectedTool === "bpm" && (
          <div className="p-3 bg-white border-2 border-[#2B2D42] rounded-2xl space-y-2 shadow-[2px_2px_0_#2B2D42]">
            <div className="text-xs font-black text-[#2B2D42]">
              デフォルトテンポ（BPM）:{" "}
              <span className="px-1.5 py-0.2 rounded bg-[#CBC8FA]">
                {defaultBpm}
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={180}
              step={5}
              value={defaultBpm}
              onChange={(e) => setDefaultBpm(Number(e.target.value))}
              className="w-full accent-[#2B2D42] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-bold text-[#2B2D42]/70">
              <span>ゆったり (60)</span>
              <span>普通 (120)</span>
              <span>超高速 (180)</span>
            </div>
          </div>
        )}

        {/* ツール別設定エリア：③ タイマーを選んだとき */}
        {selectedTool === "timer" && (
          <div className="p-3 bg-white border-2 border-[#2B2D42] rounded-2xl space-y-3 shadow-[2px_2px_0_#2B2D42]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#2B2D42]">
                タイマー秒数:
              </span>
              <div className="flex items-center gap-1.5">
                {[5, 10, 15, 30, 60].map((sec) => (
                  <button
                    type="button"
                    key={sec}
                    onClick={() => setTimerDuration(sec)}
                    className={`px-2.5 py-1 rounded-lg border border-[#2B2D42] text-xs font-black transition-all cursor-pointer ${
                      timerDuration === sec
                        ? "bg-[#7CE8DC] text-[#2B2D42]"
                        : "bg-[#FAF6EB] text-[#2B2D42]/70"
                    }`}
                  >
                    {sec}秒
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-[#2B2D42] cursor-pointer pt-2 border-t border-[#2B2D42]/20">
              <input
                type="checkbox"
                checked={isBlindTimer}
                onChange={(e) => setIsBlindTimer(e.target.checked)}
                className="accent-[#2B2D42] rounded"
              />
              <span>
                ブラインドタイマー（カウント開始後に秒数を非表示にする）
              </span>
            </label>
          </div>
        )}

        {/* 詳しいルール入力 */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-[#2B2D42] block">
            詳しいルール・遊び方（任意）
          </label>
          <textarea
            rows={2}
            value={ruleText}
            onChange={(e) => setRuleText(e.target.value)}
            className="w-full bg-white border-2 border-[#2B2D42] p-2.5 rounded-xl text-xs font-bold text-[#2B2D42] shadow-[2px_2px_0_#2B2D42] focus:outline-none"
            placeholder="例: 手拍子2回で答える。被り・詰まりは即アウト！"
          />
        </div>

        {/* 保存ボタン */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-4 px-6 bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] font-black text-base rounded-2xl shadow-[4px_5px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_2px_0_#2B2D42] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Save className="w-5 h-5" />
          <span>
            {gameToEdit ? "変更を保存する" : "オリジナルゲームを登録する！"}
          </span>
        </button>
      </div>
    </div>
  );
}
```