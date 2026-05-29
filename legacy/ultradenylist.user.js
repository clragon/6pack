// ==UserScript==
// @name         UltraDenylist
// @author       binaryfloof
// @version      5.0
// @description  Because we are ultra tired of certain content when moderating without the regular blacklist.
// @match        https://e621.net/*
// @match        https://e926.net/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_KEY = "ultradenylist_entries";
  const MARKER_ATTR = "data-ultradeny";
  const HOLD_DURATION = 1500;

  let showPageRevealed = false;

  function getEntries() {
    const raw = GM_getValue(STORAGE_KEY, "");
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
  }

  // =====================
  //  Filter parsing
  // =====================

  function parseToken(raw) {
    let inverted = false;
    let optional = false;
    let token = raw.toLowerCase();

    if (token.startsWith("~")) {
      optional = true;
      token = token.slice(1);
    }
    if (token.startsWith("-")) {
      inverted = true;
      token = token.slice(1);
    }

    const metaMatch = token.match(/^(\w+):(.+)$/);
    if (metaMatch) {
      return { type: metaMatch[1], value: metaMatch[2], inverted, optional };
    }

    if (token.includes("*")) {
      const pattern = new RegExp(
        "^" +
          token.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") +
          "$",
      );
      return { type: "wildcard", value: pattern, inverted, optional };
    }

    return { type: "tag", value: token, inverted, optional };
  }

  function parseFilter(line) {
    const tokens = line
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map(parseToken);
    if (tokens.length === 0) return null;
    return tokens;
  }

  function compareValue(postVal, comparison, filterVal) {
    if (comparison === "..") {
      const [lo, hi] = filterVal;
      if (lo !== null && postVal < lo) return false;
      if (hi !== null && postVal > hi) return false;
      return true;
    }
    switch (comparison) {
      case ">":
        return postVal > filterVal;
      case "<":
        return postVal < filterVal;
      case ">=":
        return postVal >= filterVal;
      case "<=":
        return postVal <= filterVal;
      default:
        return postVal === filterVal;
    }
  }

  function parseNumericValue(raw) {
    const rangeMatch = raw.match(/^(\d*\.?\d*)\.\.(\d*\.?\d*)$/);
    if (rangeMatch) {
      return {
        comparison: "..",
        value: [
          rangeMatch[1] ? Number(rangeMatch[1]) : null,
          rangeMatch[2] ? Number(rangeMatch[2]) : null,
        ],
      };
    }
    const cmpMatch = raw.match(/^([<>]=?)(\d+\.?\d*)$/);
    if (cmpMatch) {
      return { comparison: cmpMatch[1], value: Number(cmpMatch[2]) };
    }
    return { comparison: "=", value: Number(raw) };
  }

  function testToken(token, post) {
    let result;

    switch (token.type) {
      case "tag":
        result = post.tags.includes(token.value);
        break;
      case "wildcard":
        result = post.tags.some((t) => token.value.test(t));
        break;
      case "rating": {
        const r = token.value.charAt(0);
        result = post.rating === r;
        break;
      }
      case "id":
      case "score":
      case "favcount":
      case "width":
      case "height": {
        const field = {
          id: "id",
          score: "score",
          favcount: "favCount",
          width: "width",
          height: "height",
        }[token.type];
        const parsed = parseNumericValue(token.value);
        result = compareValue(post[field], parsed.comparison, parsed.value);
        break;
      }
      case "type":
        result = post.fileExt === token.value;
        break;
      case "status":
        result = post.flags.includes(token.value);
        break;
      case "uploader":
      case "username":
        result = post.uploader === token.value;
        break;
      case "userid":
        result = post.uploaderId === Number(token.value);
        break;
      case "pool":
        result = post.pools.includes(token.value);
        break;
      default:
        result = post.tags.includes(token.type + ":" + token.value);
        break;
    }

    return token.inverted ? !result : result;
  }

  function testFilter(filter, post) {
    const required = filter.filter((t) => !t.optional);
    const optional = filter.filter((t) => t.optional);

    for (const token of required) {
      if (!testToken(token, post)) return false;
    }

    if (optional.length > 0) {
      if (!optional.some((token) => testToken(token, post))) return false;
    }

    return true;
  }

  // =====================
  //  Post data extraction
  // =====================

  function extractFromAttrs(el) {
    const tagStr = el.getAttribute("data-tags") || "";
    if (!tagStr && !el.getAttribute("data-id")) return null;
    return {
      id: Number(el.getAttribute("data-id")),
      tags: tagStr.split(/\s+/).filter(Boolean),
      rating: (el.getAttribute("data-rating") || "").charAt(0),
      fileExt: el.getAttribute("data-file-ext") || "",
      width: Number(el.getAttribute("data-width")) || 0,
      height: Number(el.getAttribute("data-height")) || 0,
      score: Number(el.getAttribute("data-score")) || 0,
      favCount: Number(el.getAttribute("data-fav-count")) || 0,
      uploader: (el.getAttribute("data-uploader") || "").toLowerCase(),
      uploaderId: Number(el.getAttribute("data-uploader-id")) || 0,
      flags: (el.getAttribute("data-flags") || "").split(/\s+/),
      pools: (el.getAttribute("data-pools") || "").split(/\s+/).filter(Boolean),
    };
  }

  function extractFromJQueryExpando(el) {
    try {
      const expandoKey =
        Object.keys(el).find((k) => k.startsWith("jQuery")) ||
        Object.getOwnPropertyNames(el).find((k) => k.startsWith("jQuery"));
      if (!expandoKey) return null;
      const wfpost = el[expandoKey]?.wfpost;
      if (!wfpost) return null;
      const tagString = String(wfpost.tagString || "");
      return {
        id: Number(wfpost.id) || 0,
        tags: tagString.split(/\s+/).filter(Boolean),
        rating: String(wfpost.rating || "").charAt(0),
        fileExt: String(wfpost.file?.ext || el.getAttribute("filetype") || ""),
        width: Number(wfpost.img?.width) || 0,
        height: Number(wfpost.img?.height) || 0,
        score: Number(wfpost.score?.total) || 0,
        favCount: Number(wfpost.favorites || wfpost.fav_count) || 0,
        uploader: String(wfpost.uploader || "").toLowerCase(),
        uploaderId: Number(wfpost.uploader_id) || 0,
        flags: [],
        pools: [],
      };
    } catch (e) {
      return null;
    }
  }

  // =====================
  //  Re621 early cache
  // =====================

  const re621Cache = new Map();

  function cacheFromNode(node) {
    if (node.nodeType !== 1) return;
    if (node.matches?.("article[data-id][data-tags]")) {
      cacheArticle(node);
    }
    if (node.querySelectorAll) {
      for (const el of node.querySelectorAll("article[data-id][data-tags]")) {
        cacheArticle(el);
      }
    }
  }

  function cacheArticle(el) {
    const id = el.getAttribute("data-id");
    if (!id || re621Cache.has(id)) return;
    re621Cache.set(id, extractFromAttrs(el));
  }

  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        cacheFromNode(node);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // =====================
  //  Unified extraction
  // =====================

  function extractPostData(el) {
    const native = extractFromAttrs(el);
    if (native && native.tags.length > 0) return native;

    if (el.tagName === "POST" && el.id) {
      const id = el.id.replace("entry_", "");
      const cached = re621Cache.get(id);
      if (cached) return cached;

      return extractFromJQueryExpando(el);
    }

    return null;
  }

  function extractShowPageData() {
    const container = document.getElementById("image-container");
    if (!container) return null;
    return extractFromAttrs(container);
  }

  // =====================
  //  Styles
  // =====================

  const STYLE_ID = "ultradenylist-style";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* ==========================================
         Grid: Native e621 thumbnails
         ========================================== */
      article.thumbnail.ultradenied .thm-link {
        position: relative;
      }
      article.thumbnail.ultradenied .thm-link::before {
        content: "\\26D4" !important;
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        background: repeating-linear-gradient(
          45deg,
          #1a0000,
          #1a0000 10px,
          #220000 10px,
          #220000 20px
        );
        border: 2px solid #ff4444;
        z-index: 10;
        pointer-events: none;
      }
      article.thumbnail.ultradenied .thm-link img,
      article.thumbnail.ultradenied .thm-link picture,
      article.thumbnail.ultradenied .thm-link source {
        opacity: 0 !important;
      }

      /* ==========================================
         Grid: Re621 <post> thumbnails
         ========================================== */
      post.ultradenied > a {
        position: relative;
      }
      post.ultradenied > a::before {
        content: "\\26D4" !important;
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        background: repeating-linear-gradient(
          45deg,
          #1a0000,
          #1a0000 10px,
          #220000 10px,
          #220000 20px
        );
        border: 2px solid #ff4444;
        z-index: 10;
        pointer-events: none;
      }
      post.ultradenied > a > img {
        opacity: 0 !important;
      }
      post.ultradenied > a > post-loading {
        display: none !important;
      }

      /* ==========================================
         Show page: image-only overlay
         Image stays in layout (visibility:hidden)
         so the overlay matches its dimensions.
         ========================================== */
      #image-container.ultradenied {
        position: relative;
      }
      #image-container.ultradenied > *:not(#ultradenylist-show-overlay) {
        visibility: hidden !important;
      }
      #ultradenylist-show-overlay {
        position: absolute;
        inset: 0;
        min-height: 300px;
        background: repeating-linear-gradient(
          45deg,
          #1a0000,
          #1a0000 10px,
          #220000 10px,
          #220000 20px
        );
        border: 2px solid #ff4444;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        box-sizing: border-box;
      }
      #ultradenylist-show-overlay .udl-title {
        font-size: 20px;
        font-weight: bold;
        color: #ff4444;
        text-shadow: 0 0 8px #ff0000;
        letter-spacing: 2px;
      }
      #ultradenylist-show-overlay .udl-subtitle {
        font-size: 12px;
        color: #ff444488;
      }
      #ultradenylist-show-overlay .udl-tags {
        font-size: 11px;
        color: #ff444466;
        max-width: 400px;
        text-align: center;
        word-break: break-all;
      }
      #ultradenylist-show-overlay .udl-hold-btn {
        margin-top: 12px;
        position: relative;
        width: 260px;
        height: 48px;
        background: #331111;
        border: 2px solid #ff4444;
        cursor: pointer;
        overflow: hidden;
        user-select: none;
        -webkit-user-select: none;
      }
      #ultradenylist-show-overlay .udl-hold-fill {
        position: absolute;
        inset: 0;
        width: 0%;
        background: #ff4444;
        transition: none;
      }
      #ultradenylist-show-overlay .udl-hold-fill.filling {
        transition: width ${HOLD_DURATION}ms linear;
        width: 100%;
      }
      #ultradenylist-show-overlay .udl-hold-label {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #fff;
        font-size: 12px;
        font-weight: bold;
        letter-spacing: 1px;
        text-transform: uppercase;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  // =====================
  //  Grid page
  // =====================

  function processListPage() {
    const entries = getEntries();
    const filters = entries.map(parseFilter).filter(Boolean);
    if (filters.length === 0) return;

    const posts = document.querySelectorAll(
      "article.thumbnail:not([data-ultradeny]), post:not([data-ultradeny])",
    );

    for (const el of posts) {
      el.setAttribute(MARKER_ATTR, "checked");

      const post = extractPostData(el);
      if (!post || post.tags.length === 0) continue;

      const matched = filters.some((f) => testFilter(f, post));
      if (matched) {
        el.classList.add("ultradenied");
      }
    }
  }

  // =====================
  //  Show page
  // =====================

  function processShowPage() {
    if (showPageRevealed) return;
    if (document.getElementById("ultradenylist-show-overlay")) return;

    const container = document.getElementById("image-container");
    if (!container) return;

    const entries = getEntries();
    const filters = entries.map(parseFilter).filter(Boolean);
    if (filters.length === 0) return;

    const post = extractShowPageData();
    if (!post || post.tags.length === 0) return;

    const matchingEntries = entries.filter((line) => {
      const f = parseFilter(line);
      return f && testFilter(f, post);
    });
    if (matchingEntries.length === 0) return;

    container.classList.add("ultradenied");

    const video = container.querySelector("video");
    if (video) {
      video.pause();
      video.muted = true;
    }

    const overlay = document.createElement("div");
    overlay.id = "ultradenylist-show-overlay";
    overlay.innerHTML = `
      <div class="udl-title">\u26D4 ULTRA DENIED \u26D4</div>
      <div class="udl-subtitle">This post matches your UltraDenylist.</div>
      <div class="udl-tags">Matched: ${matchingEntries.map((e) => e.replace(/</g, "&lt;")).join(" | ")}</div>
      <div class="udl-hold-btn">
        <div class="udl-hold-fill"></div>
        <div class="udl-hold-label">Hold to reveal</div>
      </div>
    `;
    container.appendChild(overlay);

    const holdBtn = overlay.querySelector(".udl-hold-btn");
    const holdFill = overlay.querySelector(".udl-hold-fill");
    let holdTimer = null;

    function startHold(e) {
      e.preventDefault();
      e.stopPropagation();
      holdFill.classList.add("filling");
      holdTimer = setTimeout(() => {
        holdTimer = null;
        showPageRevealed = true;
        overlay.remove();
        container.classList.remove("ultradenied");
      }, HOLD_DURATION);
    }

    function cancelHold(e) {
      e.stopPropagation();
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      holdFill.classList.remove("filling");
      void holdFill.offsetWidth;
    }

    overlay.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
    });

    holdBtn.addEventListener("mousedown", startHold);
    holdBtn.addEventListener("mouseup", cancelHold);
    holdBtn.addEventListener("mouseleave", cancelHold);
    holdBtn.addEventListener("touchstart", startHold, { passive: false });
    holdBtn.addEventListener("touchend", cancelHold);
    holdBtn.addEventListener("touchcancel", cancelHold);
  }

  // =====================
  //  Editor
  // =====================

  function openEditor() {
    const existing = document.getElementById("ultradenylist-editor");
    if (existing) {
      existing.remove();
      return;
    }

    const raw = GM_getValue(STORAGE_KEY, "");

    const dialog = document.createElement("div");
    dialog.id = "ultradenylist-editor";
    dialog.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: #000c; display: flex; align-items: center; justify-content: center;
    `;
    dialog.innerHTML = `
      <div style="
        background: #1a1a2e; border: 2px solid #ff4444; padding: 24px;
        max-width: 600px; width: 90%; max-height: 80vh; display: flex;
        flex-direction: column; gap: 12px; color: #eee; font-family: monospace;
      ">
        <div style="font-size: 18px; font-weight: bold; color: #ff4444;">
          \u26D4 UltraDenylist Editor
        </div>
        <div style="font-size: 12px; color: #999;">
          One filter per line. Same syntax as e621 blacklist.<br>
          Lines starting with # are comments.
        </div>
        <textarea id="udl-editor-textarea" style="
          width: 100%; min-height: 200px; background: #111; color: #eee;
          border: 1px solid #333; padding: 8px; font-family: monospace;
          font-size: 13px; resize: vertical; box-sizing: border-box;
        ">${raw.replace(/</g, "&lt;")}</textarea>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button id="udl-editor-cancel" style="
            padding: 8px 16px; background: #333; color: #eee;
            border: 1px solid #555; cursor: pointer;
          ">Cancel</button>
          <button id="udl-editor-save" style="
            padding: 8px 16px; background: #ff4444; color: #fff;
            border: none; cursor: pointer; font-weight: bold;
          ">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);

    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.remove();
    });

    document
      .getElementById("udl-editor-cancel")
      .addEventListener("click", () => {
        dialog.remove();
      });

    document.getElementById("udl-editor-save").addEventListener("click", () => {
      const text = document.getElementById("udl-editor-textarea").value;
      GM_setValue(STORAGE_KEY, text);
      dialog.remove();
      location.reload();
    });
  }

  // =====================
  //  Init
  // =====================

  function isShowPage() {
    return /\/posts\/\d+/.test(location.pathname);
  }

  function init() {
    GM_registerMenuCommand("Edit UltraDenylist", openEditor);
    injectStyles();

    if (isShowPage()) {
      processShowPage();
    } else {
      processListPage();
    }

    new MutationObserver(() => {
      if (isShowPage()) {
        processShowPage();
      } else {
        processListPage();
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
