// ==UserScript==
// @name         Better Edits
// @namespace    local
// @description  Parks the edit form beside the image on wide screens, like the upload screen, and lets you scroll to zoom the image. (｡•̀ᴗ-)✧
// @version      2026-06-12
// @author       clragon
// @match        https://e621.net/posts/*
// @match        https://e926.net/posts/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
  // Two knobs: when to split, and the form's share of the row.
  // "1fr" splits evenly with the image; "2fr" mimics the upload screen,
  // where the form gets twice the image's width.
  const BREAKPOINT = "80rem";
  const EDIT_COLUMN = "1fr";

  // How far the scroll-to-zoom reaches, and how fast each notch moves.
  const MAX_ZOOM = 12;
  const ZOOM_STEP = 1.2;

  // #edit is jQuery .show()/.hide() toggled, so its inline display is the
  // only signal we need. :has() keeps the page untouched until you edit.
  const editShown = '#edit:not([style*="display: none"])';

  const style = document.createElement("style");
  style.id = "better-edits";
  style.textContent = `
    @media (min-width: ${BREAKPOINT}) {
      .post-display > .content:has(> ${editShown}) {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, ${EDIT_COLUMN});
        align-items: start;
        column-gap: 1rem;
      }

      .post-display > .content:has(> ${editShown}) > * {
        grid-column: 1;
        min-width: 0;
      }

      .post-display > .content > ${editShown} {
        grid-column: 2;
        grid-row: 1 / span 99;
        align-self: start;
        position: sticky;
        top: 0.5rem;
        margin: 0;
      }

      /* The whole frame is the half-screen area; the image centers and
         clips inside whatever room the nav/notice rows leave it. */
      .post-display > .content:has(> ${editShown}) > #image-and-nav {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 2rem);
      }

      /* e621 ships #image-container as width: fit-content, which shrink-wraps
         the stage to the image and leaves nothing to center in or zoom into. */
      .post-display > .content:has(> ${editShown}) #image-container {
        flex: 1;
        min-height: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .post-display > .content:has(> ${editShown}) #image {
        max-width: 100%;
        max-height: 100%;
        margin: auto;
        cursor: zoom-in;
      }
    }
  `;
  document.head.appendChild(style);

  const frame = document.querySelector("#image-and-nav");
  const container = document.querySelector("#image-container");
  const img = document.querySelector("#image");
  // Videos and flash get the layout but not the zoom.
  if (!frame || !container || !img || img.tagName !== "IMG") return;

  const edit = document.querySelector("#edit");
  const wide = window.matchMedia(`(min-width: ${BREAKPOINT})`);
  const active = () =>
    wide.matches && edit && getComputedStyle(edit).display !== "none";

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // Size the frame to the gap between its own top and the viewport bottom.
  // rect.top + scrollY is the scroll-independent document offset, so this
  // accounts for the header, ads, and padding the CSS can't know about.
  const sizeFrame = () => {
    if (!active()) {
      frame.style.height = "";
      return;
    }
    const offset = Math.round(frame.getBoundingClientRect().top + window.scrollY);
    frame.style.height = `calc(100vh - ${offset}px - 0.5rem)`;
  };

  // Zooming wants the full-resolution file, not the downscaled sample. RE621
  // also rigs the image to swap versions on click, so we swallow those.
  const original = container.dataset.fileUrl;
  const loadOriginal = () => {
    if (active() && original && img.src !== original) img.src = original;
  };

  container.addEventListener(
    "click",
    (e) => { if (active()) e.stopPropagation(); },
    true,
  );

  let scale = 1;
  let tx = 0;
  let ty = 0;

  const apply = () => {
    img.style.transformOrigin = "0 0";
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    img.style.cursor = scale > 1 ? "grab" : "zoom-in";
  };

  const reset = () => {
    scale = 1;
    tx = 0;
    ty = 0;
    img.style.transform = "";
    img.style.cursor = "";
  };

  container.addEventListener(
    "wheel",
    (e) => {
      if (!active()) return;
      e.preventDefault();

      // rect.left/top already fold in the current translate + scale, so the
      // pointer-to-corner offset is all we need to keep that pixel pinned.
      const rect = img.getBoundingClientRect();
      const dx = e.clientX - rect.left;
      const dy = e.clientY - rect.top;

      const next = clamp(scale * (e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP), 1, MAX_ZOOM);
      const ratio = next / scale;
      tx -= dx * (ratio - 1);
      ty -= dy * (ratio - 1);
      scale = next;

      if (scale === 1) {
        reset();
      } else {
        apply();
      }
    },
    { passive: false },
  );

  // Drag to pan once we are zoomed in.
  let dragging = false;
  let startX = 0;
  let startY = 0;

  container.addEventListener("mousedown", (e) => {
    if (!active() || scale <= 1) return;
    dragging = true;
    startX = e.clientX - tx;
    startY = e.clientY - ty;
    img.style.cursor = "grabbing";
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    tx = e.clientX - startX;
    ty = e.clientY - startY;
    apply();
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    img.style.cursor = "grab";
  });

  container.addEventListener("dblclick", (e) => {
    if (!active()) return;
    e.preventDefault();
    reset();
  });

  // Entering edit mode sizes the frame and pulls the original; leaving it (or
  // shrinking below the split) hands the image back to the page untouched.
  const sync = () => {
    if (active()) {
      sizeFrame();
      loadOriginal();
    } else {
      reset();
      frame.style.height = "";
    }
  };

  wide.addEventListener("change", sync);
  window.addEventListener("resize", () => { if (active()) sizeFrame(); });
  if (edit) {
    new MutationObserver(sync)
      .observe(edit, { attributes: true, attributeFilter: ["style"] });
  }
  sync();
})();
