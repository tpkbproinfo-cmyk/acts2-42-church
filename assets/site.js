(function () {
  var TO = 'engage@acts2-42.church';
  var es = document.documentElement.lang === 'es';

  // Baptism / baby dedication switch
  var choices = document.querySelectorAll('.choice[data-choice]');
  choices.forEach(function (btn) {
    btn.addEventListener('click', function () {
      choices.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      document.querySelectorAll('[data-group]').forEach(function (g) {
        g.hidden = g.getAttribute('data-group') !== btn.getAttribute('data-choice');
      });
    });
  });

  function labelText(el) {
    var label = el.closest('label');
    if (!label) return el.name || 'Field';
    var t = '';
    label.childNodes.forEach(function (n) { if (n.nodeType === 3) t += n.textContent; });
    return t.trim() || label.textContent.trim();
  }

  // Forms open a pre-filled email to the church
  document.querySelectorAll('form[data-subject]').forEach(function (form) {
    var note = document.createElement('p');
    note.className = 'form-note';
    note.textContent = es
      ? 'Al enviar, se abrirá tu aplicación de correo con tu mensaje listo para enviar a ' + TO + '.'
      : 'When you send, your email app opens with your message ready to send to ' + TO + '.';
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.insertAdjacentElement('afterend', note);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var lines = [];
      var choice = form.querySelector('.choice[aria-pressed="true"]');
      if (choice) lines.push((es ? 'Tipo' : 'Signing up for') + ': ' + choice.textContent.trim());
      form.querySelectorAll('input, textarea, select').forEach(function (el) {
        if (el.closest('[hidden]')) return;
        if (el.type === 'radio') { if (el.checked) lines.push((es ? 'Visibilidad' : 'Who may see this') + ': ' + labelText(el)); return; }
        if (el.type === 'checkbox') { if (el.checked) lines.push('✓ ' + labelText(el)); return; }
        if (el.value && el.value.trim()) lines.push(labelText(el) + ': ' + el.value.trim());
      });
      if (!lines.length) {
        alert(es ? 'Por favor completa el formulario antes de enviarlo.' : 'Please fill in the form before sending.');
        return;
      }
      var href = 'mailto:' + TO + '?subject=' + encodeURIComponent(form.getAttribute('data-subject')) +
        '&body=' + encodeURIComponent(lines.join('\n'));
      window.location.href = href;
    });
  });
})();

// Prayer board hearts
document.querySelectorAll('button.pray').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var on = btn.getAttribute('aria-pressed') !== 'true';
    var n = parseInt(btn.getAttribute('data-count'), 10) + (on ? 1 : 0);
    btn.setAttribute('aria-pressed', String(on));
    btn.querySelector('path').setAttribute('fill', on ? '#C77D4F' : 'none');
    btn.querySelector('.pray-count').textContent = n + ' ' + btn.getAttribute('data-unit');
  });
});

// Ministry directory: open on hover for mouse users; tap or keyboard toggles everywhere
if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('details.mdir').forEach(function (d) {
    var pinned = false;
    var timer = null;  // open only after the mouse rests on it for 2 seconds
    d.addEventListener('mouseenter', function () { clearTimeout(timer); timer = setTimeout(function () { d.open = true; }, 2000); });
    d.addEventListener('mouseleave', function () { clearTimeout(timer); if (!pinned) d.open = false; });
    d.querySelector('summary').addEventListener('click', function (e) {
      e.preventDefault(); pinned = !pinned || !d.open; d.open = pinned;
    });
  });
}

