import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const temporary = await mkdtemp(join(tmpdir(), "info2026-bridge-"));
const java = process.env.JAVA_BIN || "java";
try {
  await mkdir(join(root, "public/java"), { recursive: true });
  execFileSync(java, ["-m", "jdk.compiler/com.sun.tools.javac.Main", "-source", "8", "-target", "8",
    "-encoding", "UTF-8", "-d", temporary, join(root, "java/edu/info2026/Runner.java")], { stdio: "inherit" });
  execFileSync(java, ["-m", "jdk.jartool/sun.tools.jar.Main", "--create", "--file",
    join(root, "public/java/bridge.jar"), "-C", temporary, "."], { stdio: "inherit" });
} finally {
  await rm(temporary, { recursive: true, force: true });
}
