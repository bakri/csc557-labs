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

  // Syntax colouring for Java and XML code blocks. Works line by line so the
  // yellow "new line" highlight and the Copy button are unaffected.
  var JAVA_KW = /^(abstract|boolean|break|byte|case|catch|char|class|continue|default|do|double|else|enum|extends|final|finally|float|for|if|implements|import|instanceof|int|interface|long|new|null|package|private|protected|public|return|short|static|super|switch|this|throw|throws|true|false|try|void|while)$/;
  var JAVA_RE = /(\/\/.*$)|(\/\*.*?(?:\*\/|$))|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(@[A-Za-z_]\w*)|(\b\d+(?:\.\d+)?[fFlLdD]?\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)/g;
  var XML_RE = /(<!--.*?(?:-->|$))|(<\/?[\w.:-]+)|([\w.:-]+)(?==)|("[^"]*"?)|(\/?>)/g;

  function langOf(block) {
    var file = (block.querySelector('.code-file') || {}).textContent || '';
    if (/\.xml\b/i.test(file)) return 'xml';
    if (/\.java\b/i.test(file)) return 'java';
    if (/logcat/i.test(file)) return null;
    var first = (block.querySelector('.line') || {}).textContent || '';
    return /^\s*</.test(first) ? 'xml' : 'java';
  }

  function paint(line, text, re, classify) {
    var frag = document.createDocumentFragment(), last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      if (m[0] === '') { re.lastIndex++; continue; }
      var cls = classify(m);
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      if (cls) {
        var span = document.createElement('span');
        span.className = 'tok-' + cls;
        span.textContent = m[0];
        frag.appendChild(span);
      } else {
        frag.appendChild(document.createTextNode(m[0]));
      }
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    line.appendChild(frag);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.code'), function (block) {
    var lang = langOf(block);
    if (!lang) return;
    var inComment = false;
    Array.prototype.forEach.call(block.querySelectorAll('.line'), function (line) {
      var text = line.textContent;
      if (text === '​' || line.classList.contains('cm')) return;
      if (lang === 'java') {
        line.textContent = '';
        // a line inside a /* ... */ comment that started on an earlier line
        if (inComment) {
          var end = text.indexOf('*/');
          var head = end < 0 ? text : text.slice(0, end + 2);
          paint(line, head, /^[\s\S]+$/g, function () { return 'comment'; });
          if (end < 0) return;
          text = text.slice(end + 2);
          inComment = false;
        }
        var bare = text.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/\/\/.*$/, '');
        var open = bare.lastIndexOf('/*');
        if (open >= 0 && bare.indexOf('*/', open) < 0) inComment = true;
        paint(line, text, JAVA_RE, function (m) {
          if (m[1] || m[2]) return 'comment';
          if (m[3]) return 'string';
          if (m[4]) return 'annotation';
          if (m[5]) return 'number';
          if (m[6]) return JAVA_KW.test(m[6]) ? 'keyword' : 'method';
          if (m[7]) return JAVA_KW.test(m[7]) ? 'keyword' : (/^[A-Z]/.test(m[7]) ? 'type' : null);
          return null;
        });
      } else {
        line.textContent = '';
        paint(line, text, XML_RE, function (m) {
          if (m[1]) return 'comment';
          if (m[2] || m[5]) return 'tag';
          if (m[3]) return 'attr';
          if (m[4]) return 'string';
          return null;
        });
      }
    });
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
