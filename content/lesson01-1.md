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
- 「エラーを直す」の欄には、誤りを含むコードが最初から入っています。
  - 実行してエラーを確かめ、直してから再実行します。
  - 分からなくなったら「最初のコードに戻す」を2回押すと、最初のコードに戻ります。
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

Pythonと比べると、書き方に次の違いがあります。

| | Python | Java |
| --- | --- | --- |
| 表示 | `print("Hello")` | `System.out.println("Hello");` |
| 命令の終わり | 行の終わり | `;` を付ける |
| 処理のまとまり | 行頭の字下げ | `{` と `}` で囲む |
| 変数を作る | `n = 12` | `int n = 12;` のように、データの種類（型）も書く |

- Javaの字下げは、読みやすくするためのものです。字下げを変えても動作は変わりません。
  - それでも、まとまりが分かるように字下げをそろえて書きます。

## Hello World {#first-code}

まずは次のプログラムを、記号と大文字・小文字に注意して書き写しましょう。

- 日本語入力をオフにし、記号は半角で入力します。
  - `(` `)` はShiftと `8` `9`、`"` はShiftと `2` です。
  - `[` `]` は `@` の右隣・`:` の右隣のキーです。Shiftと押すと `{` `}` になります。
  - `;` は `L` の右隣のキーです。

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
- 3行目以外は、毎回同じ「基本の形」です。今日の見本はすべてこの形を使います。
  - 1〜2行目と最後の2行はそのまま書き、3行目の位置に処理を書きます。
  - 処理が増えたら、3行目の位置に行を増やして書きます。
- `public class Main { ... }` はプログラムを入れる外側のまとまりです。
  - このまとまりを「クラス」と呼びます。名前は `Main`、ファイル名は `Main.java` にします。
  - この教材の入力欄は `Main.java` として実行されます。`Main` の部分は変えません。
- `public static void main(String[] args) { ... }` の中に、最初に実行する処理を書きます。
  - 意味は後の回で学びます。今は基本の形としてそのまま使います。
- `System.out.println(...)` は、括弧の中の値を画面に表示して改行します。
  - 文字の並びを「文字列」と呼び、半角の二重引用符 `"` で囲みます。
  - 命令の最後には半角のセミコロン `;` を付けます。
- `{` と `}` は処理のまとまりを囲みます。
  - 内側の行の先頭を空けると、まとまりが分かりやすくなります。
:::

:::check
`Hello, World!` を `こんにちは、Java！` に書き換えて実行しましょう。
二重引用符 `"` は残します。
日本語を打ち終えたら、日本語入力をオフに戻します。戻し忘れると `”` や `；` が全角になり、エラーになります。
:::

:::check
3行目の下に `System.out.println("2行目");` を1行足して実行しましょう。
命令は上から順に実行され、2行表示されます。
:::

## 数値と文字列を表示する {#values}

表示する値には、数値と文字列があります。二重引用符 `"` の有無で意味が変わります。

:::exercise values Main.java
```java
public class Main {
    public static void main(String[] args) {
        System.out.println(7);
        System.out.println("7");
        System.out.println(1 + 2);
        System.out.println("1 + 2");
        System.out.println(3.5);
    }
}
```
:::

:::expected
```
7
7
3
1 + 2
3.5
```
:::

:::concepts
- `7` は数値、`"7"` は文字列です。表示は同じでも、データの種類が違います。
  - データの種類を「型」と呼びます。型の書き方は、この後の「変数を使う」で学びます。
- `1 + 2` は計算され、`3` が表示されます。
  - `"1 + 2"` は文字列なので、計算されずにそのまま表示されます。
- `3.5` のように小数も表示できます。数値は二重引用符で囲みません。
:::

:::check
`1 + 2` を `10 - 4` に変えると何が表示されるか、予想してから実行しましょう。
:::

## printとprintln {#print}

`println` の `ln` は「line（行）」の略です。`print` を使うと、表示の後に改行しません。

:::exercise print-lines Main.java
```java
public class Main {
    public static void main(String[] args) {
        System.out.print("こんにちは、");
        System.out.println("Java！");
        System.out.print("A");
        System.out.print("B");
        System.out.println("C");
        System.out.println("🐈");
    }
}
```
:::

:::expected
```
こんにちは、Java！
ABC
🐈
```
:::

:::concepts
- `System.out.print(...)` は表示した後に改行しません。
  - 次の表示は、同じ行の続きになります。
- `System.out.println(...)` は表示した後に改行します。
- 二重引用符の内側には、日本語や絵文字も書けます。
:::

:::check
`System.out.print("B");` を `println` に変えると、表示は何行になるでしょうか。
予想してから実行しましょう。
:::

## 変数を使う {#variables}

値を入れて、後から使える名前を「変数」と呼びます。Javaでは、変数を作るときに型も書きます。
`=` は、Shiftと `-` のキーで入力します。

