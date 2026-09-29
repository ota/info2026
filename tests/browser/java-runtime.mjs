// Start Chrome with --remote-debugging-port=9224 and an isolated user-data-dir.
// npm run dev, then: node tests/browser/java-runtime.mjs
// Static Pages layout: LESSON_URL=http://127.0.0.1:5175/info2026/lesson01.html ...
import assert from "node:assert/strict";
import { send, evaluate, until, close, errors, screenshot } from "./cdp.mjs";

const url = process.env.LESSON_URL || "http://127.0.0.1:5174/lesson01.html";
const main = body => `public class Main { public static void main(String[] args) throws Exception { ${body} } }`;
const ex = "document.querySelector('[data-exercise=first]')";
async function start(code) {
  await evaluate(`(() => {const e=${ex}; const input=e.querySelector('.editor'); input.value=${JSON.stringify(code)};
    input.dispatchEvent(new Event('input',{bubbles:true}));e.querySelector('.run-btn').click();})()`);
}
async function finished() {
  await until(`!${ex}.querySelector('.run-btn').disabled`);
  return evaluate(`(() => {const e=${ex};return {output:e.querySelector('.output pre').textContent,
    status:e.querySelector('.status').textContent,exit:e.querySelector('.exit-code').textContent};})()`);
}
async function run(code) { await start(code); return finished(); }
try {
  await send("Page.navigate", { url });
  await until(`!!${ex}?.querySelector('.save-note')`);
  assert.equal(await evaluate(`${ex}.querySelector('.run-btn').disabled`), false);
  let result = await run(main('System.out.print("日本語😀"); System.err.println("エラー出力");'));
  assert.equal(result.output, "日本語😀エラー出力\n");
  assert.equal(result.exit, "終了コード: 0");
  console.log("Japanese stdout/stderr: OK");

  result = await run(main('System.out.println("missing")'));
  assert.match(result.output, /Main.java/);
  assert.match(result.exit, /コンパイルエラー/);
  result = await run('public class Other {public static void main(String[] args){}}');
  assert.match(result.output, /Other/);
  assert.match(result.exit, /コンパイルエラー/);
  result = await run(main('int n=0; System.out.println(1/n);'));
  assert.match(result.output, /ArithmeticException/);
  assert.equal(result.exit, "終了コード: 1");
  console.log("Compile error, filename mismatch, exception: OK");

  await start('import java.util.Scanner; ' + main('Scanner s=new Scanner(System.in); System.out.print("数値: "); int n=s.nextInt(); s.nextLine(); String name=s.nextLine(); System.out.println(n+":"+name); System.out.println(s.hasNextLine()?"extra":"EOF");'));
  for (const line of ["12", "太田健吾"]) {
    await until(`!${ex}.querySelector('.stdin-input').disabled`);
    await evaluate(`(() => {const e=${ex}; e.querySelector('.stdin-input').value=${JSON.stringify(line)};e.querySelector('.stdin-send').click();})()`);
  }
  await until(`!${ex}.querySelector('.stdin-input').disabled`);
  await evaluate(`${ex}.querySelector('.stdin-eof').click()`);
  result = await finished();
  assert.equal(result.output, "数値: 12:太田健吾\nEOF\n");
  const base = new URL(".", url).pathname;
  // Dev module import is unnecessary for static builds: exercise the actual save button there.
  if (base === "/") {
    const report = await evaluate(`(async()=>{const {createSubmissionFile}=await import('/src/export.js');
      const {blob}=await createSubmissionFile({attendanceNumber:'12',studentName:'検証'});return blob.text();})()`);
    assert.match(report, /12:太田健吾/);
    assert.match(report, /送信した入力/);
    assert.doesNotMatch(report, /<script|class="stdin-controls"/);
  }
  console.log("Interactive Scanner, Japanese input, EOF, report: OK");

  await start(main('while(true) {}'));
  await until(`${ex}.querySelector('.status').textContent === '実行中…'`);
  const stopStarted = Date.now();
  await evaluate(`${ex}.querySelector('.stop-btn').click()`);
  result = await finished();
  assert.equal(result.exit, "停止");
  assert.ok(Date.now() - stopStarted < 3000);
  result = await run(main('System.out.println("再実行できました");'));
  assert.equal(result.output, "再実行できました\n");
  console.log("Infinite loop stop and rerun: OK");

  result = await run(main('String s="x"; for(int i=0;i<12;i++)s+=s; while(true)System.out.println(s);'));
  assert.match(result.status, /出力が多すぎる/);
  assert.equal(result.output.length, 100000);
  result = await run('class Person {String name; Person(String n){name=n;} } ' + main('int sum=0;for(int x:new int[]{1,2,3})if(x>1)sum+=x;System.out.printf("%d %.2f %s%n",sum,3.14,new Person("太田").name);'));
  assert.equal(result.output, "5 3.14 太田\n");
  console.log("Output limit, classes, arrays, loops, printf: OK");

  const code = await evaluate(`${ex}.querySelector('.editor').value`);
  assert.equal(await evaluate(`${ex}.querySelector('.editor').dispatchEvent(new Event('paste',{cancelable:true}))`), false);
  await send("Page.reload");
  await until(`!!${ex}?.querySelector('.save-note')`);
  assert.equal(await evaluate(`${ex}.querySelector('.editor').value`), code);
  await run(main('System.out.println("Hello, World!");'));
  await evaluate(`${ex}.scrollIntoView({block:'start'})`);
  await screenshot(process.env.SCREENSHOT || "/tmp/info2026-java-runtime.png");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({url, reloadRestoresCode:true, browserErrors:errors.length}));
} finally { close(); }
