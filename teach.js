// 示範病例、考題、心智圖的畫面。內容在 teach-content.js，數字一律由 HN 引擎即時計算。
(() => {
  const { SOURCES, CASES, QUIZ, MAP } = window.HNTeach;
  const $ = s => document.querySelector(s);
  const VIEWS = ['tool', 'cases', 'quiz', 'map'];
  const LETTERS = ['A', 'B', 'C', 'D'];
  const fin = Number.isFinite;
  const list = items => `<ul>${items.map(x => `<li>${x}</li>`).join('')}</ul>`;
  const srcLinks = keys => keys.map(k => `<a href="${SOURCES[k].url}" target="_blank" rel="noopener">${SOURCES[k].label}</a>`).join('、');

  function caseRows(s) {
    const sev = HN.severity(s), lim = HN.rateLimits(s), cna = HN.correctedNa(s), eff = HN.effectiveOsm(s), fr = HN.furst(s), fu = HN.followUp(s);
    const rows = [
      ['血鈉分級', HN.classify(s)],
      ['症狀分級', sev.label + (sev.upgraded ? '（由勾選症狀升級）' : '')],
      ['校正鈉', fin(cna) ? `${cna} mEq/L` : '—'],
      ['張力', HN.tonicity(s).text],
      ['病因方向', HN.etiology(s).text],
      ['速率', `${lim.goal}；${lim.limit}${lim.high ? '（ODS 高風險）' : ''}`]
    ];
    if (fin(eff)) rows.splice(3, 0, ['有效 Osm', `${eff} mOsm/kg`]);
    if (fin(fr)) rows.push(['Furst ratio', String(fr)]);
    if (fin(HN.tbw(s))) rows.push(['Adrogué–Madias', `TBW ${HN.tbw(s)} L；每 1 L 3% NaCl +${HN.adrogue(s, 513)}，每 1 L 0.9% NaCl +${HN.adrogue(s, 154)}`]);
    if (fu) rows.push(['治療後追蹤', fu.text]);
    return rows;
  }

  function renderCases() {
    $('#caseList').innerHTML = CASES.map((c, i) => `
      <article class="case-card" id="case-${c.id}">
        <header><span class="case-number">${i + 1}</span><div><span class="case-tag">${c.tag}</span><h3>${c.title}</h3></div></header>
        <p>${c.stem}</p>
        <ul class="case-facts">${c.facts.map(f => `<li>${f}</li>`).join('')}</ul>
        <p class="case-question"><strong>想一想：</strong>${c.question}</p>
        <details class="case-answer"><summary>看判讀與處置思路</summary>
          <h4>工具計算結果</h4>
          <div class="table-scroll"><table class="case-table"><tbody>${caseRows(c.base).map(r => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</tbody></table></div>
          <h4>判讀</h4>${list(c.read)}
          <h4>處置思路</h4>${list(c.plan)}
          <p class="case-pitfall"><strong>常見陷阱：</strong>${c.pitfall}</p>
          <p class="source-line">依據：${srcLinks(c.src)}</p>
          <button type="button" class="link-button" data-load-case="${c.id}">載入到決策流程</button>
        </details>
      </article>`).join('');
  }

  const quiz = { filter: '全部', answers: new Map() };

  function renderQuiz() {
    const shown = QUIZ.map((q, index) => ({ q, index })).filter(({ q }) => quiz.filter === '全部' || q.level === quiz.filter);
    const answered = shown.filter(({ index }) => quiz.answers.has(index));
    const right = answered.filter(({ q, index }) => quiz.answers.get(index) === q.answer).length;
    $('#quizScore').textContent = `已答 ${answered.length}／${shown.length}，答對 ${right}`;
    document.querySelectorAll('#quizFilter button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === quiz.filter)));
    $('#quizList').innerHTML = shown.map(({ q, index }) => {
      const chosen = quiz.answers.get(index), done = chosen !== undefined;
      const opts = q.options.map((o, i) => {
        const st = !done ? '' : i === q.answer ? ' is-correct' : i === chosen ? ' is-wrong' : '';
        return `<button type="button" class="quiz-option${st}" data-question="${index}" data-option="${i}"${done ? ' disabled' : ''}><span>${LETTERS[i]}</span>${o}</button>`;
      }).join('');
      const fb = done ? `<div class="quiz-feedback ${chosen === q.answer ? 'right' : 'wrong'}" role="status"><strong>${chosen === q.answer ? '答對' : `答錯，正解 ${LETTERS[q.answer]}`}</strong>：${q.why}<span class="source-line">依據：${srcLinks(q.src)}</span></div>` : '';
      return `<article class="quiz-card"><p class="quiz-stem"><span class="quiz-level${q.level === '高階' ? ' advanced' : ''}">${q.level}</span><strong>${index + 1}.</strong> ${q.stem}</p><div class="quiz-options">${opts}</div>${fb}</article>`;
    }).join('');
  }

  function renderMap() {
    const half = Math.ceil(MAP.branches.length / 2);
    const branch = (b, i) => `<details class="mm-branch" data-branch="${i}" open style="--branch:${b.color}"><summary class="mm-node">${b.title}</summary><ul>${b.leaves.map(l => `<li class="mm-leaf">${l}</li>`).join('')}</ul></details>`;
    $('#mapBody').innerHTML = `<svg class="mm-lines" aria-hidden="true"></svg>
      <div class="mm-side mm-left">${MAP.branches.slice(0, half).map((b, i) => branch(b, i)).join('')}</div>
      <div class="mm-center"><strong>${MAP.center[0]}</strong><span>${MAP.center[1]}</span></div>
      <div class="mm-side mm-right">${MAP.branches.slice(half).map((b, i) => branch(b, i + half)).join('')}</div>`;
    $('#mapBody').querySelectorAll('details').forEach(d => d.addEventListener('toggle', drawMap));
  }

  function drawMap() {
    const box = $('#mapBody'), svg = box.querySelector('.mm-lines');
    if (!svg || box.offsetParent === null || getComputedStyle(svg).display === 'none') return;
    const o = box.getBoundingClientRect();
    svg.setAttribute('width', o.width);
    svg.setAttribute('height', o.height);
    const rect = el => { const r = el.getBoundingClientRect(); return { left: r.left - o.left, right: r.right - o.left, y: r.top - o.top + r.height / 2 }; };
    const curve = (x1, y1, x2, y2, c, w) => { const m = (x1 + x2) / 2; return `<path d="M${x1} ${y1}C${m} ${y1} ${m} ${y2} ${x2} ${y2}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`; };
    const ctr = rect(box.querySelector('.mm-center'));
    let paths = '';
    box.querySelectorAll('.mm-branch').forEach(n => {
      const c = MAP.branches[Number(n.dataset.branch)].color, t = rect(n.querySelector('.mm-node')), left = n.parentElement.classList.contains('mm-left');
      paths += left ? curve(ctr.left, ctr.y, t.right, t.y, c, 2.5) : curve(ctr.right, ctr.y, t.left, t.y, c, 2.5);
      if (!n.open) return;
      n.querySelectorAll('.mm-leaf').forEach(l => {
        const r = rect(l);
        paths += left ? curve(t.left, t.y, r.right, r.y, c, 1.25) : curve(t.right, t.y, r.left, r.y, c, 1.25);
      });
    });
    svg.innerHTML = paths;
  }

  function showView(view, updateHash = true) {
    VIEWS.forEach(v => {
      $(`#view-${v}`).hidden = v !== view;
      const t = $(`#tab-${v}`);
      t.classList.toggle('active', v === view);
      t.setAttribute('aria-current', v === view ? 'page' : 'false');
    });
    if (updateHash) history.replaceState(null, '', view === 'tool' ? location.pathname + location.search : `#${view}`);
    window.scrollTo(0, 0);
    if (view === 'map') drawMap();
  }

  function banner() {
    const title = window.HNWizard.demo();
    $('#demoBanner').hidden = !title;
    $('#demoBannerText').textContent = title ? `已載入示範病例：${title}。這是虛構資料，請勿當成真實病人。` : '';
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.view) showView(b.dataset.view);
    if (b.dataset.loadCase) {
      const c = CASES.find(x => x.id === b.dataset.loadCase);
      if (window.HNWizard.load(c.base, c.title)) { banner(); showView('tool'); }
    }
    if (b.dataset.question) { quiz.answers.set(Number(b.dataset.question), Number(b.dataset.option)); renderQuiz(); }
    if (b.dataset.filter) { quiz.filter = b.dataset.filter; renderQuiz(); }
    if (b.dataset.mapAll) {
      $('#mapBody').querySelectorAll('details').forEach(d => { d.open = b.dataset.mapAll === 'open'; });
      drawMap();
    }
  });
  $('#demoClear').addEventListener('click', () => window.HNWizard.clear());
  document.addEventListener('hn-demo-change', banner);
  $('#quizReset').addEventListener('click', () => { quiz.answers.clear(); renderQuiz(); });
  window.addEventListener('resize', drawMap);
  window.addEventListener('hashchange', () => {
    const v = location.hash.slice(1);
    showView(VIEWS.includes(v) ? v : 'tool', false);
  });

  renderCases();
  renderQuiz();
  renderMap();
  $('#sourceList').innerHTML = Object.values(SOURCES).map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.cite}</a></li>`).join('');
  banner();
  const first = location.hash.slice(1);
  showView(VIEWS.includes(first) ? first : 'tool', false);
})();
