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
- 「エラーを直す」の欄には、誤りを含むコードが最初から入っています。
  - 実行してエラーを確かめ、直してから再実行します。
  - 分からなくなったら「最初のコードに戻す」を2回押すと、最初のコードに戻ります。
- 最後にこのページの出席番号と氏名を入力し、提出用HTMLを保存します。
  - 1コマ目とは別のファイルです。保存したファイルをMoodleへ提出します。
:::

## 1コマ目のおさらい {#review}

- 文字列は `"..."` で囲み、数値は囲みません。
- `int number = 12;` は、整数型の変数 `number` に `12` を入れます。
  - 小数は `double`、文字列は `String` の変数に入れます。
- `System.out.println(...)` は値を表示した後に改行します。

まずは見本を見ずに、`Hello` と1行表示するプログラムを書いてみましょう。
思い出せないときは、[1コマ目のHello World](./lesson01-1.html#first-code)を見て確かめます。

:::expected
Hello
:::

:::exercise warmup
:::

## 数値の計算 {#arithmetic}

`+`、`-`、`*`、`/` は、足し算・引き算・掛け算・割り算を表す「演算子」です。
掛け算は `×` ではなく `*`、割り算は `÷` ではなく `/` と書きます。

- 記号は次のキーで入力します。
  - `+` はShiftと `;`、`*` はShiftと `:` のキーです。
  - `/` は `.` の右隣のキー、`%` はShiftと `5` です。

:::exercise arithmetic Main.java
```java
public class Main {
    public static void main(String[] args) {
        int a = 7;
        int b = 2;
        System.out.println(a + b);
        System.out.println(a - b);
        System.out.println(a * b);
    }
}
```
:::

:::expected
```
9
5
14
```
:::

:::concepts
- 変数 `a` と `b` の値を使って計算し、その結果を表示します。
- 表示は上から順に、足し算・引き算・掛け算の結果です。
:::

次は割り算です。整数同士の割り算には、Pythonと違う点があります。

:::exercise division Main.java
```java
public class Main {
    public static void main(String[] args) {
        int a = 7;
        int b = 2;
        System.out.println(a / b);
        System.out.println(a % b);
    }
}
```
:::

:::expected
```
3
1
```
:::

:::concepts
- `int` 同士の `/` は、小数部分を切り捨てた整数になります。`7 / 2` は `3` です。
  - 前期のPythonでは、`7 / 2` は `3.5` でした。Javaの整数同士では `3` になります。
  - Pythonで整数の割り算に使った `//` は、Javaでは使いません。
- `%` は割り算の余りです。`7 % 2` は `1` になります。
  - 偶数を2で割った余りは `0`、奇数なら `1` です。後の「条件分岐」で、偶数・奇数の判定に使います。
:::

:::check
`a` を `10`、`b` を `3` に変え、割り算の答えと余りを確認しましょう。
:::

小数を含む割り算では、答えも小数になります。

:::exercise decimal Main.java
```java
public class Main {
    public static void main(String[] args) {
        double c = 7;
        int b = 2;
        System.out.println(c);
        System.out.println(c / b);
        System.out.println(7 / 2.0);
    }
}
```
:::

:::expected
```
7.0
3.5
3.5
```
:::

:::concepts
- `double` の変数に `7` を入れると、小数の `7.0` として扱われます。
- 割る数か割られる数の一方が小数なら、答えも小数になります。
  - `c / b` も `7 / 2.0` も `3.5` です。
- 小数の答えがほしいときは、`double` の変数を使うか、`2.0` のように小数で書きます。
:::

式に演算子が複数あるときは、数学と同じく掛け算・割り算が先です。累乗には `Math.pow` を使います。

:::exercise order Main.java
```java
public class Main {
    public static void main(String[] args) {
        System.out.println(2 + 3 * 4);
        System.out.println((2 + 3) * 4);
        System.out.println(Math.pow(2, 8));
    }
}
```
:::

:::expected
```
14
20
256.0
```
:::

:::concepts
- `2 + 3 * 4` は、先に `3 * 4` を計算します。
  - 先に計算したい部分は `( )` で囲みます。
- `Math.pow(2, 8)` は2の8乗を求めます。結果は小数型なので `256.0` と表示されます。
  - `println` と同じく、Javaに用意された機能を `名前(値)` の形で使います。値が複数あるときは `,` で区切ります。
  - 仕組みは後の回（メソッド）で学びます。
  - 前期のPythonで累乗に使った `**` は、Javaでは使いません。
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
```
:::

:::concepts
- `1 + 2` は整数の足し算、`"1" + "2"` は文字列をつなぐ処理です。
- `"★".repeat(5)` は、文字列を5回繰り返します。
  - `文字列.repeat(回数)` の形で書きます。
  - Pythonの文字列で使った `*` は、Javaの文字列には使えません。
:::

文字列と数値も `+` でつなげます。Pythonでは `"a" + 1` はエラーでしたが、Javaではつながります。

:::exercise concat Main.java
```java
public class Main {
    public static void main(String[] args) {
        int number = 12;
        String name = "山田花子";
        System.out.println("出席番号 " + number + " 番の " + name + " です。");
        System.out.println("合計 " + 1 + 2);
        System.out.println("合計 " + (1 + 2));
    }
}
```
:::

:::expected
```
出席番号 12 番の 山田花子 です。
合計 12
合計 3
```
:::

:::concepts
- `+` の片方が文字列なら、もう片方の数値も文字列としてつながります。
  - 1コマ目で `print` と `println` を5回使った自己紹介が、`println` 1回で書けます。
- `+` は左から順に処理されます。
  - `"合計 " + 1` で先に `"合計 1"` となり、続けて `2` がつながります。
  - 足し算を先にしたいときは `(1 + 2)` のように括弧で囲みます。
:::

:::check
`number` と `name` を自分の出席番号・氏名に変えて実行しましょう。
:::

余裕があれば、次の見本も試しましょう。数字だけの文字列を、計算に使える整数に変えられます。

:::exercise parse Main.java
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("12" + 3);
        System.out.println(Integer.parseInt("12") + 3);
    }
}
```
:::

:::expected
```
123
15
```
:::

:::concepts
- `"12" + 3` は文字列の連結なので、`123` になります。
- `Integer.parseInt("12")` は、数字の文字列 `"12"` を整数 `12` に変えます。
  - Pythonの `int("12")` にあたります。
  - 数字以外の文字列は、整数に変えられません。
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
        System.out.println("面積は " + area);
    }
}
```
:::

:::expected
面積は 50
:::

:::concepts
- `int area = base * height;` は、先に右側の `base * height` を計算します。
  - その結果 `50` を、変数 `area` に入れます。
:::

:::check
`base` と `height` の値を変えて実行し、面積が変わることを確かめましょう。
:::

代入を繰り返すと、変数の中の値が変わります。

:::exercise count Main.java
```java
public class Main {
    public static void main(String[] args) {
        int count = 1;
        System.out.println(count);
        count = count + 1;
        System.out.println(count);
        count += 10;
        System.out.println(count);
    }
}
```
:::

:::expected
```
1
2
12
```
:::

:::concepts
- `count = count + 1` は、今の `count` に1を足した結果を、もう一度 `count` に入れます。
  - 数学の「左右が等しい」という意味ではありません。
- `count += 10` は `count = count + 10` を短く書いたものです。
- 変数を作るときは `int` を付けます。すでにある変数に入れ直すときは付けません。
:::

## エラーを直す {#errors}

1コマ目と同じく、まず実行してエラーを確かめ、直してから再実行しましょう。

:::exercise fix-redefine Main.java fix
```java
public class Main {
    public static void main(String[] args) {
        int count = 1;
        int count = count + 1;
        System.out.println(count);
    }
}
```
:::

:::exercise fix-name Main.java fix
```java
public class Main {
    public static void main(String[] args) {
        int base = 5;
        int height = 10;
        int area = base * height;
        System.out.println(aera);
    }
}
```
:::

:::exercise fix-repeat Main.java fix
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("★" * 5);
    }
}
```
:::

