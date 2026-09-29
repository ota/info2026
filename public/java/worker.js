/* Classic Worker: CheerpJ uses importScripts. Each run gets a fresh VM. */
let pendingInput;
let started = false;
let compileError = false;
const send = (type, data = {}) => postMessage({ type, ...data });

self.onmessage = async ({ data }) => {
  if (data.type === "input" && pendingInput) {
    const resolve = pendingInput;
    pendingInput = null;
    resolve(data.line);
    return;
  }
  if (data.type !== "start" || started) return;
  started = true;
  try {
    const response = await fetch(`${data.base}__java/tools.jar`);
    if (!response.ok) throw new Error("コンパイラがありません。npm run setup:java を実行してください。");
    const compiler = new Uint8Array(await response.arrayBuffer());
    importScripts("https://cjrtnc.leaningtech.com/4.3/loader.js");
    await cheerpjInit({
      version: 8,
      status: "none",
      javaProperties: ["file.encoding=UTF-8"],
      natives: {
        async Java_edu_info2026_Runner_output(lib, channel, text) {
          send("output", { channel, text });
        },
        async Java_edu_info2026_Runner_input() {
          return new Promise((resolve) => {
            pendingInput = resolve;
            send("input-request");
          });
        },
        async Java_edu_info2026_Runner_phase(lib, name) {
          if (name === "compile-error") compileError = true;
          send("phase", { name });
        },
      },
    });
    cheerpOSAddStringFile("/str/Main.java", new TextEncoder().encode(data.code));
    cheerpOSAddStringFile("/str/tools.jar", compiler);
    const exitCode = await cheerpjRunMain(
      "edu.info2026.Runner",
      `/app${data.base}java/bridge.jar:/str/tools.jar`,
      `info2026-${data.id}`,
    );
    send("done", { exitCode, compileError });
  } catch (error) {
    send("error", { message: String(error?.message || error) });
  }
};
