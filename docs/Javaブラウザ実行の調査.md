# Javaをブラウザで実行する方式の調査

調査日：2026年9月29日  
対象：2I情報処理基礎演習のJava入門教材

## 結論

**最新の追記：明日の第1回に範囲を絞り、TeaVM + teavm-javacを標準構成に変更した。**
第1回だけでよいことをユーザーに確認し、ソースからビルドした版で全見本・課題を検証。
ライセンス文書と対応ソースを同梱し、通常のPages用ビルドでも実行可能。
詳細は [Java実行環境の構築](Java実行環境の構築.md)。以下は切り替え前の調査履歴。

**追記（2026年9月29日）：CheerpJ 4.3・Java 8をローカル評価用に接続した。**
Scannerの対話入力、停止・再実行を含む実装と検証は [Java実行環境の構築](Java実行環境の構築.md) を参照。
以下は接続前の候補比較の記録。学校での利用条件は引き続き未確認。

**学生が入力したJavaコードを、ブラウザ内でコンパイルして実行することは可能。**
既存のC教材と同様に、コード入力欄と実行結果を教材ページ内に配置できる。

技術面では **CheerpJが第一候補**。
ただし、学校としての利用条件を確認してから採用を決める必要がある。
JavaBoxも動作したが、配信方法と運用面の検証が多く残る。

## 比較

| 方式 | 今回確認した動作 | 主な課題 | 現時点の判断 |
| --- | --- | --- | --- |
| CheerpJ 4.3 | ブラウザ内のjavacによるコンパイル、日本語表示、クラス、配列、ループ、printf、Scanner、例外処理 | 学校利用のライセンス条件、実行途中の入力欄との接続 | 条件が合えば第一候補 |
| TeaVM + teavm-javac | ブラウザ内コンパイル、基本構文、日本語表示、クラス | 公式デモの構成ではScannerが使えず、浮動小数点のprintfと例外処理にも問題 | 現状のデモをそのまま授業用に採用するのは見送る |
| JavaBox | ブラウザ内コンパイル、基本構文、printf、例外処理、実行途中のScanner入力 | 配信サイズ、特殊なHTTPヘッダー、安定性、配布条件の確認 | 第二候補として追加検証する余地あり |

