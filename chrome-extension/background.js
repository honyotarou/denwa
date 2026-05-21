/** Generated — edit chrome-extension/src/background-entry.ts */

(() => {
  // packages/pbx-core/src/click2call/phone.ts
  function normalizeClickToCallNumber(raw) {
    const t = (raw ?? "").trim();
    if (!t) return null;
    if (t.startsWith("tel:")) return normalizeClickToCallNumber(t.slice(4));
    const digits = t.replace(/[^\d+]/g, "");
    if (!digits) return null;
    if (digits.startsWith("+81")) {
      let rest = digits.slice(3).replace(/^0/, "");
      if (/^\d{9,10}$/.test(rest) && !rest.startsWith("0")) rest = `0${rest}`;
      if (/^\d{9,11}$/.test(rest)) return rest;
      return null;
    }
    if (digits.startsWith("0") && /^\d{9,11}$/.test(digits)) return digits;
    if (/^\d{9,11}$/.test(digits)) return digits;
    return null;
  }

  // packages/pbx-core/src/click2call/originate-client.ts
  function normalizeClick2CallStorage(raw) {
    const baseUrl = String(raw.baseUrl ?? "http://localhost:3000").trim().replace(/\/$/, "");
    const from = String(raw.from ?? "1001").trim() || "1001";
    const token = String(raw.token ?? "").trim();
    if (!token) {
      return { ok: false, error: "Bearer token \u304C\u672A\u8A2D\u5B9A\u3067\u3059\uFF08\u62E1\u5F35 options\uFF09" };
    }
    return { ok: true, config: { baseUrl, from, token } };
  }
  function buildOriginateHttpRequest(config, toRaw) {
    const normalized = normalizeClickToCallNumber(toRaw) ?? toRaw.replace(/[^0-9*#+-]/g, "");
    return {
      url: `${config.baseUrl}/api/originate`,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.token}`
        },
        body: JSON.stringify({ from: config.from, to: normalized })
      }
    };
  }
  async function originateViaBearer(rawConfig, toRaw, fetchFn) {
    const norm = normalizeClick2CallStorage(rawConfig);
    if (!norm.ok) throw new Error(norm.error);
    const { url, init } = buildOriginateHttpRequest(norm.config, toRaw);
    const res = await fetchFn(url, init);
    if (res.status === 401) {
      throw new Error("originate unauthorized: token \u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044");
    }
    if (!res.ok) {
      throw new Error(`originate failed: ${res.status}`);
    }
    return res.json();
  }

  // packages/pbx-core/src/click2call/extension-message.ts
  var CLICK2CALL_MSG_ORIGINATE = "originate";
  function parseOriginateContentMessage(msg) {
    if (!msg || typeof msg !== "object") return null;
    const m = msg;
    if (m.type !== CLICK2CALL_MSG_ORIGINATE) return null;
    const to = String(m.to ?? "").trim();
    if (!to) return null;
    return { type: CLICK2CALL_MSG_ORIGINATE, to };
  }

  // packages/pbx-core/src/click2call/content-scan.ts
  function normalizeContextMenuSelection(text) {
    const num = (text ?? "").replace(/[^0-9*#+-]/g, "");
    return num || null;
  }

  // chrome-extension/src/background-entry.ts
  async function originateCall(toNumber) {
    const cfg = await chrome.storage.local.get({
      baseUrl: "http://localhost:3000",
      from: "1001",
      token: ""
    });
    return originateViaBearer(
      cfg,
      toNumber,
      (url, init) => fetch(url, init).then((res) => ({
        ok: res.ok,
        status: res.status,
        json: () => res.json()
      }))
    );
  }
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    const parsed = parseOriginateContentMessage(msg);
    if (parsed) {
      originateCall(parsed.to).then((r) => sendResponse({ ok: true, result: r })).catch((e) => sendResponse({ ok: false, error: String(e) }));
      return true;
    }
  });
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "denwa-call-selection",
      title: "denwa \u3067\u767A\u4FE1: %s",
      contexts: ["selection"]
    });
  });
  chrome.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId === "denwa-call-selection" && info.selectionText) {
      const num = normalizeContextMenuSelection(info.selectionText);
      if (num) {
        try {
          await originateCall(num);
        } catch (e) {
          console.warn("[denwa-ext]", e);
        }
      }
    }
  });
})();
