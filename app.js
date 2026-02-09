(function () {
  const STORAGE_LOGS = "dateNightFund_logs";
  const names = { you: "Sid", partner: "Tusha" };

  let logs = loadLogs();

  function loadLogs() {
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

  function saveLogs() {
    localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
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
    document.getElementById("total-you").textContent = "$" + you;
    document.getElementById("total-partner").textContent = "$" + partner;
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
      btn.addEventListener("click", function () {
        const li = this.closest("li");
        const id = li.dataset.id;
        if (id == null) return;
        const index = logs.findIndex((e) => String(e.id) === id);
        if (index === -1) return;
        logs.splice(index, 1);
        saveLogs();
        render();
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

  // Log form
  const logForm = document.getElementById("log-form");
  const logDate = document.getElementById("log-date");
  const missYou = document.getElementById("miss-you");
  const missPartner = document.getElementById("miss-partner");

  if (!logDate.value) {
    const today = new Date();
    logDate.value = today.toISOString().slice(0, 10);
  }

  logForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const date = logDate.value.trim();
    const you = missYou.checked;
    const partner = missPartner.checked;
    if (!you && !partner) {
      alert("Check at least one person who missed applying.");
      return;
    }
    logs.push({ id: Date.now(), date, you, partner });
    saveLogs();
    missYou.checked = false;
    missPartner.checked = false;
    logDate.value = new Date().toISOString().slice(0, 10);
    render();
  });

  render();
})();
