// ==UserScript==
// @name         Ouroboru
// @namespace    local
// @description  The snakes never stop
// @version      2026-06-24
// @author       clragon
// @match        https://e621.net/posts*
// @match        https://e621.net/favorites*
// @match        https://e621.net/pools/*
// @match        https://e926.net/posts*
// @match        https://e926.net/favorites*
// @match        https://e926.net/pools/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const container = document.querySelector("section.posts-container");
  if (!container) return;

  // An <a#paginator-next> means more pages exist; a <span> means we've hit the end.
  const nextHrefIn = (root) => {
    const el = root.querySelector("#paginator-next");
    const href = el && el.tagName === "A" ? el.getAttribute("href") : null;
    return href ? new URL(href, location.href).href : null;
  };

  let nextHref = nextHrefIn(document);
  if (!nextHref) return;

  const pageOf = (href) => new URL(href, location.href).searchParams.get("page") || "1";

  // Every post id we've placed, so an overlapping page never appends a duplicate.
  const seen = new Set(
    [...container.querySelectorAll("article.thumbnail[data-id]")].map((a) => a.dataset.id),
  );

  // Mark the posts already here with their page, so the url can track them too.
  const firstHere = container.querySelector("article.thumbnail");
  if (firstHere) firstHere.dataset.obPage = pageOf(location.href);

  const style = document.createElement("style");
  style.textContent = `
    .ob-tail { display:flex; align-items:center; justify-content:center; gap:1em; padding:2em 0; }
    .ob-tail button { font:inherit; cursor:pointer; }
    .ob-tail:not([state="error"]):not([state="ready"]) button { display:none; }
    .ob-status { opacity:0.7; }
  `;
  document.head.appendChild(style);

  const tail = document.createElement("div");
  tail.className = "ob-tail";
  const status = document.createElement("span");
  status.className = "ob-status";
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Load more";
  tail.append(status, button);
  container.insertAdjacentElement("afterend", tail);

  const setState = (state, text) => {
    tail.setAttribute("state", state);
    status.textContent = text || "";
  };

  let loading = false;
  let auto = true;

  const loadNext = async () => {
    if (loading || !nextHref) return;
    loading = true;
    const page = pageOf(nextHref);
    setState("loading", "Loading more…");
    try {
      const res = await fetch(nextHref, { credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const doc = new DOMParser().parseFromString(await res.text(), "text/html");
      const incoming = doc.querySelector("section.posts-container");
      const posts = incoming ? [...incoming.querySelectorAll("article.thumbnail")] : [];

      const added = [];
      for (const post of posts) {
        const id = post.dataset.id;
        if (id && seen.has(id)) continue;
        if (id) seen.add(id);
        if (added.length === 0) post.dataset.obPage = page;
        container.appendChild(post);
        added.push(post);
      }

      nextHref = nextHrefIn(doc);

      // Hand the new thumbnails to e621's own blacklist instead of reimplementing it.
      const E = window.E621 || window.Danbooru;
      const $ = window.jQuery;
      if (added.length && $ && E && E.Blacklist) {
        const $new = $(added);
        E.Blacklist.add_posts($new);
        E.Blacklist.update_styles?.();
        E.Blacklist.update_visibility();
      }

      if (!nextHref) setState("end", "That's everything.");
      else setState("ready", "");
    } catch (err) {
      console.error("[ouroboru] failed to load next page", err);
      auto = false; // stop hammering; the button stays as a manual retry
      setState("error", "Couldn't fetch the next page. Click to retry.");
    } finally {
      loading = false;
    }
  };

  button.addEventListener("click", () => {
    auto = true;
    loadNext();
  });

  // Auto-load when the tail nears the viewport, about one screen ahead of the bottom.
  new IntersectionObserver(
    (entries) => {
      if (auto && entries.some((e) => e.isIntersecting)) loadNext();
    },
    { rootMargin: "0px 0px 800px 0px" },
  ).observe(tail);

  // Mirror the page of the topmost post in view into the url, so a reload resumes here.
  let queued = false;
  const syncUrl = () => {
    queued = false;
    let current = null;
    for (const marker of container.querySelectorAll("article.thumbnail[data-ob-page]")) {
      if (marker.getBoundingClientRect().top > 80) break;
      current = marker.dataset.obPage;
    }
    if (!current) return;
    const url = new URL(location.href);
    if (current === "1") url.searchParams.delete("page");
    else url.searchParams.set("page", current);
    if (url.href !== location.href) history.replaceState(history.state, "", url.href);
  };
  window.addEventListener(
    "scroll",
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(syncUrl);
    },
    { passive: true },
  );
})();
