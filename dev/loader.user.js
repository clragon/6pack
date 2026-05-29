// ==UserScript==
// @name         6 P.A.C.K. [dev loader]
// @namespace    https://clynamic.net
// @version      1.0.0
// @description  Fetches the local build and runs it. Refresh the tab to reload; no reinstall.
// @author       binaryfloof
// @match        https://e621.net/*
// @match        https://e926.net/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addElement
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @connect      127.0.0.1
// @connect      localhost
// @run-at       document-end
// ==/UserScript==

// This loader never changes. It pulls the latest `vite build --watch` output on
// every page load and injects it with GM_addElement, which bypasses the page's
// CSP (eval is blocked by it). GM_xmlhttpRequest is a privileged request, so the
// fetch itself also sidesteps CSP and HTTPS mixed-content. The bundle runs in
// the page context and persists via localStorage, so it needs no GM_* there.
(function () {
  'use strict';

  const SOURCE = 'http://127.0.0.1:5837/dist/6pack.user.js?t=' + Date.now();

  GM_xmlhttpRequest({
    method: 'GET',
    url: SOURCE,
    onload: function (res) {
      if (res.status < 200 || res.status >= 300) {
        console.error('[6pack dev] build fetch failed:', res.status);
        return;
      }
      GM_addElement('script', { textContent: res.responseText });
    },
    onerror: function () {
      console.error('[6pack dev] could not reach the dev server on :5837');
    },
  });
})();
