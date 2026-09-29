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
// Mark the current document first, so waiting cannot pass on the page that
// is about to be replaced by the navigation or reload.
async function load(method, params = {}, ready = `!!${ex}?.querySelector('.save-note')`) {
  await evaluate("window.__replaced = true");
  await send(method, params);
  await until(`!window.__replaced && ${ready}`);
}
// Samples are compared with the expected block written right after them.
// Fix exercises must fail as written and pass after the listed repair.
function exercises(source) {
  const list = [];
  for (const m of source.matchAll(/^:::exercise ([a-z0-9-]+) Main\.java( fix)?\n```java\n([\s\S]*?)\n```\n:::\n(?:\n[^:\n][^\n]*\n)*\n?(?::::expected\n([\s\S]*?)\n:::)?/gm)) {
    const expected = m[4]?.replace(/^```\n|\n```$/g, "");
    list.push({ id: m[1], fix: !!m[2], code: m[3], expected: expected === undefined ? undefined : expected + "\n" });
  }
  return list;
}
async function checkFixes(list, repairs) {
  const fixes = list.filter(({ fix }) => fix);
  assert.deepEqual(fixes.map(({ id }) => id).sort(), Object.keys(repairs).sort());
  for (const { id, code } of fixes) {
    const box = `document.querySelector('[data-exercise=${id}]')`;
    assert.equal(await evaluate(`${box}.querySelector('.editor').value`), code);
    const [from, to, output, message] = repairs[id];
    const broken = await run(code);
    if (message) {
      assert.match(broken.exit, /コンパイルエラー/);
      assert.match(broken.output, message);
    } else assert.notEqual(broken.output, output);
    assert.ok(code.includes(from));
    const fixedResult = await run(code.replace(from, to));
    assert.equal(fixedResult.output, output, id);
    assert.equal(fixedResult.exit, "終了コード: 0");
  }
}
try {
  if (process.env.BLOCK_EXTERNAL_RUNTIME) {
    await send("Network.enable");
    await send("Network.setBlockedURLs", { urls: ["*://teavm.org/*", "*://cjrtnc.leaningtech.com/*"] });
  }
  await load("Page.navigate", { url });
  assert.equal(await evaluate(`${ex}.querySelector('.run-btn').disabled`), false);
  assert.equal(await evaluate("document.body.dataset.lesson"), "lesson01-1");
  assert.equal(await evaluate("document.querySelectorAll('.lesson-switch a').length"), 2);
  await evaluate("localStorage.setItem('info2026:lesson01:first','旧ページの入力');localStorage.removeItem('info2026:lesson01-1:first')");
  await load("Page.reload", {}, `${ex}?.querySelector('.editor').value === '旧ページの入力'`);
  assert.equal(await evaluate(`${ex}.querySelector('.editor').value`), "旧ページの入力");
  assert.equal(await evaluate("localStorage.getItem('info2026:lesson01-1:first')"), "旧ページの入力");
  const source = await readFile(new URL("../../content/lesson01-1.md", import.meta.url), "utf8");
  const firstList = exercises(source);
  const samples = firstList.filter(({ fix }) => !fix).map(({ code }) => code);
  const expected = firstList.filter(({ fix }) => !fix).map(({ expected }) => expected);
  assert.equal(samples.length, 6);
  for (let i = 0; i < samples.length; i++) {
    assert.ok(expected[i], `expected output for sample ${i}`);
    const result = await run(samples[i]);
    assert.equal(result.output, expected[i]);
    assert.equal(result.exit, "終了コード: 0");
  }
  await checkFixes(firstList, {
    "fix-semicolon": ['World!")', 'World!");', "Hello, World!\n", /Main\.java:3:\d+: ';' expected/],
    "fix-case": ["system.", "System.", "Hello, World!\n", /package system does not exist/],
    "fix-space": ["String\u3000name", "String name", "太田健吾\n", /illegal character: '\\u3000'/],
    "fix-quote": ['World!);', 'World!");', "Hello, World!\n", /unclosed string literal/],
  });
  await load("Page.reload");
  assert.equal(await evaluate("document.querySelector('[data-exercise=fix-case] .editor').value.includes('system.')"), true);
  // The reset button needs two presses and then restores and saves the starting code.
  const fixBox = "document.querySelector('[data-exercise=fix-case]')";
  await evaluate(`(() => {const e=${fixBox}.querySelector('.editor');e.value='壊れた';e.dispatchEvent(new Event('input',{bubbles:true}));${fixBox}.querySelector('.reset-btn').click();})()`);
  assert.equal(await evaluate(`${fixBox}.querySelector('.editor').value`), "壊れた");
  assert.equal(await evaluate(`${fixBox}.querySelector('.reset-btn').textContent`), "もう一度押すと戻します");
  await evaluate(`${fixBox}.querySelector('.reset-btn').click()`);
  const startCode = firstList.find(({ id }) => id === "fix-case").code;
  assert.equal(await evaluate(`${fixBox}.querySelector('.editor').value`), startCode);
  assert.equal(await evaluate("localStorage.getItem('info2026:lesson01-1:fix-case')"), startCode);
  assert.equal(await evaluate(`${fixBox}.querySelector('.reset-btn').textContent`), "最初のコードに戻す");
  assert.equal(await evaluate(`${fixBox}.querySelector('.code-highlight').textContent.includes('system.')`), true);
  assert.equal(await evaluate("document.querySelectorAll('.reset-btn').length"), 4);
  assert.equal(await evaluate("document.querySelector('[data-exercise=first] .reset-btn')"), null);
  console.log("Fix exercise reset button: OK");
  console.log("First period fix exercises start from broken code and pass after repair: OK");
  for (const [body, expectedOutput] of [
    ['System.out.println("こんにちは、Java！");', "こんにちは、Java！\n"],
    ['System.out.println("出席番号 99 番の 太田健吾 です。");System.out.println("好きなことは読書です。");', "出席番号 99 番の 太田健吾 です。\n好きなことは読書です。\n"],
    ['System.out.println("  *");System.out.println(" ***");System.out.println("*****");', "  *\n ***\n*****\n"],
    ['System.out.print("改行なし😀");', "改行なし😀"],
    ['System.out.print("前");System.err.print("中");System.out.println("後");', "前中後\n"],
    ['System.out.println("1");System.out.println("2");System.out.println("3");', "1\n2\n3\n"],
    ['int number=99;String name="太田健吾";double height=158.5;System.out.print("出席番号 ");System.out.print(number);System.out.print(" 番の ");System.out.print(name);System.out.println(" です。");System.out.print("身長は ");System.out.print(height);System.out.println(" cm です。");', "出席番号 99 番の 太田健吾 です。\n身長は 158.5 cm です。\n"],
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
  await load("Page.reload");
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
  assert.match(html,/class="tok-keyword"/);
  assert.doesNotMatch(html,/<button[^>]*class="reset-btn|<pre class="code-highlight/);
  assert.match(html,/確認用/);
  assert.match(html,/data:image\/png;base64/);
  assert.doesNotMatch(html,/<script/);
  assert.ok(await evaluate("[...document.querySelectorAll('.sample-canvas')].every(c=>c.width>0)"));
  await evaluate(`${ex}.querySelector('.output').scrollIntoView({block:'center'})`);
  await screenshot(process.env.SCREENSHOT || "/tmp/info2026-teavm-runtime.png");
  const secondUrl = new URL("lesson01-2.html", url).href;
  ex = "document.querySelector('[data-exercise=arithmetic]')";
  await load("Page.navigate", { url: secondUrl }, `location.href === ${JSON.stringify(secondUrl)} && !!${ex}?.querySelector('.save-note')`);
  assert.equal(await evaluate("document.body.dataset.lesson"), "lesson01-2");
  assert.equal(await evaluate("document.querySelectorAll('.lesson-switch a').length"), 2);
  assert.equal(await evaluate("localStorage.getItem('info2026:lesson01-1:first')"), samples[0]);
  const secondSource = await readFile(new URL("../../content/lesson01-2.md", import.meta.url), "utf8");
  const secondList = exercises(secondSource);
  const secondSamples = secondList.filter(({ fix }) => !fix).map(({ code }) => code);
  const secondExpected = secondList.filter(({ fix }) => !fix).map(({ expected }) => expected);
  assert.equal(secondSamples.length, 9);
  for (let i = 0; i < secondSamples.length; i++) {
    assert.ok(secondExpected[i], `expected output for sample ${i}`);
    const sampleResult = await run(secondSamples[i]);
    assert.equal(sampleResult.output, secondExpected[i]);
    assert.equal(sampleResult.exit, "終了コード: 0");
  }
  for (const [body, output] of [
    ['System.out.println("Hello");', "Hello\n"],
    ['String word="星";System.out.println(word.repeat(10));', "星星星星星星星星星星\n"],
    ['double upper=3;double lower=4;double height=5;System.out.println((upper+lower)*height/2);', "17.5\n"],
    ['double r=3;System.out.println(3.14*r*r);', "28.259999999999998\n"],
    ['double r=3;System.out.println(Math.PI*r*r);', "28.274333882308138\n"],
    ['int s=10000;System.out.println(s/3600+"時間"+(s%3600)/60+"分"+s%60+"秒");', "2時間46分40秒\n"],
  ]) {
    const taskResult = await run(main(body));
    assert.equal(taskResult.output, output);
    assert.equal(taskResult.exit, "終了コード: 0");
  }
  await checkFixes(secondList, {
    "fix-redefine": ["int count = count", "count = count", "2\n", /variable count is already defined/],
    "fix-name": ["println(aera)", "println(area)", "50\n", /cannot find symbol/],
    "fix-repeat": ['"★" * 5', '"★".repeat(5)', "★★★★★\n", /bad operand types/],
    "fix-divide": ["int base = 3;\n        int height = 5;", "double base = 3;\n        double height = 5;", "7.5\n"],
  });
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
