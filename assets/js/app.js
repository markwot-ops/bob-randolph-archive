/* Bob Randolph Archive — shared behavior */

// ---- language switch (per-poem) ----
// Each poem page marks its text blocks with data-lang="en" / "es" / "fr" etc.
// Only "en" has real content right now; other buttons are wired up and will
// light up automatically the day a translated block is added to the page.
function initLangSwitch() {
  const switchers = document.querySelectorAll('.lang-switch');
  switchers.forEach(function (sw) {
    const buttons = sw.querySelectorAll('button[data-lang]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const lang = btn.getAttribute('data-lang');
        const scope = document.querySelector(btn.getAttribute('data-scope') || '.poem-wrap');
        if (!scope) return;
        scope.querySelectorAll('[data-lang-block]').forEach(function (block) {
          block.style.display = (block.getAttribute('data-lang-block') === lang) ? '' : 'none';
        });
        buttons.forEach(function (b) { b.classList.toggle('active', b === btn); });
      });
    });
  });
}

// ---- view original scan toggle ----
function initScanToggle() {
  document.querySelectorAll('[data-scan-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const targetSel = btn.getAttribute('data-scan-toggle');
      const target = document.querySelector(targetSel);
      if (!target) return;
      const shown = target.classList.toggle('shown');
      btn.classList.toggle('active', shown);
      btn.textContent = shown ? 'Hide original scan' : 'View original scan';
    });
  });
}

// ---- master index table (search / sort) ----
function initMasterIndex() {
  const table = document.getElementById('index-table');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  const search = document.getElementById('index-search');
  const countEl = document.getElementById('index-count');
  const dataUrl = table.getAttribute('data-src');

  fetch(dataUrl)
    .then(function (r) { return r.json(); })
    .then(function (rows) {
      render(rows);

      function render(list) {
        tbody.innerHTML = '';
        const frag = document.createDocumentFragment();
        list.forEach(function (row) {
          const tr = document.createElement('tr');
          const numTd = document.createElement('td');
          numTd.textContent = row.number || '—';
          const ttlTd = document.createElement('td');
          ttlTd.textContent = row.title;
          const codeTd = document.createElement('td');
          codeTd.textContent = (row.codes || []).join(', ');
          tr.appendChild(numTd);
          tr.appendChild(ttlTd);
          tr.appendChild(codeTd);
          frag.appendChild(tr);
        });
        tbody.appendChild(frag);
        countEl.textContent = list.length + ' of ' + rows.length + ' poems';
      }

      search.addEventListener('input', function () {
        const q = search.value.trim().toLowerCase();
        if (!q) { render(rows); return; }
        render(rows.filter(function (row) {
          return row.title.toLowerCase().includes(q) ||
                 (row.codes || []).some(function (c) { return c.toLowerCase().includes(q); }) ||
                 String(row.number).includes(q);
        }));
      });

      let sortState = {};
      table.querySelectorAll('th[data-sort]').forEach(function (th) {
        th.addEventListener('click', function () {
          const key = th.getAttribute('data-sort');
          sortState[key] = !sortState[key];
          const asc = sortState[key];
          const sorted = rows.slice().sort(function (a, b) {
            let av = a[key], bv = b[key];
            if (key === 'number') { av = parseInt(av) || 0; bv = parseInt(bv) || 0; }
            else if (key === 'codes') { av = (av || []).join(','); bv = (bv || []).join(','); }
            else { av = (av || '').toLowerCase(); bv = (bv || '').toLowerCase(); }
            if (av < bv) return asc ? -1 : 1;
            if (av > bv) return asc ? 1 : -1;
            return 0;
          });
          render(sorted);
        });
      });
    })
    .catch(function (err) {
      tbody.innerHTML = '<tr><td colspan="3">Could not load the index (' + err + ').</td></tr>';
    });
}

document.addEventListener('DOMContentLoaded', function () {
  initLangSwitch();
  initScanToggle();
  initMasterIndex();
});
