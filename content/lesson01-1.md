---
title: 第1回・1コマ目　Javaプログラミング入門
pageTitle: 第1回①｜Javaプログラミング入門
number: 01-1
term: 後期 · Q3
subhead: 後期 第1回・1コマ目
footer: 後期 第1回・1コマ目 / Javaプログラミング入門
---

## 今回の目標 {#goals}

:::goals
- Javaを実行する | 基本の形を書き写し、実行結果を確かめる。
- 値を表示する | 文字列や数値を表示し、改行を使い分ける。
- 変数を使う | 出席番号と氏名を変数に入れて表示する。
:::

:::howto 演習の進め方
- 見本コードを見ながら、その下の入力欄に自分で打ち込みます。
  - 入力欄への貼り付けはできません。
- 「実行する」を押し、表示された結果を確かめます。
  - 最初の実行は準備に少し時間がかかります。
  - 終わらないときは「停止する」を押します。
- コードは使っているブラウザに自動保存されます。
  - 同じブラウザで開き直すと、入力を続けられます。
- 最後に出席番号と氏名を入力し、提出用HTMLを保存します。
  - 保存したファイルをMoodleへ提出します。
:::

## Javaとは {#about-java}

- 前期に学んだPythonと同じく、Javaはコンピュータに処理の手順を伝える「プログラミング言語」です。
- プログラムを書いた文字の並びを「ソースコード」と呼びます。
  - Javaのソースコードは、名前の末尾が `.java` のファイルに保存します。
- ソースコードを実行用の形式へ変換することを「コンパイル」と呼びます。
  - 書き方に誤りがあると、コンパイル時にエラーが表示されます。
  - この教材では、入力欄の下の「実行する」でコンパイルと実行を行います。

## Hello World {#first-code}

まずは次のプログラムを、記号と大文字・小文字に注意して書き写しましょう。

:::exercise first Main.java
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```
:::

:::expected
Hello, World!
:::

:::concepts
- `public class Main { ... }` はプログラムを入れる外側のまとまりです。
  - このまとまりを「クラス」と呼びます。名前は `Main`、ファイル名は `Main.java` にします。
- `public static void main(String[] args) { ... }` の中に、最初に実行する処理を書きます。
  - この行は、今回は基本の形としてそのまま使います。
- `System.out.println(...)` は、括弧の中の値を表示して改行します。
  - 文字の並びを「文字列」と呼び、半角の二重引用符 `"` で囲みます。
  - 命令の最後には半角のセミコロン `;` を付けます。
- `{` と `}` は処理のまとまりを囲みます。
  - 内側の行の先頭を空けると、まとまりが分かりやすくなります。
:::

:::check
`Hello, World!` を `こんにちは、Java！` に書き換えて実行しましょう。
二重引用符 `"` は残します。
:::

## 数値と文字列を表示する {#values}

データの種類を「型」と呼びます。まずは、整数・小数・文字列の違いを見ます。

:::exercise print-lines Main.java
```java
public class Main {
    public static void main(String[] args) {
        System.out.println(7);
        System.out.println(3.5);
        System.out.print("こんにちは、");
        System.out.println("Java！");
        System.out.println("🐈");
    }
}
```
:::

:::expected
```
7
3.5
こんにちは、Java！
🐈
```
:::

:::concepts
- `7` は整数、`3.5` は小数です。数値は二重引用符で囲みません。
  - Javaでは整数に `int`、小数に `double` という型を使います。
- `"こんにちは、"` や `"🐈"` は文字列です。文字列の型は `String` と書きます。
  - 二重引用符の内側には日本語や絵文字も書けます。
- `System.out.print(...)` は表示した後に改行しません。
  - 次の `println` の内容が同じ行の続きに表示されます。
:::

:::check
最初の `print` を `println` に変えると、表示は何行になるでしょうか。
実際に変えて確認しましょう。
:::

## 変数を使う {#variables}

値を入れて、後から使える名前を「変数」と呼びます。Javaでは、変数を作るときに型も書きます。

:::exercise variables Main.java
```java
public class Main {
    public static void main(String[] args) {
        int number = 12;
        String name = "山田花子";
        System.out.print("出席番号 ");
        System.out.print(number);
        System.out.print(" 番の ");
        System.out.print(name);
        System.out.println(" です。");
    }
}
```
:::

:::expected
出席番号 12 番の 山田花子 です。
:::

:::concepts
- `int number = 12;` は、整数型の変数 `number` に `12` を入れます。
- `String name = "山田花子";` は、文字列型の変数 `name` に氏名を入れます。
  - Javaの `String` は先頭が大文字です。
- `System.out.print(number)` は、変数の中の値を表示します。
  - `"number"` と書くと、変数の値ではなく `number` という文字が表示されます。
- 変数名には英字、数字、`_` を使えます。ただし、先頭を数字にはできません。
:::

:::check
`number` と `name` の値を自分の出席番号・氏名に変えて実行しましょう。
:::

## エラーを確かめる {#errors}

最初の見本で `println` の行末の `;` を消し、実行してみましょう。
エラーを確認したら、`;` を戻して再実行します。

- エラーが出たら、表示された行とその前後を見ます。
  - `;`、二重引用符 `"`、括弧 `()`・`{}` の抜けを確かめます。
  - `System` と `String` は先頭が大文字です。
- 記号は半角で入力します。文字列の中の日本語や全角記号は使えます。
- 直した後は、エラーが消えるだけでなく、表示結果も確認します。

## 演習問題 {#challenge}

各課題では、`public class Main` から最後の `}` までプログラム全体を入力します。

### 課題1　好きな文字列

`Hello, World!` 以外の好きな文字列を1行表示してください。

:::exercise task1
:::

### 課題2　変数で自己紹介

出席番号を `number`、氏名を `name` という変数に入れ、次の形で表示してください。
数字や名前は自分のものに変えます。

:::expected
出席番号 12 番の 山田花子 です。
:::

:::exercise task2
:::

### 課題3　山形模様

半角の空白と `*` を使い、次の3行を表示してください。

:::expected
```
  *
 ***
*****
```
:::

:::exercise task3
:::

:::hint
- 課題1：最初の見本の二重引用符の内側を変えます。
- 課題2：`int` と `String` の変数を一つずつ作り、`print` と `println` で表示します。
- 課題3：`println` を3回使います。空白も二重引用符の内側に書きます。
:::

## 1コマ目のまとめ {#summary}

- `main` の中に実行する処理を書き、命令の最後に `;` を付ける。
- 文字列は半角の二重引用符 `"` で囲み、数値は囲まない。
- `println` は改行し、`print` は改行しない。
- Javaの変数には、`int` や `String` などの型を書く。

続いて[2コマ目「演算子と変数」](./lesson01-2.html)へ進みます。
