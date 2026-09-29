# 2I情報処理基礎演習 — 2026年度Web教材

後期のJava入門のWeb教材です。シラバスに基づく第1回の初稿を作成しています。
計算機基礎演習の表示・編集・保存機能を引き継いでいます。

**第1回用のTeaVM実行環境を接続しました。通常のGitHub Pages用ビルドでもJavaを実行できます。**
最初に [HANDOFF.md](HANDOFF.md) を読んでください。

シラバスURLは [syllabus.txt](syllabus.txt)、後期16週の構成は [後期教材の構成](docs/後期教材の構成.md) に記録しています。
昨年度資料はありません。難易度と説明の量は計算機基礎演習を参考にしています。

## 起動

Node.js 24で確認しています。

```sh
cd /home/kengo/work/info2026
npm ci
npm run edit
```

- 教員の編集画面：`http://127.0.0.1:5174/__editor/lesson01`
- 学生向け表示：`http://127.0.0.1:5174/lesson01.html`
- 表示だけを開発する場合：`npm run dev`
- ポートが使用中なら、起動時に表示されるURLを使います。

実行用ファイルは `public/teavm/` に同梱済みです。初回セットアップやローカルJDKは不要です。
第1回の文字列表示、エラー表示、停止と再実行に対応しています。
Scannerの対話入力やGUIは、この版の授業用機能には含めません。
現在は `Main.java` / `Main` の1ファイル方式です。詳細は [Java実行環境の構築](docs/Java実行環境の構築.md) を参照してください。

本文・箇条書き・見本コードをブラウザ上で編集できます。
「原稿を保存」でMarkdownへ反映します。
見出し・メタデータ・出力例・演習の追加などはZedでMarkdownを編集します。

Zed側とブラウザ側に同時に変更がある場合、保存を止めて通知します。
ブラウザの編集内容を書き出してから最新の原稿を読み込んでください。
保存前の原稿は `.local/author-backups/` に残ります。

## ファイル

| 場所 | 内容 |
| --- | --- |
| `content/lesson01.md` | 後期第1回「Javaプログラミング入門」の初稿 |
| `templates/page.html` | 科目名、共通の構造、提出フォーム |
| `src/style.css` | 教材の見た目 |
| `src/main.js` | 入力欄、貼り付け禁止、自動保存、実行UI |
| `src/java-runtime.js`、`src/java-session.js` | 実行・入力・停止、Workerの管理 |
| `public/teavm/` | TeaVMの接続コード、実行用ファイル、ライセンス、対応ソース |
| `public/java/worker.js`、`java/` | 保管しているCheerpJ評価用の接続コード |
| `src/sample.js` | 見本コードをCanvasへ描画 |
| `src/export.js` | 氏名・出席番号・入力コードなどを含むHTML保存 |
| `scripts/`、`author/` | Markdown生成、教員用編集画面 |
| `docs/Javaブラウザ実行の調査.md` | 候補の比較と実測結果 |
| `references/` | 参照資料の扱い。昨年度資料はなし |

`index.html`、`lesson01.html`、`src/generated/` は生成物です。
これらの内容を直すときはMarkdownまたはテンプレートを編集してください。

## Markdownの記法

- 先頭のメタデータは `content/lesson01.md` の形式に合わせます。
- `## 見出し {#id}` が本文の区切りと左側の目次になります。
- `:::exercise first Main.java` 内の `java` コードフェンスが見本になります。
- コードを示さない課題は、空の `:::exercise task1` ブロックで作れます。
- 演習IDはページ内で一意にします。自動保存に使うため、運用開始後は不用意に変えません。
- `:::concepts`、`:::notice`、`:::expected`、`:::hint` などは元教材の記法を引き継いでいます。
- `:::about-language 画像URL | 説明` はロゴ付き説明用です。画像はまだ用意していません。
- 第2回は `content/lesson02.md` を追加して、開発サーバーを再起動します。
  - `/lesson02.html` が生成されます。
  - 各回を行き来するメニューの自動生成は未実装です。

## 確認・ビルド

```sh
npm test
npm run build
npm run build:pages
```

`build:pages` は `/info2026/` 配信用です。TeaVMによる実行が有効です。
GitHubリポジトリの作成と公開はまだ行っていません。
`npm run preview -- --host 127.0.0.1 --port 5177 --base=/info2026/` で静的ビルドを確認できます。
`dist/teavm/` のライセンスと対応ソースも含めて公開します。
手動実行用のActions例は `docs/deploy-pages.yml.example` に置いてあります。
公開するときに `.github/workflows/deploy.yml` へ移し、PagesのSourceをGitHub Actionsに設定します。

## 保存機能の範囲

- 入力コードの自動保存は、同じブラウザ・同じオリジン内に限られます。
  - キーは `info2026:lesson01:first` のように科目・回・演習で分けています。
- 教員の未保存下書きも、この科目専用のキーを使います。
- 出席番号と氏名は自動保存しません。
- 実行結果は再読み込みで復元しません。提出HTMLには表示中の結果を含めます。
- 提出HTMLには、本文、入力コード、表示中の実行結果、入力された氏名等、端末の時計とブラウザ情報を含めます。
  - 保存HTMLは閲覧用です。再実行機能や改ざん検証機能はありません。
  - PCのログイン名、学校アカウント、MACアドレスは取得しません。
- 見本のCanvas表示と貼り付け禁止は写経を促す仕組みです。
  - 開発者ツールやOCRでの取得までは防げません。
  - Canvasを読めない学生には別形式での提供が必要です。

教員用編集画面と保存APIは、ローカルの開発サーバーだけで動作します。
静的な配布物には編集APIは含まれません。
