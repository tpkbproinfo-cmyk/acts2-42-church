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
    d.addEventListener('mouseenter', function () { d.open = true; });
    d.addEventListener('mouseleave', function () { if (!pinned) d.open = false; });
    d.querySelector('summary').addEventListener('click', function (e) {
      e.preventDefault(); pinned = !pinned || !d.open; d.open = pinned;
    });
  });
}
