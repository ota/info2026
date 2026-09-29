import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  writeFile,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createLessonStore,
  lessonEditorPlugin,
} from "../scripts/author-server.mjs";
import { renderLesson } from "../scripts/generate.mjs";

const original = await readFile(
  new URL("./fixtures/lesson01.md", import.meta.url),
  "utf8",
);
const template = await readFile(
  new URL("../templates/page.html", import.meta.url),
  "utf8",
);

async function fixture(t, source = original) {
  const root = await mkdtemp(join(tmpdir(), "info2026-author-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "content"));
  await mkdir(join(root, "templates"));
  await writeFile(join(root, "content/lesson01.md"), source);
  await writeFile(join(root, "templates/page.html"), template);
  return {
    root,
    file: join(root, "content/lesson01.md"),
    store: createLessonStore(root),
  };
}

test("opening and saving without changes preserves the original bytes", async (t) => {
  const { store, root, file } = await fixture(t);
  const model = await store.load("lesson01");
  assert.ok(model.fields.some(({ kind }) => kind === "rich"));
  assert.deepEqual(
    model.fields
      .filter(({ kind }) => kind === "code")
      .map(({ exercise }) => exercise)
      .sort(),
    Object.keys(model.samples).sort(),
  );
  for (const field of model.fields) {
    assert.equal(model.source.slice(field.start, field.end), field.value);
  }
  const saved = await store.save("lesson01", {
    revision: model.revision,
    changes: [],
  });
  assert.equal(saved.revision, model.revision);
  assert.equal(await readFile(file, "utf8"), original);
  await assert.rejects(readdir(join(root, ".local")), { code: "ENOENT" });
});

test("editing one period keeps the other Markdown source unchanged", async (t) => {
  const { root, store } = await fixture(t);
  const firstPath = join(root, "content/lesson01-1.md");
  const secondPath = join(root, "content/lesson01-2.md");
  await writeFile(firstPath, original);
  await writeFile(secondPath, original);
  const first = await store.load("lesson01-1");
  const code = first.fields.find(({ exercise }) => exercise === "first");
  const replacement = code.value.replace("Hello, World!", "Java 1コマ目");
  await store.save("lesson01-1", {
    revision: first.revision,
    changes: [{ key: code.key, value: replacement }],
  });
  assert.match(await readFile(firstPath, "utf8"), /Java 1コマ目/);
  assert.equal(await readFile(secondPath, "utf8"), original);
  assert.equal((await store.load("lesson01-2")).samples.first.join("\n"), code.value);
});

test("saves nested bullets, Japanese text and Java whitespace, retaining all untouched source and IDs", async (t) => {
  const { store, root, file } = await fixture(t);
  const model = await store.load("lesson01");
  const list = model.fields.find(({ value }) => value.startsWith("- これは教材"));
  const code = model.fields.find(({ exercise }) => exercise === "first");
  const listValue =
    list.value.replace("ひな形", "編集確認用ひな形") +
    "\n  - 確認事項\n    - 内側の箇条書き";
  const codeValue =
    'public class Main {\n\tpublic static void main(String[] args) {\n        System.out.println("確認");\n    }\n}\n';
  const saved = await store.save("lesson01", {
    revision: model.revision,
    changes: [
      { key: code.key, value: codeValue },
      { key: list.key, value: listValue },
    ],
  });
  const expected = model.source
    .replace(code.value, codeValue)
    .replace(list.value, listValue);
  const disk = await readFile(file, "utf8");
  assert.equal(disk.replace(/\r\n/g, "\n"), expected);
  assert.equal(saved.samples.first.join("\n"), codeValue);
  const before = renderLesson(original, template, "lesson01.md");
  const after = renderLesson(disk, template, "lesson01.md");
  assert.deepEqual(after.sectionIds, before.sectionIds);
  assert.deepEqual(after.exerciseIds, before.exerciseIds);
  const backups = await readdir(join(root, ".local/author-backups"));
  assert.equal(backups.length, 1);
  assert.equal(
    await readFile(join(root, ".local/author-backups", backups[0]), "utf8"),
    original,
  );
});

test("external changes are never overwritten by a stale revision", async (t) => {
  const { store, file } = await fixture(t);
  const model = await store.load("lesson01");
  const external = original.replace("入力欄を確認する", "外部エディタで変更");
  await writeFile(file, external);
  await assert.rejects(
    store.save("lesson01", { revision: model.revision, changes: [] }),
    { status: 409 },
  );
  assert.equal(await readFile(file, "utf8"), external);
});

test("simultaneous saves from two tabs allow only one writer", async (t) => {
  const { store } = await fixture(t);
  const model = await store.load("lesson01");
  const field = model.fields.find(({ kind }) => kind === "inline");
  const results = await Promise.allSettled(
    ["変更A", "変更B"].map((value) =>
      store.save("lesson01", {
        revision: model.revision,
        changes: [{ key: field.key, value }],
      }),
    ),
  );
  assert.equal(
    results.filter(({ status }) => status === "fulfilled").length,
    1,
  );
  assert.equal(
    results.find(({ status }) => status === "rejected").reason.status,
    409,
  );
});

test("rejects invalid edits and structural ID changes without altering source", async (t) => {
  const { store, file } = await fixture(t);
  const model = await store.load("lesson01");
  const field = model.fields.find(({ kind }) => kind === "rich");
  for (const changes of [
    [{ key: "not-a-field", value: "bad" }],
    [
      { key: field.key, value: "text" },
      { key: field.key, value: "text" },
    ],
    [{ key: field.key, value: "## 追加見出し {#unexpected}\n\n本文" }],
    [{ key: field.key, value: ":::unknown\n本文\n:::" }],
  ]) {
    await assert.rejects(
      store.save("lesson01", { revision: model.revision, changes }),
      { status: 422 },
    );
  }
  assert.equal(await readFile(file, "utf8"), original);
  await assert.rejects(store.load("../lesson01"), { status: 404 });
});

test("preserves CRLF files while exposing normalized edit ranges", async (t) => {
  const crlf = original.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
  const { store, file } = await fixture(t, crlf);
  const model = await store.load("lesson01");
  const field = model.fields.find(({ kind }) => kind === "inline");
  await store.save("lesson01", {
    revision: model.revision,
    changes: [{ key: field.key, value: "編集確認" }],
  });
  assert.equal(
    await readFile(file, "utf8"),
    crlf.replace(field.value, "編集確認"),
  );
});

test("local editing API checks host, origin and save token", async (t) => {
  const { root } = await fixture(t);
  let middleware;
  lessonEditorPlugin(root).configureServer({
    middlewares: {
      use(fn) {
        middleware = fn;
      },
    },
  });
  async function request({
    method = "GET",
    host = "localhost:5173",
    origin,
    token,
    remoteAddress = "127.0.0.1",
    body = {},
  } = {}) {
    const req = Object.assign(
      (async function* () {
        // Split inside multibyte Japanese characters as a network stream may.
        const bytes = Buffer.from(JSON.stringify(body));
        for (let i = 0; i < bytes.length; i += 2)
          yield bytes.subarray(i, i + 2);
      })(),
      {
        url: "/__editor/api/lesson01",
        method,
        socket: { remoteAddress },
        headers: {
          host,
          origin,
          "content-type": "application/json",
          "x-lesson-editor-token": token,
        },
      },
    );
    let data;
    const response = {
      statusCode: 200,
      setHeader() {},
      end(value) {
        data = JSON.parse(value);
      },
    };
    await middleware(req, response, () =>
      assert.fail("Unexpected fallthrough"),
    );
    return { status: response.statusCode, data };
  }
  const loaded = await request();
  assert.equal(loaded.status, 200);
  assert.ok(loaded.data.token);
  assert.equal((await request({ host: "evil.example" })).status, 403);
  assert.equal((await request({ remoteAddress: "192.168.1.20" })).status, 403);
  assert.equal((await request({ origin: "https://evil.example" })).status, 403);
  assert.equal((await request({ method: "POST" })).status, 403);
  assert.equal(
    (
      await request({
        method: "POST",
        token: loaded.data.token,
        body: { revision: loaded.data.revision, changes: [] },
      })
    ).status,
    200,
  );
  const field = loaded.data.fields.find(({ kind }) => kind === "inline");
  const saved = await request({
    method: "POST",
    token: loaded.data.token,
    body: {
      revision: loaded.data.revision,
      changes: [{ key: field.key, value: "日本語の保存確認" }],
    },
  });
  assert.equal(saved.status, 200);
  assert.ok(saved.data.source.includes("日本語の保存確認"));
});

test("fix exercises put editable code with errors into the input, not the sample canvas", async (t) => {
  const broken = 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("<a>")\n    }\n}';
  const at = original.lastIndexOf("\n## ");
  const source =
    original.slice(0, at) +
    `\n:::exercise fix-one Main.java fix\n\`\`\`java\n${broken}\n\`\`\`\n:::\n` +
    original.slice(at);
  const page = renderLesson(source, template, "lesson01.md");
  assert.equal(page.samples["fix-one"], undefined);
  assert.ok(page.exerciseIds.includes("fix-one"));
  const escaped = broken.replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  assert.ok(page.html.includes(`aria-label="直すコード"`));
  assert.ok(page.html.includes(`>${escaped}</textarea>`));
  assert.throws(
    () => renderLesson(source.replace("Main.java fix", "Main.java other"), template, "lesson01.md"),
    /指定が不正/,
  );

  const { store, file } = await fixture(t, source);
  const model = await store.load("lesson01");
  const field = model.fields.find(({ exercise }) => exercise === "fix-one");
  assert.equal(field.fix, true);
  assert.equal(field.value, broken);
  const fixed = broken.replace('("<a>")', '("<b>");');
  await store.save("lesson01", {
    revision: model.revision,
    changes: [{ key: field.key, value: fixed }],
  });
  assert.equal(await readFile(file, "utf8"), source.replace(broken, fixed));
});
