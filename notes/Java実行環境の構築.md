# Java実行環境の構築

更新日：2026年9月29日

## 第1回で使う構成

標準の実行環境を **TeaVM + teavm-javac** に変更した。
ユーザーの追加依頼により、第1回の2コマで文字列表示・変数・基本演算・エラー確認を扱う。
CheerpJの学校利用条件の確認を、明日の第1回の前提にしない。

- Javaのコンパイル・WebAssemblyへの変換・実行を、ブラウザ内で行う。
- 必要なファイルはすべて教材と同じ場所から配信する。外部のJava実行APIやCDNは使わない。
- 約6.9 MBの実行用ファイルを同梱。対応ソース約28 MBは実行時には読み込まない。
- GitHub Pagesを想定した `/info2026/` 配下の静的構成に対応。
  - 特別なHTTPヘッダー、Service Worker、Java実行サーバーは不要。
- 通常の `npm run build` / `npm run build:pages` でもJava実行が有効。

## 起動と確認

Node.js 24を使う。通常の教材編集とビルドにはJDKやGradleは不要。
実行用ファイルは `public/teavm/` に同梱している。

```sh
npm ci
npm run edit
```

- 学生ページ：`http://127.0.0.1:5174/lesson01-1.html` と `/lesson01-2.html`
- 教員編集画面：`http://127.0.0.1:5174/__editor/lesson01-1` と `/__editor/lesson01-2`

GitHub Pagesと同じ構成を確認するには、次を実行する。

```sh
npm test
npm run build:pages
npm run preview -- --host 127.0.0.1 --port 5177 --base=/info2026/
```

確認先：`http://127.0.0.1:5177/info2026/lesson01-1.html` と `/lesson01-2.html`

ビルド前に、実行用ファイルと対応ソースのSHA-256、ライセンス文書の存在を確認する。
公開先は <https://ota.github.io/info2026/lesson01-1.html> と <https://ota.github.io/info2026/lesson01-2.html>。
`ota/info2026` のActions「Deploy GitHub Pages」を手動実行して更新する。
実行用ファイル・ライセンス・対応ソースは同じPagesサイトから配信する。

## 確認した範囲と制約

- 第1回・1コマ目の見本3つと課題3問、2コマ目の見本3つと課題3問。
  - Hello World、日本語、型付き変数、自己紹介、空白を使う山形模様。
  - 四則演算、整数の割り算と余り、文字列の連結・繰り返し、型変換、面積計算。
  - printとprintln、改行なしの出力、絵文字、標準エラー出力。
- コンパイルエラーのファイル名・行・列、クラス名不一致、mainの書き忘れ、実行時エラー。
- 無限ループ停止、停止後の再実行、出力過多による停止後の復帰。
- 貼り付け禁止、再読み込み後のコード復元、見本のCanvas描画、提出HTML保存。
- Linux Chrome 149の開発版と、通常のPages用静的ビルドで検証。
  - 静的版は `teavm.org` とCheerpJ CDNへの接続を遮断して検証する。

制約は次のとおり。

- `Main.java` / `public class Main` の1ファイル方式。packageを付けない。
- GUI、複数ファイル、Scannerの対話入力は、この版の授業用機能として提供しない。
- 第2回以降の利用範囲は、その回を作るときに検証する。
  - 以前の公式デモではScanner、小数のprintf、一部の例外に問題があった。
  - 今回はソースからビルドし、学生コードの変換では `strictMode: true` を指定している。
  - 古いデモの検証結果と今回の版を同一視しない。
- 準備を含めて2分、出力10万文字で自動停止する。
- 実行ごとにWorkerを作り直す。停止時にはそのWorkerを終了する。
- 改行なしの短いprint出力は、実行終了時に確実に表示する。
  - 実行途中の部分出力は改行または1024文字で表示する。
- 再読み込みで復元するのはコード。実行結果は提出HTMLで保存する。
- 演習室の端末と他のブラウザ、一斉アクセスは未確認。

## ライセンスと対応ソース

上流READMEではteavm-javacはApache License 2.0、組み込むOpenJDK部分はGPLv2＋Classpath Exceptionと説明されている。
根拠：[teavm-javacのREADME](https://github.com/konsoletyper/teavm-javac#license)。

対応ソースを特定できるよう、デモサイトのバイナリを配布する方法は使わず、次の版からビルドした。

| 対象 | 使用版 |
| --- | --- |
| teavm-javac | `2ddcf02e4983e5c74d45b945c2fd41a829358828` |
| TeaVM | 0.13.1 |
| OpenJDKコンパイラのソース | `6c48f4ed707bf0b15f9b6098de30db8aae6fa40f` |
| ビルド用JDK | Temurin 25.0.4.1+1 |
| Gradle | 9.1.0（上流Wrapper） |

`public/teavm/` には、次の文書とソースを実行用ファイルと一緒に置いている。
公開時も省かない。ページ末尾から参照できる。

- `NOTICE.txt`：使用ソフトウェアと対応ソースの案内。
- `THIRD-PARTY-LICENSES.txt`：Apache、GPL、Classpath Exception、MPL、BSD等の通知。
- `sources.zip`：teavm-javac、使用したOpenJDK部分とビルドツール、TeaVM、依存ライブラリの対応ソース。
- `SOURCE-BUILD.md`：再ビルド手順。
- `manifest.json`：出典、依存ライブラリ一覧、SHA-256。

同梱ソースから、OpenJDKの再取得を除外し、依存キャッシュを使うオフラインビルドも成功。
最終配布物にはこのビルド結果を採用した。

上流のコンパイラソースは変更していない。`public/teavm/worker.js` は教材側で作った接続コード。
パッケージ処理は `scripts/package-teavm.py`、依存ソース収集は `scripts/teavm-dependencies.init.gradle`。

## 再検証

検証専用Chromeを `--remote-debugging-port=9224` と専用の `--user-data-dir` で起動する。

```sh
node tests/browser/teavm-runtime.mjs
LESSON_URL=http://127.0.0.1:5177/info2026/lesson01-1.html BLOCK_EXTERNAL_RUNTIME=1 node tests/browser/teavm-runtime.mjs
```

保存・競合防止とWorkerの状態管理は `npm test`。

CheerpJによる標準入力等の調査は [CheerpJ評価環境の記録](CheerpJ評価環境の記録.md) に残した。
必要な場合だけ `npm run setup:java` の後に `npm run dev:cheerpj` で起動する（ポート5176）。
学校利用条件が未確認のため、この評価環境を授業・公開用として使わない。
