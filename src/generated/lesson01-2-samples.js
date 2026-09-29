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
  "parse": [
    "public class Main {",
    "    public static void main(String[] args) {",
    "        System.out.println(\"12\" + 3);",
    "        System.out.println(Integer.parseInt(\"12\") + 3);",
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
  ]
};
