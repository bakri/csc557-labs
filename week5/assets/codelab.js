(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  var steps = Array.prototype.slice.call(document.querySelectorAll('section.step'));
  var toc = document.getElementById('toc');
  var backBtn = document.getElementById('back');
  var nextBtn = document.getElementById('next');
  var remainingEl = document.getElementById('remaining-min');
  var storeKey = 'codelab:' + location.pathname + ':step';
  var current = 0;

  var clock = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7z"/></svg>';

  // Step header (duration) and sidebar entries are built from each section.
  steps.forEach(function (sec, i) {
    var h2 = sec.querySelector('h2');
    var mins = parseInt(sec.getAttribute('data-minutes'), 10) || 0;
    var head = document.createElement('div');
    head.className = 'step-head';
    sec.insertBefore(head, h2);
    head.appendChild(h2);
    var dur = document.createElement('div');
    dur.className = 'duration';
    dur.innerHTML = clock + '<span>' + mins + ' min</span>';
    head.appendChild(dur);

    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + sec.id;
    a.innerHTML = '<span class="num">' + (i + 1) + '</span><span class="label"></span>';
    a.querySelector('.label').textContent = h2.textContent;
    li.appendChild(a);
    toc.appendChild(li);
  });

  function minutesLeft(from) {
    return steps.slice(from).reduce(function (sum, s) {
      return sum + (parseInt(s.getAttribute('data-minutes'), 10) || 0);
    }, 0);
  }

  function show(i, scroll) {
    current = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach(function (s, k) { s.hidden = k !== current; });
    Array.prototype.forEach.call(toc.children, function (li, k) {
      li.className = k === current ? 'current' : (k < current ? 'done' : '');
      var a = li.querySelector('a');
      if (k === current) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
    });
    backBtn.hidden = current === 0;
    nextBtn.hidden = current === steps.length - 1;
    remainingEl.textContent = minutesLeft(current);
    document.title = steps[current].querySelector('h2').textContent + ' · ' + document.body.getAttribute('data-title');
    try { localStorage.setItem(storeKey, steps[current].id); } catch (e) {}
    if (scroll !== false) window.scrollTo(0, 0);
    root.classList.remove('nav-open');
  }

  function indexOf(id) {
    for (var k = 0; k < steps.length; k++) if (steps[k].id === id) return k;
    return -1;
  }

  function go(i) {
    var id = steps[Math.max(0, Math.min(steps.length - 1, i))].id;
    if (location.hash === '#' + id) show(i);
    else location.hash = id;
  }

  window.addEventListener('hashchange', function () {
    var k = indexOf(location.hash.slice(1));
    if (k >= 0) show(k);
  });

  backBtn.addEventListener('click', function () { go(current - 1); });
  nextBtn.addEventListener('click', function () { go(current + 1); });

  document.getElementById('menu').addEventListener('click', function () {
    root.classList.toggle('nav-open');
  });
  document.getElementById('scrim').addEventListener('click', function () {
    root.classList.remove('nav-open');
  });

  // Copy buttons copy the whole block, without highlight markup.
  Array.prototype.forEach.call(document.querySelectorAll('.code'), function (block) {
    var btn = block.querySelector('.copy');
    var label = btn.querySelector('span');
    btn.addEventListener('click', function () {
      var text = Array.prototype.map.call(block.querySelectorAll('.line'), function (l) {
        return l.textContent.replace(/​/g, '');
      }).join('\n');
      function done(ok) {
        label.textContent = ok ? 'Copied' : 'Press Ctrl+C';
        setTimeout(function () { label.textContent = 'Copy'; }, 1800);
      }
      function fallback() {
        var range = document.createRange();
        range.selectNodeContents(block.querySelector('code'));
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) {}
        done(ok);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
      } else {
        fallback();
      }
    });
  });

  var start = indexOf(location.hash.slice(1));
  if (start < 0) {
    var saved = null;
    try { saved = localStorage.getItem(storeKey); } catch (e) {}
    start = Math.max(0, indexOf(saved));
  }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  show(start);
  window.addEventListener('load', function () { window.scrollTo(0, 0); });
})();