// Spiritual gifts assessment (Romans 12)
(function () {
  var quiz = document.getElementById('gift-quiz');
  if (!quiz) return;
  var err = document.getElementById('gift-error');
  var results = document.getElementById('gift-results');
  var NAMES = { perceiving: 'Perceiving', serving: 'Serving', teaching: 'Teaching', encouraging: 'Encouraging',
                giving: 'Giving', leading: 'Leading', mercy: 'Showing mercy' };
  quiz.addEventListener('change', function () { err.hidden = true; });
  document.getElementById('gift-submit').addEventListener('click', function () {
    var groups = {}, total = {};
    quiz.querySelectorAll('input[type="radio"]').forEach(function (r) {
      groups[r.name] = groups[r.name] || false;
      if (r.checked) { groups[r.name] = true; total[r.dataset.gift] = (total[r.dataset.gift] || 0) + Number(r.value); }
    });
    var missing = Object.keys(groups).filter(function (k) { return !groups[k]; });
    if (missing.length) {
      err.hidden = false;
      var first = quiz.querySelector('input[name="' + missing[0] + '"]');
      if (first) first.focus();
      return;
    }
    var ranked = Object.keys(total).sort(function (a, b) { return total[b] - total[a]; });
    var cutoff = total[ranked[Math.min(2, ranked.length - 1)]];
    var top = ranked.filter(function (g, i) { return i < 3 || total[g] === cutoff; }).slice(0, 4);
    document.querySelectorAll('[data-result]').forEach(function (c) {
      var i = top.indexOf(c.dataset.result);
      c.hidden = i < 0; c.style.order = i;
    });
    // fill the top 3 gifts, in order, into the Get involved form
    document.querySelectorAll('#get-involved select[data-rank]').forEach(function (sel) {
      var g = top[Number(sel.dataset.rank) - 1];
      sel.value = g ? NAMES[g] : '';
    });
    results.hidden = false;
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();

// Live prayer board: renders approved requests from the Base44 public feed.
(function () {
  var box = document.getElementById('live-board');
  if (!box || !box.getAttribute('data-feed')) return;
  var es = document.documentElement.lang === 'es';
  var app = box.getAttribute('data-app');
  function esc(t) { var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }
  function ago(iso) {
    var d = new Date(iso); if (isNaN(d)) return '';
    var days = Math.floor((Date.now() - d) / 864e5);
    if (days < 1) return es ? 'hoy' : 'today';
    if (days === 1) return es ? 'ayer' : 'yesterday';
    if (days < 30) return es ? 'hace ' + days + ' días' : days + ' days ago';
    return d.toLocaleDateString(es ? 'es' : 'en-US', { month: 'short', day: 'numeric' });
  }
  fetch(box.getAttribute('data-feed'), { headers: { Accept: 'application/json' } })
    .then(function (r) { if (!r.ok) throw r; return r.json(); })
    .then(function (data) {
      var items = Array.isArray(data) ? data : (data.requests || data.items || data.data || []);
      if (!items.length) return;
      box.innerHTML = items.slice(0, 12).map(function (it) {
        var n = it.prayer_count || 0;
        var names = (it.prayed_by || it.prayer_names || []).slice(0, 3);
        var who = names.length ? (es ? 'De acuerdo: ' : 'Agreeing: ') + names.map(esc).join(', ') + (n > names.length ? (es ? ' y ' : ' and ') + (n - names.length) + (es ? ' más' : (n - names.length === 1 ? ' other' : ' others')) : '') : '';
        var answered = it.status === 'answered';
        var link = app + '?request=' + encodeURIComponent(it.id);
        return '<div style="background:#FFFFFF;border:1px solid #E3DACB;border-radius:14px;padding:24px;display:flex;flex-direction:column;gap:12px">' +
          '<div style="display:flex;justify-content:space-between;gap:12px;font-size:15px"><span style="font-weight:700;color:#2F4858">' + esc(it.display_name || (es ? 'Anónimo' : 'Anonymous')) + '</span><span style="color:#4F6676">' + esc(ago(it.approved_at || it.created_at)) + '</span></div>' +
          (answered ? '<span style="align-self:flex-start;background:#F6E3D6;color:#8A4A22;font-weight:700;font-size:13px;padding:4px 10px;border-radius:999px">' + (es ? 'Testimonio de alabanza' : 'Praise report') + '</span>' : '') +
          '<p style="margin:0;font-size:17px;line-height:1.6;color:#2F4858">' + esc(it.public_text) + '</p>' +
          (answered && it.praise_note ? '<p style="margin:0;font-size:16px;line-height:1.6;color:#8A4A22;font-style:italic">' + esc(it.praise_note) + '</p>' : '') +
          '<a href="' + link + '" target="_blank" rel="noopener" class="pray" style="align-self:flex-start;text-decoration:none;display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:16px;padding:10px 16px;border-radius:999px;background:#FFFFFF;color:#2F4858;border:2px solid #E3DACB">' +
          '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C77D4F" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>' +
          (es ? 'Estoy de acuerdo en oración · ' : 'I\'m agreeing in prayer · ') + n + '</a>' +
          (who ? '<span style="font-size:14px;color:#4F6676">' + who + '</span>' : '') +
          '</div>';
      }).join('');
      box.hidden = false; box.style.display = 'grid';
      var fb = document.getElementById('board-fallback'); if (fb) fb.hidden = true;
    })
    .catch(function () { /* keep the fallback card */ });
})();

// Interest group cards: tap/click or Enter toggles the description (touch devices have no hover)
document.querySelectorAll('.grp').forEach(function (g) {
  function t() { var o = g.classList.toggle('open'); g.setAttribute('aria-expanded', String(o)); }
  g.addEventListener('click', t);
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var timer = null;  // open only after the mouse rests on it for 2 seconds
    g.addEventListener('mouseenter', function () { clearTimeout(timer); timer = setTimeout(function () { g.classList.add('hover-open'); }, 2000); });
    g.addEventListener('mouseleave', function () { clearTimeout(timer); g.classList.remove('hover-open'); });
  }
  g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
});
