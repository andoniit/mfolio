/**
 * The post body editor that ships inside the iOS app.
 *
 * It is the same TipTap engine as the web dashboard (`simple-editor.tsx`),
 * with the same extensions configured the same way, so a post written on the
 * phone opens on the web unchanged and vice versa. Only the chrome differs:
 * there is no toolbar here — the app draws a native one and drives the editor
 * through `window.mfolio`.
 *
 * Nothing in here touches the network. Images are picked, shrunk and uploaded
 * natively, and arrive as a finished public URL via `insertImage`.
 *
 * Rebuild after editing: `npm run build:ios-editor`.
 */
import { Editor, mergeAttributes } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { HorizontalRule as TiptapHorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Image } from "@tiptap/extension-image";
import { TextAlign } from "@tiptap/extension-text-align";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Highlight } from "@tiptap/extension-highlight";
import { Typography } from "@tiptap/extension-typography";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { CharacterCount, Placeholder } from "@tiptap/extensions";

// Mirrors src/components/tiptap/node/horizontal-rule-node — the web wraps the
// <hr> in a div, and the HTML has to match byte for byte.
const HorizontalRule = TiptapHorizontalRule.extend({
  renderHTML() {
    return ["div", mergeAttributes(this.options.HTMLAttributes, { "data-type": this.name }), ["hr"]];
  },
});

function post(message) {
  try {
    window.webkit.messageHandlers.mfolio.postMessage(message);
  } catch {
    // Opened outside the app (a browser, while debugging) — nothing to tell.
  }
}

const editor = new Editor({
  element: document.getElementById("editor"),
  editorProps: {
    attributes: {
      class: "simple-editor",
      "aria-label": "Post body",
    },
  },
  extensions: [
    // Everything above Placeholder matches simple-editor.tsx; change both or neither.
    StarterKit.configure({
      horizontalRule: false,
      link: { openOnClick: false, enableClickSelection: true },
    }),
    HorizontalRule,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Image,
    Typography,
    Superscript,
    Subscript,
    // Editor-only niceties. Neither adds a node or mark, so neither changes the
    // stored JSON or HTML.
    Placeholder.configure({ placeholder: "Start writing…" }),
    CharacterCount,
  ],
  content: "",
});

/* --------------------------------------------------------------- state out */

// The native toolbar lights buttons up from this. Coalesced to one message per
// frame: a transaction fires on every keystroke and selection move.
let statePending = false;
let dirtyPending = false;

function snapshotState() {
  const align = ["center", "right", "justify"].find((a) => editor.isActive({ textAlign: a })) ?? "left";
  const heading = [1, 2, 3, 4].find((level) => editor.isActive("heading", { level })) ?? 0;
  return {
    bold: editor.isActive("bold"),
    italic: editor.isActive("italic"),
    underline: editor.isActive("underline"),
    strike: editor.isActive("strike"),
    code: editor.isActive("code"),
    highlight: editor.isActive("highlight"),
    subscript: editor.isActive("subscript"),
    superscript: editor.isActive("superscript"),
    link: editor.isActive("link"),
    linkHref: editor.getAttributes("link").href ?? "",
    heading,
    bulletList: editor.isActive("bulletList"),
    orderedList: editor.isActive("orderedList"),
    taskList: editor.isActive("taskList"),
    blockquote: editor.isActive("blockquote"),
    codeBlock: editor.isActive("codeBlock"),
    align,
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
    hasSelection: !editor.state.selection.empty,
    words: editor.storage.characterCount.words(),
    focused: editor.isFocused,
  };
}

function scheduleState() {
  if (statePending) return;
  statePending = true;
  requestAnimationFrame(() => {
    statePending = false;
    post({ type: "state", state: snapshotState() });
  });
}

// Loading content is not an edit; this keeps setContent from marking the
// post as changed the moment it opens.
let loading = false;

editor.on("transaction", scheduleState);
editor.on("focus", scheduleState);
editor.on("blur", scheduleState);
editor.on("update", () => {
  if (loading || dirtyPending) return;
  dirtyPending = true;
  requestAnimationFrame(() => {
    dirtyPending = false;
    post({ type: "dirty" });
  });
});

/* ----------------------------------------------------------- commands in */

const commands = {
  bold: (c) => c.toggleBold(),
  italic: (c) => c.toggleItalic(),
  underline: (c) => c.toggleUnderline(),
  strike: (c) => c.toggleStrike(),
  code: (c) => c.toggleCode(),
  highlight: (c) => c.toggleHighlight(),
  subscript: (c) => c.toggleSubscript(),
  superscript: (c) => c.toggleSuperscript(),
  paragraph: (c) => c.setParagraph(),
  heading: (c, level) => c.toggleHeading({ level }),
  bulletList: (c) => c.toggleBulletList(),
  orderedList: (c) => c.toggleOrderedList(),
  taskList: (c) => c.toggleTaskList(),
  blockquote: (c) => c.toggleBlockquote(),
  codeBlock: (c) => c.toggleCodeBlock(),
  horizontalRule: (c) => c.setHorizontalRule(),
  align: (c, value) => c.setTextAlign(value),
  indent: (c) => c.sinkListItem(editor.isActive("taskList") ? "taskItem" : "listItem"),
  outdent: (c) => c.liftListItem(editor.isActive("taskList") ? "taskItem" : "listItem"),
  clearFormatting: (c) => c.unsetAllMarks().clearNodes(),
  undo: (c) => c.undo(),
  redo: (c) => c.redo(),
};

window.mfolio = {
  /** Runs one formatting command against the current selection. */
  exec(name, arg) {
    const run = commands[name];
    if (!run) return false;
    return run(editor.chain().focus(), arg).run();
  },

  /**
   * Replaces the whole document. Accepts TipTap JSON (what the web saves) or
   * HTML (for posts that only have `content_html`). Clears undo history so the
   * first undo can't wipe the loaded post.
   */
  setContent(content) {
    loading = true;
    try {
      // One chain is one transaction, so the meta lands on the replacement
      // itself. Without it the load goes into undo history, and the first
      // undo after opening a post would blank it.
      editor
        .chain()
        .setMeta("addToHistory", false)
        .setContent(content ?? "", { emitUpdate: false })
        .run();
    } finally {
      loading = false;
    }
    // A new document starts at its top, whatever the last one was scrolled to.
    window.scrollTo(0, 0);
    scheduleState();
  },

  /** Everything the save needs, taken at the moment of saving. */
  snapshot() {
    return JSON.stringify({
      json: editor.getJSON(),
      html: editor.getHTML(),
      isEmpty: editor.isEmpty,
      words: editor.storage.characterCount.words(),
    });
  },

  /** Sets, changes or (with an empty href) removes the link on the selection. */
  setLink(href, text) {
    const chain = editor.chain().focus();
    if (!href) return chain.extendMarkRange("link").unsetLink().run();

    // With nothing selected there is nothing to link, so insert the text too.
    if (editor.state.selection.empty && !editor.isActive("link")) {
      const label = text || href;
      return chain
        .insertContent({ type: "text", text: label, marks: [{ type: "link", attrs: { href } }] })
        .run();
    }
    return chain.extendMarkRange("link").setLink({ href }).run();
  },

  insertImage(src, alt) {
    return editor.chain().focus().setImage({ src, alt: alt || null }).run();
  },

  focus() {
    editor.commands.focus();
  },

  blur() {
    editor.commands.blur();
    document.activeElement?.blur?.();
  },
};

post({ type: "ready" });
