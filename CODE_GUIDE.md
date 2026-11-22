# 📓 マチジカン！ 現役コード完全解説ガイド（初心者向け・全コード収録）

このファイルは、現在「**マチジカン！**」で**実際に動いているすべてのコード**を1つにまとめ、プログラミングやReact・Next.jsが初めての方でも「どの行が何をしているのか」がひと目でわかるように丁寧な解説とコメントを付けた完全ガイドブックです。

---

## 🧭 0. はじめに：アプリ全体の流れと基礎知識

### 0-1. 画面が切り替わる流れと担当ファイル

```text
[アプリを開く]
   │
   ▼
① トップ画面 (src/app/page.tsx)
   ・「マチジカン！」の大学ノート表紙
   ・「ゲーム一覧」ボタンを押す
   │
   ▼
② ゲーム一覧モーダル (src/components/home/GameCatalogModal.tsx)
   ・厳選7タイトル（src/data/games.ts）が2列の白カードで並ぶ
   ・遊びたいゲームカードをタップする
   │
   ▼
③ ゲームプレイ画面 (src/app/games/[id]/play/page.tsx)
   └─ 中身は「4ステップ進行コンポーネント」(src/components/match/StepByStepGameFlow.tsx)
        ├─ 【ステップ1：スタンバイ】 ゲーム見出し＋参加メンバー名札（手書き8キャラ・★数表示）
        │     └─ 「人数・名前」を押すと (src/components/players/PlayerRegistrationModal.tsx) が開く
        ├─ 【ステップ2：設定】 誰から始めるか（またはプレイの順番）・お題モードを決める
        ├─ 【ステップ3：ルール】 始める人・順番とルール説明を確認して「スタート」
        └─ 【ステップ4：プレイ中】 勝った人・ミスした人をタップして勝敗判定！
               │
               ▼
④ 勝者発表モーダル (src/components/match/MatchWinnerModal.tsx)
   ・勝者に通算「★+1」を記録（src/context/GameSessionContext.tsx で保存）
   ・「もう1戦！」または「次の対戦ゲームを選ぶ」へ
```

---

### 0-2. コードを読むための「5つの基本キーワード」（超入門）

コードの中によく出てくる5つの言葉だけ先に知っておくと、すべてのコードがスラスラ読めます！

1. **`interface` / `type`（データの設計図）**
   - 「プレイヤーには `id`（番号）と `name`（名前）があるよ」「ゲームには `title`（題名）と `min_players`（最小人数）があるよ」といった**データの形（ルール）**を決める設計図です。
2. **`Props`（親から子へ渡すバトン）**
   - 画面の部品（コンポーネント）に「このゲームデータを表示してね」「ボタンが押されたらこの関数を動かしてね」と渡す設定データのことです。
3. **`useState`（画面の記憶メモ）**
   - `const [step, setStep] = useState("standby");` のように書きます。
   - `step` が「今の値」、`setStep("settings")` が「値を書き換える命令」です。値を書き換えると、Reactが自動的に画面を描き直してくれます。
4. **`useEffect`（タイミングを見張る自動実行スイッチ）**
   - 「画面が最初に開いたとき」や「タイマーがONになったとき」など、特定のタイミングで自動的に処理を実行する仕組みです。
5. **`localStorage`（スマホ・ブラウザ内のメモ帳）**
   - ページを再読み込みしても「プレイヤーの名前」や「通算の★の数」が消えないように、ブラウザの中にデータを保存する仕組みです。

---

## 📦 第1章：データの設計図（型定義ファイル）

### 1-1. `src/types/game.ts`
**【このファイルの役割】**
ゲーム1つ1つのデータ（タイトル・人数・ルール・お題など）や、プレイヤー1人1人のデータ（ID・名前・脱落しているか）の「設計図（型）」を定義しています。

```tsx
// src/types/game.ts
import { MatchEngineType } from "./session";

// ゲーム内で使える補助ツールの種類を表す型
export type ToolType =
  | "prompt"              // お題表示
  | "bpm"                 // リズム（メトロノーム）
  | "timer"               // タイマー
  | "score"               // スコア・勝敗記録
  | "elimination"         // 脱落サバイバル判定
  | "elimination_tracker";

// プレイヤー1人分のデータ設計図
export interface Player {
  id: string;     // プレイヤーを見分ける固有ID（例: "p-1", "p-2"）
  name: string;   // 画面に表示するプレイヤー名（例: "プレイヤー 1", "えび"）
  score: number;  // ゲーム中の得点
  isOut: boolean; // ミスして脱落したかどうか（true = 脱落、false = 生存中）
}

// クイズ形式のお題を使う場合の設計図
export interface RiddlePrompt {
  question: string;
  answer: string;
  hint?: string; // 「?」がついている項目は「省略してもOK」という意味です
}

// お題1つ分は「ただの文字列」または「クイズ形式」のどちらか
export type PromptItem = string | RiddlePrompt;

// ゲームの追加設定（メタデータ）の設計図
export interface GameMetadata {
  tools: ToolType[];                 // このゲームが使うツールのリスト
  matchEngineType?: MatchEngineType; // 進行タイプ
  defaultBpm?: number;               // リズムの初期速さ（BPM）
  timerDuration?: number;            // タイマーの初期秒数
  blindTimer?: boolean;              // 秒数を隠すかどうか
  promptList?: PromptItem[];         // アプリが用意するお題リスト（あぶりカルビ等で使用）
  ruleSummary?: string[];            // 箇条書きの短いルール説明
  callExample?: string;              // かけ声・コールの具体例
  tags?: string[];                   // 検索用タグ（例: ["2人専用", "じゃんけん"]）
}

// ゲーム1タイトル分の完全なデータ設計図
export interface Game {
  id: string;                  // URL等に使われる英語ID（例: "chin-chin-samurai"）
  title: string;               // ゲーム名（例: "ちんちん侍"）
  min_players: number;         // 最小プレイ人数（例: 2）
  max_players: number;         // 最大プレイ人数（例: 8、2人専用なら 2）
  description: string;         // ルール確認画面に出る詳しい説明文
  created_at: string;          // 作成日時
  metadata?: GameMetadata;     // 上で定義した追加設定
  short_description?: string;  // スタンバイ画面に出る1行説明文
  rules?: string[];            // 手順ごとのルール配列
  call_examples?: string[];    // プレイ画面に出るかけ声・アクション早見表
  master_tools?: (ToolType | string)[];
  isCustom?: boolean;          // 自作ゲームかどうかの目印
}
```

---

### 1-2. `src/types/session.ts`
**【このファイルの役割】**
複数ゲームを遊んだときに引き継がれる「通算の星（★）の数」などの成績データの設計図です。

```tsx
// src/types/session.ts

// 通算ランキング用のプレイヤー成績データ設計図
export interface PlayerStats {
  id: string;               // プレイヤーID（"p-1" 〜 "p-8"）
  name: string;             // プレイヤー名
  totalWins: number;        // 通算勝利数（★の数）
  matchCount: number;       // 遊んだ試合数
  consecutiveWins?: number; // 連勝数
  underdogWins?: number;    // 初勝利カウント
}

// ブラウザ（localStorage）に丸ごと保存するセッションデータの設計図
export interface SessionData {
  sessionId: string;        // セッション名
  players: PlayerStats[];   // 全プレイヤーの成績リスト
  lastUpdated: string;      // 最終更新日時
}

// ゲームの進行タイプを表す型
export type MatchEngineType =
  | "quick_elimination"
  | "survival_elimination"
  | "tool_assisted"
  | "precision_time_attack"
  | "tournament_duel"
  | "turn_relay_blitz"
  | "consensus_coop";
```

---

## 🎮 第2章：厳選7タイトルのゲームデータ (`src/data/games.ts`)

**【このファイルの役割】**
アプリに収録されている7つのゲーム（①ちんちん侍、②めちゃギントン、③数取団、④○○から始まるリズムに合わせて、⑤カレーライス、⑥CCレモン、⑦あぶりカルビ）のタイトル・人数・ルール説明・かけ声早見表・お題リストをすべて格納しているデータベースファイルです。

