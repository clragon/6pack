// ==UserScript==
// @name         Janitor Wristwatch
// @namespace    local
// @description  100%ing post approvals since 1999.
// @version      0.6.0
// @author       binaryfloof
// @icon         https://em-content.zobj.net/source/lg/307/watch_231a.png
// @match        https://e621.net/posts/*
// @match        https://e621.net/wristwatch
// @run-at       document-idle
// @grant        none
// ==/UserScript==

// #region utility functions

const formatTime = (ms) => {
  if (ms === 0) return "0";

  const total = Math.floor(ms / 1000);
  const ms3 = String(ms % 1000).padStart(3, "0");
  if (total >= 3600) {
    const hour = Math.floor(total / 3600);
    const minute = Math.floor((total % 3600) / 60);
    const second = total % 60;
    return `${hour}:${String(minute).padStart(2, "0")}:${String(
      second,
    ).padStart(2, "0")}.${ms3}`;
  } else if (total >= 60) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}.${ms3}`;
  } else {
    return `${total}.${ms3}`;
  }
};

function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  if (total >= 3600) {
    const hour = Math.floor(total / 3600);
    const minute = Math.floor((total % 3600) / 60);
    if (minute === 0) return `${hour} hour${hour > 1 ? "s" : ""}`;
    return `${hour}h ${minute}m`;
  } else if (total >= 60) {
    const minute = Math.floor(total / 60);
    const second = total % 60;
    if (second === 0) return `${minute} minute${minute > 1 ? "s" : ""}`;
    return `${minute}m ${second}s`;
  } else {
    return `${total} second${total !== 1 ? "s" : ""}`;
  }
}

const now = () => Date.now();

const median = (arr) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

const deepEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every((k) => deepEqual(a[k], b[k]))
    );
  }
  return false;
};

// #endregion

(function () {
  if (location.pathname === "/wristwatch") {
    initWristwatchPage();
    return;
  }

  const notice = document.querySelector("#pending-approval-notice");
  const toolbar = notice && notice.querySelector(".notice-pending-toolbar");
  if (!notice || !toolbar) return;

  let cleanup = null;

  const observer = new MutationObserver(() => {
    const enabled = notice.classList.contains("enabled");
    const uiExists = document.querySelector(".jw-post-ui");
    if (enabled && !uiExists) {
      cleanup = setupUI();
    } else if (!enabled && uiExists) {
      if (cleanup) cleanup();
      cleanup = null;
    }
  });
  observer.observe(notice, { attributes: true, attributeFilter: ["class"] });

  if (notice.classList.contains("enabled")) cleanup = setupUI();
  return;

  function setupUI() {
    // #region data storage

    const LS = {
      get(k, d) {
        try {
          return JSON.parse(localStorage.getItem(k)) ?? d;
        } catch {
          return d;
        }
      },
      set(k, v) {
        localStorage.setItem(k, JSON.stringify(v));
      },
      del(k) {
        localStorage.removeItem(k);
      },
      keys() {
        return Object.keys(localStorage);
      },
    };

    const IDB = {
      async open() {
        return new Promise((resolve, reject) => {
          const req = indexedDB.open("JanitorWristwatch", 2);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => resolve(req.result);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("splits")) {
              db.createObjectStore("splits", { keyPath: "id" });
            }
          };
        });
      },
      async store(data) {
        try {
          const db = await this.open();
          const tx = db.transaction(["splits"], "readwrite");
          const store = tx.objectStore("splits");
          await new Promise((resolve, reject) => {
            const req = store.put(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
          db.close();
          return true;
        } catch (error) {
          console.error("IndexedDB store failed:", error);
          return false;
        }
      },
      async get(id) {
        try {
          const db = await this.open();
          const tx = db.transaction(["splits"], "readonly");
          const store = tx.objectStore("splits");
          const data = await new Promise((resolve, reject) => {
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
          db.close();
          return data;
        } catch (error) {
          console.error("IndexedDB get failed:", error);
          return null;
        }
      },
      async delete(id) {
        try {
          const db = await this.open();
          const tx = db.transaction(["splits"], "readwrite");
          const store = tx.objectStore("splits");
          await new Promise((resolve, reject) => {
            const req = store.delete(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
          db.close();
          return true;
        } catch (error) {
          console.error("IndexedDB delete failed:", error);
          return false;
        }
      },
    };

    // #endregion

    // #region post approval tracking

    const postId = (() => {
      const m = location.pathname.match(/\/posts\/(\d+)/);
      if (m) return m[1];
      const li = [...document.querySelectorAll("#post-information li")].find(
        (li) => /ID:\s*\d+/.test(li.textContent || ""),
      );
      if (!li) return null;
      const m2 = li.textContent.match(/ID:\s*(\d+)/);
      return m2 ? m2[1] : null;
    })();
    if (!postId) return;

    const tabId = (() => {
      const k = "jw:tab";
      let id = sessionStorage.getItem(k);
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(k, id);
      }
      return id;
    })();

    // keys
    const SKEY = "jw:sessions";
    const K_ACC = (sid, pid) => `jw:acc:${sid}:${pid}`;
    const K_LOCK = (sid, pid) => `jw:lock:${sid}:${pid}`;

    // state (no implicit session)
    let sessions = LS.get(SKEY, null);
    let sessionId = sessions?.current || null;
    let active = !!sessions?.active;
    let paused = !!sessions?.paused;

    const bc =
      "BroadcastChannel" in window
        ? new BroadcastChannel("jw-wristwatch")
        : null;
    const bcPost = (msg) => {
      try {
        bc && bc.postMessage(msg);
      } catch {}
    };
    const saveSessions = () => {
      if (sessions) LS.set(SKEY, sessions);
      bcPost({ t: "S" });
    };

    // locks
    const lockLeaseMs = 5000;
    let isOwner = false;
    let lastTick = now();
    const readLockAny = (sid, pid) => LS.get(K_LOCK(sid, pid), null);
    const writeLock = (sid, pid, v) => {
      LS.set(K_LOCK(sid, pid), v);
      bcPost({ t: "L", sid, pid });
    };
    const clearLock = (sid, pid) => {
      LS.del(K_LOCK(sid, pid));
      bcPost({ t: "L", sid, pid });
    };
    const tryAcquire = () => {
      if (!sessions || !active || paused) {
        isOwner = false;
        return;
      }
      const t = now();
      const lk = readLockAny(sessionId, postId);
      if (!lk || lk.holder === tabId || (lk.until && lk.until < t)) {
        writeLock(sessionId, postId, {
          holder: tabId,
          until: t + lockLeaseMs,
          updatedAt: t,
        });
        isOwner = true;
      } else {
        isOwner = false;
      }
    };
    const refreshLock = () => {
      if (!sessions || !active || paused || !isOwner) return;
      const t = now();
      writeLock(sessionId, postId, {
        holder: tabId,
        until: t + lockLeaseMs,
        updatedAt: t,
      });
    };

    // accumulators
    const getAccAny = (sid, pid) =>
      LS.get(K_ACC(sid, pid), {
        ms: 0,
        firstOpenedAt: now(),
        lastUpdatedAt: now(),
        approved: false,
      });
    const setAcc = (sid, pid, obj) => {
      LS.set(K_ACC(sid, pid), obj);
      bcPost({ t: "A", sid, pid });
    };

    // session elapsed = linear (start..now with pauses)
    const sessMeta = () => sessions?.all?.[sessionId] || null;
    const sessElapsed = () => {
      const m = sessMeta();
      if (!m) return 0;
      const base = m.tAccum || 0;
      if (!active || paused) return base;
      const r = m.tResumeAt || m.startedAt || now();
      return base + Math.max(0, now() - r);
    };

    // scan storage for this session’s posts (no index dependency)
    const listSessionPosts = () => {
      if (!sessions) return [];
      const sid = String(sessionId);
      const out = [];
      for (const k of LS.keys()) {
        if (!k.includes(sid)) continue;
        if (!k.startsWith("jw:acc:")) continue;
        const pidm = k.match(/(\d+)$/);
        if (!pidm) continue;
        const pid = pidm[1];
        const a = getAccAny(sid, pid);
        out.push({
          postId: pid,
          ms: a.ms || 0,
          firstOpenedAt: a.firstOpenedAt || 0,
          lastUpdatedAt: a.lastUpdatedAt || 0,
          approved: a.approved || false,
        });
      }
      const map = new Map();
      for (const p of out) {
        const prev = map.get(p.postId);
        if (!prev || (p.lastUpdatedAt || 0) > (prev.lastUpdatedAt || 0))
          map.set(p.postId, p);
      }
      return [...map.values()].sort(
        (a, b) => (b.lastUpdatedAt || 0) - (a.lastUpdatedAt || 0),
      );
    };

    const isLiveElsewhere = (pid) => {
      if (!sessions || !active || paused) return false;
      const lk = readLockAny(sessionId, pid);
      return !!(lk && lk.until && lk.until > now());
    };

    // Inject post approval tracking styles
    if (!document.getElementById("janitor-wristwatch-post-styles")) {
      const style = document.createElement("style");
      style.id = "janitor-wristwatch-post-styles";
      style.textContent = `
        .jw-post-wrapper {
          display: flex;
          justify-content: space-between;
        }

        .jw-post-ui {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          margin-left: 12px;
        }

        .jw-post-top-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .jw-post-time-display {
          font-weight: 600;
          padding: 4px 8px;
          border: 1px solid rgba(153,153,153,.2);
          border-radius: 6px;
          min-width: 260px;
          text-align: right;
        }

        .jw-post-btn-row {
          display: flex;
          gap: 6px;
        }

        .jw-post-btn {
          min-width: 64px;
          text-align: center;
        }

        .jw-post-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: flex-end;
        }

        .jw-post-time-slow {
          color: var(--palette-text-red, #c62828);
        }

        .jw-post-time-fast {
          color: var(--palette-text-green, #2e7d32);
        }
      `;
      document.head.appendChild(style);
    }

    // mount UI
    const wrapper = document.createElement("div");
    wrapper.className = "jw-post-wrapper";
    if (toolbar.parentElement !== wrapper) {
      toolbar.parentElement.insertBefore(wrapper, toolbar);
      wrapper.appendChild(toolbar);
    }

    const ui = document.createElement("div");
    ui.className = "jw-post-ui";
    wrapper.appendChild(ui);

    const topRow = document.createElement("div");
    topRow.className = "jw-post-top-row";
    const timeEl = document.createElement("div");
    timeEl.className = "jw-post-time-display";
    topRow.appendChild(timeEl);
    ui.appendChild(topRow);

    const btnRow = document.createElement("div");
    btnRow.className = "jw-post-btn-row";
    const mkBtn = (t) => {
      const a = document.createElement("a");
      a.href = "#";
      a.className = "button btn-neutral jw-post-btn";
      a.textContent = t;
      return a;
    };
    const pauseBtn = mkBtn("Pause");
    const sessBtn = mkBtn("New");
    btnRow.append(pauseBtn, sessBtn);
    ui.appendChild(btnRow);

    const listEl = document.createElement("div");
    listEl.className = "jw-post-list";
    ui.appendChild(listEl);

    let prevState = null;

    const render = () => {
      const acc = getAccAny(sessionId, postId);
      const live = !paused && isOwner ? Math.max(0, now() - lastTick) : 0;
      const cur = (acc.ms || 0) + live;
      const sess = sessElapsed();
      const all = listSessionPosts().filter(
        (p) => p.postId !== postId && !isLiveElsewhere(p.postId),
      );
      const approvedCount = all.filter((p) => p.approved).length;

      const currentState = {
        active: sessions && active,
        paused,
        cur,
        sess,
        count: all.length,
        approvedCount,
        recent: all.slice(0, 3).map((p) => `${p.postId}:${p.ms}`),
      };

      if (prevState && deepEqual(prevState, currentState)) {
        return;
      }

      if (!prevState || prevState.active !== currentState.active) {
        if (!currentState.active) {
          pauseBtn.style.display = "none";
          sessBtn.textContent = "New";
        } else {
          pauseBtn.style.display = "";
          sessBtn.textContent = "Finish";
        }
      }

      if (!prevState || prevState.paused !== currentState.paused) {
        if (currentState.active) {
          pauseBtn.textContent = currentState.paused ? "Resume" : "Pause";
        }
      }

      if (
        !prevState ||
        prevState.cur !== currentState.cur ||
        prevState.sess !== currentState.sess ||
        prevState.count !== currentState.count ||
        prevState.approvedCount !== currentState.approvedCount
      ) {
        if (!currentState.active) {
          timeEl.textContent = `${formatTime(0)} / ${formatTime(0)} / 0 (0)`;
        } else {
          timeEl.textContent = `${formatTime(currentState.cur)} / ${formatTime(
            currentState.sess,
          )} / ${currentState.count} (${currentState.approvedCount})`;
        }
      }

      if (!prevState || !deepEqual(prevState.recent, currentState.recent)) {
        if (!currentState.active) {
          listEl.innerHTML = "";
        } else {
          const rec = all.slice(0, 3);
          const medianSlice = all.slice(0, 100);
          const med = median(medianSlice.map((x) => x.ms));
          listEl.innerHTML = "";
          rec.forEach((x) => {
            const line = document.createElement("div");
            line.textContent = `• ${formatTime(x.ms)}`;
            if (rec.length > 1) {
              line.className =
                x.ms > med ? "jw-post-time-slow" : "jw-post-time-fast";
            }
            listEl.appendChild(line);
          });
        }
      }

      prevState = currentState;
    };

    const tick = () => {
      if (!sessions || !active || paused || document.hidden) return;
      tryAcquire();
      const t = now();
      if (isOwner) {
        const d = Math.max(0, t - lastTick);
        if (d > 0) {
          const a = getAccAny(sessionId, postId);
          setAcc(sessionId, postId, {
            ...a,
            ms: (a.ms || 0) + d,
            firstOpenedAt: a.firstOpenedAt || t,
            lastUpdatedAt: t,
          });
        }
        refreshLock();
      }
      lastTick = t;
    };

    const iv = setInterval(() => {
      tick();
      render();
    }, 120);

    pauseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!sessions || !active) return;
      const s = LS.get(SKEY, sessions);
      const m = s.all?.[sessionId];
      if (!m) return;

      if (!s.paused) {
        if (isOwner) {
          const t = now();
          const a = getAccAny(sessionId, postId);
          setAcc(sessionId, postId, {
            ...a,
            ms: (a.ms || 0) + Math.max(0, t - lastTick),
            lastUpdatedAt: t,
          });
        }
        s.paused = true;
        m.tAccum =
          (m.tAccum || 0) +
          Math.max(0, now() - (m.tResumeAt || m.startedAt || now()));
        m.tResumeAt = null;
        clearLock(sessionId, postId);
        isOwner = false;
      } else {
        s.paused = false;
        m.tResumeAt = now();
        lastTick = now();
        tryAcquire();
      }
      sessions = s;
      active = !!s.active;
      paused = !!s.paused;
      saveSessions();
      render();
    });

    sessBtn.addEventListener("click", (e) => {
      e.preventDefault();

      if (!sessions || !active) {
        if (!confirm("Start a new session?")) return;
        const s = LS.get(SKEY, null) || { all: {} };
        const id = String(now());
        s.current = id;
        s.active = true;
        s.paused = false;
        if (!s.all) s.all = {};
        const t = now();
        s.all[id] = { startedAt: t, tAccum: 0, tResumeAt: t };
        LS.set(SKEY, s);
        bcPost({ t: "S" });
        sessions = s;
        sessionId = id;
        active = true;
        paused = false;
        lastTick = now();
        tryAcquire();
        render();
      } else {
        if (!confirm("Finish session?")) return;

        const s = LS.get(SKEY, sessions);
        const m = s.all?.[sessionId];
        if (m && !s.paused) {
          m.tAccum =
            (m.tAccum || 0) +
            Math.max(0, now() - (m.tResumeAt || m.startedAt || now()));
          m.tResumeAt = null;
        }
        if (isOwner && !paused) {
          const t = now();
          const a = getAccAny(sessionId, postId);
          setAcc(sessionId, postId, {
            ...a,
            ms: (a.ms || 0) + Math.max(0, t - lastTick),
            lastUpdatedAt: t,
          });
        }

        const posts = listSessionPosts();
        const splitsData = {
          id: sessionId,
          startedAt: m?.startedAt || null,
          endedAt: now(),
          totalMs: m ? m.tAccum || 0 : 0,
          posts,
        };

        IDB.store(splitsData);

        const del = [];
        for (const k of LS.keys()) {
          if (k.startsWith("jw:")) del.push(k);
        }
        del.forEach(LS.del);
        clearLock(sessionId, postId);

        sessions = null;
        sessionId = null;
        active = false;
        paused = false;
        isOwner = false;
        lastTick = now();
        render();
      }
    });

    window.addEventListener("visibilitychange", () => {
      const t = now();
      if (!sessions || !active) {
        lastTick = t;
        return;
      }
      if (document.hidden && !paused && isOwner) {
        const a = getAccAny(sessionId, postId);
        setAcc(sessionId, postId, {
          ...a,
          ms: (a.ms || 0) + Math.max(0, t - lastTick),
          lastUpdatedAt: t,
        });
      }
      lastTick = t;
    });

    window.addEventListener("pagehide", () => {
      const t = now();
      if (sessions && active && !paused && isOwner) {
        const a = getAccAny(sessionId, postId);
        setAcc(sessionId, postId, {
          ...a,
          ms: (a.ms || 0) + Math.max(0, t - lastTick),
          lastUpdatedAt: t,
        });
      }
      clearLock(sessionId, postId);
      clearInterval(iv);
    });

    window.addEventListener("storage", (e) => {
      if (!e.key) return;
      if (e.key === SKEY) {
        const s = LS.get(SKEY, null);
        sessions = s;
        sessionId = s?.current || null;
        active = !!s?.active;
        paused = !!s?.paused;
        render();
        return;
      }
      if (
        sessionId &&
        e.key.includes(sessionId) &&
        (e.key.includes("acc") || e.key.includes("lock"))
      ) {
        render();
      }
    });

    if (bc) bc.onmessage = () => render();

    // Track approve and next button clicks
    const observeApprovalButtons = () => {
      const approveNextBtn = document.querySelector("#approve-post-next");
      if (approveNextBtn && !approveNextBtn.dataset.jwTracked) {
        approveNextBtn.dataset.jwTracked = "true";
        approveNextBtn.addEventListener("click", () => {
          if (sessions && active && sessionId && postId) {
            const a = getAccAny(sessionId, postId);
            setAcc(sessionId, postId, {
              ...a,
              approved: true,
            });
          }
        });
      }
    };

    observeApprovalButtons();
    const btnObserver = new MutationObserver(observeApprovalButtons);
    btnObserver.observe(document.body, { childList: true, subtree: true });

    render();

    // #endregion

    return () => {
      clearInterval(iv);
      btnObserver.disconnect();
      ui.remove();
    };
  }
})();

// #region wristwatch page

async function initWristwatchPage() {
  const pageDiv = document.querySelector("#page");
  if (!pageDiv) return;

  document.title = "Janitor Wristwatch - e621";

  // Inject custom styles
  if (!document.getElementById("wristwatch-styles")) {
    const style = document.createElement("style");
    style.id = "wristwatch-styles";
    style.textContent = `
        .ww-session {
          border-left: 0.25rem solid var(--color-dtext-section);
          background: var(--color-section-lighten-5);
          padding: 15px;
          margin-bottom: 20px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .ww-session-header {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }

        .ww-session-stats {
          flex: 1;
        }

        .ww-stats-column {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .ww-session-title {
          font-size: 16px;
        }

        .ww-stat-item {
          font-size: 14px;
        }

        .ww-graph-container {
          width: 400px;
        }

        .ww-details {
          margin-bottom: 15px;
        }

        .ww-summary {
          cursor: pointer;
          font-weight: bold;
          padding: 5px 0;
        }

        .ww-post-list {
          max-height: 300px;
          overflow-y: auto;
          margin-top: 10px;
        }

        .ww-post-item {
          padding: 8px 12px;
          border-bottom: 1px solid var(--color-table-border);
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .ww-post-timing {
          display: flex;
          gap: 10px;
          align-items: baseline;
        }

        .ww-no-data {
          padding: 12px;
        }

        .ww-actions {
          margin-top: 15px;
        }
      `;
    document.head.appendChild(style);
  }

  pageDiv.innerHTML = `
      <div id="c-static-pages" class="c-static-pages">
        <div id="a-show" class="a-show">
          <h1>Sessions</h1>
          <div id="history-container">Loading splits data...</div>
        </div>
      </div>
    `;

  const container = document.getElementById("history-container");

  try {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("JanitorWristwatch", 2);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("splits")) {
          db.createObjectStore("splits", { keyPath: "id" });
        }
      };
    });

    if (!db.objectStoreNames.contains("splits")) {
      container.innerHTML =
        "<p>No splits data found. Complete a session first!</p>";
      db.close();
      return;
    }

    const tx = db.transaction(["splits"], "readonly");
    const store = tx.objectStore("splits");
    const allData = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    db.close();

    if (allData.length === 0) {
      container.innerHTML =
        "<p>No splits data found. Complete a session first!</p>";
      return;
    }

    allData.sort((a, b) => b.endedAt - a.endedAt);

    let html = "";
    for (const session of allData) {
      const duration = session.totalMs || 0;
      const sessionDate = new Date(parseInt(session.id)).toLocaleDateString();
      const postCount = session.posts ? session.posts.length : 0;
      const approvedCount = session.posts
        ? session.posts.filter((p) => p.approved).length
        : 0;

      // Calculate median time per post
      let medianTimePerPost = 0;
      if (session.posts && session.posts.length > 0) {
        const times = session.posts
          .map((post) => post.ms)
          .sort((a, b) => a - b);
        const mid = Math.floor(times.length / 2);
        medianTimePerPost =
          times.length % 2 === 0
            ? (times[mid - 1] + times[mid]) / 2
            : times[mid];
      }

      html += `
          <div class="ww-session">
            <div class="ww-session-header">
              <div class="ww-session-stats">
                <div class="ww-stats-column">
                  <span class="ww-session-title">
                    <strong>Session on ${sessionDate}</strong>
                  </span>
                  <span class="ww-stat-item">
                    <strong>Duration:</strong> ${formatDuration(duration)}
                  </span>
                  <span class="ww-stat-item">
                    <strong>Posts:</strong> ${postCount}
                  </span>
                  <span class="ww-stat-item">
                    <strong>Approved:</strong> ${approvedCount}
                  </span>
                  <span class="ww-stat-item">
                    <strong>Median:</strong> ${formatTime(medianTimePerPost)}
                  </span>
                </div>
              </div>
              <div class="ww-graph-container">
                ${generateGraph(session.posts, medianTimePerPost)}
              </div>
            </div>
                <details class="ww-details">
                  <summary class="ww-summary">Posts (${postCount})</summary>
                  <div class="ww-post-list">
                    ${
                      session.posts
                        ? (() => {
                            return session.posts
                              .map((post, index) => {
                                const splitColor =
                                  post.ms <= medianTimePerPost
                                    ? "var(--color-score-positive)"
                                    : "var(--color-score-negative)";

                                const ratio =
                                  post.ms / (medianTimePerPost || 1);
                                let durationColor = "#66bb6a";
                                if (ratio < 0.9) durationColor = "#2e7d32";
                                else if (ratio >= 1.1)
                                  durationColor =
                                    ratio >= 1.5 ? "#e45f5f" : "#ffb74d";
                                else if (ratio >= 0.9 && ratio < 1.1)
                                  durationColor = "#4caf50";

                                return `
                        <article class="ww-post-item" style="border-bottom-color: ${durationColor};">
                          <div>
                            <strong><a href="/posts/${
                              post.postId
                            }" style="color: var(--color-link);">Post #${
                              post.postId
                            }</a></strong>
                          </div>
                          <div class="ww-post-timing">
                            <span style="color: var(--color-text-muted); font-family: monospace; font-size: 12px;">
                              ${new Date(post.firstOpenedAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour12: false,
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                },
                              )}.${String(
                                new Date(post.firstOpenedAt).getMilliseconds(),
                              ).padStart(3, "0")}
                            </span>
                            <span style="color: var(--color-text); font-family: monospace; font-size: 12px;">
                              ${formatTime(post.ms)}
                            </span>
                            <span style="color: ${splitColor}; font-family: monospace; font-size: 12px; font-weight: bold;">
                              ${
                                post.ms <= medianTimePerPost ? "-" : "+"
                              }${formatTime(
                                Math.abs(post.ms - medianTimePerPost),
                              )}
                            </span>
                          </div>
                        </article>
                        `;
                              })
                              .join("");
                          })()
                        : '<p class="ww-no-data">No post data</p>'
                    }
                  </div>
                </details>
                <div class="ww-actions">
                  <a href="#" class="delete-session-link" data-session-id="${
                    session.id
                  }">Delete</a>
                </div>
              </div>
        `;
    }

    container.innerHTML = html;

    container.addEventListener("click", async (e) => {
      if (e.target.classList.contains("delete-session-link")) {
        e.preventDefault();
        const sessionId = e.target.dataset.sessionId;

        if (
          confirm(
            `Delete session from ${new Date(
              parseInt(sessionId),
            ).toLocaleDateString()}?`,
          )
        ) {
          try {
            const db = await new Promise((resolve, reject) => {
              const req = indexedDB.open("JanitorWristwatch", 2);
              req.onerror = () => reject(req.error);
              req.onsuccess = () => resolve(req.result);
            });

            const tx = db.transaction(["splits"], "readwrite");
            const store = tx.objectStore("splits");
            await new Promise((resolve, reject) => {
              const req = store.delete(sessionId);
              req.onsuccess = () => resolve(req.result);
              req.onerror = () => reject(req.error);
            });

            db.close();

            // Refresh the page
            initWristwatchPage();
          } catch (error) {
            console.error("Failed to delete session:", error);
            alert("Failed to delete session: " + error.message);
          }
        }
      }
    });
  } catch (error) {
    console.error("Failed to load splits data:", error);
    container.innerHTML = `<p>Error loading data: ${error.message}</p><p>Try completing a session first to create the database.</p>`;
  }

  // #region graph generation

  function generateGraph(posts, median) {
    if (!posts || posts.length === 0) return "<p>No data to graph</p>";

    const width = 400;
    const height = 150;
    const padding = 30;
    const rightPadding = 20;

    const bucketCount = 8;
    const buckets = [];

    const bucketRanges = [
      { min: 0, max: 0.5 },
      { min: 0.5, max: 0.75 },
      { min: 0.75, max: 0.9 },
      { min: 0.9, max: 1.1 },
      { min: 1.1, max: 1.25 },
      { min: 1.25, max: 1.5 },
      { min: 1.5, max: 2.0 },
      { min: 2.0, max: Infinity },
    ];

    // Initialize buckets with time-based labels
    bucketRanges.forEach((range, index) => {
      let label;
      if (range.min === 0) {
        const maxTime = Math.round((range.max * median) / 1000);
        label = `<${maxTime}s`;
      } else if (range.max === Infinity) {
        const minTime = Math.round((range.min * median) / 1000);
        label = `>${minTime}s`;
      } else if (range.min === 0.9 && range.max === 1.1) {
        const medianTime = Math.round(median / 1000);
        label = `~${medianTime}s`;
      } else {
        // Use the upper bound for clearer differentiation
        const upperTime = Math.round((range.max * median) / 1000);
        label = `~${upperTime}s`;
      }

      buckets.push({
        ...range,
        label,
        count: 0,
        posts: [],
        index,
      });
    });

    // Categorize posts into buckets
    posts.forEach((post) => {
      const ratio = post.ms / (median || 1);
      const bucket = buckets.find((b) => ratio >= b.min && ratio < b.max);
      if (bucket) {
        bucket.count++;
        bucket.posts.push(post);
      }
    });

    const maxCount = Math.max(...buckets.map((b) => b.count), 1);
    const barWidth = (width - padding - rightPadding) / buckets.length;

    let bars = "";
    let labels = "";

    buckets.forEach((bucket, i) => {
      const x = padding + i * barWidth;
      const barHeight = (bucket.count / maxCount) * (height - 2 * padding);
      const y = height - padding - barHeight;

      // Color based on performance relative to median
      let color = "#66bb6a"; // Default neutral
      if (bucket.max <= 0.9)
        color = "#2e7d32"; // Fast (green)
      else if (bucket.min >= 1.1)
        color = bucket.min >= 1.5 ? "#e45f5f" : "#ffb74d"; // Slow (red/orange)
      else if (bucket.min < 1.1 && bucket.max > 0.9) color = "#4caf50"; // Around median (light green)

      bars += `<rect x="${x + 2}" y="${y}" width="${
        barWidth - 4
      }" height="${barHeight}" fill="${color}" opacity="0.8" stroke="var(--color-text-muted)" stroke-width="0.5"/>`;

      // Count label on top of bar
      if (bucket.count > 0) {
        bars += `<text x="${x + barWidth / 2}" y="${
          y - 5
        }" text-anchor="middle" fill="var(--color-text)" font-size="12" font-weight="bold">${
          bucket.count
        }</text>`;
      }

      // X-axis labels
      labels += `<text x="${x + barWidth / 2}" y="${
        height - padding + 15
      }" text-anchor="middle" fill="var(--color-text-muted)" font-size="9" transform="rotate(-45 ${
        x + barWidth / 2
      } ${height - padding + 15})">${bucket.label}</text>`;
    });

    // Y-axis labels
    const yAxisLabels = [];
    for (
      let i = 0;
      i <= Math.min(maxCount, 10);
      i += Math.max(1, Math.floor(maxCount / 5))
    ) {
      const y = height - padding - (i / maxCount) * (height - 2 * padding);
      yAxisLabels.push(
        `<text x="${padding - 5}" y="${
          y + 4
        }" text-anchor="end" fill="var(--color-text-muted)" font-size="10">${i}</text>`,
      );
    }

    return `
        <svg width="${width}" height="${
          height + 20
        }" style="background: var(--color-foreground);">
          <!-- Axes -->
          <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${
            height - padding
          }" stroke="var(--color-text-muted)" stroke-width="1"/>
          <line x1="${padding}" y1="${height - padding}" x2="${
            width - rightPadding
          }" y2="${
            height - padding
          }" stroke="var(--color-text-muted)" stroke-width="1"/>

          <!-- Bars -->
          ${bars}

          <!-- Y-axis labels -->
          ${yAxisLabels.join("")}

          <!-- X-axis labels -->
          ${labels}

          <!-- Axis titles -->
          <text x="${width / 2}" y="${
            height + 15
          }" text-anchor="middle" fill="var(--color-text-muted)" font-size="12">Duration</text>
          <text x="15" y="${
            height / 2
          }" text-anchor="middle" fill="var(--color-text-muted)" font-size="12" transform="rotate(-90 15 ${
            height / 2
          })">Count</text>
        </svg>
      `;
  } // #endregion
}

// #endregion
