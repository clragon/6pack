// ==UserScript==
// @name         Dmark Pilot
// @namespace    local
// @description  Type Markdown in DText fields. Translates via dmark, lets the site render.
// @version      0.2.0
// @author       binaryfloof
// @icon         📝
// @match        https://e621.net/*
// @match        https://e926.net/*
// @run-at       document-end
// @grant        none
// @require      https://libs.cdn.clynamic.net/dmark/0.0.2/dmark.iife.min.js
// ==/UserScript==

/* global dmark */

(() => {
  "use strict";

  const PILOT_FLAG = "dmarkPilot";

  // #region dmark adapter

  function mdToDText(md) {
    const { document: ast } = dmark.parseMarkdown(md);
    return dmark.formatDText(ast).output;
  }

  function dtextToMd(dtext) {
    const ast = dmark.parseDTextToAST(dtext);
    return dmark.formatMarkdown(ast).output;
  }

  // #endregion

  // #region markdown templates for the dtext format buttons
  // Keyed by the data-dtext attribute the e621ng formatter writes onto each
  // button. wrap = surround the selection. linePrefix = prefix every line of
  // the selection (or the cursor's current line if nothing selected).

  const MD_OPS = {
    "[b]%selection%[/b]": { wrap: ["**", "**"] },
    "[i]%selection%[/i]": { wrap: ["*", "*"] },
    "[u]%selection%[/u]": { wrap: ["__", "__"] },
    "[s]%selection%[/s]": { wrap: ["~~", "~~"] },
    "h2. %selection%": { linePrefix: "## " },
    "[spoiler]%selection%[/spoiler]": { wrap: ["||", "||"] },
    "[code]%selection%[/code]": { wrap: ["`", "`"] },
    "[quote]%selection%[/quote]": { linePrefix: "> " },
  };

  function applyOp(textarea, op) {
    const value = textarea.value;
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const selected = value.slice(start, end);

    if (op.wrap) {
      const inserted = op.wrap[0] + selected + op.wrap[1];
      textarea.value = value.slice(0, start) + inserted + value.slice(end);
      const cursorStart = start + op.wrap[0].length;
      textarea.setSelectionRange(cursorStart, cursorStart + selected.length);
    } else if (op.linePrefix) {
      if (start === end) {
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        textarea.value =
          value.slice(0, lineStart) + op.linePrefix + value.slice(lineStart);
        const cursor = start + op.linePrefix.length;
        textarea.setSelectionRange(cursor, cursor);
      } else {
        const prefixed = selected
          .split("\n")
          .map((line) => op.linePrefix + line)
          .join("\n");
        textarea.value = value.slice(0, start) + prefixed + value.slice(end);
        textarea.setSelectionRange(start, start + prefixed.length);
      }
    }

    textarea.focus();
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // #endregion

  // #region styles

  const STYLE = `
    .dtext-formatter[data-pilot-active="1"] textarea.dtext-formatter-input:not(.dmark-pilot-input) {
      display: none !important;
    }
    .dtext-formatter:not([data-pilot-active="1"]) .dmark-pilot-input {
      display: none !important;
    }
    .dtext-formatter-buttons .dmark-pilot-toggle {
      margin-left: auto;
      padding: 0.2em 0.6em;
      font: inherit;
      font-size: 0.85em;
      background: transparent;
      color: inherit;
      border: 1px solid currentColor;
      border-radius: 3px;
      opacity: 0.55;
      cursor: pointer;
    }
    .dtext-formatter-buttons .dmark-pilot-toggle:hover { opacity: 1; }
    .dtext-formatter-buttons .dmark-pilot-toggle.active {
      opacity: 1;
      background: var(--color-link);
      color: var(--color-section);
      border-color: var(--color-link);
    }
  `;

  function injectStyle() {
    if (document.getElementById("dmark-pilot-style")) return;
    const el = document.createElement("style");
    el.id = "dmark-pilot-style";
    el.textContent = STYLE;
    document.head.appendChild(el);
  }

  // #endregion

  // #region per-formatter wiring

  function pilotFormatter(formatter) {
    if (formatter.dataset[PILOT_FLAG]) return;

    const textarea = formatter.querySelector("textarea.dtext-formatter-input");
    if (!textarea) return;

    const buttons = formatter.querySelector(".dtext-formatter-buttons");
    if (!buttons) return;

    formatter.dataset[PILOT_FLAG] = "1";

    const mdTextarea = document.createElement("textarea");
    mdTextarea.className = "dtext-formatter-input dmark-pilot-input";
    mdTextarea.rows = textarea.rows || 6;
    textarea.insertAdjacentElement("afterend", mdTextarea);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "dmark-pilot-toggle";
    toggle.textContent = "Md";
    toggle.title = "Toggle Markdown input (translates to DText)";
    buttons.appendChild(toggle);

    function syncToDText() {
      let dtext;
      try {
        dtext = mdToDText(mdTextarea.value);
      } catch (error) {
        console.error("[dmark-pilot] md to dtext failed:", error);
        return;
      }
      if (textarea.value === dtext) return;
      textarea.value = dtext;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function isActive() {
      return formatter.getAttribute("data-pilot-active") === "1";
    }

    function setActive(value) {
      if (value) {
        let initial = textarea.value;
        if (initial) {
          try {
            initial = dtextToMd(initial);
          } catch (error) {
            console.error("[dmark-pilot] dtext to md failed:", error);
          }
        }
        mdTextarea.value = initial;
        formatter.setAttribute("data-pilot-active", "1");
        toggle.classList.add("active");
        syncToDText();
        const tabs = formatter.querySelector(".dtext-formatter-tabs");
        if (formatter.getAttribute("data-state") === "preview") {
          tabs?.querySelector('button.dtext-formatter-tab[action="write"]')?.click();
        }
        mdTextarea.focus();
      } else {
        formatter.removeAttribute("data-pilot-active");
        toggle.classList.remove("active");
      }
    }

    // Capture format-button clicks before the e621ng delegated handler runs.
    // Bubble-phase delegation can't see stopImmediatePropagation from a child,
    // so we listen in the capture phase on the buttons container.
    buttons.addEventListener(
      "click",
      (event) => {
        if (!isActive()) return;
        const button = event.target.closest("button.dtext-formatter-button");
        if (!button || !buttons.contains(button)) return;
        const template = button.getAttribute("data-dtext");
        const op = MD_OPS[template];
        if (!op) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        applyOp(mdTextarea, op);
      },
      true,
    );

    mdTextarea.addEventListener("input", syncToDText);
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      setActive(!isActive());
    });

    console.debug("[dmark-pilot] attached to formatter", formatter);
  }

  function scan() {
    document.querySelectorAll(".dtext-formatter").forEach(pilotFormatter);
  }

  // #endregion

  // #region bootstrap

  if (typeof dmark === "undefined") {
    console.error("[dmark-pilot] dmark library not loaded, check @require URL");
    return;
  }

  console.info("[dmark-pilot] booting, dmark exports:", Object.keys(dmark));
  injectStyle();
  scan();

  const observer = new MutationObserver(() => scan());
  observer.observe(document.body, { childList: true, subtree: true });

  // #endregion
})();
