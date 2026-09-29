// Our adapter; compiler/runtime files in vendor/ are generated from upstream sources.
import { load } from "./vendor/compiler.wasm-runtime.js";

let started = false;
let output = "";
const send = (type, values = {}) => postMessage({ type, ...values });
function flush() {
  if (output) { send("output", { text: output }); output = ""; }
}
function putchar(character) {
  output += String.fromCharCode(character);
  if (character === 10 || output.length >= 1024) flush();
}
async function bytes(name) {
  const response = await fetch(new URL(`./vendor/${name}`, import.meta.url));
  if (!response.ok) throw new Error(`実行用ファイルを取得できませんでした: ${name} (${response.status})`);
  return new Int8Array(await response.arrayBuffer());
}

self.onmessage = async ({ data }) => {
  if (data.type !== "start" || started) return;
  started = true;
  let executing = false;
  try {
    const [vm, sdk, classlib] = await Promise.all([
      load(new URL("./vendor/compiler.wasm", import.meta.url).href),
      bytes("compile-classlib-teavm.bin"),
      bytes("runtime-classlib-teavm.bin"),
    ]);
    const compiler = vm.exports.createCompiler();
    compiler.setSdk(sdk);
    compiler.setTeaVMClasslib(classlib);
    const diagnostics = [];
    compiler.onDiagnostic((diagnostic) => {
      const location = diagnostic.fileName
        ? `${diagnostic.fileName}:${diagnostic.lineNumber}${diagnostic.columnNumber ? `:${diagnostic.columnNumber}` : ""}: ` : "";
      diagnostics.push(`${location}${diagnostic.message}`);
    });
    const failure = () => {
      send("output", { text: diagnostics.join("\n") + "\n" });
      send("done", { exitCode: 1, compileError: true });
    };
    send("phase", { name: "compile" });
    compiler.addSourceFile("Main.java", data.code);
    if (!compiler.compile()) { failure(); return; }
    if (!Array.from(compiler.detectMainClasses()).includes("Main")) {
      diagnostics.push("Mainクラスに public static void main(String[] args) を書いてください。packageは付けません。");
      failure(); return;
    }
    if (!compiler.generateWebAssembly({
      outputName: "lesson", mainClass: "Main", strictMode: true,
    })) { failure(); return; }
    const program = await load(compiler.getWebAssemblyOutputFile("lesson.wasm"), {
      installImports(imports) {
        imports.teavmConsole.putcharStdout = putchar;
        imports.teavmConsole.putcharStderr = putchar;
      },
    });
    send("phase", { name: "run" });
    executing = true;
    await program.exports.main([]);
    flush(); // print() without a final newline must also be displayed.
    send("done", { exitCode: 0, compileError: false });
  } catch (error) {
    flush();
    if (executing) {
      send("output", { text: `\n実行時エラー: ${error?.message || error}\n` });
      send("done", { exitCode: 1, compileError: false });
    } else {
      send("error", { message: String(error?.message || error) });
    }
  }
};
