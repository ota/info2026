# CheerpJ評価環境の記録

この文書はTeaVMへの切り替え前の記録です。現在の授業用構成は [Java実行環境の構築](Java実行環境の構築.md) を参照。
CheerpJは `npm run setup:java` → `npm run dev:cheerpj`（ポート5176）でローカル評価時だけ起動します。
以下の通常起動・ビルドの記述は当時のものです。

更新日：2026年9月29日

## 現在の構成

ローカルでの技術評価用に、CheerpJ 4.3・Java 8を接続した。
コンパイラはTemurin OpenJDK 8u504-b01の `tools.jar`。
学生のプログラムはブラウザ内でコンパイル・実行する。
Javaを実行するサーバーや、コンパイル用の外部APIは使用しない。

- 教材の「実行する」で開始し、「停止する」でWorkerを終了する。
- 実行ごとに新しいWorkerを作る。前のクラス定義や入力待ちを引き継がない。
- 標準出力と標準エラーは、同じ実行結果欄に出た順で表示する。
- `Scanner` などが標準入力を要求したとき、入力欄を表示する。
  - 1行ずつ送信する。空行も送信できる。
  - 「入力を終了」でEOF（これ以上入力がない状態）を送る。
  - 入力中の日本語の変換確定では送信しない。実際の日本語IME操作は演習室で要確認。
- 準備・入力待ちを含めて2分で自動停止する。出力は10万文字で停止する。
- 実行中のコード欄は読み取り専用。停止後に編集を再開できる。
- ファイル名と実行するクラスは `Main.java` / `Main`。`package` は付けない。
  - 同じファイルに、publicでない補助クラスを書くことはできる。
  - 複数ファイルやGUIの入力・描画は未対応。
- 再読み込みで復元するのは入力コード。実行途中の状態・出力・標準入力は復元しない。
- 提出HTMLには、コード・表示中の出力・送信済みの標準入力を含める。
  - 保存したHTMLは閲覧用。Java実行スクリプトは含めない。

## 起動

Node.js 24を使う。

```sh
npm ci
npm run setup:java
npm run edit
```

`setup:java` は公式Temurin配布物（約104 MB）を取得し、SHA-256を確認する。
コンパイラ・対応ソース・ライセンスを `.local/java-runtime/` に展開する。展開には `tar` が必要。
このディレクトリはGit管理しない。初回セットアップにはインターネット接続が必要。

Javaとの入出力をつなぐ `public/java/bridge.jar` は、このリポジトリの `java/edu/info2026/Runner.java` から生成したもの。
通常の教材編集・実行にはローカルJDKは不要。橋渡しコードを変更するときだけ再生成する。

```sh
JAVA_BIN=/usr/lib/jvm/java-21-openjdk-amd64/bin/java npm run build:java-bridge
```

生成にはコンパイラとjarツールを含むJDK 9以降が必要。Java 8用のバイトコードを出力する。

## GitHub Pagesを想定した確認

CheerpJは静的なHTTP配信で利用できる。公式文書はHTTPSとJARのRangeリクエスト対応を要求している。
根拠：[CheerpJのサーバー要件](https://cheerpj.com/docs/guides/basic-server-setup)。

今回の構成では、コンパイラは `fetch` で全体を取得して仮想ファイルに渡す。
独自のCOOP・COEPヘッダーやService Workerは使わない。
URLはベースパスを使って構成し、`/info2026/` 配下でWorkerとJARを読み込めるようにした。

```sh
npm run build:evaluation
npm run preview:evaluation
```

- URL：`http://127.0.0.1:5175/info2026/lesson01.html`
- 出力先：`.local/pages-evaluation/info2026/`
- この評価ビルドにはコンパイラ・ソース・ライセンスを含む。
- 開発サーバーの編集APIやコンパイル用サーバー処理に依存しない。
- 評価ビルドでのJava実行はlocalhostに限定している。授業配布・公開には使わない。
- `npm run build` / `npm run build:pages` は、現時点ではJava実行無効の配布物を生成する。
  - `tools.jar` は含めない。教材表示・コード入力・提出HTML保存は利用できる。

実際のGitHub Pagesへの配置・公開は行っていない。
公開時には実URLでのJAR取得、キャッシュ更新、実行・停止・再実行を再確認する。

## 利用条件と配布物

- CheerpJ本体は公式CDN `https://cjrtnc.leaningtech.com/4.3/loader.js` から読み込む。
  - 実行環境を自己ホスト・再配布しない。ページ末尾に提供元リンクを表示。
- 公式の説明では技術評価が利用対象に含まれる一方、教育機関の内部・公開システムは問い合わせ対象。
  - 学校利用の無償可否は未確認。第三者への問い合わせは行っていない。
  - 根拠：[CheerpJの利用条件](https://cheerpj.com/docs/licensing)。
- コンパイラは公式Temurinの配布物から取り出した未変更の `tools.jar`。
  - 元配布物：[Temurin 8u504-b01](https://github.com/adoptium/temurin8-binaries/releases/tag/jdk8u504-b01)。
  - 配布アーカイブSHA-256：`9c70e102f527ac674ac2fe9c7d47b9a04e2d19842ba5ab8e9b33f368bbadfaea`
  - `tools.jar` SHA-256：`f2599fc78dcbfadefc1cb6b79e05d281e090217ac0139d50b792d72bf1130af4`
  - GPLv2本文・例外・第三者通知・対応ソース `src.zip` を一緒に保存する。
  - 公開前に、配布範囲に対応したソース提供と通知の扱いを最終確認する。
- 初期検討に使ったJavaFiddleのOracle製 `tools.jar` は現在の構成には使用しない。
- Java 17構成では `ToolProvider.getSystemJavaCompiler()` がnullだったため、Java 8構成にした。

## 検証

LinuxのChrome 149で次を確認するブラウザテストを用意した。

- 日本語・絵文字の標準出力、標準エラー。
- セミコロン欠落、public class名とファイル名の不一致、実行時例外。
- Scannerの実行途中の数値・日本語入力、EOF。
- 無限ループの停止、停止後の再実行、出力過多の自動停止。
- 配列、分岐、ループ、クラス、コンストラクタ、printf。
- 貼り付け禁止、コードの再読み込み復元、提出HTMLへの出力・標準入力保存。

検証専用Chromeを `--remote-debugging-port=9224` と専用 `--user-data-dir` で起動し、次を実行する。

```sh
node tests/browser/java-runtime.mjs
LESSON_URL=http://127.0.0.1:5175/info2026/lesson01.html node tests/browser/java-runtime.mjs
```

保存・競合防止のテストとWorkerの状態管理テストは `npm test`。
演習室の端末、他ブラウザ、一斉アクセス、長時間の授業利用は別途確認する。