```tsx
// src/data/games.ts
import { Game } from "@/types/game";

// 厳選7タイトルの対戦型ゲームデータ配列
// export を付けることで、他のファイルから import して使えるようになります
export const ALL_GAMES: Game[] = [
  // ① ちんちん侍（2〜8人・お題なし・誰から始めるか選択）
  {
    id: "chin-chin-samurai",
    title: "ちんちん侍",
    min_players: 2,
    max_players: 8,
    description:
      "4つのワード（ちんちん／おちんちん／侍／ちんちん侍）とともに次の人を指差し、言われたワードに応じたポーズ＆リアクションを瞬時に決めるゲーム！\n・【ちんちん】ポーズなし（そのままリズムよく次のワードを言って別の人を指差す）\n・【おちんちん】両手で伸ばすジェスチャーをしながら「びろ〜ん！」と発声し、次の人を指差す\n・【侍（サムライ）】腰から刀を抜いて宙を切る抜刀ポーズで「シャキーン！」と叫び、次の人を指差す\n・【ちんちん侍】参加者全員で一斉に刀を構える侍ポーズを決め、声を揃えて「ちんちん侍！」と叫ぶ\n一番出遅れた人や、ポーズ・発声を間違えた人がアウト（負け）となります！",
    short_description:
      "4つのワードに合わせて瞬時に抜刀・びろ〜ん・全員ポーズを決める指差しアクションゲーム！",
    created_at: new Date().toISOString(),
    matchEngineType: "quick_elimination",
    master_tools: ["elimination_tracker"],
    rules: [
      "【「ちんちん」】特定のポーズはありません（繋ぎのパス）。指名された人はリズムを崩さず、すぐに次のワード（ちんちん／おちんちん／侍／ちんちん侍）を言って別の人を指差します。",
      "【「おちんちん」】両手で何かを横や上下に伸ばすようなジェスチャー（または両手を広げて伸び上がる動き）をしながら「びろ〜ん！」と発声し、続けて次の人を指差します。",
      "【「侍（サムライ）」】腰から刀を抜いて片手で宙をスパッと切る（抜刀・居合斬り）ポーズで「シャキーン！」と叫び、続けて次の人を指差します。",
      "【「ちんちん侍」】コールされた人だけでなく参加者全員で、刀を構える侍のポーズ（または両手を構えるポーズ）を一斉に決め、全員で声を揃えて「ちんちん侍！」と叫びます。",
      "【勝敗（アウト基準）】一番出遅れた人や、ポーズ・発声を間違えた人、リズムを乱した人がアウト（負け）となります。",
    ],
    call_examples: [
      "【ちんちん】➔ ポーズなし（すぐ次の人を指差してコール）",
      "【おちんちん】➔ 両手を伸ばすジェスチャーで「びろ〜ん！」",
      "【侍（サムライ）】➔ 抜刀・居合斬りポーズで「シャキーン！」",
      "【ちんちん侍】➔ 全員一斉に侍ポーズで「ちんちん侍！」（出遅れ・間違いがアウト）",
    ],
    metadata: {
      matchEngineType: "quick_elimination",
      tools: ["elimination"],
      callExample:
        "【ちんちん】➔ ポーズなし（すぐ次の人へパス）\n【おちんちん】➔ 両手を伸ばして「びろ〜ん！」\n【侍（サムライ）】➔ 抜刀ポーズで「シャキーン！」\n【ちんちん侍】➔ 全員一斉に侍ポーズで「ちんちん侍！」",
      ruleSummary: [
        "【ちんちん】ポーズなし。すぐに次のワードを言って別の人を指差す",
        "【おちんちん】両手で伸ばすジェスチャーをしながら「びろ〜ん！」",
        "【侍】腰から刀を抜いて宙を切る抜刀ポーズで「シャキーン！」",
        "【ちんちん侍】参加者全員で侍ポーズを一斉に決め「ちんちん侍！」と叫ぶ（出遅れ・ミスがアウト！）",
      ],
      tags: ["アクション", "反射神経", "抜刀ポーズ", "指差し"],
    },
  },

  // ② めちゃギントン（2〜8人・3連打×2回の擬音回答）
  {
    id: "mecha-ginton",
    title: "めちゃギントン",
    min_players: 2,
    max_players: 8,
    description:
      "リズムに乗ってお題に合った擬音を答えていくゲーム！\n①全員でリズムに合わせて「め〜ちゃギントン♪」と歌い、出題者が「お題（名詞や動作など）」をコールします。\n②次の回答者は、そのお題に最も適した「擬音・効果音・鳴き声」をリズムに合わせて【3連打×2回（合計6回）】答えます（例：包丁→「トントントン トントントン」）。\n③正しく答えられたら再び「め〜ちゃギントン♪」とともに次のお題を出題し、順番に回していきます。\nお題に合わない擬音・謎の造語・言葉詰まり・リズム遅れはアウト（負け）！",
    short_description:
      "「め〜ちゃギントン♪」のリズムでお題に合った擬音を3連打×2回で答えるゲーム！",
    created_at: new Date().toISOString(),
    matchEngineType: "quick_elimination",
    rules: [
      "【全員でコール】全員でリズムに合わせて「め〜ちゃギントン♪」と歌います。",
      "【お題の出題】出題者がリズムに合わせて「お題（名詞や動作など）」をコールします。",
      "【擬音で回答（3連打×2回）】次の回答者は、お題に最も適した「擬音・効果音・鳴き声」をリズムに合わせて3連打×2回（合計6回）答えます（例：包丁→「トントントン トントントン」、ねこ→「ニャーニャーニャー ニャーニャーニャー」、とり→「バサバサバサ バサバサバサ」）。",
      "【次の人へ継続】正しく答えられたら、再び「め〜ちゃギントン♪」の掛け声とともに次のお題を出題し、順番に回していきます。",
      "【アウトの基準】①お題に合わない不適切な擬音（魚で「シャカシャカシャカ」等）、②言葉に詰まる・リズムに乗れなかった場合、③擬音ではなく謎の造語や適当な言葉（テーブルで「テーブルブル」等）を言った場合はミス（アウト）となります。",
    ],
    call_examples: [
      "全員「め〜ちゃギントン♪」➔ 出題「包丁！」➔ 回答「トントントン トントントン！」",
      "お題「ねこ」➔「ニャーニャーニャー ニャーニャーニャー！」",
      "お題「とり」➔「バサバサバサ バサバサバサ！」（3連打×2回）",
    ],
    metadata: {
      matchEngineType: "quick_elimination",
      tools: ["score"],
      callExample:
        "全員「め〜ちゃギントン♪」\nお題「包丁」→「トントントン トントントン」\nお題「ねこ」→「ニャーニャーニャー ニャーニャーニャー」\nお題「とり」→「バサバサバサ バサバサバサ」（3連打×2回！）",
      ruleSummary: [
        "全員で「め〜ちゃギントン♪」と歌い、出題者が「お題」をコール",
        "次の人はお題に合った擬音・鳴き声を【3連打×2回（計6回）】リズムに合わせて答える",
        "正しく答えられたら再び「め〜ちゃギントン♪」で次のお題を出して順番に回す",
        "不適切な擬音・謎の造語・言葉詰まり・リズム遅れはアウト！",
      ],
      tags: ["リズム", "擬音", "3連打×2回", "瞬発力"],
    },
  },

  // ③ 数取団（2〜8人・1から順に数字を増やして単位回答）
  {
    id: "kazutoridan",
    title: "数取団",
    min_players: 2,
    max_players: 8,
    description:
      "前の人が出したお題（名詞）に対して、次の人が「1から1つずつ増える数字＋正しい単位（助数詞）」をリズムに合わせて答え、さらに次のお題を出して回していくゲーム！\n①「せーの、ブンブンブブブン！」でスタートし、最初の人がお題（例：「車」）を言います。\n②全員で「ブンブン！」と合いの手を入れた後、次の人が「1台！」と答え、再び「ブンブン！」の後に次のお題（例：「犬」）を出します。\n③さらに次の人が「2匹！」➔「ブンブン！」➔次のお題…と1ずつ増やしながらラリーを続けます（同じお題を繰り返してもOK）。\n数字や単位の間違い、リズム遅れ、噛み、「美しい固有の単位（タンス＝棹、イカ＝杯など）」を言えなかった場合はアウト！",
    short_description:
      "「ブンブン！」のリズムで1から順に数を増やしながら正しい単位（助数詞）を答えるゲーム！",
    created_at: new Date().toISOString(),
    matchEngineType: "quick_elimination",
    rules: [
      "【①スタートコール】最初の人が「せーの」と合図し、全員で「ブンブンブブブン！」とコールして始まります（直後にフライングで「ブンブン！」と言う『ぶんぶんオーバー』に注意）。",
      "【②お題の提示＆合いの手】最初の人がお題（例：「車」）を言い、全員で「ブンブン！」と声を揃えて合間を取ります。",
      "【③解答＋次のお題出し】次の人が「数字＋単位」（例：「1台」）を答え、全員で「ブンブン！」と合間を取った後、同じ人が次のお題（例：「犬」）を出します。",
      "【④ループ】次の人が「2匹」➔「ブンブン！」➔次のお題…と、数字を1から1つずつ増やしながら順番にラリーを続けます（前に出たお題を繰り返してもOK）。",
      "【アウトの基準】①数字や単位の間違い（車に「1個」等）、②リズム遅れ・沈黙・噛み、③より適した美しい単位の不採用（タンス＝「○棹」、イカ＝「○杯」、ワイン＝「○年物」等）で即アウト（負け）！",
    ],
    call_examples: [
      "全員「せーの、ブンブンブブブン！」➔ 1人目「車！」➔ 全員「ブンブン！」",
      "2人目「1台！」➔ 全員「ブンブン！」➔ 2人目「犬！」➔ 全員「ブンブン！」",
      "3人目「2匹！」➔ 全員「ブンブン！」➔ 3人目「イカ！」（次は「3杯！」）",
    ],
    metadata: {
      matchEngineType: "quick_elimination",
      tools: ["score"],
      callExample:
        "全員「せーの、ブンブンブブブン！」\n1人目「車！」➔ 全員「ブンブン！」\n2人目「1台！」➔ 全員「ブンブン！」➔ 2人目「犬！」\n3人目「2匹！」➔ 全員「ブンブン！」➔ 3人目「イカ！」",
      ruleSummary: [
        "①「せーの、ブンブンブブブン！」で開始し、最初の人がお題（例：車）を言う",
        "②全員で「ブンブン！」と合いの手を入れたら、次の人が「1台！」と答える",
        "③再び全員で「ブンブン！」の後、答えた人が次のお題（例：犬）を出す",
        "④数字を1・2・3…と1つずつ増やしてラリー継続！単位ミス・リズム遅れ・噛みはアウト！",
      ],
      tags: ["リズム", "単位・助数詞", "ブンブン", "頭脳"],
    },
  },

  // ④ ○○から始まるリズムに合わせて（2〜8人・2文字ネーム＋1〜4/ちぇけ）
  {
    id: "rhythm-shiritori",
    title: "○○から始まるリズムに合わせて",
    min_players: 2,
    max_players: 8,
    description:
      "机を叩いて手拍子をする4拍子のリズムに乗って進行する指名リズムゲーム！\n通常の名前から2文字取った呼び名（例：「えび」「まる」「ガリ」）を使い、「〇〇から始まるリズムに合わせて！」の掛け声でスタート！\n相手の名前と1〜4の数字（または「ちぇけ」）を指定してパスを回し、リズムや回数・ワードを間違えてミスした人が負けとなります。",
    short_description:
      "2文字の呼び名と1〜4の数字・『ちぇけ』でパスを回す4拍子リズムゲーム！",
    created_at: new Date().toISOString(),
    matchEngineType: "quick_elimination",
    rules: [
      "【準備】通常の名前から2文字取り、「えび」「まる」「ガリ」といった2文字のプレイヤー名を決めます。",
      "【開始】机を叩いて手拍子をする4拍子のリズムに乗り、「〇〇（最初の人の名前）から始まるリズムに合わせて！」の掛け声でスタートします。",
      "【コール＆レスポンス】相手の名前と1〜4の数字を指定してパスします（例：「ガリ 3」「まる 1」）。指名された人は指定回数分だけ自分の名前を4拍子に合わせてコールし、最後に次の相手の名前と数字を言ってパスを返します。",
      "【追加ルール：ちぇけ】「ちぇけ」と指定された際は、通常の名前コールの代わりに『よう・チェケ・ラッ・チョ』と言ってから次の人へパスします。",
      "【勝敗条件】リズムを崩したり、言う回数やワードを間違えたりしてミスしたプレイヤーが負け（脱落）となります。",
    ],
    call_examples: [
      "全員「『えび』から始まるリズムに合わせて！」（4拍子スタート）",
      "えび「ガリ 3！」➔ ガリ「ガリ・ガリ・ガリ！（＋次の指名：まる 1！）」",
      "まる「まる！（＋次の指名：えび ちぇけ！）」",
      "えび「よう・チェケ・ラッ・チョ！（＋次の人を指名！）」",
    ],
    metadata: {
      matchEngineType: "quick_elimination",
      tools: ["bpm", "score"],
      defaultBpm: 110,
      callExample:
        "全員「『えび』から始まるリズムに合わせて！」\nえび「ガリ 3！」\nガリ「ガリ・ガリ・ガリ！ まる 1！」\nまる「まる！ えび ちぇけ！」\nえび「よう・チェケ・ラッ・チョ！」",
      ruleSummary: [
        "通常の名前から2文字取った呼び名（例：えび、まる、ガリ）を使います",
        "机を叩いて手拍子をする4拍子のリズムに乗り、「〇〇から始まるリズムに合わせて！」でスタート",
        "相手の名前と「1〜4の数字」を指定してパス（例：「ガリ 3」「まる 1」）",
        "指名された人は指定回数だけ自分の名前をコールし、最後に次の相手の名前と数字を言ってパス",
        "【追加ルール】「ちぇけ」と指定されたら名前コールの代わりに「よう・チェケ・ラッ・チョ」と言う",
        "リズムを崩したり、回数やワードを間違えてミスしたプレイヤーが負け！",
      ],
      tags: ["4拍子リズム", "2文字ネーム", "ちぇけ", "コール＆レスポンス"],
    },
  },

  // ⑤ カレーライス（2人専用・グーカラ/チョーカラ/パーカラ ➔ 水！）
  {
    id: "curry-rice",
    title: "カレーライス",
    min_players: 2,
    max_players: 2,
    description:
      "2人専用の進化系リズムじゃんけん！\n呼び方はグーが「グーカラ」、チョキが「チョーカラ」、パーが「パーカラ」。\n①2人が向き合い「カレーライス」の掛け声（1・2・3のリズム）でじゃんけんをします。\n②勝った方が次の掛け声を担当し、勝った手を2回＋次の新しい手を1回コールして出します（例：チョキで勝ったら「チョーカラ、チョーカラ、グーカラ！」）。\n③じゃんけんを繰り返し、あいこになった瞬間にお互いが「水！」と叫び、早かった方の勝ち！",
    short_description:
      "「グーカラ・チョーカラ・パーカラ」でじゃんけんし、あいこで先に「水！」と言った方が勝ちの2人専用ゲーム！",
    created_at: new Date().toISOString(),
    matchEngineType: "tournament_duel",
    rules: [
      "【手の呼び方】じゃんけんと同じ3つの手を使います。グー＝「グーカラ」、チョキ＝「チョーカラ」、パー＝「パーカラ」。",
      "【①開始】2人が向き合い、グーで1・2・3のリズムをとりながら「カレーライス」の掛け声の「ス」でじゃんけんをします。",
      "【②勝った人の掛け声】勝った方が次の掛け声をします。1・2・3のリズムで「勝った手を2回＋次の新しい手を1回」出します（例：グーで勝ったら「グーカラ、グーカラ、次の手！」、同じ手を続けるなら「グーカラ、グーカラ、グーカラ！」）。",
      "【③あいこで「水！」】じゃんけんを繰り返し、あいこになった瞬間にお互いが「水！」と叫びます（例：「チョーカラ、チョーカラ、グーカラ（グーであいこ）➔ 水！」）。",
      "【④勝敗】「水！」を言うタイミングが早かった方の勝ちになります。",
    ],
    call_examples: [
      "グー＝「グーカラ」／ チョキ＝「チョーカラ」／ パー＝「パーカラ」",
      "勝った人「チョーカラ、チョーカラ、グーカラ！」",
      "あいこになった瞬間 ➔ 先に「水！」と言った方の勝ち！",
    ],
    metadata: {
      matchEngineType: "tournament_duel",
      tools: ["score"],
      callExample:
        "グー＝「グーカラ」／ チョキ＝「チョーカラ」／ パー＝「パーカラ」\n勝った人「チョーカラ、チョーカラ、グーカラ！」\n（グーであいこ！）➔ 先に「水！」と叫んだ方の勝ち！",
      ruleSummary: [
        "2人専用！グー＝「グーカラ」、チョキ＝「チョーカラ」、パー＝「パーカラ」",
        "①「カレーライス」の掛け声（1・2・3のリズム）の「ス」でじゃんけん",
        "②勝った方が「勝った手を2回＋次の新しい手を1回」コールしてじゃんけん（例：グーカラ、グーカラ、パーカラ！）",
        "③あいこになった瞬間にお互いが「水！」と叫び、早かった方の勝ち！",
      ],
      tags: ["2人専用", "じゃんけん", "瞬発力", "水！"],
    },
  },

  // ⑥ CCレモン（2人専用・溜め/攻撃/防御の同時出しバトル）
  {
    id: "cc-lemon",
    title: "CCレモン",
    min_players: 2,
    max_players: 2,
    description:
      "2人専用の心理戦コマンドバトル！\n「シー・シー（または手拍子パン・パン）」の2拍に続き、3拍目の「レモン！」で双方が同時にポーズを出し合います。\n【溜め（レモン）】胸の前で両手を重ねてパワー+1（この瞬間に攻撃されると敗北）\n【攻撃（ビーム）】パワーを1消費して両手を前へ突き出す（相手が「溜め」なら勝利！）\n【防御（バリア）】両腕を胸の前でX字クロス（コスト0で攻撃を防ぐ ※連続使用は2〜3回まで）\n【勝敗判定】攻撃 vs 溜め＝攻撃側の勝ち ／ 攻撃 vs 防御・攻撃 vs 攻撃・溜め同士・防御同士＝あいこ（勝負続行）！",
    short_description:
      "「シー・シー・レモン！」の3拍目で溜め・攻撃・防御を同時に出し合う2人専用コマンド心理戦！",
    created_at: new Date().toISOString(),
    matchEngineType: "tournament_duel",
    rules: [
      "【基本進行（2人専用）】「シー・シー（または手拍子パン・パン）」の2拍でリズムをとり、3拍目の「レモン！」の瞬間に双方が同時にアクション（ポーズ）を出します。",
      "【溜め（チャージ / レモン）】両手でボールを包むように胸の前で重ねる。パワーが1つストックされる（0〜5個まで蓄積可能）が、無防備なため攻撃を受けると敗北。",
      "【攻撃（ビーム / かめはめ波）】パワーを1消費して両手を前方に突き出す（パワー0の時は出せない）。相手が「溜め」を出していれば勝利！",
      "【防御（バリア / ガード）】両腕を胸の前で「X」の字にクロスする（コスト0）。相手の攻撃を防ぐ（※2〜3回連続使用は禁止）。",
      "【勝敗判定】攻撃 vs 溜め＝攻撃側の勝ち（溜め側が敗北） ／ 攻撃 vs 防御＝防御成功で続行 ／ 攻撃 vs 攻撃＝相殺（両者パワー1消費して続行） ／ 溜め同士・防御同士＝続行。",
    ],
    call_examples: [
      "掛け声「シー・シー・レモン！」（3拍目で同時にポーズ！）",
      "【溜め】パワー+1（無防備） ／ 【攻撃】パワー1消費 ／ 【防御】コスト0",
      "「攻撃 vs 溜め」になった瞬間に攻撃側の勝ち！",
    ],
    metadata: {
      matchEngineType: "tournament_duel",
      tools: ["score"],
      callExample:
        "掛け声「シー・シー・レモン！」（3拍目で同時ポーズ）\n・溜め（レモン）：パワー+1（攻撃されると負け）\n・攻撃（ビーム）：パワー1消費（溜めを倒す！）\n・防御（バリア）：コスト0（攻撃を防ぐ・連続禁止）",
      ruleSummary: [
        "2人専用！「シー・シー・レモン！」の3拍目で同時にポーズを出す",
        "【溜め】胸の前で手を重ねてパワー+1（攻撃されると負け）",
        "【攻撃】パワー1消費で前方に突き出す（相手が溜めなら勝ち！）",
        "【防御】腕をX字クロス（コスト0で攻撃を防ぐ・連続使用禁止）",
        "攻撃 vs 溜めで決着！攻撃同士は相殺（両者-1）して続行",
      ],
      tags: ["2人専用", "心理戦", "コマンドバトル", "手拍子"],
    },
  },

  // ⑦ あぶりカルビ（2〜8人・お題あり・プレイの順番で1回ずつ増やす）
  {
    id: "aburi-karubi",
    title: "あぶりカルビ",
    min_players: 2,
    max_players: 8,
    description:
      "「炙りカルビ」のような噛みやすそうな言葉をお題にして、1回・2回・3回…と回数を1回ずつ増やしながら順番に言っていく滑舌ゲーム！\n噛んでしまったり、つっかえて正しく言えなくなった時点で失敗（負け）となります。",
    short_description:
      "噛みやすい言葉を1回・2回・3回…と増やして交互に言う滑舌ゲーム！",
    created_at: new Date().toISOString(),
    matchEngineType: "quick_elimination",
    rules: [
      "【お題の決定】「炙りカルビ」「静岡塩漬け」「暖かく」「肩たたき」「僕ボブ」など、噛みやすそうな言葉をお題として決めます。",
      "【1人目（1回）】最初の人からお題を1回言います（例：「炙りカルビ」）。",
      "【2人目以降（＋1回ずつ増加）】前の人が言えたら回数を1回増やし、2回（例：「炙りカルビ、炙りカルビ」）、次は3回…と交互に繰り返します。",
      "【勝敗（アウトの基準）】噛んでしまったり、つっかえて正しく言えなくなったりした時点で失敗（負け）となります。",
    ],
    call_examples: [
      "1巡目「炙りカルビ」",
      "2巡目「炙りカルビ、炙りカルビ」",
      "3巡目「炙りカルビ、炙りカルビ、炙りカルビ」",
      "4巡目「炙りカルビ、あぶりばる…（噛んだら負け！）」",
    ],
    metadata: {
      matchEngineType: "quick_elimination",
      tools: ["prompt", "score"],
      callExample:
        "1巡目「炙りカルビ」\n2巡目「炙りカルビ、炙りカルビ」\n3巡目「炙りカルビ、炙りカルビ、炙りカルビ」\n（噛んだりつっかえたら即アウト！）",
      ruleSummary: [
        "「炙りカルビ」「静岡塩漬け」「暖かく」「肩たたき」「僕ボブ」など噛みやすい言葉をお題にします",
        "1巡目は1回、2巡目は2回、3巡目は3回…と1回ずつ回数を増やして順番に言います",
        "噛んでしまったり、つっかえて正しく言えなくなった時点で失敗（負け）！",
      ],
      tags: ["早口言葉", "滑舌", "大爆笑", "お題ガチャ"],
      promptList: [
        "炙りカルビ",
        "静岡塩漬け",
        "暖かく",
        "肩たたき",
        "僕ボブ",
        "きゃりーぱみゅぱみゅ",
        "マサチューセッツ州",
        "老若男女",
        "専売特許",
        "手術室",
        "除雪車",
        "魔術師",
        "骨粗鬆症",
        "貨客船",
        "旅客機",
        "生麦生米生卵",
        "赤パジャマ青パジャマ黄パジャマ",
        "赤巻紙青巻紙黄巻紙",
        "東京特許許可局",
        "新春シャンソンショー",
        "バスガス爆発",
        "親亀子亀孫亀",
        "右耳右目右目右耳",
        "高架橋脚",
      ],
    },
  },
];
```

