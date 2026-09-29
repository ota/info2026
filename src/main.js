import "./style.css";
import { createSubmissionFile } from "./export.js";
import { drawSample } from "./sample.js";
import { highlightHtml } from "./highlight.js";
import { javaRuntimeAvailable, javaRuntimeMessage, javaRuntimeNotice, isCheerpJ, runJava, stopJava, sendJavaInput } from "./java-runtime.js";

const sampleModules = import.meta.glob("./generated/*-samples.js", {
  eager: true,
});
const lesson = document.body.dataset.lesson;
if (import.meta.hot) {
  import.meta.hot.on("lesson-updated", ({ slug }) => {
    if (slug === lesson) location.reload();
  });
}
const samples = sampleModules[`./generated/${lesson}-samples.js`]?.samples ?? {};

const sampleCanvases = [];
for (const [name, lines] of Object.entries(samples)) {
  const canvas = document.querySelector(
    '[data-exercise="' + name + '"] .sample-canvas',
  );
  sampleCanvases.push([canvas, lines]);
  drawSample(canvas, lines);
}
// A canvas keeps whatever font was available when it was drawn, so redraw
// once the web font has loaded; otherwise a slow load leaves the fallback.
document.fonts?.load('14px "DM Mono"').then(() => {
  for (const [canvas, lines] of sampleCanvases) drawSample(canvas, lines);
});
let resizeFrame;
window.addEventListener("resize", () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    for (const [canvas, lines] of sampleCanvases) drawSample(canvas, lines);
  });
});

for (const note of document.querySelectorAll(".runtime-availability")) {
  note.textContent = javaRuntimeAvailable
    ? javaRuntimeNotice
    : javaRuntimeMessage;
  note.hidden = !note.textContent;
}
if (isCheerpJ) {
  const credit = document.querySelector(".runtime-credit");
  if (credit) credit.innerHTML = 'Java実行: <a href="https://cheerpj.com/" target="_blank" rel="noopener noreferrer">CheerpJ</a> · コンパイラ: OpenJDK';
}
let running = false;

function setAllRunButtonsDisabled(disabled) {
  for (const button of document.querySelectorAll(".run-btn"))
    button.disabled = disabled || !javaRuntimeAvailable;
  for (const button of document.querySelectorAll(".reset-btn, .copy-btn"))
    button.disabled = disabled;
}

// Buttons that replace the input act on a second press within 4 seconds,
// so one accidental click does not discard what the student typed.
function twoPress(button, confirmText, action, needsConfirm = () => true) {
  const label = button.textContent;
  let timer;
  const restore = () => {
    clearTimeout(timer);
    timer = undefined;
    button.textContent = label;
    button.classList.remove("confirming");
  };
  button.addEventListener("click", () => {
    if (running) return;
    if (!timer && needsConfirm()) {
      button.textContent = confirmText;
      button.classList.add("confirming");
      timer = setTimeout(restore, 4000);
      return;
    }
    restore();
    action();
  });
}

