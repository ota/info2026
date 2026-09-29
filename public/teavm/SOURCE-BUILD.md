# TeaVMコンパイラの対応ソースとビルド方法

同じディレクトリの `sources.zip` に、使用したソースとビルド設定を同梱しています。

- teavm-javac：`2ddcf02e4983e5c74d45b945c2fd41a829358828`。ソースの変更なし。
- TeaVM：0.13.1。全ソースアーカイブと、使用した各ライブラリのソースJARを同梱。
- OpenJDK：`6c48f4ed707bf0b15f9b6098de30db8aae6fa40f`。
  - コンパイラで使う全ソース、コンパイラ用ビルドツール、ライセンスを元のZIP構造で同梱。
  - 選択範囲は `javac/build.gradle` と `lesson-build/package-teavm.py` に記載。
- その他の依存ソース：`dependency-sources/`。版は `dependencies.json` を参照。
- 統合用Workerは自作で、同じディレクトリの `worker.js` がそのソースです。

JDK 25、インターネット接続を用意し、展開後の `teavm-javac` で次を実行します。
Gradle WrapperがGradle 9.1.0と指定版の依存ライブラリを取得します。

```sh
./gradlew :compiler:createDist -x :javac:downloadJDK --no-daemon
```

結果は `compiler/build/distributions/dist.zip`。
`-x :javac:downloadJDK` により、同梱したOpenJDKソースZIPを使い、元の大きなアーカイブを再取得しません。
教材で使用するのは、その中の `compiler.wasm`、`compiler.wasm-runtime.js`、
`compile-classlib-teavm.bin`、`runtime-classlib-teavm.bin` の4ファイルです。
デバッグ情報と逆難読化用ファイルは教材では読み込みません。

教材では、学生のコードを変換するときに `strictMode: true` を指定しています。
コンパイラ本体のビルド設定は上流のままです。

教材の配布一式を作り直す場合は、次の依存ソース収集とパッケージ処理も実行します。

```sh
./gradlew :compiler:lessonDependencySources --init-script ../lesson-build/teavm-dependencies.init.gradle --no-daemon
```

`package-teavm.py` は教材リポジトリのルートを基準に配置するスクリプトです。
ソースバンドル内には処理内容を確認できるように同梱しています。
上流URL、ライブラリ一覧、教材の実行用4ファイルのSHA-256は `manifest.json` に記載しています。