---

## 🛠️ 第3章：裏方の便利ツール群 (`src/lib/`)

### 3-1. `src/lib/supabase.ts`（ゲームデータの取得窓口）
**【このファイルの役割】**
「ゲーム一覧」や「指定IDのゲーム」を取り出すための窓口です。外部データベース（Supabase）が設定されていない環境でも、常に第2章の `ALL_GAMES`（厳選7タイトル）を確実に返すように作られています。

```tsx
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { Game } from "@/types/game";
import { ALL_GAMES } from "@/data/games";
import { getCustomGames } from "@/lib/customGames";

// 環境変数からSupabaseの接続先URLとキーを読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Supabaseが正しく設定されているかをチェックする関数
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes("placeholder-project") &&
    !supabaseAnonKey.includes("placeholder-anon-key")
  );
};

// Supabaseクライアントの作成（未設定時はダミーURLを入れてエラーを防ぐ）
export const supabase = createClient(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

export const FALLBACK_GAMES: Game[] = ALL_GAMES;

/**
 * ゲームID（例: "chin-chin-samurai"）から1つのゲームデータを取得する関数
 */
export async function getGameById(id: string): Promise<Game | null> {
  // まず手元の ALL_GAMES から探す
  const localGame =
    ALL_GAMES.find((g) => g.id === id) ||
    getCustomGames().find((g) => g.id === id);

  // Supabase未設定なら手元のデータをそのまま返す
  if (!isSupabaseConfigured()) {
    return localGame || null;
  }

  try {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return localGame || null;
    }

    // 手元の最新ルール定義（localGame）を最優先して合体させる
    if (localGame) {
      return {
        ...(data as Game),
        ...localGame,
      };
    }
    return data as Game;
  } catch (err) {
    console.warn("Error fetching game from Supabase, using local fallback:", err);
    return localGame || null;
  }
}

/**
 * 全ゲーム一覧（厳選7タイトル）を取得する関数
 */
export async function getAllGames(): Promise<Game[]> {
  if (!isSupabaseConfigured()) {
    return ALL_GAMES;
  }

  try {
    const { data, error } = await supabase.from("games").select("*");
    if (error || !data || data.length === 0) {
      return ALL_GAMES;
    }

    // ALL_GAMES に含まれる7タイトルだけを最新定義優先で返す
    return ALL_GAMES.map((local) => {
      const dbItem = data.find((item) => item.id === local.id);
      return dbItem ? ({ ...dbItem, ...local } as Game) : local;
    });
  } catch (err) {
    console.warn("Error fetching games from Supabase, using local data:", err);
    return ALL_GAMES;
  }
}
```

---

### 3-2. `src/lib/playerStorage.ts`（参加メンバーの名前・人数保存）
**【このファイルの役割】**
参加メンバーの名前や人数をブラウザの `localStorage` に保存・読み込みするファイルです。プレイヤーのIDを必ず `p-1` 〜 `p-8` に統一することで、4人〜8人に増やしたときも通算★数がズレずに記録されます。

```tsx
// src/lib/playerStorage.ts
import { Player } from "@/types/game";

// ブラウザのlocalStorageに保存するときのキー名（引き出しの名前）
export const PLAYER_STORAGE_KEY = "waiting_game_players";

// 「おまかせ名前」ボタンを押したときに使うニックネーム候補
export const PRESET_NICKNAMES = [
  "たろう",
  "はなこ",
  "そうた",
  "ゆい",
  "れん",
  "あおい",
  "ひなた",
  "りく",
  "さくら",
  "こうき",
];

// 指定された人数の初期プレイヤー配列（プレイヤー 1, プレイヤー 2...）を作る関数
export function generateDefaultPlayers(count: number = 3): Player[] {
  // 人数が2〜8人の範囲に収まるように調整
  const safeCount = Math.max(2, Math.min(8, count));
  return Array.from({ length: safeCount }, (_, i) => ({
    id: `p-${i + 1}`,          // 必ず p-1, p-2, ... p-8 というIDにする
    name: `プレイヤー ${i + 1}`,
    score: 0,
    isOut: false,
  }));
}

// localStorageから保存済みのプレイヤー一覧を読み込む関数
export function loadStoredPlayers(fallbackCount: number = 3): Player[] {
  // サーバー側で動いているときはlocalStorageがないので初期値を返す
  if (typeof window === "undefined") {
    return generateDefaultPlayers(fallbackCount);
  }

  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return generateDefaultPlayers(fallbackCount);

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 2) {
      return generateDefaultPlayers(fallbackCount);
    }

    // 読み込んだデータのIDを p-1, p-2... に整えて返す
    return parsed.map((p, idx) => ({
      id: `p-${idx + 1}`,
      name:
        typeof p.name === "string" && p.name.trim() !== ""
          ? p.name.trim()
          : `プレイヤー ${idx + 1}`,
      score: typeof p.score === "number" ? p.score : 0,
      isOut: Boolean(p.isOut),
    }));
  } catch (e) {
    console.error("Failed to load players from localStorage:", e);
    return generateDefaultPlayers(fallbackCount);
  }
}

// プレイヤー一覧をlocalStorageに保存する関数
export function saveStoredPlayers(players: Player[]): void {
  if (typeof window === "undefined") return;
  try {
    const normalized = players.map((p, idx) => ({
      ...p,
      id: `p-${idx + 1}`,
    }));
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(normalized));
  } catch (e) {
    console.error("Failed to save players to localStorage:", e);
  }
}

// ゲームの最小・最大人数（例：2人専用なら2人）に合わせてプレイヤー配列の人数を調整する関数
export function syncPlayersWithCount(
  existing: Player[],
  targetCount: number,
  minCount: number = 2,
  maxCount: number = 8,
  resetGameStatus: boolean = false
): Player[] {
  const safeCount = Math.max(minCount, Math.min(maxCount, targetCount));

  if (!existing || existing.length === 0) {
    return generateDefaultPlayers(safeCount);
  }

  let result: Player[] = [];

  if (existing.length >= safeCount) {
    // 今の人数が多い場合は、先頭から必要な人数分だけ切り取る
    result = existing.slice(0, safeCount).map((p, idx) => ({
      ...p,
      id: `p-${idx + 1}`,
    }));
  } else {
    // 今の人数が足りない場合は、後ろに新しいプレイヤーを追加する
    result = existing.map((p, idx) => ({
      ...p,
      id: `p-${idx + 1}`,
    }));
    for (let i = existing.length; i < safeCount; i++) {
      result.push({
        id: `p-${i + 1}`,
        name: `プレイヤー ${i + 1}`,
        score: 0,
        isOut: false,
      });
    }
  }

  if (resetGameStatus) {
    return result.map((p) => ({
      ...p,
      score: 0,
      isOut: false,
    }));
  }

  return result;
}
```

---

### 3-3. `src/lib/sound.ts`（効果音・メトロノーム音の生成）
**【このファイルの役割】**
音声ファイル（mp3など）を使わずに、ブラウザ標準の `Web Audio API`（シンセサイザー機能）を使って、「ピッ」「シャッフル音」「勝利ファンファーレ」をプログラムだけで鳴らす仕組みです。右上のスピーカーボタンでミュート（消音）も切り替えられます。

```tsx
// src/lib/sound.ts
class SoundController {
  private ctx: AudioContext | null = null;
  private muted: boolean = false; // trueなら消音モード

  // 現在ミュートかどうかを返す
  isMuted(): boolean {
    return this.muted;
  }

  // ミュートON/OFFを切り替える
  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  // ブラウザの音源エンジン（AudioContext）を準備する内部関数
  private getContext(): AudioContext | null {
    if (this.muted) return null; // ミュート中なら音を鳴らさない
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // メトロノームのクリック音（1拍目は高い音1200Hz、2〜4拍目は800Hz）
  playClick(isHigh: boolean = false) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = isHigh ? 1200 : 800;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.type = "sine";

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // ブラウザ制限時は無視
    }
  }

  // ボタンを押したときやカウントダウンの軽い「ピッ」音
  playTick() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.type = "sine";

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  // 時間切れの「ピピピピ！」アラーム音
  playTimeUp() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [0, 0.12, 0.24, 0.36].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(900, now + delay);
        osc.type = "square";
        gain.gain.setValueAtTime(0.25, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      });
    } catch {}
  }

  // お題変更やランダム順番シャッフルの「キュイーン」音
  playGacha() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  // 勝者が決まったときの「ド・ミ・ソ・ド♪」ファンファーレ音
  playWin() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // ド・ミ・ソ・高いドの周波数
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.1;
        const dur = idx === notes.length - 1 ? 0.4 : 0.12;

        osc.frequency.setValueAtTime(freq, startTime);
        osc.type = "sine";

        gain.gain.setValueAtTime(0.35, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    } catch {}
  }

  // 全員復活・リベンジ時のキラキラ上昇音
  playRevive() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } catch {}
  }
}

// アプリ全体で1つの sound インスタンスを共有する
export const sound = new SoundController();
```

---

## ⭐ 第4章：通算★（星）成績の管理システム (`src/context/GameSessionContext.tsx`)

**【このファイルの役割】**
アプリ全体で「誰が通算何勝（★いくつ）しているか」を記憶・更新・リセットする司令塔（React Context）です。
`syncSessionPlayers` によって、参加メンバーが4人〜8人に増えたときも全員分の通算★数がズレずに記録されます。

```tsx
// src/context/GameSessionContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { PlayerStats, SessionData } from "@/types/session";

const SESSION_STORAGE_KEY = "machajikan_session_v2";
const LEGACY_STORAGE_KEY = "waiting_game_players";

interface WinResult {
  winnerId: string;
  isUnderdog: boolean;
  bonusStars: number;
  streak: number;
}

// 他の画面から呼び出せる機能の一覧
interface GameSessionContextType {
  players: PlayerStats[];                                             // 全員の★成績リスト
  recordWin: (winnerId: string, winnerName?: string) => WinResult;    // 勝者に★+1する関数
  recordTeamWin: () => void;                                          // 全員に★+1する関数
  updatePlayerNames: (updated: { id: string; name: string }[]) => void; // 名前を更新する関数
  syncSessionPlayers: (roster: { id: string; name: string }[]) => void; // 人数・名前を同期する関数
  setPlayerCount: (count: number) => void;                            // 人数を変更する関数
  resetSessionWins: () => void;                                       // 全員の★を0にリセットする関数
  isInitialized: boolean;
}

const GameSessionContext = createContext<GameSessionContextType | undefined>(
  undefined
);

// 初期状態のプレイヤー成績リストを作る関数
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

export function GameSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [players, setPlayers] = useState<PlayerStats[]>(() =>
    createDefaultPlayers(3)
  );
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // ① アプリ起動時に localStorage から保存済みの★成績を読み込む
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SessionData;
        if (
          parsed.players &&
          Array.isArray(parsed.players) &&
          parsed.players.length >= 2
        ) {
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

  // ② players（★成績）が変化するたびに localStorage に自動保存する
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

  // ③ 勝者に「★+1」を加算する関数（プレイヤー1〜8まで確実に記録）
  const recordWin = useCallback(
    (winnerId: string, winnerName?: string): WinResult => {
      const result: WinResult = {
        winnerId,
        isUnderdog: false,
        bonusStars: 1,
        streak: 1,
      };

      setPlayers((prev) => {
        // 万が一リストにまだいないプレイヤーだった場合は追加する
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
            (p.id === winnerId ||
              (Boolean(winnerName) && p.name === winnerName));
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
    },
    []
  );

  // ④ ゲーム画面の参加メンバー（2〜8人）と★成績リストを同期する関数
  const syncSessionPlayers = useCallback(
    (roster: { id: string; name: string }[]) => {
      if (!roster || roster.length < 2) return;
      setPlayers((prev) => {
        return roster.map((r, idx) => {
          const normalizedId = `p-${idx + 1}`;
          const existing =
            prev.find((p) => p.id === r.id) ||
            prev.find((p) => p.id === normalizedId) ||
            prev[idx];
          return {
            id: normalizedId,
            name:
              r.name.trim() !== "" ? r.name.trim() : `プレイヤー ${idx + 1}`,
            totalWins: existing ? existing.totalWins : 0, // これまでの★数はそのまま引き継ぐ
            matchCount: existing ? existing.matchCount : 0,
            consecutiveWins: existing ? existing.consecutiveWins || 0 : 0,
            underdogWins: existing ? existing.underdogWins || 0 : 0,
          };
        });
      });
    },
    []
  );

  // ⑤ 全員の★数を 0 にリセットする関数（★リセットボタン用）
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

  // （互換用補助関数）
  const recordTeamWin = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        totalWins: p.totalWins + 1,
        matchCount: p.matchCount + 1,
      }))
    );
  }, []);

  const updatePlayerNames = useCallback(
    (updated: { id: string; name: string }[]) => {
      setPlayers((prev) =>
        prev.map((p, idx) => {
          const found = updated.find((u) => u.id === p.id) || updated[idx];
          return found
            ? {
                ...p,
                name: found.name.trim() !== "" ? found.name.trim() : p.name,
              }
            : p;
        })
      );
    },
    []
  );

  const setPlayerCount = useCallback((count: number) => {
    const safeCount = Math.max(2, Math.min(8, count));
    setPlayers((prev) => {
      if (prev.length === safeCount) return prev;
      if (prev.length > safeCount) {
        return prev
          .slice(0, safeCount)
          .map((p, idx) => ({ ...p, id: `p-${idx + 1}` }));
      }
      const next = prev.map((p, idx) => ({ ...p, id: `p-${idx + 1}` }));
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

// 他のコンポーネントから `const { players, recordWin, resetSessionWins } = useGameSession();` で呼び出すためのフック
export function useGameSession() {
  const context = useContext(GameSessionContext);
  if (!context) {
    throw new Error("useGameSession must be used within a GameSessionProvider");
  }
  return context;
}
```

