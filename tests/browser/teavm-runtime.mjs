import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { send, evaluate, until, close, errors, screenshot } from "./cdp.mjs";

const url = process.env.LESSON_URL || "http://127.0.0.1:5174/lesson01-1.html";
let ex = "document.querySelector('[data-exercise=first]')";
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
  assert.equal(await evaluate("document.body.dataset.lesson"), "lesson01-1");
  assert.equal(await evaluate("document.querySelectorAll('.lesson-switch a').length"), 2);
  await evaluate("localStorage.setItem('info2026:lesson01:first','旧ページの入力');localStorage.removeItem('info2026:lesson01-1:first')");
  await send("Page.reload");
  await until(`${ex}?.querySelector('.editor').value === '旧ページの入力'`);
  assert.equal(await evaluate(`${ex}.querySelector('.editor').value`), "旧ページの入力");
  assert.equal(await evaluate("localStorage.getItem('info2026:lesson01-1:first')"), "旧ページの入力");
  const source = await readFile(new URL("../../content/lesson01-1.md", import.meta.url), "utf8");
  const samples = [...source.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  const expected = ["Hello, World!\n", "7\n3.5\nこんにちは、Java！\n🐈\n", "出席番号 12 番の 山田花子 です。\n"];
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
  console.log("First period samples, tasks, print without newline, Japanese/emoji/stderr: OK");
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
  assert.match(file,/^info2026_01-1_12_.*\.html$/);
  const html=await readFile(`${directory}/${file}`,"utf8");
  assert.match(html,/Hello, World!/);
  assert.match(html,/確認用/);
  assert.match(html,/data:image\/png;base64/);
  assert.doesNotMatch(html,/<script/);
  assert.ok(await evaluate("[...document.querySelectorAll('.sample-canvas')].every(c=>c.width>0)"));
  await evaluate(`${ex}.querySelector('.output').scrollIntoView({block:'center'})`);
  await screenshot(process.env.SCREENSHOT || "/tmp/info2026-teavm-runtime.png");
  const secondUrl = new URL("lesson01-2.html", url).href;
  await send("Page.navigate", { url: secondUrl });
  ex = "document.querySelector('[data-exercise=arithmetic]')";
  await until(`location.href === ${JSON.stringify(secondUrl)} && !!${ex}?.querySelector('.save-note')`);
  assert.equal(await evaluate("document.body.dataset.lesson"), "lesson01-2");
  assert.equal(await evaluate("document.querySelectorAll('.lesson-switch a').length"), 2);
  assert.equal(await evaluate("localStorage.getItem('info2026:lesson01-1:first')"), samples[0]);
  const secondSource = await readFile(new URL("../../content/lesson01-2.md", import.meta.url), "utf8");
  const secondSamples = [...secondSource.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  const secondExpected = ["9\n5\n14\n3\n1\n3.5\n256.0\n", "Java入門\n3\n12\n★★★★★\n15\n", "50\n2\n"];
  for (let i = 0; i < secondSamples.length; i++) {
    const sampleResult = await run(secondSamples[i]);
    assert.equal(sampleResult.output, secondExpected[i]);
    assert.equal(sampleResult.exit, "終了コード: 0");
  }
  for (const [body, output] of [
    ['String word="星";System.out.println(word.repeat(10));', "星星星星星星星星星星\n"],
    ['double base=3;double height=5;System.out.println(base*height/2);', "7.5\n"],
    ['double r=3;System.out.println(Math.PI*r*r);', "28.274333882308138\n"],
    ['int s=10000;System.out.println(s/3600+"時間"+(s%3600)/60+"分"+s%60+"秒");', "2時間46分40秒\n"],
  ]) {
    const taskResult = await run(main(body));
    assert.equal(taskResult.output, output);
    assert.equal(taskResult.exit, "終了コード: 0");
  }
  assert.ok(await evaluate("localStorage.getItem('info2026:lesson01-2:arithmetic')"));
  await evaluate("document.querySelector('#attendance-number').value='12';document.querySelector('#student-name').value='確認用';document.querySelector('.export-btn').click()");
  await until("document.querySelector('#export-status').textContent.includes('ダウンロードを開始')");
  let secondFile;
  for (let i=0; i<50; i++) {
    secondFile=(await readdir(directory)).find(name=>/^info2026_01-2_12_.*\.html$/.test(name));
    if (secondFile) break;
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.ok(secondFile);
  const secondHtml=await readFile(`${directory}/${secondFile}`,"utf8");
  assert.match(secondHtml,/2時間46分40秒/);
  assert.doesNotMatch(secondHtml,/<script/);
  console.log("Second period samples, all tasks, extension, separate saved code: OK");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({url, secondUrl, reload:true, submission:true, browserErrors:errors.length}));
} finally { close(); }
