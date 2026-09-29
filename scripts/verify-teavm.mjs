import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const base = new URL("../public/teavm/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", base), "utf8"));
for (const name of ["compiler.wasm", "compiler.wasm-runtime.js", "compile-classlib-teavm.bin", "runtime-classlib-teavm.bin"]) {
  const bytes = await readFile(new URL(`vendor/${name}`, base));
  if (createHash("sha256").update(bytes).digest("hex") !== manifest.files[name])
    throw new Error(`TeaVMのSHA-256が一致しません: ${name}`);
}
const sources = await readFile(new URL("sources.zip", base));
if (createHash("sha256").update(sources).digest("hex") !== manifest.sourcesSha256)
  throw new Error("TeaVM対応ソースのSHA-256が一致しません。");
for (const name of ["NOTICE.txt", "THIRD-PARTY-LICENSES.txt", "SOURCE-BUILD.md"]) {
  if (!(await readFile(new URL(name, base))).length)
    throw new Error(`TeaVMの配布文書が空です: ${name}`);
}
console.log("TeaVMの実行用ファイル・対応ソース・ライセンスを確認しました。");
