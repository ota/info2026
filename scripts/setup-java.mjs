import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, mkdtemp, copyFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

// Pin the upstream distribution and verify it before extracting anything.
const url = "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u504-b01/OpenJDK8U-jdk_x64_linux_hotspot_8u504b01.tar.gz";
const checksum = "9c70e102f527ac674ac2fe9c7d47b9a04e2d19842ba5ab8e9b33f368bbadfaea";
const root = resolve(import.meta.dirname, "..");
const target = join(root, ".local/java-runtime");
const temporary = await mkdtemp(join(tmpdir(), "info2026-java-setup-"));
try {
  console.log("Temurin OpenJDK 8コンパイラを準備します（初回の取得は約104 MB）。");
  let bytes;
  if (process.env.JAVA_ARCHIVE) bytes = await readFile(process.env.JAVA_ARCHIVE);
  else {
    const response = await fetch(url, { signal: AbortSignal.timeout(180_000) });
    if (!response.ok) throw new Error(`取得失敗: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (createHash("sha256").update(bytes).digest("hex") !== checksum)
    throw new Error("配布物のSHA-256が一致しません。配置を中止しました。");
  const archive = join(temporary, "jdk.tar.gz");
  await writeFile(archive, bytes);
  const files = ["lib/tools.jar", "LICENSE", "ASSEMBLY_EXCEPTION", "THIRD_PARTY_README", "src.zip"];
  execFileSync("tar", ["-xzf", archive, "-C", temporary,
    ...files.map(file => `jdk8u504-b01/${file}`)]);
  await mkdir(target, { recursive: true });
  for (const file of files)
    await copyFile(join(temporary, "jdk8u504-b01", file), join(target, file.replace("lib/", "")));
  await writeFile(join(target, "provenance.json"), JSON.stringify({ url, checksum }, null, 2) + "\n");
  console.log(".local/java-runtime にコンパイラ・ソース・ライセンスを配置しました。");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
