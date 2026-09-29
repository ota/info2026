import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { send, evaluate, until, close, errors, screenshot } from "./cdp.mjs";

const url = process.env.LESSON_URL || "http://127.0.0.1:5174/lesson01.html";
const ex = "document.querySelector('[data-exercise=first]')";
const main = body => `public class Main { public static void main(String[] args) { ${body} } }`;
async function start(code) {
  await evaluate(`(() => {const e=${ex};const input=e.querySelector('.editor');
    input.value=${JSON.stringify(code)};input.dispatchEvent(new Event('input',{bubbles:true}));
    e.querySelector('.run-btn').click();})()`);
}
async function finished() {
  await until(`!${ex}.querySelector('.run-btn').disabled`);
  return evaluate(`(() => {const e=${ex};return {output:e.querySelector('.output pre').textContent,
    status:e.querySelector('.status').textContent,exit:e.querySelector('.exit-code').textContent};})()`);
}
async function run(code) { await start(code); return finished(); }
try {
  if (process.env.BLOCK_EXTERNAL_RUNTIME) {
    await send("Network.enable");
    await send("Network.setBlockedURLs", { urls: ["*://teavm.org/*", "*://cjrtnc.leaningtech.com/*"] });
  }
  await send("Page.navigate", { url });
  await until(`!!${ex}?.querySelector('.save-note')`);
  assert.equal(await evaluate(`${ex}.querySelector('.run-btn').disabled`), false);
  const source = await readFile(new URL("../../content/lesson01.md", import.meta.url), "utf8");
  const samples = [...source.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  const expected = ["Hello, World!\n", "こんにちは。Javaを学びます。\nよろしくお願いします。\n"];
  for (let i = 0; i < samples.length; i++) {
    const result = await run(samples[i]);
    assert.equal(result.output, expected[i]);
    assert.equal(result.exit, "終了コード: 0");
  }
  for (const [body, expectedOutput] of [
    ['System.out.println("こんにちは、Java！");', "こんにちは、Java！\n"],
    ['System.out.println("出席番号 12 番の 山田花子 です。");System.out.println("好きなことは読書です。");', "出席番号 12 番の 山田花子 です。\n好きなことは読書です。\n"],
    ['System.out.println("  *");System.out.println(" ***");System.out.println("*****");', "  *\n ***\n*****\n"],
    ['System.out.print("改行なし😀");', "改行なし😀"],
    ['System.out.print("前");System.err.print("中");System.out.println("後");', "前中後\n"],
    ['System.out.println("1");System.out.println("2");System.out.println("3");', "1\n2\n3\n"],
  ]) {
    const result = await run(main(body));
    assert.equal(result.output, expectedOutput);
    assert.equal(result.exit, "終了コード: 0");
  }
  console.log("Lesson 1 samples, all tasks, print without newline, Japanese/emoji/stderr: OK");
  let result = await run(main('System.out.println("missing")'));
  assert.match(result.output, /Main.java:1/);
  assert.match(result.exit, /コンパイルエラー/);
  result = await run('public class Other { public static void main(String[] args) {} }');
  assert.match(result.output, /Other/);
  assert.match(result.exit, /コンパイルエラー/);
  result = await run('public class Main {}');
  assert.match(result.output, /main/);
  assert.match(result.exit, /コンパイルエラー/);
  result = await run(main('int n=0;System.out.println(1/n);'));
  assert.notEqual(result.exit, "終了コード: 0");
  console.log("Compiler diagnostics, filename mismatch, missing main, runtime error: OK");

  await start(main('while(true) {}'));
  await until(`${ex}.querySelector('.status').textContent === '実行中…'`);
  const stopped = Date.now();
  await evaluate(`${ex}.querySelector('.stop-btn').click()`);
  result = await finished();
  assert.equal(result.exit, "停止");
  assert.ok(Date.now() - stopped < 3000);
  result = await run(main('System.out.println("復帰");'));
  assert.equal(result.output, "復帰\n");
  result = await run(main('while(true) System.out.println("1234567890");'));
  assert.match(result.status, /出力が多すぎる/);
  assert.equal(result.output.length, 100000);
  result = await run(samples[0]);
  assert.equal(result.output, expected[0]);
  console.log("Stop/rerun, output limit/recovery: OK");

  assert.equal(await evaluate(`${ex}.querySelector('.editor').dispatchEvent(new Event('paste',{cancelable:true}))`), false);
  await send("Page.reload");
  await until(`!!${ex}?.querySelector('.save-note')`);
  assert.equal(await evaluate(`${ex}.querySelector('.editor').value`), samples[0]);
  await run(samples[0]);
  // Exercise the actual download button in both dev and static builds.
  const { mkdtemp, readdir } = await import("node:fs/promises");
  const directory = await mkdtemp("/tmp/info2026-teavm-downloads-");
  await send("Browser.setDownloadBehavior", {behavior:"allow",downloadPath:directory});
  await evaluate("document.querySelector('#attendance-number').value='12';document.querySelector('#student-name').value='確認用';document.querySelector('.export-btn').click()");
  await until("document.querySelector('#export-status').textContent.includes('ダウンロードを開始')");
  let file;
  for (let i=0; i<50; i++) {
    file=(await readdir(directory)).filter(name=>name.endsWith('.html')).sort().at(-1);
    if (file) break;
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.ok(file);
  const html=await readFile(`${directory}/${file}`,"utf8");
  assert.match(html,/Hello, World!/);
  assert.match(html,/確認用/);
  assert.match(html,/data:image\/png;base64/);
  assert.doesNotMatch(html,/<script/);
  assert.ok(await evaluate("[...document.querySelectorAll('.sample-canvas')].every(c=>c.width>0)"));
  await evaluate(`${ex}.querySelector('.output').scrollIntoView({block:'center'})`);
  await screenshot(process.env.SCREENSHOT || "/tmp/info2026-teavm-runtime.png");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({url, reload:true, submission:true, browserErrors:errors.length}));
} finally { close(); }