方式の説明は、[CheerpJ公式ドキュメント](https://cheerpj.com/docs/overview.html)、[teavm-javacリポジトリ](https://github.com/konsoletyper/teavm-javac)、[JavaBoxリポジトリ](https://github.com/bmarti44/javabox)を参照。
動作結果は今回の実測。

## 1. CheerpJ

### 仕組みと公開方法

- WASMを利用するJava実行環境で、公式にはJava 8・11・17に対応。
- 公開デモのJavaFiddleは、ブラウザ内でjavacを実行して入力コードをコンパイルしている。
- 今回はJavaFiddleのJava 8構成で動作を確認した。
  - Java 11・17の構成は今回未検証。
- 教材のHTML・JavaScript・必要なJARを静的に配信できるため、GitHub Pagesを使う構成が可能と判断できる。
  - コンパイル用のサーバーは不要。
  - 今回の検証は公式デモ上で行い、自分のGitHub Pagesへの組み込みは未実施。

根拠：[対応バージョン](https://cheerpj.com/docs/overview.html)、[JavaFiddleの実装](https://github.com/leaningtech/javafiddle/blob/main/src/lib/CheerpJ.svelte)。

### 動作確認

Linux上のChrome 149をヘッドレスで操作し、[JavaFiddle](https://javafiddle.leaningtech.com/)の実行環境にテストコードを渡した。

| テスト | 結果 |
| --- | --- |
| 配列、for、if、メソッド、クラスとコンストラクタ | 成功 |
| 日本語の文字列表示 | 成功 |
| `System.out.printf("%d %.2f %s%n", 10, 3.14, "日本語")` | `10 3.14 日本語` と改行を出力 |
| `Scanner.nextInt()` と `nextLine()` | 整数12、日本語文字列「太田」の読み取りに成功 |
| 整数のゼロ除算を `ArithmeticException` で捕捉 | 成功 |
| 配列の範囲外アクセスを例外として捕捉 | 成功 |
| セミコロン欠落 | javacが位置付きのエラーを出力 |

Scannerのテストでは、事前に用意したUTF-8の文字列を `ByteArrayInputStream` に入れ、`System.setIn(...)` で渡した。
**実行途中に学生が入力欄へ打ち込む操作は、CheerpJではまだ検証していない。**

### 起動時間と通信量

- HTTPキャッシュと関連するサイトストレージを消去して、公式デモを読み込んだ。
- Hello Worldの出力まで約4.2秒、通信量は約22.7 MBだった。
  - デモの画面用ファイルなども含むChromeのネットワーク計測値。
  - 使用するクラスによって追加ダウンロードが発生するため、教材全体の必要容量を示す数値ではない。
- 起動後の小さなテストでは、コンパイルと実行の合計が約1.3〜1.7秒だった。
- いずれも今回のPC・回線での測定値。
  - 演習室の端末性能、外部サイトへの接続制限、一斉アクセス時の速度は別途確認する。

### 利用条件

公式の利用条件では、個人・FOSSプロジェクト・技術評価向けの無償利用枠がある。
一方、教育機関として内部向け・公開向けのシステムに使う場合は、個別見積もりの問い合わせ対象として記載されている。
したがって、今回の授業で無償利用できるとは現段階で断定しない。

Community Licenseでは公式CDNから実行環境を読み込む。
実行環境そのものを自己ホストする場合はCommercial Licenseが必要。
今回、提供元への問い合わせは行っていない。

根拠：[CheerpJの利用条件](https://cheerpj.com/docs/licensing)。

## 2. TeaVM + teavm-javac

### 動作と問題点

teavm-javacは、javacとTeaVMを使ってブラウザ内でJavaソースから実行用WASMを生成する方式。
[公式Playground](https://teavm.org/playground.html)の `/playground/3/` 配下の構成を検証した。

- Hello World、クラスとコンストラクタ、メソッド、配列、分岐、反復、日本語表示は動作した。
- セミコロン欠落のコンパイルエラーも表示された。
- `java.util.Scanner` は `cannot find symbol` になった。
- `System.setIn(...)` もコンパイル時に見つからなかった。
- `%d %.2f %s%n` を使うprintfはコンパイルできたが、実行時に `java.text.DecimalFormat` 内でWASMのnull参照エラーになった。
- 整数のゼロ除算は `catch (ArithmeticException ...)` で捕捉できず、WASMの `divide by zero` で停止した。

以上は**今回の公式デモの構成での結果**。
TeaVM全体で解決不可能という意味ではないが、設定変更や不足機能の補完で解決するかは未検証。
初学者のコードが通常のJavaと異なる動作をする状態では、授業への採用が難しい。

主要4ファイルのContent-Length合計は約6.9 MBだった。
これはUIなどを除くファイルサイズの合計で、CheerpJの初回通信量とは測定範囲が異なる。

ライセンスは、プロジェクトのApache 2.0に加え、組み込まれたOpenJDK由来部分のGPLv2＋Classpath Exceptionなどを確認する必要がある。
根拠：[teavm-javacの説明とライセンス表記](https://github.com/konsoletyper/teavm-javac)。

## 3. JavaBox

OpenJDK 21のZeroインタープリタをWASMにした方式。
コンパイルも実行もブラウザ内で行う。
配布済みの実行ファイル一式は約76 MBと説明されている。
また、内部スレッドに既知の制約がある。
根拠：[JavaBox README](https://github.com/bmarti44/javabox)。

[公開デモ](https://javabox-demo.brian-fec.workers.dev/)で、次を確認できた。

- クラス、コンストラクタ、配列、分岐、反復、日本語表示。
- 浮動小数点を含むprintf。
- ゼロ除算と配列の範囲外アクセスの例外捕捉。
- **プログラムがScannerで入力を待ってから、ブラウザ側から整数と日本語文字列を送信し、実行を続ける動作。**
  - デモの入力用APIをテストスクリプトから呼び出して確認した。
  - 学生の実際のキー操作や日本語IME操作は未検証。

GitHub Pagesへの設置には工夫が必要。

- JavaBoxはSharedArrayBufferとCOOP・COEPというHTTPレスポンスヘッダーを要求する。
- GitHub Pagesには任意のレスポンスヘッダーを設定する標準機能がない。
- Service Workerで補う方法はあるが、JavaBoxとの組み合わせは未検証。
  - 初回の自動再読み込み、キャッシュ更新、教材ごとの適用範囲を考慮する必要がある。
- ヘッダーを設定できる静的ホスティングも選択肢になる。

根拠：[JavaBoxの配信要件](https://github.com/bmarti44/javabox)、[GitHub側の回答](https://github.com/orgs/community/discussions/54257)、[coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker)。

授業向けの長時間利用、繰り返し実行、配布物のライセンス確認は未完了。
今回の動作確認だけで本番採用を決める段階にはない。

## 現在の教材から引き継げるもの

- Markdownからの教材生成と編集プレビュー。
- サンプルコード表示、写経用の入力欄、貼り付け禁止。
- 入力コードのブラウザへの自動保存。
- 出席番号・氏名と入力内容を含めた提出ファイルの保存。
- 各回の固定URL。

Java用に追加・調整する部分は次のとおり。

- C用のコンパイラ・実行部分をJava用に差し替える。
- クラス名とファイル名を対応させる。
- コンパイルエラー、標準出力、実行時例外を表示する。
- Scannerを使う回には、標準入力用の欄を用意する。
  - CheerpJなら、まずは実行前に入力内容を用意する方式が今回の検証に近い。
  - 対話入力が必要なら、その接続を先に試作する。
- 無限ループを止められるようにし、停止後にも再実行できる構成にする。
  - CheerpJにはWeb Worker対応があるが、この教材での停止・復帰は未実装・未検証。
  - 参考：[公式のWorker使用例](https://cheerpj.com/docs/migrating-from-cheerpj2.html)。
- 自動保存のキーを科目・回・演習で分ける。
- 保存した提出ファイルを再度開いたときに、コードと出力を確認できることを検証する。
  - 外部の実行環境を使う場合、保存ファイルだけでオフライン再実行までできるとは限らない。

## おすすめの進め方

1. **授業で使うJavaの範囲とCheerpJの利用条件を確認する。**
   - 特にScannerの対話入力、複数ファイル、GUIの有無を整理する。
2. 条件が合えば、`info2026` にCheerpJを組み込んだ1問だけの試作を作る。
   - 出力、入力、エラー、無限ループ停止、自動保存まで確認する。
3. 演習室のPCで、初回起動・再実行・日本語入力・リロード復帰を確認する。
4. 動作を確認してから、第1回以降の教材を移す。

CheerpJの条件が合わない場合は、JavaBoxの配信方法・配布条件を次に検証する。
TeaVMの不足機能を教材側で補う案は、授業内容への影響と保守作業が大きくなりやすいため、現時点では優先しない。
