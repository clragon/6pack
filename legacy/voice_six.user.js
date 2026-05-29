// ==UserScript==
// @name         Voice Six
// @description  VA2 -> E6 Janitor Bridge
// @version      2025-08-20
// @author       binaryfloof
// @match        https://e621.net/*
// @icon         https://em-content.zobj.net/source/samsung/411/microphone_1f3a4.png
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  const isEditable = (el) => {
    if (!el) return false;
    const t = el.tagName?.toLowerCase();
    return t === "input" || t === "textarea" || el.isContentEditable;
  };

  const visible = (el) =>
    !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

  const getCsrfToken = () =>
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") ?? "";

  const postForm = async (url, method, form) => {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        credentials: "same-origin",
        body: new URLSearchParams(form).toString(),
        keepalive: true,
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const currentPostId = () => {
    const m = location.pathname.match(/\/posts\/(\d+)/);
    return m ? m[1] : null;
  };

  const clickRefreshSources = () => {
    const root = document.querySelector("li.source-links");
    if (!root) return false;
    let el =
      root.querySelector('i[title*="Update source data" i]') ||
      root.querySelector("i.fa-rotate") ||
      [...root.querySelectorAll("i")].find((i) =>
        /cursor\s*:\s*pointer/i.test(i.getAttribute("style") || "")
      ) ||
      root.querySelector("i");
    if (!el || !visible(el)) el = [...root.querySelectorAll("i")].find(visible);
    if (!el) return false;
    el.click();
    return true;
  };

  const collectRelatedPostLinks = () => {
    const arts = document.querySelectorAll(
      '.parent-children article[id^="post_"], .children-moved article[id^="post_"], .notice-parent article[id^="post_"], .notice-child article[id^="post_"]'
    );
    const seen = new Set();
    const out = [];
    for (const art of arts) {
      const a =
        art.querySelector('a[href*="/posts/"]') || art.querySelector("a[href]");
      if (!a) continue;
      const u = new URL(a.getAttribute("href"), location.href);
      if (!/\/posts\/\d+/.test(u.pathname)) continue;
      const href = u.href;
      if (seen.has(href)) continue;
      seen.add(href);
      out.push(href);
    }
    return out;
  };

  const openAllRelated = () => {
    const links = collectRelatedPostLinks();
    if (!links.length) return false;
    for (const href of links)
      window.open(href, "_blank", "noopener,noreferrer");
    return true;
  };

  const openUploaderPage = () => {
    const li = document.querySelector(
      "#post-information li:has(a.user-member)"
    );
    if (!li) return false;
    const a = li.querySelector("a.user-member[href]");
    if (!a) return false;
    const href = new URL(a.getAttribute("href"), location.href).href;
    window.open(href, "_blank", "noopener,noreferrer");
    return true;
  };

  const openArtistTagSearch = () => {
    const a = document.querySelector(
      '#tag-list .artist-tag-list a.tag-list-search[href*="/posts?tags="]'
    );
    if (!a) return false;
    const href = new URL(a.getAttribute("href"), location.href).href;
    window.open(href, "_blank", "noopener,noreferrer");
    return true;
  };

  const tagBVAS = async () => {
    const id = currentPostId();
    if (!id) return false;
    const ok = await postForm(`${location.origin}/posts/${id}.json`, "PUT", {
      "post[tag_string_diff]": "bvas",
    });
    Danbooru.notice("Added BVAS tag");
    return ok;
  };

  const openFullscreen = () => {
    const a = document.querySelector(".ptbr-fullscreen a[href]");
    if (!a) return false;
    const href = new URL(a.getAttribute("href"), location.href).href;
    window.open(href, "_blank", "noopener,noreferrer");
    return true;
  };

  const addPendingToSearch = () => {
    if (!/^\/posts\/?$/.test(location.pathname)) return false;
    const sp = new URLSearchParams(location.search);
    const tags = sp.get("tags") ?? "";
    const decoded = tags.replace(/\+/g, " ");
    if (!decoded.trim()) return false;
    if (/\bstatus:pending\b/i.test(decoded)) return true;
    const next = (decoded + " status:pending").trim().replace(/\s+/g, " ");
    sp.set("tags", next);
    const url = `${location.origin}${location.pathname}?${sp.toString()}`;
    location.assign(url);
    return true;
  };

  const openProfileUploads = () => {
    const root = document.querySelector(".profile-sample.profile-uploads");
    if (!root) return false;
    const a =
      root.querySelector(
        '.profile-sample-header a.title[href*="/posts?tags="]'
      ) || root.querySelector('.profile-sample-links a[href*="/posts?tags="]');
    if (!a) return false;
    const href = new URL(a.getAttribute("href"), location.href).href;
    location.assign(href);
    return true;
  };

  const clickFirstGridPost = () => {
    const a = document.querySelector(
      'search-content post[rendered] a[href^="/posts/"]'
    );
    if (!a) return false;
    const href = new URL(a.getAttribute("href"), location.href).href;
    location.assign(href);
    return true;
  };

  const openSourcePosts = () => {
    const links = document.querySelectorAll(
      '.source-links .source-link a[href]:not([href^="/posts?tags="]):not(.jsv-replacement-anchor)'
    );
    if (!links.length) return false;
    const exts = /\.(jpe?g|png|gif|webp|bmp|svg|tiff?|heic|avif)(\?|#|$)/i;
    let opened = 0;

    for (const a of links) {
      const href = a.getAttribute("href");
      if (!href) continue;
      if (exts.test(href)) continue;
      window.open(
        new URL(href, location.href).href,
        "_blank",
        "noopener,noreferrer"
      );
      opened++;
    }
    return opened > 0;
  };

  const clickDeleteConfirm = () => {
    const a = document.querySelector(
      '.quick-mod-group a.button[href*="/moderator/post/posts/"][href*="/confirm_delete"]'
    );
    if (!a) return false;
    const href = new URL(a.getAttribute("href"), location.href).href;
    location.assign(href);
    return true;
  };

  const openComparison = () => {
    openFullscreen();

    const anchors = document.querySelectorAll(
      "a.jsv-replacement-anchor[data-replacement-url]"
    );
    if (!anchors.length) return false;

    for (const a of anchors) {
      const url = a.getAttribute("data-replacement-url");
      if (!url) continue;
      window.open(url, "_blank", "noopener,noreferrer");
    }
    return true;
  };

  const openFluffle = () => {
    const fluffleLink = document.querySelector('li a[href*="fluffle.xyz"]');
    if (!fluffleLink) return false;
    const href = fluffleLink.getAttribute("href");
    if (!href) return false;
    window.open(href, "_blank", "noopener,noreferrer");
    return true;
  };

  const approvePost = async () => {
    const id = currentPostId();
    if (!id) return false;

    await postForm(`${location.origin}/moderator/post/approval.json`, "POST", {
      post_id: id,
    });

    const nextLink = document.querySelector(".nav-link.next");
    if (nextLink) {
      const location = nextLink.getAttribute("href");
      if (location) {
        window.location.assign(new URL(location, window.location.href).href);
      }
    }

    return true;
  };

  const unapprovePost = async () => {
    const id = currentPostId();
    if (!id) return false;

    const ok = await postForm(
      `${location.origin}/moderator/post/approval.json`,
      "DELETE",
      {
        post_id: id,
      }
    );

    location.reload();

    return ok;
  };

  const MAP = {
    s1: clickRefreshSources,
    s2: openSourcePosts,
    r1: openAllRelated,
    u1: openUploaderPage,
    u2: openProfileUploads,
    a1: openArtistTagSearch,
    a2: approvePost,
    a3: unapprovePost,
    p1: tagBVAS,
    p2: openFullscreen,
    p3: clickDeleteConfirm,
    p4: openComparison,
    t1: addPendingToSearch,
    g1: clickFirstGridPost,
    f1: openFluffle,
  };

  const ARM_CODE = "Equal";
  let haveCtrl = false;
  let haveAltGr = false;
  let armed = false;
  let first = null;
  let timer = null;
  let shield = null;

  const suppress = new Set();
  const mark = (code) => {
    suppress.add(code);
    setTimeout(() => suppress.delete(code), 250);
  };

  const disarm = () => {
    armed = false;
    first = null;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (shield) {
      shield.remove();
      shield = null;
    }
  };

  const arm = () => {
    armed = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(disarm, 1500);
    shield = document.createElement("div");
    shield.style.position = "fixed";
    shield.style.inset = "0";
    shield.style.zIndex = "2147483647";
    shield.style.background = "transparent";
    shield.style.pointerEvents = "all";
    shield.tabIndex = 0;
    document.documentElement.appendChild(shield);
    shield.focus();
  };

  const keyChar = (e) => {
    if (/^Key[A-Z]$/.test(e.code)) return e.code.slice(-1).toLowerCase();
    if (/^Digit[0-9]$/.test(e.code)) return e.code.slice(-1);
    if (/^Numpad[0-9]$/.test(e.code)) return e.code.slice(-1);
    return null;
  };

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "AltGraph" || e.code === "AltRight") haveAltGr = true;
      if (e.key === "Control") haveCtrl = true;
    },
    true
  );

  window.addEventListener(
    "keyup",
    (e) => {
      if (e.key === "AltGraph" || e.code === "AltRight") haveAltGr = false;
      if (e.key === "Control") haveCtrl = false;
    },
    true
  );

  window.addEventListener(
    "blur",
    () => {
      haveCtrl = false;
      haveAltGr = false;
      suppress.clear();
      disarm();
    },
    true
  );

  window.addEventListener(
    "keydown",
    (e) => {
      if (isEditable(e.target)) return;

      if (!armed) {
        const ctrlNow = e.getModifierState("Control") || haveCtrl;
        const altgrNow = e.getModifierState("AltGraph") || haveAltGr;
        if (e.code === ARM_CODE && ctrlNow && altgrNow) {
          arm();
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
        return;
      }

      if (e.code === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        disarm();
        return;
      }

      const ch = keyChar(e);
      if (!ch) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      if (first == null) {
        first = ch;
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      const key = first + ch;
      const fn = MAP[key];
      disarm();
      if (fn) {
        const r = fn();
        if (r instanceof Promise) r.then(() => {}).catch(() => {});
        mark(e.code);
        e.preventDefault();
        e.stopImmediatePropagation();
      } else {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    "keypress",
    (e) => {
      if (armed || suppress.has(e.code)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    "keyup",
    (e) => {
      if (armed || suppress.has(e.code)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true
  );
})();