次のコードはエラーなく動きますが、三角形の面積が `7.5` ではなく `7` になります。
正しく `7.5` と表示されるように直しましょう。

:::exercise fix-divide Main.java fix
```java
public class Main {
    public static void main(String[] args) {
        int base = 3;
        int height = 5;
        System.out.println(base * height / 2);
    }
}
```
:::

:::hint
- 1つ目：`variable count is already defined` は「`count` はもう作られている」。4行目の `int` を消します。
- 2つ目：`cannot find symbol` は「その名前が見つからない」。`aera` を `area` に直します。
  - 次の行の `symbol: variable aera` に、見つからない名前が表示されます。
- 3つ目：`bad operand types for binary operator '*'` は「`*` を使えない型」。`"★".repeat(5)` にします。
  - 下の2行に、使おうとした値の型が表示されます。`java.lang.String` は `String` のことです。
- 4つ目：`int` 同士の割り算で、小数部分が切り捨てられています。
  - `base` と `height` の型を `double` に変えます。
  - または、`/ 2` を `/ 2.0` にしても直せます。
:::

## 演習問題 {#challenge}

各課題で `Main` クラスと `main` を含むプログラム全体を書きます。

### 課題1　好きな文字列を10回

好きな短い文字列を `String word` に入れ、`repeat(10)` で10回続けて表示してください。

