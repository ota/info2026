---
title: 第1回・2コマ目　Javaプログラミング入門
pageTitle: 第1回②｜Javaプログラミング入門
number: 01-2
term: 後期 · Q3
subhead: 後期 第1回・2コマ目
footer: 後期 第1回・2コマ目 / Javaプログラミング入門
---

## 今回の目標 {#goals}

:::goals
- 数値を計算する | 四則演算と、割り算の答えや余りを確認する。
- 文字列を扱う | `+` でつなぎ、数値との違いを見る。
- 変数で計算する | 面積の計算結果を変数に入れて表示する。
:::

:::howto 演習の進め方
- [1コマ目](./lesson01-1.html)の `Main` と `main` の形を使います。
- 見本を入力して「実行する」を押し、表示結果と比べます。
  - 入力欄への貼り付けはできません。
- 最後にこのページの出席番号と氏名を入力し、提出用HTMLを保存します。
  - 1コマ目とは別のファイルです。提出先は授業中の指示に従ってください。
:::

## 1コマ目のおさらい {#review}

- 文字列は `"..."` で囲み、整数は囲みません。
- `int number = 12;` は、整数型の変数 `number` に `12` を入れます。
- `System.out.println(...)` は値を表示した後に改行します。

:::check
1コマ目の課題2で、出席番号や氏名を変数から表示できたか確認しましょう。
うまく動かなかった場合は、[1コマ目のページ](./lesson01-1.html)で直してから進みます。
:::

## 数値の計算 {#arithmetic}

`+`、`-`、`*`、`/` は、足し算・引き算・掛け算・割り算を表す「演算子」です。
`%` は割り算の余りを求めます。

:::exercise arithmetic Main.java
```java
public class Main {
    public static void main(String[] args) {
        int a = 7;
        int b = 2;
        System.out.println(a + b);
        System.out.println(a - b);
        System.out.println(a * b);
        System.out.println(a / b);
        System.out.println(a % b);
        System.out.println(7.0 / 2);
        System.out.println(Math.pow(2, 8));
    }
}
```
:::

:::expected
```
9
5
14
3
1
3.5
256.0
```
:::

:::concepts
- `int` 同士の `/` は、小数部分を切り捨てた整数になります。`7 / 2` は `3` です。
  - 前期のPythonで整数の割り算に使った `//` は、Javaでは使いません。
- `7.0` は小数型 `double` の値です。`7.0 / 2` は `3.5` になります。
- `%` は余りです。`7 % 2` は `1` になります。
- `Math.pow(2, 8)` は2の8乗を求めます。結果は小数型なので `256.0` と表示されます。
  - 前期のPythonで累乗に使った `**` は、Javaでは使いません。
:::

:::check
`a` を `10`、`b` を `3` に変え、割り算の答えと余りを確認しましょう。
:::

## 文字列と数値 {#strings}

Javaでも、文字列同士は `+` でつなげられます。ただし、数値の足し算とは結果が違います。

:::exercise strings Main.java
```java
public class Main {
    public static void main(String[] args) {
        String word = "Java";
        System.out.println(word + "入門");
        System.out.println(1 + 2);
        System.out.println("1" + "2");
        System.out.println("★".repeat(5));
        int number = Integer.parseInt("12");
        System.out.println(number + 3);
    }
}
```
:::

:::expected
```
Java入門
3
12
★★★★★
15
```
:::

:::concepts
- `1 + 2` は整数の足し算、`"1" + "2"` は文字列をつなぐ処理です。
- `"★".repeat(5)` は、文字列を5回繰り返します。
  - Pythonの文字列で使った `*` は、Javaの文字列には使えません。
- `Integer.parseInt("12")` は、数字の文字列 `"12"` を整数に変えます。
  - 数字以外の文字列は、整数に変えられません。
:::

:::check
`"12"` を `"7"` に変えると、最後の行は何と表示されるでしょうか。
:::

## 代入と面積 {#variables}

変数へ値を入れる `=` を「代入」と呼びます。`=` の右側には計算を書くこともできます。

:::exercise area Main.java
```java
public class Main {
    public static void main(String[] args) {
        int base = 5;
        int height = 10;
        int area = base * height;
        System.out.println(area);
        int count = 1;
        count = count + 1;
        System.out.println(count);
    }
}
```
:::

:::expected
```
50
2
```
:::

:::concepts
- `area = base * height` は、底辺と高さの積を `area` に入れます。
- `count = count + 1` は、今の `count` に1を足した結果を、もう一度 `count` に入れます。
  - 数学の「左右が等しい」という意味ではありません。
  - `count += 1` と短く書くこともできます。
- 変数を作るときは `int` を付けます。すでにある変数に入れ直すときは付けません。
:::

:::check
`count = count + 1;` を `count += 1;` に書き換え、結果が同じことを確かめましょう。
:::

## 演習問題 {#challenge}

各課題で `Main` クラスと `main` を含むプログラム全体を書きます。

### 課題1　好きな文字列を10回

好きな短い文字列を `String word` に入れ、`repeat(10)` で10回続けて表示してください。

:::exercise task1
:::

### 課題2　三角形の面積

底辺を `base` に `3`、高さを `height` に `5` として、三角形の面積を求めてください。
答えは小数を含めて表示します。

:::expected
7.5
:::

:::exercise task2
:::

### 課題3　円の面積

半径 `3` を変数 `r` に入れ、円の面積を計算してください。
円周率には Java の `Math.PI` を使います。

:::exercise task3
:::

:::hint
- 課題1：`System.out.println(word.repeat(10));` と書けます。
- 課題2：`double base = 3;`、`double height = 5;` とし、`base * height / 2` を使います。
- 課題3：円の面積は「半径 × 半径 × 円周率」です。`Math.PI * r * r` と書けます。
:::

余裕があれば、`10,000` 秒が何時間何分何秒かを、整数の `/` と `%` で計算してみましょう。

## 2コマ目のまとめ {#summary}

- `int` 同士の `/` は整数の商、`%` は余りを求める。
- `double` を使うと小数を含む計算ができる。
- `+` は数値なら足し算、文字列なら連結になる。
- `=` は代入、`+=` は今の値に足してから代入する。

次回は「演算子と変数」をさらに練習し、計算や代入を使いこなします。