---

## 🎨 第5章：アプリ全体の土台とデザイン設定 (`src/app/globals.css`, `src/app/layout.tsx`)

### 5-1. `src/app/globals.css`
**【このファイルの役割】**
アプリ全体の背景色（大学ノートのクリーム色 `#FAF6EB`）と文字色（濃紺インク色 `#2B2D42`）を設定しています。

```css
/* src/app/globals.css */
@import "tailwindcss";

:root {
  --background: #FAF6EB; /* 大学ノートのクリーム用紙色 */
  --foreground: #2B2D42; /* ボールペンの濃紺インク色 */
  --font-chalk: var(--font-chalk);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --font-chalk: var(--font-chalk);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-chalk), var(--font-geist-sans), sans-serif;
}
```

### 5-2. `src/app/layout.tsx`
**【このファイルの役割】**
すべてのページの外側を包む「大枠（レイアウト）」です。Googleフォント（手書き風フォント `Potta One` など）を読み込み、第4章の `GameSessionProvider`（通算★管理）でアプリ全体を包んでいます。

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Potta_One } from "next/font/google";
import "./globals.css";
import { GameSessionProvider } from "@/context/GameSessionContext";
import { ActiveMatchProvider } from "@/context/ActiveMatchContext";

// Google Fontsの読み込み設定
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pottaOne = Potta_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-chalk",
});

// ブラウザのタブに表示されるタイトルと説明
export const metadata: Metadata = {
  title: "マチジカン！- 待ち時間対戦ゲームマスター",
  description:
    "テーマパークや待ち時間に、1台のスマホを囲んで道具なしで対戦できるゲームマスターWebアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${pottaOne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* アプリ全体で通算★成績を共有できるように Provider で包む */}
        <GameSessionProvider>
          <ActiveMatchProvider>{children}</ActiveMatchProvider>
        </GameSessionProvider>
      </body>
    </html>
  );
}
```


---

## 🏠 第6章：最初の画面・トップページ (`src/app/page.tsx`)

**【このファイルの役割】**
アプリを開いたときに一番最初に表示される画面です。
- 大学ノートの背景（水色の横罫線・左端の赤い縦2本線・上部のスパイラルリング穴）
- 黄色い蛍光マーカーが引かれた「**マチジカン！**」タイトル
- 中央の「**ゲーム一覧**」カードボタン（押すと第7章の `GameCatalogModal` が開く）
- 右下の文房具イラスト（プラスチック消しゴム＆蛍光ペン）

（※現在一時非表示にしている「1on1」「みんなで遊ぶ」「ゲームを作る」のコードは省き、今実際に画面で動いているコードだけを分かりやすくまとめています）

```tsx
// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllGames } from "@/lib/supabase";
import { Game } from "@/types/game";
import { getAllGamesWithCustom } from "@/lib/customGames";
import GameCatalogModal from "@/components/home/GameCatalogModal";

// 「ゲーム一覧」カードの右下に描く「開いたノート＆しおり」のボールペン風SVGイラスト
function CatalogBookDoodle({ inkColor = "#3B356E" }: { inkColor?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className="w-15 h-15 sm:w-17 sm:h-17 overflow-visible opacity-90"
      fill="none"
      stroke={inkColor}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g transform="rotate(-5 32 32)">
        {/* 見開きノートの左ページと右ページ */}
        <path
          d="M12 20 Q22 17 32 21 L32 46 Q22 42 12 45 Z"
          fill="#FFFFFF"
        />
        <path
          d="M52 20 Q42 17 32 21 L32 46 Q42 42 52 45 Z"
          fill="#FFFFFF"
        />
        {/* ノートの中の文字線 */}
        <line x1="17" y1="26" x2="27" y2="27" />
        <line x1="17" y1="32" x2="27" y2="33" />
        <line x1="17" y1="38" x2="25" y2="39" />
        <line x1="37" y1="27" x2="47" y2="26" />
        <line x1="37" y1="33" x2="47" y2="32" />
        {/* 下から飛び出るしおりリボン */}
        <polygon points="39,44 39,53 42.5,50 46,53 46,43" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

// 画面右下に飾る「蛍光マーカーペン」と「プラスチック消しゴム」のイラスト部品
function NotebookStationery() {
  return (
    <div
      className="flex items-end gap-3 select-none pointer-events-none"
      aria-hidden="true"
    >
      {/* 黄色い蛍光マーカーペン */}
      <div className="flex items-center -rotate-6 translate-y-0.5 drop-shadow-[2px_2px_0_#2B2D42]">
        <div
          className="w-2.5 h-3 bg-[#FFF275] border-2 border-r-0 border-[#2B2D42]"
          style={{ clipPath: "polygon(0 30%, 100% 0, 100% 100%, 0 80%)" }}
        />
        <div className="w-3 h-4 bg-white border-2 border-r-0 border-[#2B2D42]" />
        <div className="w-20 sm:w-24 h-5 bg-[#FFF275] border-2 border-[#2B2D42] rounded-r-md flex items-center justify-between px-2">
          <span className="text-[7px] font-black tracking-widest text-[#2B2D42]">
            MARKER
          </span>
          <div className="w-3 h-1.5 bg-[#2B2D42]/20 rounded-full" />
        </div>
      </div>

      {/* 青白スリーブ付きのプラスチック消しゴム */}
      <div className="relative w-14 h-8 bg-white rounded-md border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] rotate-3 flex overflow-hidden">
        <div className="w-3.5 h-full bg-[#FAF8F5] border-r-2 border-[#2B2D42]" />
        <div className="flex-1 h-full bg-[#3A86FF] flex flex-col justify-between py-1 px-1.5">
          <div className="w-full h-1 bg-white/90 rounded-xs" />
          <span className="text-[7px] font-black tracking-tighter text-white leading-none text-center">
            ERASER
          </span>
          <div className="w-full h-1 bg-[#2B2D42] rounded-xs" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  // 全ゲームリストを記憶するstate
  const [allGameList, setAllGameList] = useState<Game[]>([]);
  // 「ゲーム一覧モーダル」が開いているかどうかを記憶するstate（true = 開いている）
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);

  // ゲーム一覧データを読み込む関数
  const refreshGames = useCallback(async () => {
    const defaultGames = await getAllGames();
    const custom = getAllGamesWithCustom().filter((g) => g.isCustom);
    setAllGameList([...custom, ...defaultGames]);
  }, []);

  // 画面が最初に開いたときにゲーム一覧データを読み込む
  useEffect(() => {
    refreshGames();
  }, [refreshGames]);

  return (
    <main
      className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none relative"
      style={{
        // 大学ノートの水色横罫線（28px間隔で繰り返し引く）
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(116, 162, 209, 0.32) 27px, rgba(116, 162, 209, 0.32) 28px)",
        backgroundPosition: "0 16px",
      }}
    >
      {/* 大学ノートの左端にある赤い縦マージン2本線 */}
      <div
        className="pointer-events-none fixed inset-y-0 left-4 sm:left-10 w-1 border-l-2 border-r border-rose-400/45 z-0"
        aria-hidden="true"
      />

      {/* ノートページ中央のメイン枠 */}
      <div className="relative z-10 w-full max-w-md h-[92vh] max-h-[820px] min-h-[600px] flex flex-col justify-between">
        {/* 上部：リングノートの金具＆「マチジカン！」見出し */}
        <div>
          {/* 10個のスパイラルリングとパンチ穴 */}
          <div
            className="px-4 sm:px-6 pt-1 pb-2 flex items-center justify-between pointer-events-none"
            aria-hidden="true"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-2 h-3.5 -mt-2 rounded-full border-2 border-[#2B2D42]/70 bg-[#E2DDD0]" />
                <div className="w-3.5 h-3.5 -mt-1 rounded-full bg-[#DBD5C5] border border-[#2B2D42]/30 shadow-inner" />
              </div>
            ))}
          </div>

          {/* 蛍光イエローマーカー付きの「マチジカン！」タイトル */}
          <header className="mt-1 px-3 py-3 border-t-2 border-b-2 border-[#2B2D42] bg-[#FAF6EB]/90 backdrop-blur-xs">
            <div className="text-center py-1">
              <div className="relative inline-block px-3">
                <span
                  className="absolute bottom-1 inset-x-0 h-4 sm:h-5 bg-[#FFF275] -rotate-1 rounded-xs -z-10"
                  aria-hidden="true"
                />
                <h1 className="text-4xl sm:text-5xl font-black text-[#2B2D42] tracking-tight transform -rotate-1">
                  マチジカン！
                </h1>
              </div>
            </div>
          </header>
        </div>

        {/* 中央：「ゲーム一覧」特大カードボタン */}
        <div className="flex justify-center my-auto px-3">
          <button
            type="button"
            onClick={() => setIsCatalogModalOpen(true)} // 押すとゲーム一覧モーダルを開く
            className="group relative w-full max-w-xs h-42 sm:h-46 rounded-3xl bg-white border-[2.5px] border-[#2B2D42] overflow-hidden text-left flex flex-col justify-between p-5 sm:p-6 shadow-[5px_6px_0_#2B2D42] hover:-translate-y-0.5 hover:shadow-[6px_7px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_3px_0_#2B2D42] transition-all cursor-pointer"
            title="収録タイトル一覧"
          >
            {/* 右側の斜め蛍光ラベンダー帯 */}
            <div
              className="absolute inset-y-0 right-0 w-[54%] pointer-events-none transition-transform duration-200 group-hover:scale-105"
              style={{
                backgroundColor: "#CBC8FA",
                clipPath: "polygon(38% 0, 100% 0, 100% 100%, 0% 100%)",
              }}
            />

            {/* 左上の黒い「全7タイトル」バッジ */}
            <span className="relative z-10 inline-flex items-center self-start px-2.5 py-0.5 rounded-md bg-[#2B2D42] text-white text-xs font-black tracking-wide">
              全{allGameList.length || 7}タイトル
            </span>

            {/* メイン文字「ゲーム一覧」 */}
            <div className="relative z-10 mt-auto pr-12">
              <span className="block text-2xl sm:text-3xl font-black text-[#2B2D42] tracking-tight leading-tight">
                ゲーム一覧
              </span>
              <span className="block text-xs font-extrabold text-[#2B2D42]/75 mt-1">
                あそぶゲームをえらぶ
              </span>
            </div>

            {/* 右下のノート落書きスタンプ */}
            <div className="absolute bottom-2 right-2.5 z-10 pointer-events-none transition-transform duration-200 group-hover:rotate-6 group-hover:scale-110">
              <CatalogBookDoodle inkColor="#3B356E" />
            </div>
          </button>
        </div>

        {/* 下部：消しゴム＆蛍光ペンの文房具あしらい */}
        <div className="pt-2 pb-1 flex items-end justify-end px-2 border-t-2 border-dashed border-[#2B2D42]/25">
          <NotebookStationery />
        </div>
      </div>

      {/* ゲーム一覧モーダル（isCatalogModalOpen が true のときだけ画面に表示される） */}
      <GameCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        allGameList={allGameList}
        onRefresh={refreshGames}
        onEditCustomGame={() => {}}
      />
    </main>
  );
}
```

---

## 📚 第7章：ゲーム一覧ノート画面 (`src/components/home/GameCatalogModal.tsx`)

**【このファイルの役割】**
トップ画面で「ゲーム一覧」を押したときに開く、大学ノート風のゲーム一覧画面です。
- 7つのゲームを「白カード＋右斜め蛍光マーカー帯＋ボールペン落書きスタンプ（刀・電車・数字・炎・レモンなど）」で2列に表示します。
- 右上の虫眼鏡ボタンを押すと、キーワード検索やプレイ人数（2人〜8人）での絞り込みができます。
- カードをタップすると、すぐに `/games/[そのゲームのID]/play`（第8章・第9章のスタンバイ画面）へ移動します。

```tsx
// src/components/home/GameCatalogModal.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Edit2, Trash2 } from "lucide-react";
import { Game } from "@/types/game";
import { deleteCustomGame } from "@/lib/customGames";

interface GameCatalogModalProps {
  isOpen: boolean;                        // モーダルが開いているか
  onClose: () => void;                    // 閉じるボタンを押したときの関数
  allGameList: Game[];                    // 表示するゲーム配列
  onRefresh: () => void;                  // 再読み込み関数
  onEditCustomGame: (game: Game) => void;
}

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

// カード右下に描くボールペン落書きイラストの種類
export type DoodleType =
  | "katana"    // 侍の刀（ちんちん侍）
  | "train"     // 電車（めちゃギントン）
  | "numbers"   // 123!（数取団）
  | "leaf"      // 双葉
  | "flame"     // 炎（あぶりカルビ）
  | "lemon"     // レモン（CCレモン）
  | "stopwatch" // ストップウォッチ
  | "music"     // 音符（○○から始まるリズムに合わせて）
  | "cards"     // カード
  | "mic"       // マイク
  | "hand"      // ハンドサイン（カレーライス）
  | "crown";    // 王冠

export interface CardVisualTheme {
  markerColor: string;     // 右側の斜め蛍光マーカーの色
  inkAccent: string;       // イラストのインク色
  defaultDoodle: DoodleType;
}