:::exercise task1
:::

### 課題2　台形の面積

上底を `upper` に `3`、下底を `lower` に `4`、高さを `height` に `5` として、台形の面積を求めてください。
台形の面積は「(上底 + 下底) × 高さ ÷ 2」です。答えは小数を含めて表示します。

:::expected
17.5
:::

:::exercise task2
:::

### 課題3　円の面積

半径 `3` を変数 `r` に入れ、円の面積を計算してください。
円周率には Java の `Math.PI` を使います。

:::expected
28.274333882308138
:::

:::exercise task3
:::

:::hint
- 課題1：`System.out.println(word.repeat(10));` と書けます。
- 課題2：`double upper = 3;` のように3つの変数を作ります。
  - 足し算を先にするため、`(upper + lower)` を括弧で囲みます。
- 課題3：円の面積は「半径 × 半径 × 円周率」です。`Math.PI * r * r` と書けます。
  - 小数の桁が長く表示されますが、正しい結果です。
  - `3.14` を使うと `28.259999999999998` になります。小数の計算には、このような小さな誤差が出ることがあります。
:::

余裕があれば、`10000` 秒が何時間何分何秒かを、整数の `/` と `%` で計算してみましょう。

:::expected
2時間46分40秒
:::

:::exercise ext1
:::

:::hint
- 1時間は `3600` 秒、1分は `60` 秒です。
- `10000 / 3600` で時間、`10000 % 3600` で残りの秒数が求まります。
- 残りの秒数を、さらに `/ 60` と `% 60` で分と秒に分けます。
- 時間・分・秒を先に変数へ入れてから、`+` でつないで表示すると確実です。
  - 例：`int h = 10000 / 3600;`
  - `"答え " + 2 * 3` は掛け算が先で `答え 6`、`"答え " + 2 + 3` は左から順につながって `答え 23` になります。
:::

## 2コマ目のまとめ {#summary}

- `int` 同士の `/` は整数の商、`%` は余りを求める。
- `double` を使うと小数を含む計算ができる。
- 掛け算・割り算が先に計算される。先にしたい部分は `( )` で囲む。
- `+` は数値なら足し算、文字列があれば連結になる。
- `=` は代入、`+=` は今の値に足してから代入する。

次回は「演算子と変数」をさらに練習し、計算や代入を使いこなします。
