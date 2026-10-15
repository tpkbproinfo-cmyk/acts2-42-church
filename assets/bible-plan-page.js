(function () {
  var KEY = 'acts242-bible-plan-v1', VKEY = 'acts242-bible-version';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  var done = {}; load().forEach(function (n) { done[n] = true; });
  var version = 'NLT';
  try { version = localStorage.getItem(VKEY) || 'NLT'; } catch (e) {}
  var sel = document.getElementById('bp-version');
  if (sel) { sel.value = version; if (sel.value !== version) { version = 'NLT'; sel.value = version; } }

  var rows = Array.prototype.slice.call(document.querySelectorAll('.bp-day'));
  function url(q) { return 'https://www.biblegateway.com/passage/?search=' + encodeURIComponent(q) + '&version=' + encodeURIComponent(version); }
  function setLinks() {
    rows.forEach(function (r) { var a = r.querySelector('a.bp-ref'); a.href = url(a.getAttribute('data-q')); });
    updateToday();
  }
  var today = window.bibleDayFor(new Date());
  function updateToday() {
    var p = window.BIBLE_PLAN[today - 1];
    var link = document.getElementById('bp-today-link');
    link.textContent = 'Day ' + today + ' · ' + p[0];
    link.href = '#d' + today;
    document.getElementById('bp-read-today').href = url(p[1]);
    document.getElementById('bp-today-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function refresh() {
    var count = 0, firstUnread = null;
    rows.forEach(function (r) {
      var n = +r.getAttribute('data-day'), on = !!done[n];
      r.querySelector('input').checked = on;
      r.classList.toggle('done', on);
      if (on) { count++; firstUnread = null; } else if (firstUnread === null) firstUnread = n;
    });
    document.querySelectorAll('details.bp-month').forEach(function (m) {
      var ds = m.querySelectorAll('.bp-day'), c = 0;
      ds.forEach(function (r) { if (done[+r.getAttribute('data-day')]) c++; });
      m.querySelector('.bp-mcount').textContent = c ? (c === ds.length ? '✓ Complete' : c + ' / ' + ds.length) : '';
    });
    document.getElementById('bp-count').textContent = count + ' of 365 days';
    document.getElementById('bp-fill').style.width = (count / 365 * 100).toFixed(1) + '%';
    var next = document.getElementById('bp-next');
    if (count === 0) next.textContent = 'Start today, or go back to Day 1 and begin at the beginning.';
    else if (count === 365) next.textContent = 'You’ve read the whole Bible. Praise God!';
    else if (firstUnread !== null) { next.innerHTML = ''; next.appendChild(document.createTextNode('Your next unread day: ')); var a = document.createElement('a'); a.href = '#d' + firstUnread; a.style.color = '#E8D9BF'; a.textContent = 'Day ' + firstUnread + ' · ' + window.BIBLE_PLAN[firstUnread - 1][0]; next.appendChild(a); }
    else next.textContent = 'Keep going: ' + (365 - count) + ' days left to read.';
  }
  rows.forEach(function (r) {
    var n = +r.getAttribute('data-day');
    r.querySelector('input').addEventListener('change', function (e) {
      if (e.target.checked) done[n] = true; else delete done[n];
      save(Object.keys(done).map(Number).sort(function (a, b) { return a - b; }));
      refresh();
    });
    r.querySelector('a.bp-ref').addEventListener('click', function (e) { e.stopPropagation(); });
  });
  var tr = document.getElementById('d' + today);
  if (tr) { tr.classList.add('today'); tr.closest('details').open = true; }
  function openHash() {
    var t = location.hash && document.getElementById(location.hash.slice(1));
    if (t && t.classList.contains('bp-day')) { t.closest('details').open = true; setTimeout(function () { t.scrollIntoView({ block: 'center' }); }, 30); }
  }
  window.addEventListener('hashchange', openHash); openHash();
  if (sel) sel.addEventListener('change', function () { version = sel.value; try { localStorage.setItem(VKEY, version); } catch (e) {} setLinks(); });
  document.getElementById('bp-reset').addEventListener('click', function () {
    if (confirm('Clear all your checkmarks on this device?')) { done = {}; save([]); refresh(); }
  });
  var opened = [];
  window.addEventListener('beforeprint', function () { opened = []; document.querySelectorAll('details.bp-month').forEach(function (d) { if (!d.open) { opened.push(d); d.open = true; } }); });
  window.addEventListener('afterprint', function () { opened.forEach(function (d) { d.open = false; }); });
  setLinks(); refresh();
})();
