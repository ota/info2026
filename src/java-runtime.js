import { JavaSession } from "./java-session.js";

// TeaVM is the lesson 1 runtime. CheerpJ remains an explicit local evaluation option.
export const isCheerpJ = import.meta.env.MODE === "cheerpj";
const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
export const javaRuntimeAvailable = typeof Worker !== "undefined" &&
  typeof WebAssembly !== "undefined" && (!isCheerpJ || local);
export const javaRuntimeMessage = "Javaを実行できません。対応ブラウザと実行環境の設定を確認してください。入力と保存は利用できます。";
export const javaRuntimeNotice = isCheerpJ
  ? "Java実行はローカルでの技術評価用です。授業での利用・公開前に利用条件を確認します。"
  : "";
const session = new JavaSession({
  createWorker: () => isCheerpJ
    ? new Worker(`${import.meta.env.BASE_URL}java/worker.js`)
    : new Worker(`${import.meta.env.BASE_URL}teavm/worker.js`, { type: "module" }),
  base: import.meta.env.BASE_URL,
});
export function runJava(code, callbacks) {
  if (!javaRuntimeAvailable) throw new Error(javaRuntimeMessage);
  return session.run(code, callbacks);
}
export const stopJava = () => session.stop();
export const sendJavaInput = (line) => session.input(line);
