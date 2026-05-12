(function () {
      "use strict";

      const API_EXPENSES = "/api/expenses";

      const DEFAULT_CATEGORIES = [
        "Food & dining",
        "Transport",
        "Shopping",
        "Bills & utilities",
        "Entertainment",
        "Health",
        "Travel",
        "Other",
      ];

      function todayLocal() {
        const d = new Date();
        return (
          d.getFullYear() + "-" +
          String(d.getMonth() + 1).padStart(2, "0") + "-" +
          String(d.getDate()).padStart(2, "0")
        );
      }

      async function parseJsonError(res) {
        try {
          const j = await res.json();
          if (j && j.error) return j.error;
        } catch (_) {}
        return res.statusText || "Request failed";
      }

      async function getAllExpenses() {
        const res = await fetch(API_EXPENSES);
        if (!res.ok) throw new Error(await parseJsonError(res));
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }

      async function createExpense(payload) {
        const res = await fetch(API_EXPENSES, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseJsonError(res));
        return res.json();
      }

      async function updateExpense(id, payload) {
        const res = await fetch(API_EXPENSES + "/" + encodeURIComponent(id), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseJsonError(res));
        return res.json();
      }

      async function deleteExpense(id) {
        const res = await fetch(API_EXPENSES + "/" + encodeURIComponent(id), { method: "DELETE" });
        if (!res.ok && res.status !== 204) throw new Error(await parseJsonError(res));
      }

      function formatMoney(n) {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "AUD",
          maximumFractionDigits: 2,
        }).format(n);
      }

      function parseAmount(str) {
        const n = parseFloat(String(str).replace(/,/g, ""), 10);
        return Number.isFinite(n) && n >= 0 ? n : NaN;
      }

      function monthKey(isoDate) { return isoDate.slice(0, 7); }

      function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }

      function addMonths(d, n) {
        const x = new Date(d);
        x.setMonth(x.getMonth() + n);
        return x;
      }

      let cache = [];
      let editingId = null;
      let pendingDeleteId = null;

      const els = {
        overviewStats:      document.getElementById("overview-stats"),
        categoryBreakdown:  document.getElementById("category-breakdown"),
        monthlyChart:       document.getElementById("monthly-chart"),
        filterCategory:     document.getElementById("filter-category"),
        expenseTbody:       document.getElementById("expense-tbody"),
        expenseEmpty:       document.getElementById("expense-empty"),
        expenseTableWrap:   document.getElementById("expense-table-wrap"),
        backdrop:           document.getElementById("expense-modal-backdrop"),
        form:               document.getElementById("expense-form"),
        modalTitle:         document.getElementById("modal-title"),
        fId:                document.getElementById("f-id"),
        fTitle:             document.getElementById("f-title"),
        fCategory:          document.getElementById("f-category"),
        fAmount:            document.getElementById("f-amount"),
        fDate:              document.getElementById("f-date"),
        fDescription:       document.getElementById("f-description"),
        modalClose:         document.getElementById("modal-close"),
        modalCancel:        document.getElementById("modal-cancel"),
        confirmBackdrop:    document.getElementById("confirm-backdrop"),
        confirmMessage:     document.getElementById("confirm-message"),
        confirmClose:       document.getElementById("confirm-close"),
        confirmCancel:      document.getElementById("confirm-cancel"),
        confirmDelete:      document.getElementById("confirm-delete"),
        toasts:             document.getElementById("toasts"),
      };

      function getCategoriesFromData() {
        const set = new Set(DEFAULT_CATEGORIES);
        cache.forEach((e) => set.add(e.category));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
      }

      function escapeHtml(s) {
        const d = document.createElement("div");
        d.textContent = s;
        return d.innerHTML;
      }

      function populateCategorySelects() {
        const cats = getCategoriesFromData();
        const filterVal = els.filterCategory.value;

        els.fCategory.innerHTML = cats
          .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
          .join("");

        els.filterCategory.innerHTML =
          '<option value="">All categories</option>' +
          cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

        if (cats.includes(filterVal)) els.filterCategory.value = filterVal;
      }

      function aggregateByCategory(expenses) {
        const map = new Map();
        expenses.forEach((e) => {
          map.set(e.category, (map.get(e.category) || 0) + e.amount);
        });
        return Array.from(map.entries())
          .map(([name, total]) => ({ name, total }))
          .sort((a, b) => b.total - a.total);
      }

      function monthlyTotalsLast12(expenses) {
        const now = new Date();
        const start = startOfMonth(addMonths(now, -11));
        const labels = [];
        for (let i = 0; i < 12; i++) {
          const d = addMonths(start, i);
          labels.push({
            key: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"),
            short: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
          });
        }
        const sums = Object.fromEntries(labels.map((l) => [l.key, 0]));
        expenses.forEach((e) => {
          const k = monthKey(e.expense_date);
          if (sums[k] !== undefined) sums[k] += e.amount;
        });
        return labels.map((l) => ({ ...l, total: sums[l.key] }));
      }

      function expensesThisMonth(expenses) {
        const d = new Date();
        const prefix = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        return expenses.filter((e) => e.expense_date.startsWith(prefix)).reduce((s, e) => s + e.amount, 0);
      }

      function renderOverview() {
        const total = cache.reduce((s, e) => s + e.amount, 0);
        const thisMonth = expensesThisMonth(cache);
        const count = cache.length;

        els.overviewStats.innerHTML = `
          <div class="stat-card"><span>All time total</span><strong>${formatMoney(total)}</strong></div>
          <div class="stat-card"><span>This month</span><strong>${formatMoney(thisMonth)}</strong></div>
          <div class="stat-card"><span>Entries</span><strong>${count}</strong></div>
        `;

        const byCat = aggregateByCategory(cache);
        els.categoryBreakdown.innerHTML = byCat.length === 0
          ? '<li><span class="name">No data yet</span><span class="amt">—</span></li>'
          : byCat.map((c) =>
              `<li><span class="name">${escapeHtml(c.name)}</span><span class="amt">${formatMoney(c.total)}</span></li>`
            ).join("");

        const months = monthlyTotalsLast12(cache);
        const maxVal = Math.max(...months.map((m) => m.total), 1);
        els.monthlyChart.innerHTML = months.map((m) => {
          const pct = (m.total / maxVal) * 100;
          return `<div class="chart-bar">
            <span class="val">${m.total > 0 ? formatMoney(m.total) : ""}</span>
            <div class="bar" style="height:${Math.max(pct, m.total > 0 ? 8 : 0)}px" title="${escapeHtml(m.short)}: ${formatMoney(m.total)}"></div>
            <span class="label">${escapeHtml(m.short)}</span>
          </div>`;
        }).join("");
      }

      function renderExpenseTable() {
        const catFilter = els.filterCategory.value;
        let rows = [...cache].sort((a, b) => (a.expense_date < b.expense_date ? 1 : a.expense_date > b.expense_date ? -1 : 0));
        if (catFilter) rows = rows.filter((e) => e.category === catFilter);

        const hasAny = cache.length > 0;
        els.expenseEmpty.hidden = hasAny;
        els.expenseTableWrap.hidden = !hasAny;

        if (!hasAny) {
          els.expenseTbody.innerHTML = "";
          return;
        }

        if (rows.length === 0) {
          els.expenseTbody.innerHTML = `<tr><td colspan="6" class="empty-state" style="padding:1.5rem;">No expenses in this category.</td></tr>`;
          return;
        }

        els.expenseTbody.innerHTML = rows.map((e) => {
          const desc = e.description
            ? escapeHtml(e.description.length > 48 ? e.description.slice(0, 45) + "…" : e.description)
            : "—";
          return `<tr data-id="${escapeHtml(e.id)}">
            <td>${escapeHtml(e.title)}</td>
            <td>${escapeHtml(e.category)}</td>
            <td class="mono">${formatMoney(e.amount)}</td>
            <td class="mono">${escapeHtml(e.expense_date)}</td>
            <td>${desc}</td>
            <td class="actions">
              <button type="button" class="btn btn-ghost btn-sm" data-action="edit"   data-id="${escapeHtml(e.id)}">Edit</button>
              <button type="button" class="btn btn-danger btn-sm" data-action="delete" data-id="${escapeHtml(e.id)}">Delete</button>
            </td>
          </tr>`;
        }).join("");
      }

      function renderAll() {
        populateCategorySelects();
        renderOverview();
        renderExpenseTable();
      }

      async function refresh() {
        try {
          cache = await getAllExpenses();
              console.log(cache);
        } catch (err) {
          toast(err.message || "Could not load expenses.", "error");
          cache = [];
        }
        renderAll();
      }

      function toast(msg, type) {
        const t = document.createElement("div");
        t.className = "toast " + (type || "success");
        t.textContent = msg;
        els.toasts.appendChild(t);
        setTimeout(() => {
          t.style.opacity = "0";
          t.style.transform = "translateX(8px)";
          setTimeout(() => t.remove(), 200);
        }, 3200);
      }

      function openModal(editRecord) {
        editingId = editRecord ? editRecord.id : null;
        els.modalTitle.textContent = editRecord ? "Edit expense" : "Add expense";
        els.fId.value = editRecord ? editRecord.id : "";
        els.fTitle.value = editRecord ? editRecord.title : "";
        els.fAmount.value = editRecord ? String(editRecord.amount) : "";
        els.fDate.value = editRecord ? editRecord.expense_date : todayLocal();
        els.fDescription.value = editRecord ? editRecord.description || "" : "";
        populateCategorySelects();
        if (editRecord) els.fCategory.value = editRecord.category;

        ["field-title", "field-category", "field-amount", "field-date"].forEach((id) => {
          document.getElementById(id).classList.remove("invalid");
        });

        els.backdrop.hidden = false;
        requestAnimationFrame(() => els.backdrop.classList.add("open"));
        els.fTitle.focus();
      }

      function closeModal() {
        els.backdrop.classList.remove("open");
        setTimeout(() => { els.backdrop.hidden = true; editingId = null; }, 200);
      }

      function validateForm() {
        let ok = true;
        const title = els.fTitle.value.trim();

        if (!title) { document.getElementById("field-title").classList.add("invalid"); ok = false; }
        else          document.getElementById("field-title").classList.remove("invalid");

        if (!els.fCategory.value) { document.getElementById("field-category").classList.add("invalid"); ok = false; }
        else                        document.getElementById("field-category").classList.remove("invalid");

        const amt = parseAmount(els.fAmount.value);
        if (!Number.isFinite(amt)) { document.getElementById("field-amount").classList.add("invalid"); ok = false; }
        else                         document.getElementById("field-amount").classList.remove("invalid");

        if (!els.fDate.value) { document.getElementById("field-date").classList.add("invalid"); ok = false; }
        else                    document.getElementById("field-date").classList.remove("invalid");

        return ok
          ? { title, category: els.fCategory.value, amount: amt, expense_date: els.fDate.value, description: els.fDescription.value.trim() }
          : null;
      }

      // ── Event wiring ──────────────────────────────────────────

      document.getElementById("btn-add-expense").addEventListener("click", () => openModal(null));
      document.getElementById("btn-add-expense-empty").addEventListener("click", () => openModal(null));

      els.modalClose.addEventListener("click", closeModal);
      els.modalCancel.addEventListener("click", closeModal);
      els.backdrop.addEventListener("click", (e) => { if (e.target === els.backdrop) closeModal(); });

      els.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = validateForm();
        if (!data) return;
        try {
          if (editingId) await updateExpense(editingId, data);
          else           await createExpense(data);
          await refresh();
          closeModal();
          toast(editingId ? "Expense updated." : "Expense saved.");
        } catch (err) {
          toast(err.message || "Could not save expense.", "error");
        }
      });

      els.expenseTbody.addEventListener("click", (e) => {
        const editBtn = e.target.closest("[data-action=edit]");
        const delBtn  = e.target.closest("[data-action=delete]");
        if (editBtn) {
          const rec = cache.find((x) => x.id === Number(editBtn.dataset.id));

          if (rec) openModal(rec);
        } else if (delBtn) {
          pendingDeleteId = Number(delBtn.dataset.id);
          const rec = cache.find((x) => x.id === Number(pendingDeleteId));
          els.confirmMessage.textContent = rec
            ? `Delete "${rec.title}" (${formatMoney(rec.amount)})? This cannot be undone.`
            : "Delete this expense? This cannot be undone.";
          els.confirmBackdrop.hidden = false;
          requestAnimationFrame(() => els.confirmBackdrop.classList.add("open"));
        }
      });

      function closeConfirm() {
        els.confirmBackdrop.classList.remove("open");
        setTimeout(() => { els.confirmBackdrop.hidden = true; pendingDeleteId = null; }, 200);
      }

      els.confirmClose.addEventListener("click", closeConfirm);
      els.confirmCancel.addEventListener("click", closeConfirm);
      els.confirmBackdrop.addEventListener("click", (e) => { if (e.target === els.confirmBackdrop) closeConfirm(); });

      els.confirmDelete.addEventListener("click", async () => {
        if (!pendingDeleteId) return;
        const id = pendingDeleteId;
        try {
          await deleteExpense(id);
          closeConfirm();
          await refresh();
          toast("Expense deleted."); 
        } catch (err) {
          toast(err.message || "Could not delete.", "error");
        }
      });

      els.filterCategory.addEventListener("change", renderExpenseTable);

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          if (!els.confirmBackdrop.hidden) closeConfirm();
          else if (!els.backdrop.hidden)   closeModal();
        }
      });

      refresh();
    })();