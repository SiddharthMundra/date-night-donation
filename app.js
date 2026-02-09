(function () {
  const STORAGE_LOGS = "dateNightFund_logs";
  const STORAGE_ROOM_CODE = "dateNightFund_roomCode";
  const names = { you: "Sid", partner: "Tusha" };
  const API_BASE = typeof window !== "undefined" && window.API_BASE_URL ? window.API_BASE_URL.replace(/\/$/, "") : "";

  let logs = [];

  function getRoomCode() {
    return localStorage.getItem(STORAGE_ROOM_CODE) || "";
  }

  function setRoomCode(code) {
    const trimmed = String(code).trim();
    if (trimmed) localStorage.setItem(STORAGE_ROOM_CODE, trimmed);
    return trimmed;
  }

  function loadLogsLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_LOGS);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.map((e, i) => ({ id: e.id || Date.now() + i, date: e.date, you: !!e.you, partner: !!e.partner }));
    } catch {
      return [];
    }
  }

  function saveLogsLocal() {
    localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
  }

  async function loadLogsFromAPI() {
    const roomCode = getRoomCode();
    if (!roomCode) return [];
    const res = await fetch(`${API_BASE}/logs?roomCode=${encodeURIComponent(roomCode)}`);
    if (!res.ok) throw new Error("Failed to load logs");
    const data = await res.json();
    const arr = data.logs || [];
    return arr.map((e, i) => ({ id: e.id || Date.now() + i, date: e.date, you: !!e.you, partner: !!e.partner }));
  }

  async function loadLogs() {
    if (API_BASE) {
      try {
        return await loadLogsFromAPI();
      } catch (err) {
        console.error(err);
        return [];
      }
    }
    return loadLogsLocal();
  }

  function saveLogs() {
    if (!API_BASE) saveLogsLocal();
  }

  async function saveLogToAPI(entry) {
    const roomCode = getRoomCode();
    if (!roomCode) return;
    const res = await fetch(`${API_BASE}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomCode,
        date: entry.date,
        you: entry.you,
        partner: entry.partner,
      }),
    });
    if (!res.ok) throw new Error("Failed to save");
    const data = await res.json();
    logs = (data.logs || []).map((e, i) => ({ id: e.id || Date.now() + i, date: e.date, you: !!e.you, partner: !!e.partner }));
  }

  async function deleteLogFromAPI(logId) {
    const roomCode = getRoomCode();
    if (!roomCode) return;
    const res = await fetch(`${API_BASE}/logs`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode, logId }),
    });
    if (!res.ok) throw new Error("Failed to delete");
    const data = await res.json();
    logs = (data.logs || []).map((e, i) => ({ id: e.id || Date.now() + i, date: e.date, you: !!e.you, partner: !!e.partner }));
  }

  function getTotals() {
    let you = 0,
      partner = 0;
    for (const entry of logs) {
      if (entry.you) you += 1;
      if (entry.partner) partner += 1;
    }
    return { you, partner };
  }

  function renderTotals() {
    const { you, partner } = getTotals();
    document.getElementById("total-you").textContent = "$" + you * 2;
    document.getElementById("total-partner").textContent = "$" + partner * 2;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function renderHistory() {
    const list = document.getElementById("log-list");
    const empty = document.getElementById("empty-history");
    const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));

    if (sorted.length === 0) {
      list.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");

    list.innerHTML = sorted
      .map((entry) => {
        const who = [];
        if (entry.you) who.push(`<span class="you">${escapeHtml(names.you)}</span>`);
        if (entry.partner) who.push(`<span class="partner">${escapeHtml(names.partner)}</span>`);
        const whoHtml = who.length ? who.join(", ") : "—";
        return `<li data-id="${escapeHtml(String(entry.id))}">
          <span class="date">${escapeHtml(formatDate(entry.date))}</span>
          <span class="who">${whoHtml}</span>
          <button type="button" aria-label="Delete entry">×</button>
        </li>`;
      })
      .join("");

    list.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const li = this.closest("li");
        const id = li.dataset.id;
        if (id == null) return;
        const index = logs.findIndex((e) => String(e.id) === id);
        if (index === -1) return;
        if (API_BASE) {
          try {
            await deleteLogFromAPI(id);
            render();
          } catch (err) {
            alert("Could not delete. Try again.");
          }
        } else {
          logs.splice(index, 1);
          saveLogs();
          render();
        }
      });
    });
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function render() {
    renderTotals();
    renderHistory();
  }

  function showRoomCodeSection(show) {
    const el = document.getElementById("room-code-section");
    if (el) el.classList.toggle("hidden", !show);
  }

  function renderRoomCode() {
    const inp = document.getElementById("room-code-input");
    const saveBtn = document.getElementById("room-code-save");
    if (!inp || !saveBtn) return;
    inp.value = getRoomCode();
    if (API_BASE) {
      showRoomCodeSection(true);
    } else {
      showRoomCodeSection(false);
    }
  }

  function onRoomCodeSave() {
    const inp = document.getElementById("room-code-input");
    if (!inp) return;
    const newCode = setRoomCode(inp.value);
    if (newCode) init();
    else alert("Enter a room code (you and Tusha share this).");
  }

  async function init() {
    if (API_BASE && !getRoomCode()) {
      logs = [];
      renderRoomCode();
      render();
      return;
    }
    logs = await loadLogs();
    renderRoomCode();
    render();
  }

  // Log form
  const logForm = document.getElementById("log-form");
  const logDate = document.getElementById("log-date");
  const missYou = document.getElementById("miss-you");
  const missPartner = document.getElementById("miss-partner");

  if (logDate && !logDate.value) {
    const today = new Date();
    logDate.value = today.toISOString().slice(0, 10);
  }

  if (logForm) {
    logForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const date = logDate.value.trim();
      const you = missYou.checked;
      const partner = missPartner.checked;
      if (!you && !partner) {
        alert("Check at least one person who missed applying.");
        return;
      }
      const entry = { id: Date.now(), date, you, partner };
      if (API_BASE) {
        try {
          await saveLogToAPI(entry);
          missYou.checked = false;
          missPartner.checked = false;
          logDate.value = new Date().toISOString().slice(0, 10);
          render();
        } catch (err) {
          alert("Could not save. Check room code and try again.");
        }
      } else {
        logs.push(entry);
        saveLogs();
        missYou.checked = false;
        missPartner.checked = false;
        logDate.value = new Date().toISOString().slice(0, 10);
        render();
      }
    });
  }

  const saveBtn = document.getElementById("room-code-save");
  if (saveBtn) saveBtn.addEventListener("click", onRoomCodeSave);

  init();
})();
