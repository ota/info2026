// Browser-independent lifetime/protocol logic, also exercised with fake Workers.
export class JavaSession {
  constructor({ createWorker, base = "/", timeout = 120_000, maxOutput = 100_000 }) {
    Object.assign(this, { createWorker, base, timeout, maxOutput });
    this.active = null;
  }

  run(code, { onStatus = () => {}, onOutput = () => {}, onInput = () => {} } = {}) {
    if (this.active) return Promise.reject(new Error("別のプログラムを実行中です。"));
    return new Promise((resolve, reject) => {
      let worker;
      try { worker = this.createWorker(); } catch (error) { reject(error); return; }
      const run = { worker, output: "", waiting: false };
      this.active = run;
      run.finish = (result, error) => {
        if (this.active !== run) return;
        clearTimeout(run.timer);
        worker.terminate();
        this.active = null;
        onInput(false);
        if (error) reject(error);
        else resolve({ output: run.output, ...result });
      };
      run.timer = setTimeout(() => run.finish({ exitCode: null, stopped: true,
        reason: "実行が2分を超えたため停止しました。" }), this.timeout);
      worker.onerror = () => run.finish(null, new Error(
        "Java実行環境を読み込めませんでした。通信を確認して再実行してください。"));
      worker.onmessage = ({ data }) => {
        if (this.active !== run) return;
        if (data.type === "output") {
          const text = String(data.text);
          const remaining = this.maxOutput - run.output.length;
          run.output += text.slice(0, remaining);
          onOutput(run.output);
          if (text.length > remaining) run.finish({ exitCode: null, stopped: true,
            reason: "出力が多すぎるため停止しました（10万文字まで表示）。" });
        } else if (data.type === "phase") {
          onStatus(data.name === "compile" ? "コンパイル中…" : "実行中…");
        } else if (data.type === "input-request") {
          run.waiting = true;
          onStatus("入力を待っています。");
          onInput(true);
        } else if (data.type === "done") {
          run.finish({ exitCode: data.compileError ? null : data.exitCode,
            compileError: data.compileError });
        } else if (data.type === "error") {
          run.finish(null, new Error(`Java実行環境でエラーが発生しました。再実行してください。\n${data.message}`));
        }
      };
      onStatus("Java実行環境を準備中…（初回は通信に時間がかかります）");
      worker.postMessage({ type: "start", code, base: this.base, id: crypto.randomUUID() });
    });
  }

  input(line) {
    if (!this.active?.waiting) return false;
    this.active.waiting = false;
    this.active.worker.postMessage({ type: "input", line });
    return true;
  }

  stop() {
    this.active?.finish({ exitCode: null, stopped: true, reason: "停止しました。" });
  }
}
