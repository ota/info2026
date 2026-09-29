import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import MarkdownIt from "markdown-it";
import { EditorFields } from "./editor-fields.mjs";

const root = resolve(import.meta.dirname, "..");
const contentDir = join(root, "content");
const templatePath = join(root, "templates/page.html");
const generatedDir = join(root, "src/generated");
const markdown = new MarkdownIt({ html: false, linkify: true });
const defaultLinkOpen =
  markdown.renderer.rules.link_open ||
  ((tokens, index, options, environment, self) =>
    self.renderToken(tokens, index, options));
markdown.renderer.rules.link_open = (
  tokens,
  index,
  options,
  environment,
  self,
) => {
  const href = tokens[index].attrGet("href") || "";
  if (/^https?:\/\//.test(href)) {
    tokens[index].attrSet("target", "_blank");
    tokens[index].attrSet("rel", "noopener noreferrer");
  }
  return defaultLinkOpen(tokens, index, options, environment, self);
};

// Show each sentence on its own line: break after "。" unless it ends the
// text or a closing bracket follows. A source line break after "。" also
// becomes a visible break. Code spans are separate tokens and stay intact.
markdown.core.ruler.push("sentence_breaks", (state) => {
  for (const block of state.tokens) {
    if (block.type !== "inline" || !block.children) continue;
    const children = [];
    const hasContentAfter = (index) =>
      block.children
        .slice(index + 1)
        .some(({ type, content }) => type !== "softbreak" && (type !== "text" || content.trim()));
    block.children.forEach((token, index) => {
      if (token.type === "softbreak" && children.at(-1)?.content?.endsWith("。")) {
        children.push(new state.Token("hardbreak", "br", 0));
        return;
      }
      if (token.type !== "text" || !token.content.includes("。")) {
        children.push(token);
        return;
      }
      const parts = token.content.split(/(?<=。)(?![」』）)])/);
      parts.forEach((part, partIndex) => {
        const text = new state.Token("text", "", 0);
        text.content = partIndex ? part.replace(/^\s+/, "") : part;
        if (text.content) children.push(text);
        const last = partIndex === parts.length - 1;
        if (!last && parts.slice(partIndex + 1).some((rest) => rest.trim()))
          children.push(new state.Token("hardbreak", "br", 0));
      });
      // A sentence that ends this token but is followed by code or other
      // inline content still gets its own line.
      const next = block.children[index + 1];
      if (parts.at(-1).endsWith("。") && next && next.type !== "softbreak" && hasContentAfter(index))
        children.push(new state.Token("hardbreak", "br", 0));
    });
    block.children = children;
  }
});

// Wide tables scroll inside their own box instead of widening the page on phones.
markdown.renderer.rules.table_open = () => '<div class="table-scroll"><table>\n';
markdown.renderer.rules.table_close = () => "</table></div>\n";

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );

function readFrontMatter(source, path) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error(`${path}: 先頭にメタデータが必要です`);
  const meta = Object.fromEntries(
    match[1]
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf(":");
        if (index < 0) throw new Error(`${path}: 不正なメタデータ: ${line}`);
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
  for (const key of [
    "title",
    "pageTitle",
    "number",
    "term",
    "subhead",
    "footer",
  ]) {
    if (!meta[key]) throw new Error(`${path}: ${key} がありません`);
  }
  return {
    meta,
    body: source.slice(match[0].length),
    bodyStart: match[0].length,
  };
}