for (const exercise of document.querySelectorAll(".exercise")) {
  const key =
    "info2026:" +
    `${lesson}:` +
    exercise.dataset.exercise;
  const editor = exercise.querySelector(".editor");
  const gutter = exercise.querySelector(".gutter");
  // Colored copy of the code behind the transparent textarea. The textarea
  // stays the real input, so paste blocking, IME and autosave are unchanged.
  const codeArea = document.createElement("div");
  codeArea.className = "code-area";
  const highlight = document.createElement("pre");
  highlight.className = "code-highlight";
  highlight.setAttribute("aria-hidden", "true");
  editor.before(codeArea);
  codeArea.append(highlight, editor);
  editor.classList.add("has-highlight");
  const syncScroll = () => {
    gutter.scrollTop = highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
  };
  const status = exercise.querySelector(".status");
  const output = exercise.querySelector(".output");
  const outputText = output.querySelector("pre");
  const exitCode = output.querySelector(".exit-code");
  const stopButton = exercise.querySelector(".stop-btn");
  const inputPanel = exercise.querySelector(".stdin-panel");
  const input = exercise.querySelector(".stdin-input");
  const inputHistory = exercise.querySelector(".stdin-history");
  const inputSend = exercise.querySelector(".stdin-send");
  const inputEof = exercise.querySelector(".stdin-eof");
  const setInputWaiting = (waiting) => {
    input.disabled = inputSend.disabled = inputEof.disabled = !waiting;
    if (waiting) {
      inputPanel.hidden = false;
      input.focus();
    }
  };
  const sendInput = (line) => {
    if (!sendJavaInput(line)) return;
    inputHistory.hidden = false;
    inputHistory.textContent += line === null ? "（入力終了）\n" : `${line}\n`;
    input.value = "";
    setInputWaiting(false);
    status.textContent = "実行中…";
  };
  inputSend.addEventListener("click", () => sendInput(input.value));
  inputEof.addEventListener("click", () => sendInput(null));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      sendInput(input.value);
    }
  });
  stopButton.addEventListener("click", stopJava);
  const replaceCode = (code, message) => {
    editor.value = code;
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    status.classList.remove("error");
    status.textContent = message;
  };
  // Fix exercises: restore the broken starting code.
  const resetButton = exercise.querySelector(".reset-btn");
  if (resetButton)
    twoPress(resetButton, "もう一度押すと戻します", () =>
      replaceCode(editor.defaultValue, "最初のコードに戻しました。"),
    );
  // Inputs under a check: copy the student's own code from the exercise above.
  const copyButton = exercise.querySelector(".copy-btn");
  const source = document.querySelector(
    `[data-exercise="${exercise.dataset.copyFrom}"] .editor`,
  );
  if (copyButton)
    twoPress(
      copyButton,
      "もう一度押すと上書きします",
      () => {
        if (!source.value.trim()) {
          status.textContent = "先に上の入力欄にコードを入力してください。";
          status.classList.add("error");
          return;
        }
        replaceCode(source.value, "上のコードをコピーしました。書き換えて実行しましょう。");
      },
      () => editor.value.trim() && source.value.trim() && editor.value !== source.value,
    );
  const saveNote = document.createElement("div");
  saveNote.className = "save-note";
  saveNote.setAttribute("role", "status");
  saveNote.setAttribute("aria-live", "polite");
  editor.closest(".editor-wrap").insertAdjacentElement("afterend", saveNote);
  const updateGutter = () => {
    const minimum = exercise.classList.contains("try-exercise") ? 4 : 8;
    const count = Math.max(minimum, editor.value.split("\n").length);
    gutter.innerHTML = Array.from(
      { length: count },
      (_, index) => index + 1,
    ).join("<br>");
    highlight.innerHTML = highlightHtml(editor.value) + "\n ";
    syncScroll();
  };
  try {
    let saved = localStorage.getItem(key);
    if (saved === null && lesson === "lesson01-1") {
      saved = localStorage.getItem(`info2026:lesson01:${exercise.dataset.exercise}`);
      if (saved !== null) localStorage.setItem(key, saved);
    }
    // Fix exercises start from the code in the page; clearing it restores that code.
    editor.value = saved || editor.defaultValue;
    saveNote.textContent = saved
      ? "前回の入力を復元しました · この端末に保存"
      : "入力内容はこの端末に自動保存されます";
  } catch {
    saveNote.textContent =
      "自動保存を利用できません。ブラウザの保存設定を確認してください。";
    saveNote.classList.add("save-error");
  }
  updateGutter();
  editor.addEventListener("input", () => {
    updateGutter();
    output.hidden = true;
    inputPanel.hidden = true;
    inputHistory.textContent = "";
    try {
      localStorage.setItem(key, editor.value);
      saveNote.textContent = editor.value
        ? "この端末に保存済み"
        : "入力内容はこの端末に自動保存されます";
      saveNote.classList.remove("save-error");
    } catch {
      saveNote.textContent =
        "自動保存できません。ブラウザの保存設定を確認してください。";
      saveNote.classList.add("save-error");
    }
  });
  editor.addEventListener("scroll", syncScroll);
  // While the IME is composing, show the textarea's own text so the
  // composition (and its underline or background) stays readable.
  editor.addEventListener("compositionstart", () => codeArea.classList.add("composing"));
  editor.addEventListener("compositionend", () => codeArea.classList.remove("composing"));
  const blockPaste = (event) => {
    event.preventDefault();
    status.textContent =
      "貼り付けは受け付けません。キーボードで入力してください。";
    status.classList.add("error");
  };
  editor.addEventListener("paste", blockPaste);
  input.addEventListener("paste", blockPaste);
  input.addEventListener("drop", blockPaste);
  input.addEventListener("beforeinput", (event) => {
    if (["insertFromPaste", "insertFromDrop"].includes(event.inputType)) blockPaste(event);
  });
  editor.addEventListener("drop", blockPaste);
  editor.addEventListener("beforeinput", (event) => {
    if (
      event.inputType === "insertFromPaste" ||
      event.inputType === "insertFromDrop"
    )
      blockPaste(event);
  });
  editor.addEventListener("contextmenu", (event) => event.preventDefault());
  editor.addEventListener("keydown", (event) => {
    if (
      ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") ||
      (event.shiftKey && event.key === "Insert")
    ) {
      blockPaste(event);
    } else if (event.key === "Tab") {
      event.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.setRangeText("    ", start, end, "end");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  if (!javaRuntimeAvailable) {
    status.textContent = javaRuntimeMessage;
    exercise.querySelector(".run-btn").disabled = true;
  }
  exercise.querySelector(".run-btn").addEventListener("click", async () => {
    if (running) return;
    if (!editor.value.trim()) {
      status.textContent = "まずコードを入力してください。";
      status.classList.add("error");
      editor.focus();
      return;
    }
    running = true;
    editor.readOnly = true;
    stopButton.hidden = false;
    setAllRunButtonsDisabled(true);
    output.hidden = true;
    outputText.textContent = "";
    exitCode.textContent = "実行中";
    inputHistory.textContent = "";
    inputHistory.hidden = true;
    inputPanel.hidden = true;
    input.value = "";
    status.classList.remove("error");
    status.textContent = "Java実行環境を準備中…";
    const codeAtRun = editor.value;
    try {
      const result = await runJava(codeAtRun, {
        onStatus: (message) => { status.textContent = message; },
        onOutput: (text) => {
          output.hidden = false;
          outputText.textContent = text;
        },
        onInput: setInputWaiting,
      });
      if (editor.value !== codeAtRun) {
        status.textContent =
          "実行中にコードが変わりました。もう一度実行してください。";
        status.classList.add("error");
        return;
      }
      if (result.stopped) {
        outputText.textContent = result.output || "（出力なし）";
        output.hidden = false;
        exitCode.textContent = "停止";
        status.textContent = result.reason;
        return;
      }
      const failed = result.exitCode === null || result.exitCode !== 0;
      const diagnostics = Array.isArray(result.errors)
        ? result.errors.join("\n")
        : "";
      outputText.textContent = failed
        ? diagnostics ||
          result.output ||
          result.stderr ||
          "実行できませんでした。"
        : result.output || "（出力なし）";
      exitCode.textContent = failed
        ? "終了コード: " + (result.exitCode ?? "コンパイルエラー")
        : "終了コード: 0";
      output.hidden = false;
      if (failed) {
        status.textContent = "エラーを確認して直してみましょう。";
        status.classList.add("error");
      } else {
        status.textContent = "実行できました。出力を確認してください。";
      }
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("error");
      if (!output.hidden) exitCode.textContent = "実行中断";
    } finally {
      running = false;
      editor.readOnly = false;
      stopButton.hidden = true;
      setInputWaiting(false);
      setAllRunButtonsDisabled(false);
    }
  });
}

const exportForm = document.querySelector("#export-form");
exportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = exportForm.querySelector(".export-btn");
  const status = document.querySelector("#export-status");
  const attendanceNumber = document
    .querySelector("#attendance-number")
    .value.trim();
  const studentName = document.querySelector("#student-name").value.trim();
  if (!attendanceNumber || !studentName) return;

  button.disabled = true;
  status.classList.remove("error");
  status.textContent = "HTMLファイルを作成中…";
  try {
    const { blob, filename } = await createSubmissionFile({
      attendanceNumber,
      studentName,
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    status.textContent = "HTMLファイルのダウンロードを開始しました。";
  } catch (error) {
    status.textContent =
      "保存ファイルを作れませんでした。もう一度試してください。";
    status.classList.add("error");
    console.error(error);
  } finally {
    button.disabled = false;
  }
});