:::exercise variable Main.java
```java
public class Main {
    public static void main(String[] args) {
        int number = 12;
        System.out.println(number);
        System.out.println("number");
    }
}
```
:::

:::expected
```
12
number
```
:::

:::concepts
- `int number = 12;` は、整数型の変数 `number` を作り、`12` を入れます。
  - `型 名前 = 値;` の順に書きます。`int` は整数の型です。
- `System.out.println(number)` は、変数の中の値 `12` を表示します。
  - `"number"` と書くと文字列になり、`number` という文字がそのまま表示されます。
- 変数名には英字、数字、`_` を使えます。ただし、先頭を数字にはできません。
  - 大文字と小文字は区別されます。`Number` と `number` は別の名前です。
:::

:::check
`int number = 12;` の `12` を自分の出席番号に変えて実行しましょう。
:::

整数のほかに、小数と文字列の変数も作れます。型によって書く名前が違います。

:::exercise types Main.java
```java
public class Main {
    public static void main(String[] args) {
        int number = 12;
        double height = 158.5;
        String name = "山田花子";
        System.out.println(number);
        System.out.println(height);
        System.out.println(name);
    }
}
```
:::

:::expected
```
12
158.5
山田花子
```
:::

| 型 | 入れる値 | 例 |
| --- | --- | --- |
| `int` | 整数 | `12`、`-3` |
| `double` | 小数 | `158.5`、`3.0` |
| `String` | 文字列 | `"山田花子"` |

:::concepts
- `double height = 158.5;` は、小数型の変数 `height` に `158.5` を入れます。
- `String name = "山田花子";` は、文字列型の変数 `name` に氏名を入れます。
  - `String` だけ先頭が大文字です。`int` と `double` は小文字です。
:::

`print` と `println` を組み合わせると、変数の値を文の途中に入れられます。

:::exercise self-intro Main.java
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
- `print` で改行せずに続けて表示し、最後だけ `println` で改行します。
- `" 番の "` のように、文字列の中の空白もそのまま表示されます。
:::

:::check
`number` と `name` の値を自分の出席番号・氏名に変えて実行しましょう。
:::

## エラーを直す {#errors}

誤りがあると、実行結果の欄にエラーが表示されます。

:::expected
Main.java:3:44: ';' expected
:::

- `Main.java:3:44` は「`Main.java` の3行目、左から44文字目あたり」という意味です。
  - その後ろにエラーの内容が英語で表示されます。上の例は「`;` が必要」です。
- 誤りのある場所は、表示された行の少し前のこともあります。前後の行も見ます。
- エラーが複数表示されたら、最初のエラーから直して再実行します。

次のコードには、それぞれ誤りが一つあります。まず実行してエラーを確かめ、直してから再実行しましょう。

:::exercise fix-semicolon Main.java fix
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!")
    }
}
```
:::

:::exercise fix-case Main.java fix
```java
public class Main {
    public static void main(String[] args) {
        system.out.println("Hello, World!");
    }
}
```
:::

:::exercise fix-quote Main.java fix
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!);
    }
}
```
:::

次の誤りは見た目では分かりにくいものです。エラーは2つ表示されますが、原因は一つです。

:::exercise fix-space Main.java fix
```java
public class Main {
    public static void main(String[] args) {
        String　name = "山田花子";
        System.out.println(name);
    }
}
```
:::

:::hint
- 1つ目：`';' expected` は「`;` が必要」。3行目の行末に `;` を付けます。
- 2つ目：`package system does not exist` は「`system` が見つからない」。`System` と大文字にします。
- 3つ目：`unclosed string literal` は「文字列が閉じていない」。`!` の後に `"` を足します。
- 4つ目：`illegal character: '\u3000'` は「使えない文字がある」。`\u3000` は全角の空白を表す番号です。
  - `String` と `name` の間を消し、半角の空白を打ち直します。
:::

- 困ったときは、次の順に確かめます。
  - `;`、二重引用符 `"`、括弧 `()`・`{}` の抜けはないか。
  - `System` と `String` の先頭は大文字か。
  - 記号や空白を全角で打っていないか。文字列の中の日本語や全角記号は使えます。
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

半角の空白と `*` を使い、次の3行を表示してください。`*` はShiftと `:` のキーです。

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

余裕があれば、課題2に身長を加えましょう。
身長は `double` の変数 `height` に入れ、次の2行を表示します。

:::expected
```
出席番号 12 番の 山田花子 です。
身長は 158.5 cm です。
```
:::

:::exercise ext1
:::

## 1コマ目のまとめ {#summary}

- `main` の中に実行する処理を書き、命令の最後に `;` を付ける。
- 文字列は半角の二重引用符 `"` で囲み、数値は囲まない。
- `println` は改行し、`print` は改行しない。
- Javaの変数には、`int`・`double`・`String` などの型を書く。
- エラーは `Main.java:行:列` で場所を確かめ、最初のエラーから直す。

続いて[2コマ目「演算子と変数」](./lesson01-2.html)へ進みます。