function splitSections(body, path, offset = 0) {
  const heading = /^## (.+?) \{#([a-z][a-z0-9-]*)\}\s*$/gm;
  const matches = [...body.matchAll(heading)];
  if (!matches.length) throw new Error(`${path}: ## 見出し {#id} がありません`);
  if (body.slice(0, matches[0].index).trim())
    throw new Error(`${path}: 最初の本文の前に ## 見出し {#id} が必要です`);
  if ([...body.matchAll(/^## /gm)].length !== matches.length)
    throw new Error(`${path}: すべての ## 見出しに {#id} を付けてください`);
  const ids = new Set();
  return matches.map((match, index) => {
    if (ids.has(match[2]))
      throw new Error(`${path}: 見出しID ${match[2]} が重複しています`);
    ids.add(match[2]);
    const rawStart = match.index + match[0].length;
    const raw = body.slice(rawStart, matches[index + 1]?.index);
    return {
      title: match[1],
      id: match[2],
      body: raw.trim(),
      bodyStart: offset + rawStart + raw.length - raw.trimStart().length,
    };
  });
}

function exerciseHtml(argument, body, samples, usedIds, path, context) {
  // "fix" puts code with deliberate errors into the input for students to repair.
  const [id, filename, mode] = argument.split(/\s+/);
  if (mode && mode !== "fix")
    throw new Error(`${path}: ${id} の指定が不正です: ${mode}`);
  const fix = mode === "fix";
  if (!/^[a-z][a-z0-9-]*$/.test(id || ""))
    throw new Error(`${path}: 演習IDが不正です: ${id}`);
  if (usedIds.has(id))
    throw new Error(`${path}: 演習ID ${id} が重複しています`);
  usedIds.add(id);
  let sample = "";
  let initial = "";
  let codeField;
  if (body.trim()) {
    const code = body.trim().match(/^```java\n([\s\S]*?)\n```$/);
    if (!code || !filename)
      throw new Error(
        `${path}: ${id} の見本はJavaコードフェンスとファイル名が必要です`,
      );
    if (fix) initial = code[1];
    else {
      sample = code[1];
      samples[id] = sample.split("\n");
    }
    codeField = context.editor?.add(
      "code",
      code[1],
      context.start + body.length - body.trimStart().length + 8,
      { exercise: id, filename, ...(fix && { fix: true }) },
    );
  } else if (fix) {
    throw new Error(`${path}: ${id} の直すコードがありません`);
  } else if (filename) {
    throw new Error(`${path}: ${id} の見本コードがありません`);
  }
  const safeId = escapeHtml(id);
  const label = sample
    ? "上記のサンプルコードを書き写してください："
    : fix
      ? "まず実行してエラーを確かめ、直してから再実行しましょう："
      : "";
  const sampleHtml = sample
    ? `<div class="sample-head"><span class="file-icon">J</span> ${escapeHtml(filename)}${codeField ? `<button type="button" class="author-code-button" data-author-code="${codeField.key}">見本コードを編集</button>` : '<span class="sample-tag">見ながら入力</span>'}</div>
       <div class="sample-scroll"><canvas class="sample-canvas" aria-label="書き写すためのJavaコードサンプル。文字は選択できません。"></canvas></div>`
    : fix
      ? `<div class="sample-head fix-head"><span class="file-icon">J</span> ${escapeHtml(filename)}${codeField ? `<button type="button" class="author-code-button" data-author-code="${codeField.key}">直すコードを編集</button>` : '<span class="sample-tag">エラーを直す</span>'}</div>`
      : "";
  return `<div class="exercise${fix ? " fix-exercise" : ""}" data-exercise="${safeId}">
    ${sampleHtml}
    <div class="work">
      ${label ? `<label for="editor-${safeId}">${label}</label>` : ""}
      <div class="editor-wrap"><div class="gutter" aria-hidden="true"></div>
        <textarea id="editor-${safeId}" aria-label="${sample ? "サンプルコード" : fix ? "直すコード" : escapeHtml(id.replace(/^task(\d+)$/, "課題$1").replace(/^ext(\d+)$/, "発展課題$1")) + "のコード"}" class="editor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" placeholder="${sample ? "// サンプルコードを見ながら、ここに入力" : "// 自分で考えて入力"}">${escapeHtml(initial)}</textarea>
      </div>
      <div class="work-footer"><div class="buttons">${fix ? '<button type="button" class="reset-btn">最初のコードに戻す</button>' : ""}<button type="button" class="run-btn">▶ 実行する</button><button type="button" class="stop-btn" hidden>停止する</button></div></div>
      <div class="status" role="status" aria-live="polite"></div>
      <div class="output" hidden><div class="output-head">実行結果 <span class="exit-code"></span></div><pre></pre></div>
      <div class="stdin-panel" hidden>
        <label for="stdin-${safeId}">プログラムへの入力（1行ずつ送信）</label>
        <pre class="stdin-history" aria-label="送信した入力" hidden></pre>
        <div class="stdin-controls">
          <input id="stdin-${safeId}" class="stdin-input" type="text" autocomplete="off" disabled>
          <button type="button" class="stdin-send" disabled>送信</button>
          <button type="button" class="stdin-eof" disabled>入力を終了</button>
        </div>
      </div>
    </div>
  </div>`;
}

function directiveHtml(name, argument, body, samples, usedIds, path, context) {
  const trimmed = body.trim();
  const lines = trimmed.split("\n");
  let lineStart = context.start + body.length - body.trimStart().length;
  const inline = (text, start) =>
    context.editor
      ? context.editor.inline(text, start)
      : markdown.renderInline(text);
  const rich = () =>
    context.editor
      ? context.editor.rich(body, context.start)
      : markdown.render(body);
  if (name === "goals") {
    return `<div class="goal-grid">${lines
      .map((line, index) => {
        const match = line.match(/^- (.+?) \| (.+)$/);
        if (!match)
          throw new Error(`${path}: goal は「- 名前 | 説明」で書いてください`);
        const title = inline(match[1], lineStart + 2);
        const description = inline(
          match[2],
          lineStart + 2 + match[1].length + 3,
        );
        lineStart += line.length + 1;
        return `<div class="goal"><b>${String(index + 1).padStart(2, "0")}</b><strong>${title}</strong><span>${description}</span></div>`;
      })
      .join("")}</div>`;
  }
  if (name === "howto") {
    return `<section class="howto" aria-labelledby="howto-title"><div class="howto-icon">⌨</div><div><h3 id="howto-title">${escapeHtml(argument)}</h3>${rich()}</div></section>`;
  }
  if (name === "about-language") {
    const [src, caption] = argument.split("|").map((part) => part.trim());
    if (!src || !caption)
      throw new Error(`${path}: about-language には画像と説明が必要です`);
    const list = rich().replace("<ul>", '<ul class="language-points">');
    return `<div class="about-language-layout">${list}<figure class="language-logo"><img src="${escapeHtml(src)}" alt="${escapeHtml(caption)}" width="250" height="262" /><figcaption>${escapeHtml(caption)}</figcaption></figure></div>`;
  }
  if (name === "concepts") {
    const items = [];
    for (const line of lines) {
      if (line.startsWith("- ")) {
        items.push({
          content: inline(line.slice(2), lineStart + 2),
          details: [],
        });
      } else if (line.startsWith("  - ") && items.length) {
        items.at(-1).details.push(inline(line.slice(4), lineStart + 4));
      } else {
        throw new Error(`${path}: concepts は箇条書きで書いてください`);
      }
      lineStart += line.length + 1;
    }
    return `<ul class="concepts">${items.map(({ content, details }) => `<li class="concept"><p>${content}</p>${details.length ? `<ul class="concept-details">${details.map((detail) => `<li>${detail}</li>`).join("")}</ul>` : ""}</li>`).join("\n")}</ul>`;
  }
  if (name === "exercise")
    return exerciseHtml(argument, body, samples, usedIds, path, context);
  if (name === "check")
    return `<div class="check"><b>確認</b><div class="check-body">${rich()}</div></div>`;
  if (name === "notice") return `<div class="lesson-notice">${rich()}</div>`;
  if (name === "expected") {
    const value = body.trim().startsWith("```")
      ? markdown
          .render(body)
          .replace(/<pre><code>/, "<pre>")
          .replace(/<\/code><\/pre>/, "</pre>")
      : `<code>${markdown.renderInline(body.trim())}</code>`;
    return `<div class="expected">${value}</div>`;
  }
  if (name === "hint")
    return `<details class="hint"><summary>ヒント</summary>${rich()}</details>`;
  throw new Error(`${path}: 未対応の記法 :::${name}`);
}

function renderBody(body, samples, usedIds, path, context) {
  const blocks = [];
  // The student rendering keeps its existing output; the editor renders each
  // source fragment separately so that editable ranges have exact offsets.
  let authorHtml = "";
  let cursor = 0;
  const withPlaceholders = body.replace(
    /^:::(\w[\w-]*)([^\n]*)\n([\s\S]*?)^:::\s*$/gm,
    (full, name, argument, content, offset) => {
      const token = `LESSONBLOCK${blocks.length}END`;
      const html = directiveHtml(
        name,
        argument.trim(),
        content,
        samples,
        usedIds,
        path,
        {
          editor: context.editor,
          start: context.start + offset + 3 + name.length + argument.length + 1,
        },
      );
      blocks.push([token, html]);
      if (context.editor) {
        authorHtml +=
          context.editor.rich(
            body.slice(cursor, offset),
            context.start + cursor,
          ) + html;
        cursor = offset + full.length;
      }
      return `\n\n${token}\n\n`;
    },
  );
  if (/^:::/m.test(withPlaceholders))
    throw new Error(`${path}: 閉じていない ::: ブロックがあります`);
  if (context.editor)
    return (
      authorHtml +
      context.editor.rich(body.slice(cursor), context.start + cursor)
    );
  let html = markdown.render(withPlaceholders);
  for (const [token, value] of blocks)
    html = html.replace(`<p>${token}</p>`, value);
  return html;
}

function renderSection(section, samples, usedIds, path, editor) {
  let body = section.body;
  let after = "";
  if (section.id === "goals") {
    const howto = body.match(/\n:::howto[^\n]*\n[\s\S]*?\n:::\s*$/);
    if (howto) {
      after = renderBody(howto[0].trim(), samples, usedIds, path, {
        editor,
        start:
          section.bodyStart +
          howto.index +
          howto[0].length -
          howto[0].trimStart().length,
      });
      body = body.slice(0, howto.index).trim();
    }
  }
  let html = renderBody(body, samples, usedIds, path, {
    editor,
    start: section.bodyStart,
  });
  if (section.id === "warmup")
    html = html.replace("<ul>", '<ul class="fact-list">');
  if (section.id === "challenge") {
    html = html.replace(
      /<h3>課題(\d+)\s+([^<]+)<\/h3>/g,
      '<h3 class="task-title">課題$1 <span>$2</span></h3>',
    );
  }
  const className =
    section.id === "challenge"
      ? "section challenge-section"
      : section.id === "summary"
        ? "section summary"
        : "section";
  return `<section id="${section.id}" class="${className}"><h2>${escapeHtml(section.title)}</h2>${html}</section>${after}`;
}

export function renderLesson(
  source,
  template,
  path,
  { editable = false } = {},
) {
  source = source.replace(/\r\n?/g, "\n");
  const slug = path.replace(/\.md$/, "");
  const { meta, body, bodyStart } = readFrontMatter(source, path);
  const sections = splitSections(body, path, bodyStart);
  const samples = {};
  const usedIds = new Set();
  const editor = editable ? new EditorFields(markdown, source) : undefined;
  const content = `<h1>${escapeHtml(meta.title)}</h1>\n${sections.map((section) => renderSection(section, samples, usedIds, path, editor)).join("\n")}`;
  const nav =
    sections
      .map(({ id, title }) => `<a href="#${id}">${escapeHtml(title)}</a>`)
      .join("") + '<a href="#save">保存</a>';
  const replacements = {
    PAGE_TITLE: meta.pageTitle,
    TERM: meta.term,
    NUMBER: meta.number,
    TITLE: meta.title,
    SUBHEAD: meta.subhead,
    FOOTER: meta.footer,
    SLUG: slug,
    NAV: nav,
    LESSON_SWITCH: ["lesson01-1", "lesson01-2"].includes(slug)
      ? ["lesson01-1", "lesson01-2"]
          .map((part, index) =>
            `<a href="./${part}.html"${slug === part ? ' aria-current="page"' : ""}>${index + 1}コマ目</a>`,
          )
          .join("")
      : "",
    CONTENT: content,
    RUNTIME_NOTICE: editable ? "/teavm/NOTICE.txt" : "./teavm/NOTICE.txt",
  };
  let html = template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) =>
    key === "NAV" || key === "CONTENT" || key === "LESSON_SWITCH"
      ? replacements[key]
      : escapeHtml(replacements[key] ?? ""),
  );
  html = html.replace(/[\t ]+$/gm, "");
  if (html.includes("{{"))
    throw new Error(`${path}: 未処理のテンプレート変数があります`);
  return {
    html,
    samples,
    fields: editor?.fields ?? [],
    source,
    meta,
    sectionIds: sections.map(({ id }) => id),
    exerciseIds: [...usedIds],
  };
}

export async function generateAll() {
  const template = await readFile(templatePath, "utf8");
  const paths = (await readdir(contentDir))
    .filter((name) => /^lesson\d+(?:-\d+)?\.md$/.test(name))
    .sort();
  if (!paths.includes("lesson01-1.md") || !paths.includes("lesson01-2.md"))
    throw new Error("content/lesson01-1.md と lesson01-2.md が必要です");
  await mkdir(generatedDir, { recursive: true });
  // Validate every lesson before writing any generated files.
  const rendered = await Promise.all(
    paths.map(async (path) => ({
      path,
      ...renderLesson(
        await readFile(join(contentDir, path), "utf8"),
        template,
        path,
      ),
    })),
  );
  const outputs = [];
  for (const { path, html, samples } of rendered) {
    const slug = path.slice(0, -3);
    const output = join(root, `${slug}.html`);
    await writeFile(output, html);
    if (slug === "lesson01-1") {
      const entry = join(root, "index.html");
      await writeFile(entry, html);
      outputs.push(entry);
      const previousUrl = join(root, "lesson01.html");
      await writeFile(previousUrl, html);
      outputs.push(previousUrl);
    }
    await writeFile(
      join(generatedDir, `${slug}-samples.js`),
      `// Generated from content/${path}\nexport const samples = ${JSON.stringify(samples, null, 2)};\n`,
    );
    outputs.push(output);
  }
  return outputs;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  for (const path of await generateAll()) console.log(path);
}
