// Generated from content/lesson01-2.md
export const samples = {
  "arithmetic": [
    "public class Main {",
    "    public static void main(String[] args) {",
    "        int a = 7;",
    "        int b = 2;",
    "        System.out.println(a + b);",
    "        System.out.println(a - b);",
    "        System.out.println(a * b);",
    "    }",
    "}"
  ],
  "division": [
    "public class Main {",
    "    public static void main(String[] args) {",
    "        int a = 7;",
    "        int b = 2;",
    "        System.out.println(a / b);",
    "        System.out.println(a % b);",
    "    }",
    "}"
  ],
  "decimal": [
    "public class Main {",
    "    public static void main(String[] args) {",
    "        double c = 7;",
    "        int b = 2;",
    "        System.out.println(c);",
    "        System.out.println(c / b);",
    "        System.out.println(7 / 2.0);",
    "    }",
    "}"
  ],
  "order": [
    "public class Main {",
    "    public static void main(String[] args) {",
    "        System.out.println(2 + 3 * 4);",
    "        System.out.println((2 + 3) * 4);",
    "        System.out.println(Math.pow(2, 8));",
    "    }",
    "}"
  ],
  "strings": [
    "public class Main {",
    "    public static void main(String[] args) {",
    "        String word = \"Java\";",
    "        System.out.println(word + \"入門\");",
    "        System.out.println(1 + 2);",
    "        System.out.println(\"1\" + \"2\");",
    "        System.out.println(\"★\".repeat(5));",
    "    }",
    "}"
  ],
  "concat": [
    "public class Main {",
    "    public static void main(String[] args) {",
    "        int number = 99;",
    "        String name = \"太田健吾\";",
    "        System.out.println(\"出席番号 \" + number + \" 番の \" + name + \" です。\");",
    "        System.out.println(\"合計 \" + 1 + 2);",
    "        System.out.println(\"合計 \" + (1 + 2));",
    "    }",
    "}"
  ],
  "area": [
    "public class Main {",
    "    public static void main(String[] args) {",
    "        int base = 5;",
    "        int height = 10;",
    "        int area = base * height;",
    "        System.out.println(\"面積は \" + area);",
    "    }",
    "}"
  ],
  "count": [
    "public class Main {",
    "    public static void main(String[] args) {",
    "        int count = 1;",
    "        System.out.println(count);",
    "        count = count + 1;",
    "        System.out.println(count);",
    "        count += 10;",
    "        System.out.println(count);",
    "    }",
    "}"
  ],
  "parse": [
    "public class Main {",
    "    public static void main(String[] args) {",
    "        System.out.println(\"12\" + 3);",
    "        System.out.println(Integer.parseInt(\"12\") + 3);",
    "    }",
    "}"
  ]
};
export const outputs = {
  "warmup": "Hello",
  "arithmetic": "9\n5\n14",
  "division": "3\n1",
  "decimal": "7.0\n3.5\n3.5",
  "order": "14\n20\n256.0",
  "strings": "Java入門\n3\n12\n★★★★★",
  "concat": "出席番号 99 番の 太田健吾 です。\n合計 12\n合計 3",
  "area": "面積は 50",
  "count": "1\n2\n12",
  "fix-divide": "7.5",
  "task2": "17.5",
  "task3": "28.274333882308138",
  "parse": "123\n15",
  "ext1": "2時間46分40秒"
};