// 各カードに順番に割り当てる蛍光マーカー色パレット
export const CARD_THEMES: CardVisualTheme[] = [
  { markerColor: "#7CE8DC", inkAccent: "#1D4E56", defaultDoodle: "katana" },
  { markerColor: "#E8F655", inkAccent: "#425214", defaultDoodle: "train" },
  { markerColor: "#CBC8FA", inkAccent: "#3B356E", defaultDoodle: "numbers" },
  { markerColor: "#9AF0A8", inkAccent: "#1F572D", defaultDoodle: "leaf" },
  { markerColor: "#FFADAD", inkAccent: "#6E2323", defaultDoodle: "flame" },
  { markerColor: "#FFF275", inkAccent: "#5C4D12", defaultDoodle: "lemon" },
  { markerColor: "#8ED8F8", inkAccent: "#1B4965", defaultDoodle: "stopwatch" },
  { markerColor: "#FFD194", inkAccent: "#663F14", defaultDoodle: "music" },
  { markerColor: "#F9B8E0", inkAccent: "#63224C", defaultDoodle: "cards" },
  { markerColor: "#B8E1FF", inkAccent: "#1E3F66", defaultDoodle: "mic" },
  { markerColor: "#D9F788", inkAccent: "#365314", defaultDoodle: "hand" },
  { markerColor: "#FCE073", inkAccent: "#5C4308", defaultDoodle: "cards" },
];

// ゲームのタイトルや特徴から、ぴったりの落書きイラスト種類を自動判定する関数
export function resolveDoodleType(game: Game, fallback: DoodleType): DoodleType {
  if (game.isCustom) return "crown";
  const id = game.id.toLowerCase();
  const title = game.title;

  if (id.includes("samurai") || title.includes("侍")) return "katana";
  if (id.includes("ginton") || title.includes("ギントン")) return "train";
  if (id.includes("kazu") || title.includes("数") || title.includes("数字"))
    return "numbers";
  if (title.includes("カルビ") || title.includes("焼肉")) return "flame";
  if (title.includes("レモン")) return "lemon";
  if (game.metadata?.tools?.includes("bpm")) return "music";
  if (game.metadata?.tools?.includes("prompt")) return "mic";
  if (title.includes("カレー") || title.includes("じゃんけん")) return "hand";

  return fallback;
}

// ボールペンで描いたような落書きスタンプSVGコンポーネント（第9章のスタンバイ画面でも再利用）
export function NotebookDoodle({
  type,
  inkColor = "#2B2D42",
}: {
  type: DoodleType;
  inkColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 56 56"
      className="w-12 h-12 sm:w-13 sm:h-13 overflow-visible opacity-90"
      fill="none"
      stroke={inkColor}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* 侍の刀 */}
      {type === "katana" && (
        <g transform="rotate(-8 28 28)">
          <path d="M12 44 L42 14 C44 12 46 12 46 15 L18 43 Z" fill="#FFFFFF" />
          <line x1="15" y1="35" x2="23" y2="43" strokeWidth="3" />
          <path d="M9 47 L16 40" strokeWidth="3.2" />
          <path d="M22 14 L24 9 L26 14 L31 16 L26 18 L24 23 L22 18 L17 16 Z" />
        </g>
      )}
      {/* 電車（めちゃギントン） */}
      {type === "train" && (
        <g transform="rotate(-5 28 28)">
          <rect x="12" y="16" width="30" height="24" rx="5" fill="#FFFFFF" />
          <rect x="17" y="21" width="9" height="8" rx="1.5" />
          <rect x="29" y="21" width="9" height="8" rx="1.5" />
          <circle cx="19" cy="43" r="3.5" fill="#FFFFFF" />
          <circle cx="35" cy="43" r="3.5" fill="#FFFFFF" />
          <path d="M22 12 Q25 7 30 9 Q34 5 39 8" />
        </g>
      )}
      {/* 数字 123!（数取団） */}
      {type === "numbers" && (
        <g transform="rotate(-6 28 28)">
          <rect
            x="10"
            y="16"
            width="36"
            height="26"
            rx="6"
            fill="#FFFFFF"
            strokeDasharray="4 2.5"
          />
          <text
            x="28"
            y="35"
            textAnchor="middle"
            fill={inkColor}
            stroke="none"
            fontSize="16"
            fontWeight="900"
            fontFamily="monospace"
          >
            123!
          </text>
          <path d="M42 10 L45 6 M47 14 L51 12" />
        </g>
      )}
      {/* 双葉 */}
      {type === "leaf" && (
        <g transform="rotate(-6 28 28)">
          <path d="M28 45 L28 24" strokeWidth="2.5" />
          <path
            d="M28 30 C14 30 12 16 26 16 C28 16 28 24 28 30 Z"
            fill="#FFFFFF"
          />
          <path
            d="M28 26 C42 26 44 12 30 12 C28 12 28 20 28 26 Z"
            fill="#FFFFFF"
          />
          <path d="M21 23 L26 27 M35 19 L30 23" />
        </g>
      )}
      {/* 炎（あぶりカルビ） */}
      {type === "flame" && (
        <g transform="rotate(-4 28 28)">
          <path
            d="M28 10 C32 18 42 22 40 34 C39 42 33 46 26 46 C19 46 14 40 15 32 C16 26 21 24 21 19 C21 19 25 23 26 26 C25 19 26 14 28 10 Z"
            fill="#FFFFFF"
          />
          <path d="M27 32 C29 35 32 37 31 41 C30 44 25 44 24 41 C23 38 25 35 27 32 Z" />
        </g>
      )}
      {/* レモン（CCレモン） */}
      {type === "lemon" && (
        <g transform="rotate(-12 28 28)">
          <path
            d="M12 29 C14 17 26 13 38 19 C43 21 45 25 46 28 C44 39 32 43 20 37 C15 35 13 31 12 29 Z"
            fill="#FFFFFF"
          />
          <circle cx="24" cy="26" r="1" fill={inkColor} />
          <circle cx="30" cy="24" r="1" fill={inkColor} />
          <path d="M38 10 L33 17 L39 17 L34 24" strokeWidth="2.2" />
        </g>
      )}
      {/* ストップウォッチ */}
      {type === "stopwatch" && (
        <g transform="rotate(-6 28 28)">
          <circle cx="28" cy="31" r="14" fill="#FFFFFF" />
          <line x1="24" y1="13" x2="32" y2="13" strokeWidth="2.8" />
          <line x1="28" y1="13" x2="28" y2="17" />
          <line x1="38" y1="17" x2="41" y2="14" />
          <polyline points="28,23 28,31 34,34" />
        </g>
      )}
      {/* 音符（○○から始まるリズムに合わせて） */}
      {type === "music" && (
        <g transform="rotate(-8 28 28)">
          <path d="M21 38 L21 17 L41 13 L41 34" />
          <ellipse cx="17" cy="39" rx="4.5" ry="3.5" fill="#FFFFFF" />
          <ellipse cx="37" cy="35" rx="4.5" ry="3.5" fill="#FFFFFF" />
          <line x1="21" y1="22" x2="41" y2="18" />
        </g>
      )}
      {/* トランプカード */}
      {type === "cards" && (
        <g transform="rotate(-6 28 28)">
          <rect
            x="14"
            y="16"
            width="20"
            height="28"
            rx="3"
            transform="rotate(-10 24 30)"
            fill="#FFFFFF"
          />
          <rect
            x="22"
            y="15"
            width="20"
            height="28"
            rx="3"
            transform="rotate(8 32 29)"
            fill="#FFFFFF"
          />
          <polygon
            points="32,23 36,29 32,35 28,29"
            fill={inkColor}
            stroke="none"
          />
        </g>
      )}
      {/* マイク */}
      {type === "mic" && (
        <g transform="rotate(12 28 28)">
          <rect x="22" y="12" width="12" height="18" rx="6" fill="#FFFFFF" />
          <line x1="22" y1="21" x2="34" y2="21" />
          <path d="M18 24 C18 31 22 35 28 35 C34 35 38 31 38 24" />
          <line x1="28" y1="35" x2="28" y2="43" />
          <line x1="22" y1="43" x2="34" y2="43" />
        </g>
      )}
      {/* ピース・じゃんけんハンド（カレーライス） */}
      {type === "hand" && (
        <g transform="rotate(-6 28 28)">
          <path
            d="M22 28 L19 14 C18.5 11.5 22 11 23 13.5 L26 25 L29 13 C30 10.5 33.5 11.5 33 14 L30 26 L34 26 C37 26 38 29 37 32 L35 40 C34 43 30 45 25 45 C20 45 17 41 17 36 L17 30 C17 28 19.5 27 22 28 Z"
            fill="#FFFFFF"
          />
        </g>
      )}
      {/* 王冠 */}
      {type === "crown" && (
        <g transform="rotate(-6 28 28)">
          <polygon
            points="12,38 15,20 23,28 28,16 33,28 41,20 44,38"
            fill="#FFFFFF"
          />
          <line x1="13" y1="42" x2="43" y2="42" />
          <circle cx="15" cy="16" r="1.8" fill={inkColor} />
          <circle cx="28" cy="12" r="1.8" fill={inkColor} />
          <circle cx="41" cy="16" r="1.8" fill={inkColor} />
        </g>
      )}
    </svg>
  );
}

