// ==UserScript==
// @name         6 P.A.C.K.
// @namespace    http://tampermonkey.net/
// @version      3.3.1
// @description  Portable Areal Combustion Kit for e6: A weapon to surpass metal gear.
// @author       binaryfloof
// @icon         🛠️
// @supportURL   https://gist.github.com/clragon/d833e65ef3d92b97d9ca7e741d6949fd
// @updateURL    https://gist.githubusercontent.com/clragon/d833e65ef3d92b97d9ca7e741d6949fd/raw/e621_comment_hammer_and_wrench.user.js
// @downloadURL  https://gist.githubusercontent.com/clragon/d833e65ef3d92b97d9ca7e741d6949fd/raw/e621_comment_hammer_and_wrench.user.js
// @match        https://e621.net/*
// @match        https://e926.net/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  // #region page routing

  const PAGES = [
    {
      name: "post-show",
      match: (path) => /^\/posts\/\d+/.test(path),
      controls: { selector: "div.comments", position: "afterbegin" },
      burnable: {
        selector: "article.comment[data-comment-id]",
        type: "comment",
        idAttr: "data-comment-id",
      },
    },
    {
      name: "comments-index",
      match: (path) => /^\/comments(?:[?\/.]|$)/.test(path),
      controls: { selector: "#c-comments #searchform", position: "afterend" },
      burnable: {
        selector: "article.comment[data-comment-id]",
        type: "comment",
        idAttr: "data-comment-id",
      },
    },
    {
      name: "forum-topic-show",
      match: (path) => /^\/forum_topics\/\d+/.test(path),
      controls: {
        selector: "#c-forum-topics #a-show > p.info",
        position: "afterend",
      },
      burnable: {
        selector: "article.forum-post[data-forum-post-id]",
        type: "forum_post",
        idAttr: "data-forum-post-id",
      },
    },
    {
      name: "users-index",
      match: (path) => /^\/users(?:[?\/.]|$)/.test(path),
      controls: { selector: "#c-users #searchform", position: "afterend" },
      burnable: { selector: "#c-users tbody tr", type: "user" },
    },
    {
      name: "bans-new",
      match: (path) => path === "/bans/new",
      controls: { selector: ".c-bans .a-new > h1", position: "afterend" },
    },
    {
      name: "bans-show",
      match: (path) => /^\/bans\/\d+/.test(path),
      controls: { selector: "#c-bans #a-show > h1", position: "afterend" },
    },
  ];

  function getCurrentPage() {
    return PAGES.find((p) => p.match(window.location.pathname)) ?? null;
  }

  // #endregion

  // #region html utils

  function getControlsInsertionPoint() {
    const page = getCurrentPage();
    if (!page) return null;
    const element = document.querySelector(page.controls.selector);
    if (!element) return null;
    return { element, position: page.controls.position };
  }

  function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    Object.assign(element, options);
    return element;
  }

  let progressToast = null;

  function updateNotice(message, show = true, reloadable = false) {
    const Toast = window.E621?.Toast;
    if (!Toast) return;

    if (!show) {
      progressToast?.dismiss(true);
      progressToast = null;
      return;
    }

    const timeout = reloadable ? 5 : 0;

    if (progressToast?.isVisible) {
      progressToast.rewrite(message, { timeout });
    } else {
      progressToast = Toast.create(message, { timeout });
    }
  }

  // #endregion

  // #region http requests

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getCsrfToken = () =>
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") ?? "";

  async function postRequest(url, body) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      return response.ok;
    } catch (error) {
      console.error("Request failed:", error);
      return false;
    }
  }

  // #endregion

  // #region burning items

  async function incinerate(items, opts) {
    const total = items.length;
    let burnCount = 0;
    const doMark = opts.markType !== "none";

    const msg = `Incinerate ${total} items${
      doMark ? ` for ${opts.markType}` : ""
    }?`;
    if (!confirm(msg)) return;

    updateNotice(
      `Burning ${total} items${doMark ? ` for ${opts.markType}` : ""}...`,
    );

    for (const item of items) {
      if (await burnItem(item, opts)) burnCount += 1;
      await delay(500);
      updateNotice(`Burning ${Math.floor(burnCount)} of ${total}...`);
    }

    updateNotice(`Turned ${Math.round(burnCount)} items to ash.`, true, true);
  }

  async function burnItem(item, opts = {}) {
    let success = false;

    switch (item.type) {
      case "comment":
        success = await postRequest(`/comments/${item.id}/hide.json`, {});
        break;

      case "forum_post":
        success = await postRequest(`/forum_posts/${item.id}/hide.json`, {});
        break;

      case "user":
        success = await postRequest(`/bans`, {
          ban: {
            user_id: item.id,
            reason: opts.reason || "No reason provided.",
            duration: opts.duration || "",
            is_permaban: opts.isPermaban ? "1" : "0",
          },
        });
        break;

      default:
        throw new Error(`Unsupported type for burn: ${item.type}`);
    }

    if (opts.markType && opts.markType !== "none") {
      await delay(500);
      await markItem(item, opts.markType);
    }

    return success;
  }

  async function markItem(item, markType) {
    switch (item.type) {
      case "comment":
        return await postRequest(`/comments/${item.id}/warning.json`, {
          record_type: markType,
        });
      case "forum_post":
        return await postRequest(`/forum_posts/${item.id}/warning.json`, {
          record_type: markType,
        });
      case "user":
        // no-op
        break;
      default:
        throw new Error(`Unsupported type for mark: ${item.type}`);
    }
  }

  // #endregion

  // #region selection logic

  function getBurnableId(el, burnable) {
    if (burnable.idAttr) return el.getAttribute(burnable.idAttr);
    if (burnable.type === "user") {
      const userLink = el.querySelector('a[href^="/users/"]');
      const match = userLink?.getAttribute("href")?.match(/\/users\/(\d+)/);
      return match?.[1] ?? null;
    }
    return null;
  }

  function isBurnt(el, type) {
    if (type === "user") {
      return /\bBlocked\b/i.test(
        el.querySelector("td:nth-last-child(3)")?.textContent ?? "",
      );
    }
    return (
      el.getAttribute("data-is-deleted") === "true" ||
      el.getAttribute("data-is-hidden") === "true"
    );
  }

  function getBurnables() {
    const page = getCurrentPage();
    if (!page?.burnable) return [];

    const items = [];
    document.querySelectorAll(page.burnable.selector).forEach((el) => {
      const id = getBurnableId(el, page.burnable);
      if (!id) return;
      items.push({
        type: page.burnable.type,
        id,
        selected: el.querySelector(".burner-checkbox")?.checked ?? false,
        burnt: isBurnt(el, page.burnable.type),
        el,
      });
    });

    return items;
  }

  function getSelectionState() {
    const items = getBurnables();
    if (items.length === 0) return "none";

    const selectedCount = items.filter((item) => item.selected).length;

    if (selectedCount === 0) return "none";
    if (selectedCount === items.length) return "all";
    return "some";
  }

  function setSelectionState(state) {
    const items = getBurnables();
    const shouldSelect = state === "all";

    for (const item of items) {
      const checkbox = item.el.querySelector(".burner-checkbox");
      if (checkbox) checkbox.checked = shouldSelect;
    }

    renderControls();
  }

  // #endregion

  // #region selection ui

  function BurnCheckbox(item) {
    const checkbox = createElement("input", {
      type: "checkbox",
      className: "burner-checkbox",
      style: "cursor: pointer;",
      "data-type": item.type,
      "data-id": item.id,
    });

    checkbox.addEventListener("change", () => {
      renderControls();
    });

    return checkbox;
  }

  function BurnCheckboxContainer(item) {
    const isTableRow = item.el.tagName === "TR";

    const inner = createElement("div", {
      className: "burn-checkbox-container",
      style: [
        "padding: 0.25rem 0.5rem;",
        "cursor: pointer;",
        isTableRow
          ? "display: flex; justify-content: flex-end; align-items: center;"
          : "background-color: var(--color-section-lighten-5); grid-column: 3;",
      ].join(" "),
      "data-id": item.id,
      "data-type": item.type,
    });

    const checkbox = BurnCheckbox(item);
    inner.appendChild(checkbox);

    inner.addEventListener("click", (event) => {
      if (event.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event("change"));
      }
    });

    if (isTableRow) {
      const wrapper = document.createElement("td");
      wrapper.appendChild(inner);
      return wrapper;
    }

    return inner;
  }

  function renderBurnCheckboxes() {
    const items = getBurnables();
    if (items.length === 0) return;

    for (const item of items) {
      if (item.el.querySelector(".burn-checkbox-container")) continue;

      const container = BurnCheckboxContainer(item);
      item.el.appendChild(container);
      item.el.style.height = "100%";
    }
  }

  renderBurnCheckboxes();

  // #endregion

  // #region mass bans storage

  const MASS_BANS_KEY = "6pack.massbans";

  function saveMassBan(ids) {
    const existing = JSON.parse(localStorage.getItem(MASS_BANS_KEY) || "[]");
    existing.push({ userIds: ids, timestamp: Date.now() });
    localStorage.setItem(MASS_BANS_KEY, JSON.stringify(existing));
  }

  function loadMassBans() {
    const data = localStorage.getItem(MASS_BANS_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to parse mass bans:", error);
      return [];
    }
  }

  // #endregion

  // #region mass bans ui

  function MassBanTemplateNotice() {
    if (location.pathname !== "/bans/new") return null;

    const params = new URLSearchParams(location.search);
    const userId = params.get("ban[user_id]");
    if (!userId) return null;

    const bans = loadMassBans();
    const entry = bans.find((e) => e.userIds.includes(userId));
    if (!entry) return null;

    const container = createElement("div", {
      style:
        "margin-top: 10px; margin-bottom: 10px; display: flex; gap: 10px; align-items: center;",
    });

    const label = createElement("div", {
      textContent: `This ban can be used as a template for ${
        entry.userIds.length - 1
      } other users.`,
      style: "font-weight: bold; color: var(--color-danger);",
    });

    const cancel = AbortMassBanButton(bans.indexOf(entry), container);

    container.append(label, cancel);

    return container;
  }

  function MassBanConfirmation() {
    const banLinkMatch = location.pathname.match(/^\/bans\/(\d+)/);
    if (!banLinkMatch) return null;
    const banId = banLinkMatch[1];

    const userLink = document.querySelector("#a-show a[href^='/users/']");
    const userIdMatch = userLink?.href.match(/\/users\/(\d+)/);
    if (!userIdMatch) return null;
    const userId = userIdMatch[1];

    const bans = loadMassBans();
    const entryIndex = bans.findIndex((e) => e.userIds.includes(userId));
    if (entryIndex === -1) return null;

    const entry = bans[entryIndex];
    const targets = entry.userIds.filter((id) => id !== userId);
    if (targets.length === 0) return null;

    const container = createElement("div", {
      style: "margin-top: 10px; margin-bottom: 10px; display: flex; gap: 10px;",
    });

    const button = createElement("input", {
      type: "button",
      value: `Ban ${targets.length} other users with this template`,
      className: "button btn-danger",
    });

    button.addEventListener("click", async () => {
      button.disabled = true;

      const ban = await fetch(`/bans/${banId}.json`).then((r) => r.json());

      await incinerate(
        targets.map((id) => ({
          type: "user",
          id,
          el: null,
          selected: true,
          burnt: false,
        })),
        {
          reason: ban.reason,
          duration: ban.expires_at
            ? String(
                Math.round(
                  (new Date(ban.expires_at) - new Date(ban.created_at)) /
                    (1000 * 60 * 60 * 24),
                ),
              )
            : "",
          isPermaban: ban.expires_at == null,
          markType: "none",
        },
      );

      bans.splice(entryIndex, 1);
      localStorage.setItem(MASS_BANS_KEY, JSON.stringify(bans));
      button.remove();
    });

    const cancelButton = AbortMassBanButton(entryIndex, container);

    container.append(button, cancelButton);

    return container;
  }

  function AbortMassBanButton(entryIndex, container) {
    const button = createElement("button", {
      textContent: "Abort",
      className: "button btn-neutral",
    });

    button.addEventListener("click", () => {
      const bans = loadMassBans();
      bans.splice(entryIndex, 1);
      localStorage.setItem(MASS_BANS_KEY, JSON.stringify(bans));
      container.remove();
    });

    return button;
  }

  function renderMassBans() {
    const insertionPoint = getControlsInsertionPoint();
    if (!insertionPoint) return;

    const notice = MassBanTemplateNotice();
    if (notice)
      insertionPoint.element.insertAdjacentElement(
        insertionPoint.position,
        notice,
      );

    const confirm = MassBanConfirmation();
    if (confirm)
      insertionPoint.element.insertAdjacentElement(
        insertionPoint.position,
        confirm,
      );
  }

  renderMassBans();

  // #endregion

  // #region copy item links

  function CopyButton() {
    const button = createElement("button", {
      innerText: "Copy",
      className: "button btn-neutral",
      style: "margin-right: 10px;",
    });

    button.addEventListener("click", () => {
      const selectedItems = getBurnables().filter((item) => item.selected);
      if (selectedItems.length === 0) return alert("No items selected.");

      function buildUrl(type, ids) {
        switch (type) {
          case "comment":
            return `https://e621.net/comments?group_by=comment&search[id]=${ids.join(
              ",",
            )}`;
          case "forum_post":
            return `https://e621.net/forum_posts?search[id]=${ids.join(",")}`;
          case "user":
            return `https://e621.net/users?search[id]=${ids.join(",")}`;
          default:
            throw new Error(`Unsupported item type: ${type}`);
        }
      }

      const groupedByType = selectedItems.reduce((acc, item) => {
        (acc[item.type] ??= []).push(item.id);
        return acc;
      }, {});

      const output = Object.entries(groupedByType)
        .map(([type, ids]) => buildUrl(type, ids))
        .join("\n");

      navigator.clipboard.writeText(output).then(() => {
        alert("Copied item link to clipboard: " + output);
      });
    });

    return button;
  }

  // #endregion

  // #region visibility controls

  let showBurntItems = true;

  function VisibilityLabel() {
    const burntCount = getBurnables().filter((item) => item.burnt).length;
    return createElement("label", {
      textContent: `Burnt (${burntCount})`,
      style: "margin-right: 10px; font-weight: 700;",
    });
  }

  function ToggleVisibilityLink() {
    const link = createElement("a", {
      href: "#",
      textContent: showBurntItems ? "Hide" : "Show",
      style: "color: var(--color-link); cursor: pointer;",
    });

    link.addEventListener("click", (event) => {
      event.preventDefault();
      showBurntItems = !showBurntItems;

      getBurnables().forEach((item) => {
        if (item.burnt) {
          item.el.style.display = showBurntItems ? "" : "none";
        }
      });

      renderControls();
    });

    return link;
  }

  function VisibilityControls() {
    const container = createElement("div", {
      style:
        "display: flex; justify-content: flex-start; align-items: center; margin: 10px;",
    });

    const label = VisibilityLabel();
    const toggleLink = ToggleVisibilityLink();

    container.append(label, toggleLink);
    return container;
  }

  // #endregion

  // #region action controls

  function ManageLabel() {
    const items = getBurnables();
    const selectedCount = items.filter((item) => item.selected).length;
    const totalCount = items.length;
    return createElement("label", {
      textContent: `Manage (${selectedCount > 0 ? selectedCount : totalCount})`,
      style: "margin-right: 10px; font-weight: 700;",
    });
  }

  function MarkingSelect() {
    const select = createElement("select", {
      id: "sixpack-marking-select",
      className: "button btn-neutral",
      style: "margin-right: 10px;",
    });

    ["none", "warning", "record", "ban"].forEach((option) => {
      select.appendChild(
        createElement("option", {
          value: option,
          textContent: option.charAt(0).toUpperCase() + option.slice(1),
        }),
      );
    });

    return select;
  }

  function getMarking() {
    return document.getElementById("sixpack-marking-select")?.value ?? "none";
  }

  function BurnButton() {
    const button = createElement("button", {
      innerText: "Burn",
      className: "button btn-neutral",
      style: "margin-right: 10px;",
    });

    button.addEventListener("click", async () => {
      const items = getBurnables().filter((item) => item.selected);
      if (items.length === 0) return alert("No items selected.");

      const type = items[0]?.type;
      if (!type || !items.every((i) => i.type === type)) {
        alert("Cannot burn mixed item types.");
        return;
      }

      if (type === "user") {
        const ids = items.map((i) => i.id);
        saveMassBan(ids);
        location.href = `/bans/new?ban[user_id]=${items[0].id}`;
        return;
      }

      const markType = getMarking();
      await incinerate(items, { markType });
      renderControls();
    });

    return button;
  }

  function LeftControls() {
    const container = createElement("div", {
      style: "display: flex; align-items: center;",
    });

    container.append(ManageLabel(), CopyButton(), BurnButton());

    const type = getCurrentPage()?.burnable?.type;
    if (type === "comment" || type === "forum_post") {
      container.append(MarkingSelect());
    }

    return container;
  }

  function RightControls() {
    const container = createElement("div", {
      style: "display: flex; align-items: center;",
    });

    const checkbox = createElement("input", {
      type: "checkbox",
      id: "select-all-checkbox",
      style: "margin-left: 10px;",
    });

    checkbox.addEventListener("change", () => {
      setSelectionState(checkbox.checked ? "all" : "none");
    });

    const state = getSelectionState();
    checkbox.checked = state === "all";
    checkbox.indeterminate = state === "some";

    container.appendChild(checkbox);
    return container;
  }

  function ActionControls() {
    const container = createElement("div", {
      style:
        "display: flex; justify-content: space-between; align-items: center; margin: 10px;",
    });

    container.append(LeftControls(), RightControls());
    return container;
  }

  // #endregion

  // #region controls

  function renderControls() {
    document.querySelector("#sixpack-control-region")?.remove();

    const insertionPoint = getControlsInsertionPoint();
    if (!insertionPoint) return;

    const burnables = getBurnables();
    if (burnables.length === 0) return;

    const region = createElement("div", {
      id: "sixpack-control-region",
      style: "display: flex; flex-direction: column;",
    });

    const anyBurnt = burnables.some((item) => item.burnt);
    if (anyBurnt) {
      const vis = VisibilityControls();
      vis.id = "sixpack-visibility-controls";
      region.appendChild(vis);
    }

    const act = ActionControls();
    act.id = "sixpack-controls";
    region.appendChild(act);

    insertionPoint.element.insertAdjacentElement(
      insertionPoint.position,
      region,
    );
  }

  renderControls();

  // #endregion
})();
