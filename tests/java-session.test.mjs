import test from "node:test";
import assert from "node:assert/strict";
import { JavaSession } from "../src/java-session.js";

function fixture(options = {}) {
  const workers = [];
  const session = new JavaSession({ ...options, createWorker() {
    const worker = {
      messages: [], terminated: false,
      postMessage(message) { this.messages.push(message); },
      terminate() { this.terminated = true; },
      emit(data) { this.onmessage({ data }); },
    };
    workers.push(worker);
    return worker;
  }});
  return { session, workers };
}

test("streams output, sends input only when requested and completes", async () => {
  const { session, workers } = fixture({ base: "/info2026/" });
  const waiting = [];
  const result = session.run("source", { onInput: value => waiting.push(value) });
  const worker = workers[0];
  assert.equal(worker.messages[0].base, "/info2026/");
  assert.equal(session.input("early"), false);
  worker.emit({ type: "output", text: "日本語\n" });
  worker.emit({ type: "input-request" });
  assert.equal(session.input("太田"), true);
  assert.equal(session.input("duplicate"), false);
  worker.emit({ type: "input-request" });
  assert.equal(session.input(null), true);
  worker.emit({ type: "done", exitCode: 0, compileError: false });
  assert.equal((await result).output, "日本語\n");
  assert.deepEqual(waiting, [true, true, false]);
  assert.equal(worker.terminated, true);
  assert.deepEqual(worker.messages.at(-1), { type: "input", line: null });
});

test("stop terminates the VM and late output cannot affect a new run", async () => {
  const { session, workers } = fixture();
  const first = session.run("infinite loop");
  await assert.rejects(session.run("overlap"), /実行中/);
  session.stop();
  assert.equal((await first).stopped, true);
  const second = session.run("new code");
  workers[0].emit({ type: "output", text: "stale" });
  workers[0].emit({ type: "done", exitCode: 1 });
  workers[1].emit({ type: "done", exitCode: 0 });
  assert.equal((await second).output, "");
  assert.ok(workers.every(worker => worker.terminated));
});

test("compiler errors retain diagnostics; worker failure allows retry", async () => {
  const { session, workers } = fixture();
  const first = session.run("invalid source");
  workers[0].emit({ type: "output", text: "Main.java:3: error" });
  workers[0].emit({ type: "done", exitCode: 1, compileError: true });
  assert.equal((await first).exitCode, null);
  const second = session.run("source");
  workers[1].onerror();
  await assert.rejects(second, /通信/);
  assert.equal(session.active, null);
});

test("output limit and timeout both release the worker", async () => {
  const { session, workers } = fixture({ maxOutput: 5, timeout: 20 });
  const first = session.run("many outputs");
  workers[0].emit({ type: "output", text: "1234567" });
  assert.equal((await first).output, "12345");
  const second = session.run("hang");
  assert.equal((await second).stopped, true);
  assert.ok(workers.every(worker => worker.terminated));
});