export default function GameCatalogModal({
  isOpen,
  onClose,
  allGameList,
  onRefresh,
  onEditCustomGame,
}: GameCatalogModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");         // 検索キーワード
  const [playerFilter, setPlayerFilter] = useState<number | null>(null); // 人数フィルター
  const [showFilterBar, setShowFilterBar] = useState<boolean>(false); // 検索バーの表示状態

  // 検索ワードと人数フィルターに合致するゲームだけを絞り込む
  const filteredGames = useMemo(() => {
    return allGameList.filter((g) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = g.title.toLowerCase().includes(q);
        const matchTags = g.metadata?.tags?.some((t) =>
          t.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchTags) return false;
      }
      if (playerFilter !== null) {
        if (g.min_players > playerFilter || g.max_players < playerFilter) {
          return false;
        }
      }
      return true;
    });
  }, [allGameList, searchQuery, playerFilter]);

  // ゲームカードをタップしたら直接プレイ画面（ステップ1：スタンバイ）へ遷移する
  const handleSelectGameCard = (game: Game) => {
    const query = playerFilter ? `?count=${playerFilter}` : "";
    router.push(`/games/${game.id}/play${query}`);
  };

  if (!isOpen) return null;

  const hasActiveFilter = searchQuery.trim() !== "" || playerFilter !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ゲーム一覧"
      className="fixed inset-0 z-50 bg-[#FAF6EB] text-[#2B2D42] flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(116, 162, 209, 0.32) 27px, rgba(116, 162, 209, 0.32) 28px)",
        backgroundPosition: "0 16px",
      }}
    >
      {/* 左端の赤い縦マージン2本線 */}
      <div
        className="pointer-events-none fixed inset-y-0 left-4 sm:left-10 w-1 border-l-2 border-r border-rose-400/45 z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col h-full">
        {/* 最上部のリング穴 */}
        <div
          className="px-6 pt-1.5 pb-1 flex items-center justify-between pointer-events-none shrink-0"
          aria-hidden="true"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-2 h-3 -mt-2 rounded-full border-2 border-[#2B2D42]/70 bg-[#E2DDD0]" />
              <div className="w-3.5 h-3.5 -mt-1 rounded-full bg-[#DBD5C5] border border-[#2B2D42]/30 shadow-inner" />
            </div>
          ))}
        </div>

        {/* ヘッダー：左「ホームへ戻る」｜中央「ゲーム一覧ノート」｜右「検索ボタン」 */}
        <header className="px-4 pt-2 pb-3 flex items-center justify-between border-b-2 border-[#2B2D42] bg-[#FAF6EB]/90 backdrop-blur-xs shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_1px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] transition-all cursor-pointer"
            aria-label="トップ画面へ戻る"
          >
            <svg
              viewBox="0 0 28 28"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 13 L14 4 L24 13" />
              <path d="M7 11 V23 H21 V11" />
              <rect x="12" y="16" width="4" height="7" />
            </svg>
          </button>

          <div className="flex flex-col items-center">
            <div className="relative px-2">
              <span
                className="absolute bottom-0.5 inset-x-0 h-3 bg-[#FFF275] -rotate-1 rounded-xs -z-10"
                aria-hidden="true"
              />
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#2B2D42] transform -rotate-1">
                ゲーム一覧ノート
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFilterBar((prev) => !prev)}
            className={`relative w-10 h-10 rounded-xl border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_1px_0_#2B2D42] flex items-center justify-center transition-all cursor-pointer ${
              showFilterBar || hasActiveFilter
                ? "bg-[#FFE066] text-[#2B2D42]"
                : "bg-white text-[#2B2D42]"
            }`}
            aria-label="検索・人数絞り込み"
          >
            <Search className="w-5 h-5 stroke-[2.5]" />
          </button>
        </header>

        {/* 検索＆人数フィルターバー（虫眼鏡ボタンを押したときだけ開く） */}
        {showFilterBar && (
          <div className="px-4 pt-3 pb-1 shrink-0">
            <div className="bg-white rounded-2xl p-3 border-2 border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-[#2B2D42]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ゲーム名、タグで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#FAF6EB] border-2 border-[#2B2D42]/25 text-xs font-bold text-[#2B2D42]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pb-0.5">
                <span className="text-[#2B2D42] font-extrabold shrink-0 pr-0.5 text-xs">
                  人数:
                </span>
                <button
                  type="button"
                  onClick={() => setPlayerFilter(null)}
                  className={`px-2.5 py-1 rounded-lg font-extrabold shrink-0 border border-[#2B2D42] cursor-pointer ${
                    playerFilter === null
                      ? "bg-[#2B2D42] text-white"
                      : "bg-[#FAF6EB] text-[#2B2D42]"
                  }`}
                >
                  すべて
                </button>
                {PLAYER_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      setPlayerFilter(playerFilter === p ? null : p)
                    }
                    className={`px-2.5 py-1 rounded-lg font-extrabold shrink-0 border border-[#2B2D42] cursor-pointer ${
                      playerFilter === p
                        ? "bg-[#2B2D42] text-white"
                        : "bg-[#FAF6EB] text-[#2B2D42]"
                    }`}
                  >
                    {p}人
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2列のゲームカードグリッド */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-10">
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-4">
            {filteredGames.map((game, index) => {
              const theme = CARD_THEMES[index % CARD_THEMES.length];
              const doodleType = resolveDoodleType(game, theme.defaultDoodle);

              return (
                <div
                  key={game.id}
                  onClick={() => handleSelectGameCard(game)}
                  role="button"
                  tabIndex={0}
                  className="group relative h-[80px] sm:h-[86px] w-full rounded-2xl bg-white border-2 border-[#2B2D42] overflow-hidden text-left flex items-center pl-3.5 pr-12 shadow-[3px_4px_0_#2B2D42] hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  {/* 右側の斜め蛍光マーカー帯 */}
                  <div
                    className="absolute inset-y-0 right-0 w-[52%] pointer-events-none"
                    style={{
                      backgroundColor: theme.markerColor,
                      clipPath: "polygon(40% 0, 100% 0, 100% 100%, 0% 100%)",
                    }}
                  />

                  {/* 左側：ゲームタイトル */}
                  <span className="relative z-10 font-black text-[#2B2D42] text-[13.5px] sm:text-[15px] leading-snug tracking-tight line-clamp-2">
                    {game.title}
                  </span>

                  {/* 右下：落書きスタンプ */}
                  <div className="absolute bottom-0.5 right-1 z-10 pointer-events-none">
                    <NotebookDoodle
                      type={doodleType}
                      inkColor={theme.inkAccent}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 第8章：個別ゲーム起動ページ (`src/app/games/[id]/play/page.tsx`)

**【このファイルの役割】**
URL（例：`/games/chin-chin-samurai/play`）から選ばれたゲームのIDを受け取り、
1. ゲームデータの読み込み（`getGameById`）
2. 参加プレイヤー配列の準備（2人専用ゲームなら自動で2人に調整）と通算★成績への同期（`syncSessionPlayers`）
3. 第9章の「4ステップ進行コンポーネント（`StepByStepGameFlow`）」と、第10章の「プレイヤー設定モーダル（`PlayerRegistrationModal`）」、第11章の「勝者発表モーダル（`MatchWinnerModal`）」をつなぐ役割を担っています。

```tsx
// src/app/games/[id]/play/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getGameById } from "@/lib/supabase";
import { Game, Player } from "@/types/game";
import { ALL_GAMES } from "@/data/games";
import { useGameSession } from "@/hooks/useGameSession";
import StepByStepGameFlow from "@/components/match/StepByStepGameFlow";
import MatchWinnerModal from "@/components/match/MatchWinnerModal";
import PlayerRegistrationModal from "@/components/players/PlayerRegistrationModal";
import {
  loadStoredPlayers,
  saveStoredPlayers,
  syncPlayersWithCount,
} from "@/lib/playerStorage";
import { sound } from "@/lib/sound";
import { ArrowLeft } from "lucide-react";

function GamePlayContent() {
  const params = useParams();              // URLの [id] 部分を取得
  const searchParams = useSearchParams();  // URLの ?count=... を取得
  const router = useRouter();
  const id = params?.id as string;
  const countParam = searchParams?.get("count");
  const targetCount = countParam ? parseInt(countParam, 10) : null;

  // 通算★セッションと参加メンバーを同期する関数を取得
  const { syncSessionPlayers } = useGameSession();

  // 選ばれたゲームデータを取得
  const initialGame = ALL_GAMES.find((g) => g.id === id) || null;
  const [game, setGame] = useState<Game | null>(initialGame);
  const [loading, setLoading] = useState<boolean>(!initialGame);
  const [showPlayerModal, setShowPlayerModal] = useState<boolean>(false);

  // 勝者が決まったときに { id, name } を入れるstate（値が入ると勝者モーダルが開く）
  const [winner, setWinner] = useState<{ id: string; name: string } | null>(
    null
  );

  // 参加プレイヤーリストの初期準備（ゲームの最小〜最大人数に自動で合わせる）
  const [players, setPlayers] = useState<Player[]>(() => {
    const minP = initialGame?.min_players || 2;
    const maxP = initialGame?.max_players || 8;
    const defaultCount = targetCount || Math.max(3, minP);
    const current = loadStoredPlayers(defaultCount);
    return syncPlayersWithCount(
      current,
      Math.min(maxP, Math.max(minP, defaultCount)),
      minP,
      maxP,
      false
    );
  });

  // プレイヤー配列が変化したら、通算★管理側にも人数・名前を完全同期する
  useEffect(() => {
    if (players.length >= 2) {
      syncSessionPlayers(players);
    }
  }, [players, syncSessionPlayers]);

  // ゲームデータ読み込み時の処理
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      try {
        const data = await getGameById(id);
        if (isMounted) {
          setGame(data);
          setLoading(false);

          const minP = data?.min_players || 2;
          const maxP = data?.max_players || 8;
          const current = loadStoredPlayers(Math.max(3, minP));
          let adjusted: Player[];

          if (targetCount && !isNaN(targetCount)) {
            adjusted = syncPlayersWithCount(current, targetCount, minP, maxP, false);
          } else if (current.length < minP) {
            adjusted = syncPlayersWithCount(current, minP, minP, maxP, false);
          } else if (current.length > maxP) {
            // カレーライス・CCレモン（maxP=2）のときは自動で2人に絞る
            adjusted = syncPlayersWithCount(current, maxP, minP, maxP, false);
          } else {
            adjusted = current;
          }

          setPlayers(adjusted);
          saveStoredPlayers(adjusted);
          syncSessionPlayers(adjusted);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id, targetCount, syncSessionPlayers]);

  // 「ミス」ボタンが押されたとき：脱落状態を切り替え、残り1人になったら自動で勝者決定！
  const handleToggleEliminate = (playerId: string) => {
    sound.playClick();
    setPlayers((prev) => {
      const updated = prev.map((p) =>
        p.id === playerId ? { ...p, isOut: !p.isOut } : p
      );
      saveStoredPlayers(updated);

      const alive = updated.filter((p) => !p.isOut);
      if (updated.length >= 2 && alive.length === 1) {
        sound.playWin();
        setWinner({ id: alive[0].id, name: alive[0].name });
      }
      return updated;
    });
  };

  // 全員の脱落状態を解除して全員生存に戻す関数
  const handleResetElimination = () => {
    setPlayers((prev) => {
      const updated = prev.map((p) => ({ ...p, isOut: false }));
      saveStoredPlayers(updated);
      return updated;
    });
    setWinner(null);
  };

  // 「👑 勝ち」ボタンが直接押されたときに勝者を決定する関数
  const handleSelectWinner = (playerId: string, playerName: string) => {
    sound.playWin();
    setWinner({ id: playerId, name: playerName });
  };

  // 「もう1戦！（リベンジ）」が押されたときの関数
  const handleRematch = () => {
    sound.playRevive();
    handleResetElimination();
  };

  // 人数・名前設定モーダルで「保存」されたときの関数
  const handleSavePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    saveStoredPlayers(newPlayers);
    syncSessionPlayers(newPlayers);
    setShowPlayerModal(false);
  };

  // 設定画面で2文字ネーム等を直接入力したときの関数
  const handleRenamePlayer = (playerId: string, newName: string) => {
    setPlayers((prev) => {
      const updated = prev.map((p) =>
        p.id === playerId ? { ...p, name: newName } : p
      );
      saveStoredPlayers(updated);
      syncSessionPlayers(updated);
      return updated;
    });
  };

  if (loading || !game) {
    return (
      <div className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex items-center justify-center">
        <p className="text-sm font-black">ゲームを起動中...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh bg-[#FAF6EB] text-[#2B2D42] flex flex-col relative px-4 py-2"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(116, 162, 209, 0.32) 27px, rgba(116, 162, 209, 0.32) 28px)",
        backgroundPosition: "0 16px",
      }}
    >
      {/* 左端の赤い縦マージン2本線 */}
      <div
        className="pointer-events-none fixed inset-y-0 left-4 sm:left-10 w-1 border-l-2 border-r border-rose-400/45 z-0"
        aria-hidden="true"
      />

      <main className="relative z-10 flex-1 w-full">
        {/* 第9章：4ステップ進行画面 */}
        <StepByStepGameFlow
          game={game}
          players={players}
          onOpenPlayerModal={() => setShowPlayerModal(true)}
          onRenamePlayer={handleRenamePlayer}
          onToggleEliminate={handleToggleEliminate}
          onResetElimination={handleResetElimination}
          onSelectWinner={handleSelectWinner}
          onBackToHome={() => router.push("/")}
        />

        {/* 第10章：参加メンバーの人数・名前設定モーダル */}
        <PlayerRegistrationModal
          isOpen={showPlayerModal}
          onClose={() => setShowPlayerModal(false)}
          initialPlayers={players}
          onSave={handleSavePlayers}
          minPlayers={game.min_players || 2}
          maxPlayers={game.max_players || 8}
          gameTitle={game.title}
          isInitialSetup={false}
        />

        {/* 第11章：勝者発表＆通算ランキングモーダル */}
        <MatchWinnerModal
          winnerId={winner?.id || ""}
          winnerName={winner?.name || ""}
          isOpen={!!winner}
          onRematch={handleRematch}
        />
      </main>
    </div>
  );
}

export default function GamePlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF6EB]" />}>
      <GamePlayContent />
    </Suspense>
  );
}
```


---

## 🎯 第9章：4ステップ進行システム＆手書き8キャラ (`src/components/match/StepByStepGameFlow.tsx`)

**【このファイルの役割】**
ゲームが選ばれた後の**4つの画面（①スタンバイ ➔ ②設定 ➔ ③ルール確認 ➔ ④プレイ中）**すべてを1つのファイルで切り替えながら動かす、このアプリの心臓部です。

1. **`PlayerStampAvatar`（手書き8キャラクターSVG）**：
   - プレイヤー番号（`0`〜`7`）に応じて、描いていただいた8種類のオリジナル手書きキャラ（①クマ、②ネコ、③ウサギ/ブチ、④トリ、⑤ライオン、⑥コウモリ、⑦長鼻キャラ、⑧ニコニコもち）を描画します。
2. **ステップ①（`step === "standby"`）**：
   - 横幅いっぱいの「ノート見出しゲームカード」＋「参加メンバー（付箋名札グリッド・通算★数表示・★リセットボタン）」＋「このメンバーで始める ➔」ボタン。
3. **ステップ②（`step === "settings"`）**：
   - あぶりカルビ等の場合は「お題（アプリ / 自由）」と「プレイの順番（1番目➔2番目…）」。
   - ちんちん侍・○○から始まるリズムに合わせての場合は「誰から始めるか（ランダム抽選 or タップ選択）」（＋2文字ネーム入力）。
4. **ステップ③（`step === "rules"`）**：
   - 始める人（またはプレイの順番）と、そのゲームのルール・かけ声例を確認して「スタート」を押します。
5. **ステップ④（`step === "playing"`）**：
   - 上部にコンパクトな掛け声・お題・順番バーを表示し、画面中央に大きく「勝った人・ミスした人をタップ」のプレイヤーカード群を並べます。

```tsx
// src/components/match/StepByStepGameFlow.tsx
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
  Shuffle,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Crown,
  LogOut,
  Dices,
} from "lucide-react";

// 4つのステップ（画面状態）を表す型
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
  arenaContext?: {
    roundNumber: number;
    subtitle: string;
    isLoserKingOrSurvival?: boolean;
    judgeLabel?: string;
    onRerollGame?: () => void;
    onRecordEliminated?: (playerId: string) => void;
  };
}

// 8キャラクターの背面に敷くパステル蛍光マーカー色
const STAMP_COLORS = [
  "#FFADAD", // 1. コーラルピンク
  "#CBC8FA", // 2. ラベンダー
  "#7CE8DC", // 3. ミントブルー
  "#FFE066", // 4. 蛍光イエロー
  "#9AF0A8", // 5. 蛍光グリーン
  "#F9B8E0", // 6. 蛍光ピンク
  "#FFD194", // 7. アプリコット
  "#E8F655", // 8. ライム
];

/**
 * 手書きイラスト8種オリジナルマスコットアイコン
 * index (0〜7) に応じて「クマ・ネコ・ウサギ・トリ・ライオン・コウモリ・長鼻・ニコニコ」を描画
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
      {/* 背面の斜め蛍光マーカー座布団 */}
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
            <path d="M16 16 C15 10, 22 10, 22 15" fill="#FFFFFF" />
            <path d="M34 15 C34 10, 41 10, 40 16" fill="#FFFFFF" />
            <path d="M13 38 C8 38, 8 44, 15 43" fill="#FFFFFF" />
            <path d="M42 39 C47 40, 46 46, 40 43" fill="#FFFFFF" />
            <path
              d="M11 35 C9 20, 17 13, 28 13 C39 13, 47 20, 45 35 C44 43, 12 43, 11 35 Z"
              fill="#FFFFFF"
            />
            <circle cx="21" cy="24" r="1.8" fill="#2B2D42" />
            <circle cx="35" cy="25" r="1.8" fill="#2B2D42" />
            <ellipse cx="27.5" cy="31.5" rx="6.8" ry="4.4" fill="#FFFFFF" />
            <ellipse cx="27.5" cy="31.5" rx="2.1" ry="1.4" fill="#2B2D42" />
          </g>
        )}

        {/* 1: ネコ（三角耳＋ヒゲ＋逆三角鼻＋ω口） */}
        {charType === 1 && (
          <g>
            <path d="M14 40 C10 41, 10 46, 16 44" fill="#FFFFFF" />
            <path d="M41 40 C46 40, 46 45, 40 43" fill="#FFFFFF" />
            <path
              d="M11 35 C9 21, 17 14, 28 14 C39 14, 47 21, 45 35 C44 43, 12 43, 11 35 Z"
              fill="#FFFFFF"
            />
            <path d="M17 17 L21 9 L25 15" fill="#FFFFFF" />
            <path d="M31 15 L35 9 L39 17" fill="#FFFFFF" />
            <circle cx="23" cy="22.5" r="1.7" fill="#2B2D42" />
            <circle cx="33" cy="22.5" r="1.7" fill="#2B2D42" />
            <polygon points="25,26.5 31,26.5 28,31" fill="#FFFFFF" />
            <path d="M25.5 33.5 C25.5 36.5, 28 36.5, 28 34 C28 36.5, 30.5 36.5, 30.5 33.5" />
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
            <path d="M18 16 C17 3, 24 2, 25 14" fill="#FFFFFF" />
            <path d="M32 14 C34 2, 42 3, 38 16" fill="#FFFFFF" />
            <path d="M13 38 C8 38, 8 43, 14 42" fill="#FFFFFF" />
            <path d="M41 39 C46 39, 46 44, 40 42" fill="#FFFFFF" />
            <path
              d="M12 34 C11 20, 18 13, 28 13 C38 13, 45 20, 44 34 C43 43, 13 43, 12 34 Z"
              fill="#FFFFFF"
            />
            <path d="M31 13.5 C27 24, 21 30, 12.5 32" />
            <path d="M43 21 C38 22, 38 28, 44 29" />
            <circle cx="22.5" cy="22.5" r="1.6" fill="#2B2D42" />
            <circle cx="33" cy="22.5" r="1.4" fill="#2B2D42" />
            <circle cx="28" cy="29.5" r="1.2" />
            <path d="M20 40 C23 33.5, 33 33.5, 36 40" />
          </g>
        )}

        {/* 3: トリ（トサカ＋左右の羽＋笑顔） */}
        {charType === 3 && (
          <g>
            <path
              d="M20 19 C17 11, 24 8, 26 14 C28 5, 36 5, 35 14 C40 9, 44 15, 38 20"
              fill="#FFFFFF"
            />
            <path d="M18 42 C16 46, 21 47, 21 43" fill="#FFFFFF" />
            <path d="M35 43 C35 47, 40 46, 38 42" fill="#FFFFFF" />
            <path
              d="M13 33 C13 21, 20 17, 28 17 C36 17, 43 21, 43 33 C43 43, 13 43, 13 33 Z"
              fill="#FFFFFF"
            />
            <path d="M16 28 C8 27, 8 39, 17 37" fill="#FFFFFF" />
            <path d="M40 28 C47 27, 47 39, 39 37" fill="#FFFFFF" />
            <circle cx="23" cy="26" r="1.8" fill="#2B2D42" />
            <circle cx="33" cy="26" r="1.8" fill="#2B2D42" />
            <path d="M23 32 Q28 33.5 33 32 Q28 38.5 23 32 Z" fill="#FFFFFF" />
          </g>
        )}

        {/* 4: ライオン（もこもこタテガミ＋三角鼻ヒゲ） */}
        {charType === 4 && (
          <g>
            <path
              d="M11 36 C6 33, 6 26, 10 23 C8 17, 13 13, 18 14 C21 9, 28 9, 31 12 C36 9, 42 12, 43 17 C48 19, 49 25, 45 29 C48 33, 46 38, 41 38"
              fill="#FFFFFF"
            />
            <path d="M16 40 C13 43, 16 46, 19 42" fill="#FFFFFF" />
            <path d="M36 42 C38 46, 42 43, 39 39" fill="#FFFFFF" />
            <path
              d="M14 33 C14 21, 20 17, 28 17 C36 17, 41 22, 41 33 C41 42, 14 42, 14 33 Z"
              fill="#FFFFFF"
            />
            <circle cx="24" cy="26.5" r="1.6" fill="#2B2D42" />
            <circle cx="31.5" cy="26.5" r="1.6" fill="#2B2D42" />
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
            <path
              d="M15 26 C10 19, 6 24, 8 36 L12 31 L15 33"
              fill="#FFFFFF"
            />
            <path
              d="M41 26 C46 19, 50 24, 48 36 L44 31 L41 33"
              fill="#FFFFFF"
            />
            <path d="M18 41 C15 45, 19 47, 21 42" fill="#FFFFFF" />
            <path d="M37 40 C41 42, 43 45, 38 43" fill="#FFFFFF" />
            <path
              d="M14 33 C14 21, 20 17, 28 17 C36 17, 42 21, 42 33 C42 42, 14 42, 14 33 Z"
              fill="#FFFFFF"
            />
            <path d="M21.5 18 L23 13.5 L24.8 17.5" fill="#FFFFFF" />
            <path d="M31.2 17.5 L33 13.5 L34.5 18" fill="#FFFFFF" />
            <circle cx="24" cy="25" r="1.7" fill="#2B2D42" />
            <circle cx="32" cy="25" r="1.7" fill="#2B2D42" />
            <path d="M24.5 31.5 L26.3 35.5 L28 32.5 L29.7 35.5 L31.5 31.5" />
          </g>
        )}

        {/* 6: 長鼻キャラ（とんがり鼻＋にっこり口） */}
        {charType === 6 && (
          <g>
            <path d="M13 39 C9 41, 10 46, 15 42" fill="#FFFFFF" />
            <path d="M42 39 C45 41, 45 45, 41 42" fill="#FFFFFF" />
            <path
              d="M12 35 C10 19, 18 12, 28 12 C39 12, 46 20, 44 35 C43 43, 13 43, 12 35 Z"
              fill="#FFFFFF"
            />
            <circle cx="22.5" cy="21" r="1.8" fill="#2B2D42" />
            <circle cx="33.5" cy="21" r="1.8" fill="#2B2D42" />
            <path d="M27.5 24.5 L18.5 34.5 L28.5 31.5" fill="#FFFFFF" />
            <path d="M23 36 Q31 38 36 31.5" />
            <path d="M34.5 29.5 L37.5 33" />
          </g>
        )}

        {/* 7: ニコニコもち（アーチ目＋にっこり笑顔） */}
        {charType === 7 && (
          <g>
            <path d="M13 38 C8 39, 9 44, 15 42" fill="#FFFFFF" />
            <path d="M42 39 C47 39, 47 44, 41 42" fill="#FFFFFF" />
            <path
              d="M12 35 C11 21, 18 14, 28 14 C38 14, 45 21, 44 35 C43 43, 13 43, 12 35 Z"
              fill="#FFFFFF"
            />
            <path d="M20 25 Q22 19.5 24 25" />
            <path d="M32 25 Q34 19.5 36 25" />
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
  // 「○○から始まるリズムに合わせて」かどうかの判定
  const isRhythmNameGame = game.id === "rhythm-shiritori";
  // 順番リストではなく「誰から始めるか」だけを決めるゲーム（ちんちん侍・○○から始まるリズム）
  const isStarterOnlyGame =
    game.id === "chin-chin-samurai" || game.id === "rhythm-shiritori";

  // 通算★成績の取得とリセット関数
  const { players: sessionPlayers, resetSessionWins } = useGameSession();

  // 現在のステップ（standby -> settings -> rules -> playing）
  const [step, setStep] = useState<FlowStep>("standby");
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());
  const [showRulePopup, setShowRulePopup] = useState<boolean>(false);

  // 「誰から始めるか」で選ばれているプレイヤーID
  const [starterId, setStarterId] = useState<string>(
    () => players[0]?.id || "p-1"
  );

  // お題モード（"app" = アプリのお題、"free" = 自由お題）
  const [promptMode, setPromptMode] = useState<"app" | "free">("app");
  // BPM速さ
  const [bpmValue, setBpmValue] = useState<number>(
    game.metadata?.defaultBpm || 110
  );

  // 順番管理（あぶりカルビ・めちゃギントン・数取団などの順番制ゲーム用）
  const [orderIds, setOrderIds] = useState<string[]>(() =>
    players.map((p) => p.id)
  );

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

  // 順番をランダムシャッフルする関数
  const handleShuffleOrder = () => {
    sound.playGacha();
    const ids = orderedPlayers.map((p) => p.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setOrderIds(ids);
  };

  // 「誰から始めるか」をランダム抽選する関数
  const handlePickRandomStarter = () => {
    sound.playGacha();
    if (players.length === 0) return;
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

  // 順番を上下に入れ替える関数
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
    if (!nextMuted) sound.playTick();
  };

  // このゲームがお題やBPMを使うかどうかの判定
  const hasPrompt = Boolean(
    game.metadata?.tools?.includes("prompt") ||
      (game.metadata?.promptList && game.metadata.promptList.length > 0)
  );
  const hasBpm = Boolean(game.metadata?.tools?.includes("bpm"));

  // お題リストと現在のお題番号
  const promptList: PromptItem[] = useMemo(() => {
    return game.metadata?.promptList || ["炙りカルビ"];
  }, [game]);
  const [promptIndex, setPromptIndex] = useState<number>(0);

  // BPMメトロノーム再生ステート
  const [isBpmPlaying, setIsBpmPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  // ステップ③から「スタート」を押してステップ④（プレイ中）へ進む関数
  const handleStartMatch = () => {
    sound.playWin();
    onResetElimination();
    setIsBpmPlaying(false);
    setStep("playing");
  };

  // BPMメトロノームの4拍子タイマー
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

  // ゲームカードのテーマ色とイラスト種類
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

  const aliveOrderedPlayers = useMemo(
    () => orderedPlayers.filter((p) => !p.isOut),
    [orderedPlayers]
  );

  const currentPromptItem = promptList[promptIndex % promptList.length];
  const currentPromptText =
    typeof currentPromptItem === "string"
      ? currentPromptItem
      : currentPromptItem?.question;

  const getRoleLabel = (idx: number, total: number): string => {
    if (idx === 0) return "最初の人（親・スタート）";
    if (idx === total - 1 && total >= 3) return "最後の人（アンカー）";
    return `${idx + 1}番目`;
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col min-h-[calc(100dvh-2rem)] justify-between py-2 select-none">
      {/* =========================================================
          STEP 1: スタンバイ画面
         ========================================================= */}
      {step === "standby" && (
        <div className="flex flex-col flex-1 justify-between space-y-5 animate-in fade-in duration-200">
          {/* 上部バー：戻る ＜ | マチジカン！ | 音量ボタン */}
          <header className="flex items-center justify-between px-1 pt-1">
            <button
              type="button"
              onClick={onBackToHome}
              className="w-11 h-11 rounded-2xl bg-white hover:bg-[#FFF275] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.8]" />
            </button>

            <div className="relative inline-block">
              <span className="absolute inset-x-0 bottom-0.5 h-3 bg-[#FFE066]/90 -rotate-1 rounded-xs" />
              <h1 className="relative text-2xl sm:text-3xl font-black tracking-tight text-[#2B2D42] px-1">
                マチジカン！
              </h1>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              className="w-11 h-11 rounded-2xl bg-white hover:bg-[#FFF275] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 stroke-[2.5] text-rose-500" />
              ) : (
                <Volume2 className="w-5 h-5 stroke-[2.5]" />
              )}
            </button>
          </header>

          {/* 上段：横幅いっぱいの「ノート見出しゲームカード」 */}
          <div className="relative w-full rounded-3xl bg-white border-[2.5px] border-[#2B2D42] p-4 sm:p-5 shadow-[4px_5px_0_#2B2D42] overflow-hidden">
            <div
              className="absolute inset-y-0 right-0 w-[38%] pointer-events-none"
              style={{
                backgroundColor: cardTheme.markerColor,
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
              </div>
              <button
                type="button"
                onClick={() => setShowRulePopup(true)}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#FFE066] border-2 border-[#2B2D42] shadow-[1px_2px_0_#2B2D42] flex items-center gap-1 text-[#2B2D42] font-black text-xs cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>ルール</span>
              </button>
            </div>
            <div className="relative z-10 pr-14">
              <h2 className="font-black text-[#2B2D42] text-xl sm:text-2xl leading-tight">
                {game.title}
              </h2>
              <p className="text-xs font-bold text-[#2B2D42]/75 mt-1 line-clamp-2">
                {game.short_description || game.description}
              </p>
            </div>
            <div className="absolute bottom-1.5 right-2 z-10 pointer-events-none">
              <NotebookDoodle type={doodleType} inkColor={cardTheme.inkAccent} />
            </div>
          </div>

          {/* 中段：「参加メンバー」ノート付箋グリッド（★リセット＆人数・名前変更ボタン付き） */}
          <div className="bg-white border-[2.5px] border-[#2B2D42] rounded-3xl p-4 sm:p-5 shadow-[4px_5px_0_#2B2D42] relative flex-1 flex flex-col justify-between">
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
                  className="px-2.5 py-1.5 rounded-xl bg-[#FAF6EB] hover:bg-[#FFADAD] border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] flex items-center gap-1 text-[#2B2D42] text-[11px] font-black cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                  <span>★リセット</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenPlayerModal}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF6EB] hover:bg-[#FFE066] border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] flex items-center gap-1.5 text-[#2B2D42] text-xs font-black cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>人数・名前</span>
                </button>
              </div>
            </div>

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
                    className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-[#FAF6EB] hover:bg-[#FFF275]/45 border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] text-left cursor-pointer"
                  >
                    <PlayerStampAvatar index={idx} size="md" isOut={player.isOut} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black text-[#2B2D42]/60">
                          メンバー {idx + 1}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-full bg-[#FFE066] border border-[#2B2D42] text-[10px] font-black text-[#2B2D42]">
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

          {/* 下段：「このメンバーで始める ➔」ボタン */}
          <div className="pt-1 pb-2">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setStep("settings");
              }}
              className="w-full py-4 px-6 rounded-2xl bg-[#9AF0A8] hover:bg-[#82e893] border-[2.5px] border-[#2B2D42] shadow-[4px_5px_0_#2B2D42] text-[#2B2D42] font-black text-lg sm:text-xl cursor-pointer"
            >
              このメンバーで始める ➔
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STEP 2: 「設定」画面（誰から始めるか / プレイの順番 / お題モード）
         ========================================================= */}
      {step === "settings" && (
        <div className="flex flex-col flex-1 justify-between space-y-4 animate-in fade-in duration-200">
          <header className="flex items-center justify-between px-1 pt-1">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setStep("standby");
              }}
              className="w-10 h-10 rounded-xl bg-white border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] flex items-center justify-center cursor-pointer"
            >
              <LogOut className="w-5 h-5 stroke-[2.5] rotate-180" />
            </button>
            <div className="text-center px-2">
              <h1 className="text-lg sm:text-xl font-black text-[#2B2D42]">
                {game.title}
              </h1>
              <p className="text-xs font-black text-[#2B2D42]/70 mt-0.5">設定</p>
            </div>
            <button
              type="button"
              onClick={() => setShowRulePopup(true)}
              className="w-10 h-10 rounded-full bg-white border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] flex items-center justify-center cursor-pointer"
            >
              <HelpCircle className="w-5 h-5 stroke-[2.5]" />
            </button>
          </header>

          <div className="bg-white border-[2.5px] border-[#2B2D42] rounded-3xl p-5 shadow-[4px_5px_0_#2B2D42] space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* お題モード切替（あぶりカルビ等のお題があるゲームのみ） */}
              {hasPrompt && (
                <div>
                  <h2 className="text-sm font-black text-[#2B2D42] mb-2">お題</h2>
                  <div className="grid grid-cols-2 p-1 rounded-full bg-[#FAF6EB] border-2 border-[#2B2D42]">
                    <button
                      type="button"
                      onClick={() => setPromptMode("app")}
                      className={`py-2 rounded-full text-xs sm:text-sm font-black cursor-pointer ${
                        promptMode === "app"
                          ? "bg-[#2B2D42] text-white"
                          : "text-[#2B2D42]"
                      }`}
                    >
                      アプリ
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromptMode("free")}
                      className={`py-2 rounded-full text-xs sm:text-sm font-black cursor-pointer ${
                        promptMode === "free"
                          ? "bg-[#2B2D42] text-white"
                          : "text-[#2B2D42]"
                      }`}
                    >
                      自由
                    </button>
                  </div>
                </div>
              )}

              {/* 「誰から始めるか」（ちんちん侍・○○から始まるリズム） または 「プレイの順番」（あぶりカルビ等） */}
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
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#FFE066] border-2 border-[#2B2D42] text-xs font-black cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>ランダムで決める</span>
                    </button>
                  </div>

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
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border-2 border-[#2B2D42] cursor-pointer ${
                            isStarter
                              ? "bg-[#FFE066] shadow-[3px_3px_0_#2B2D42]"
                              : "bg-[#FAF6EB]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                            <PlayerStampAvatar index={idx} size="sm" />
                            <div className="min-w-0 flex-1">
                              {onRenamePlayer && isRhythmNameGame ? (
                                <input
                                  type="text"
                                  value={player.name}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    onRenamePlayer(player.id, e.target.value)
                                  }
                                  className="w-full px-2 py-0.5 rounded-lg bg-white border border-[#2B2D42]/40 text-sm font-black"
                                />
                              ) : (
                                <div className="text-sm font-black text-[#2B2D42] truncate">
                                  {player.name}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-white border-2 border-[#2B2D42] text-xs font-black shrink-0">
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
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#FFE066] border-2 border-[#2B2D42] text-xs font-black cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>ランダム</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
                    {orderedPlayers.map((player, idx) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42]"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          <span className="px-2 py-0.5 rounded-lg bg-[#FFE066] border border-[#2B2D42] font-black text-xs shrink-0">
                            {idx + 1}番目
                          </span>
                          <PlayerStampAvatar index={idx} size="sm" />
                          <div className="min-w-0 flex-1">
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

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveOrder(idx, -1)}
                            className="p-1.5 rounded-lg bg-white border border-[#2B2D42] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === orderedPlayers.length - 1}
                            onClick={() => handleMoveOrder(idx, 1)}
                            className="p-1.5 rounded-lg bg-white border border-[#2B2D42] disabled:opacity-30 cursor-pointer"
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
          </div>

          <div className="pt-1 pb-2">
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                setStep("rules");
              }}
              className="w-full py-4 px-6 rounded-2xl bg-[#CBC8FA] border-[2.5px] border-[#2B2D42] shadow-[4px_5px_0_#2B2D42] text-[#2B2D42] font-black text-base sm:text-lg cursor-pointer"
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STEP 3: 「ルール」確認画面
         ========================================================= */}
      {step === "rules" && (
        <div className="flex flex-col flex-1 justify-between space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border-[2.5px] border-[#2B2D42] rounded-3xl p-5 shadow-[4px_5px_0_#2B2D42] space-y-5 flex-1 flex flex-col justify-between">
            {/* 上段：始める人 または 順番の確認 */}
            {isStarterOnlyGame ? (
              <div className="p-3.5 rounded-2xl bg-[#FFE066] border-2 border-[#2B2D42] flex items-center justify-center gap-3">
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
                  <div className="text-lg font-black text-[#2B2D42]">
                    {starterPlayer?.name}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[175px] overflow-y-auto pr-1">
                {orderedPlayers.map((player, idx) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42]"
                  >
                    <span className="px-2 py-0.5 rounded-lg bg-[#FFE066] border border-[#2B2D42] font-black text-xs">
                      {idx + 1}番目
                    </span>
                    <PlayerStampAvatar index={idx} size="sm" />
                    <span className="text-sm font-black text-[#2B2D42] truncate">
                      {player.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 下段：ルール本文と掛け声例 */}
            <div className="py-4 px-2 text-center space-y-3">
              <p className="text-xs sm:text-sm font-bold text-[#2B2D42] leading-relaxed whitespace-pre-wrap">
                {game.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 pb-2">
            <button
              type="button"
              onClick={() => setStep("settings")}
              className="py-4 px-4 rounded-2xl bg-white border-[2.5px] border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] font-black text-base cursor-pointer"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={handleStartMatch}
              className="py-4 px-4 rounded-2xl bg-[#9AF0A8] border-[2.5px] border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] font-black text-base cursor-pointer"
            >
              スタート
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STEP 4: 本番プレイ画面（プレイヤーの「ミス」「勝ち」判定が主役）
         ========================================================= */}
      {step === "playing" && (
        <div className="flex flex-col flex-1 justify-between space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border-[2.5px] border-[#2B2D42] rounded-3xl p-4 sm:p-5 shadow-[4px_5px_0_#2B2D42] space-y-3.5 flex-1 flex flex-col">
            {/* メイン領域：勝った人・ミスした人をタップ */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
              {(isStarterOnlyGame ? players : orderedPlayers).map(
                (player, idx) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border-[2.5px] border-[#2B2D42] ${
                      player.isOut
                        ? "bg-[#2B2D42]/10 opacity-55"
                        : "bg-[#FAF6EB] shadow-[3px_4px_0_#2B2D42]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {!isStarterOnlyGame && (
                        <span className="px-2 py-0.5 rounded-lg bg-[#FFE066] border border-[#2B2D42] font-black text-xs shrink-0">
                          {idx + 1}番目
                        </span>
                      )}
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
                      <button
                        type="button"
                        onClick={() => onToggleEliminate(player.id)}
                        className="px-4 py-2.5 rounded-xl bg-[#FFADAD] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] text-xs sm:text-sm font-black cursor-pointer"
                      >
                        {player.isOut ? "復活" : "ミス"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectWinner(player.id, player.name)}
                        className="px-4 py-2.5 rounded-xl bg-[#FFE066] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] text-xs sm:text-sm font-black flex items-center gap-1.5 cursor-pointer"
                      >
                        <Crown className="w-4 h-4" />
                        <span>勝ち</span>
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 👥 第10章：参加メンバー設定モーダル (`src/components/players/PlayerRegistrationModal.tsx`)

**【このファイルの役割】**
スタンバイ画面の「**⚙️ 人数・名前**」ボタンまたは名札カードをタップしたときに開くモーダルです。
- 参加人数を `2人〜8人`（2人専用ゲームでは `2人`）の間で増減できます。
- 各メンバーの名前を自由に入力したり、「おまかせ名前」で一括入力できます。

```tsx
// src/components/players/PlayerRegistrationModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Player } from "@/types/game";
import { PRESET_NICKNAMES } from "@/lib/playerStorage";
import { Users, UserPlus, Trash2, Sparkles, X, Check, RotateCcw } from "lucide-react";

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

export default function PlayerRegistrationModal({
  isOpen,
  onClose,
  initialPlayers,
  onSave,
  minPlayers = 2,
  maxPlayers = 8,
  gameTitle,
}: PlayerRegistrationModalProps) {
  // モーダル内で編集中のプレイヤーリスト
  const [localPlayers, setLocalPlayers] = useState<Player[]>(initialPlayers);

  // モーダルが開いたときに最新のプレイヤーリストをセットする
  useEffect(() => {
    if (isOpen && initialPlayers && initialPlayers.length >= 2) {
      setLocalPlayers(initialPlayers);
    }
  }, [isOpen, initialPlayers]);

  if (!isOpen) return null;

  // 名前テキストボックスが書き換えられたときの処理
  const handleNameChange = (id: string, name: string) => {
    setLocalPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  // 「プレイヤーを追加」ボタンを押したときの処理
  const handleAddPlayer = () => {
    if (localPlayers.length >= maxPlayers) return;
    const nextNum = localPlayers.length + 1;
    setLocalPlayers((prev) => [
      ...prev,
      {
        id: `p-${nextNum}`,
        name: `プレイヤー ${nextNum}`,
        score: 0,
        isOut: false,
      },
    ]);
  };

  // ゴミ箱ボタンでプレイヤーを1人減らす処理
  const handleRemovePlayer = (id: string) => {
    if (localPlayers.length <= minPlayers) return;
    setLocalPlayers((prev) =>
      prev
        .filter((p) => p.id !== id)
        .map((p, idx) => ({ ...p, id: `p-${idx + 1}` }))
    );
  };

  // 「決定」ボタンを押したときに親へ保存して閉じる処理
  const handleSave = () => {
    const sanitized = localPlayers.map((p, idx) => ({
      ...p,
      id: `p-${idx + 1}`,
      name: p.name.trim() !== "" ? p.name.trim() : `プレイヤー ${idx + 1}`,
    }));
    onSave(sanitized);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#FAF6EB] border-2 border-[#2B2D42] rounded-3xl p-5 sm:p-6 shadow-[6px_7px_0_#2B2D42] text-[#2B2D42] max-h-[90vh] flex flex-col relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white border-2 border-[#2B2D42]"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-black mb-4">
          {gameTitle ? `「${gameTitle}」の参加メンバー設定` : "プレイヤー設定"}
        </h2>

        {/* 各プレイヤーの名前入力欄リスト */}
        <div className="flex-1 overflow-y-auto space-y-2.5 mb-4">
          {localPlayers.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border-2 border-[#2B2D42]"
            >
              <span className="w-8 h-8 rounded-xl bg-[#FFE066] border-2 border-[#2B2D42] flex items-center justify-center text-xs font-black">
                {index + 1}
              </span>
              <input
                type="text"
                value={player.name}
                onChange={(e) => handleNameChange(player.id, e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-[#FAF6EB] border border-[#2B2D42]/30 text-sm font-black"
              />
              {localPlayers.length > minPlayers && (
                <button
                  type="button"
                  onClick={() => handleRemovePlayer(player.id)}
                  className="p-2 rounded-xl bg-[#FFADAD] border-2 border-[#2B2D42]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 人数追加ボタン（最大人数未満のときのみ表示） */}
        {localPlayers.length < maxPlayers && (
          <button
            type="button"
            onClick={handleAddPlayer}
            className="w-full py-2.5 mb-3 rounded-2xl bg-white border-2 border-dashed border-[#2B2D42] font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>プレイヤーを追加（あと{maxPlayers - localPlayers.length}人まで）</span>
          </button>
        )}

        {/* 保存ボタン */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl bg-[#FFE066] border-2 border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] font-black text-base flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-5 h-5" />
          <span>このメンバーで決定！</span>
        </button>
      </div>
    </div>
  );
}
```

---

## 🏆 第11章：勝者発表＆通算ランキングモーダル (`src/components/match/MatchWinnerModal.tsx`)

**【このファイルの役割】**
プレイ画面で勝者が決まった瞬間に開く表彰モーダルです。
- モーダルが開いた瞬間に `recordWin(winnerId, winnerName)` を呼び出し、勝者の通算★数を自動的に `+1` します。
- 本日の通算ランキングを勝利数順に表示し、右上の「**★リセット**」ボタンで全員の星を `0` に戻すこともできます。
- 下部の2つのボタンで「**もう1戦！（リベンジ）**」または「**次の対戦ゲームを選ぶ（通算★引継）**」を選べます。

```tsx
// src/components/match/MatchWinnerModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw, LayoutGrid, Award } from "lucide-react";
import { useGameSession } from "@/hooks/useGameSession";

interface MatchWinnerModalProps {
  winnerId: string;
  winnerName: string;
  isOpen: boolean;
  onRematch: () => void;
  onClose?: () => void;
}

// ボールペン手書き風トロフィーイラストSVG
function WinnerTrophyDoodle({ className = "w-14 h-14" }: { className?: string }) {
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
      <path d="M32 21 L34 26 L39 26 L35 29 L36.5 34 L32 31 L27.5 34 L29 29 L25 26 L30 26 Z" fill="#FFE066" />
      <path d="M10 9 L13 12 M54 9 L51 12 M32 5 V9" />
    </svg>
  );
}

export default function MatchWinnerModal({
  winnerId,
  winnerName,
  isOpen,
  onRematch,
}: MatchWinnerModalProps) {
  const {
    players: sessionPlayers,
    recordWin,
    resetSessionWins,
  } = useGameSession();
  // 1回の勝利につき1度だけ★を加算するためのフラグ
  const [recorded, setRecorded] = useState(false);

  // モーダルが開いたときに勝者へ「★+1」を記録する
  useEffect(() => {
    if (isOpen && winnerId && !recorded) {
      recordWin(winnerId, winnerName);
      setRecorded(true);
    }
    if (!isOpen) {
      setRecorded(false);
    }
  }, [isOpen, winnerId, winnerName, recorded, recordWin]);

  if (!isOpen) return null;

  // 通算★数が多い順番に並び替える
  const sortedPlayers = [...sessionPlayers].sort((a, b) => {
    if (b.totalWins !== a.totalWins) {
      return b.totalWins - a.totalWins;
    }
    return a.name.localeCompare(b.name);
  });

  // 「★リセット」ボタンが押されたときの処理
  const handleResetStars = () => {
    if (confirm("全員の通算★数を 0 にリセットしますか？")) {
      resetSessionWins();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2D42]/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-[#FAF6EB] border-[3px] border-[#2B2D42] rounded-3xl p-5 sm:p-7 shadow-[6px_8px_0_#2B2D42] text-[#2B2D42] overflow-hidden"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, #C5D6E8 27px, #C5D6E8 28px)",
          backgroundPosition: "0 12px",
        }}
      >
        {/* 勝者メインカード（白カード＋斜め蛍光イエロー帯＋手書きトロフィー） */}
        <div className="relative bg-white border-[2.5px] border-[#2B2D42] rounded-2xl p-5 mb-5 shadow-[3px_4px_0_#2B2D42] overflow-hidden text-left">
          <div
            className="absolute inset-y-0 right-0 w-[38%] pointer-events-none"
            style={{
              backgroundColor: "#FFE066",
              clipPath: "polygon(32% 0%, 100% 0%, 100% 100%, 0% 100%)",
            }}
          />

          <div className="relative z-10 pr-16">
            <span className="inline-block text-xs font-black text-[#2B2D42] bg-[#FFF275] px-2.5 py-0.5 rounded-md border-2 border-[#2B2D42] mb-2">
              勝者決定！
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2B2D42] leading-tight">
              {winnerName}
            </h2>
            <p className="text-xs font-black text-[#2B2D42]/80 mt-1.5">
              通算 ★ +1 獲得！
            </p>
          </div>

          <div className="absolute right-3 bottom-2 z-10 pointer-events-none">
            <WinnerTrophyDoodle className="w-14 h-14 sm:w-16 sm:h-16" />
          </div>
        </div>

        {/* 本日の通算ランキング（右上に★リセットボタン付き） */}
        <div className="mb-5 bg-white border-[2.5px] border-[#2B2D42] rounded-2xl p-4 shadow-[3px_4px_0_#2B2D42]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-[#2B2D42] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#2B2D42]" />
              <span>本日の通算ランキング</span>
            </h3>
            <button
              type="button"
              onClick={handleResetStars}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF6EB] hover:bg-[#FFADAD] border-2 border-[#2B2D42] text-[11px] font-black text-[#2B2D42] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>★リセット</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {sortedPlayers.map((player, index) => {
              const isWinner =
                player.id === winnerId || player.name === winnerName;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border-2 border-[#2B2D42] ${
                    isWinner
                      ? "bg-[#FFE066] text-[#2B2D42] font-black"
                      : "bg-[#FAF6EB] text-[#2B2D42] font-bold"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 text-left text-xs font-black">
                      {index + 1}位
                    </span>
                    <span className="truncate max-w-[140px]">{player.name}</span>
                    {isWinner && (
                      <span className="text-[10px] bg-white border border-[#2B2D42] px-2 py-0.5 rounded-full font-black">
                        +1勝
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-black">
                    <span>★</span>
                    <span className="text-base">{player.totalWins}</span>
                    <span className="text-xs text-[#2B2D42]/75 font-bold">勝</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 下部アクションボタン */}
        <div className="space-y-2.5">
          <button
            onClick={onRematch}
            className="w-full py-4 px-6 bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] font-black text-base sm:text-lg rounded-2xl border-[2.5px] border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>もう1戦！（リベンジ）</span>
          </button>

          <Link
            href="/"
            className="w-full py-3.5 px-6 bg-white hover:bg-[#FAF6EB] text-[#2B2D42] font-black text-sm rounded-2xl border-[2.5px] border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] flex items-center justify-center gap-2"
          >
            <LayoutGrid className="w-4 h-4 stroke-[2.5] text-[#2B2D42]" />
            <span>次の対戦ゲームを選ぶ（通算★引継）</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
```