/* ============================================================
   Flashcard Body Parts — logika kartu (vanilla JS, tanpa build)
   ============================================================ */
(function () {
  'use strict';

  const STORAGE_KEY = 'mbj.flash-body-parts.v1';
  const PARTS = Array.isArray(window.PARTS) ? window.PARTS : [];

  const $ = (id) => document.getElementById(id);
  const els = {
    setup: $('screen-setup'),
    game: $('screen-game'),
    results: $('screen-results'),
    segPairs: $('seg-pairs'),
    segFront: $('seg-front'),
    frontHint: $('front-hint'),
    ckSound: $('ck-sound'),
    btnFullSetup: $('btn-full-setup'),
    btnStart: $('btn-start'),
    progressText: $('progress-text'),
    progFill: $('prog-fill'),
    knownCount: $('known-count'),
    deckTip: $('deck-tip'),
    card: $('card'),
    frontTag: $('front-tag'),
    backTag: $('back-tag'),
    frontMedia: $('front-media'),
    backMedia: $('back-media'),
    btnPrev: $('btn-prev'),
    btnFlip: $('btn-flip'),
    btnNext: $('btn-next'),
    btnAgain: $('btn-again'),
    btnKnown: $('btn-known'),
    btnQuit: $('btn-quit'),
    btnFinish: $('btn-finish'),
    btnSound2: $('btn-sound2'),
    btnFull2: $('btn-full2'),
    flash: $('flash'),
    resEmoji: $('res-emoji'),
    resTitle: $('res-title'),
    resSub: $('res-sub'),
    resCards: $('res-cards'),
    resMeta: $('res-meta'),
    btnRetry: $('btn-retry'),
    btnAgainPlay: $('btn-again-play'),
    btnSetup: $('btn-setup')
  };

  const state = { deck: null };
  let settings = loadSettings();

  /* ---------------------------- sound ---------------------------- */

  const sound = (function () {
    let ctx = null;
    let enabled = true;

    function context() {
      if (!enabled) return null;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!ctx) ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }

    function tone(freq, delay, dur, type, level) {
      const c = context();
      if (!c) return;
      const t0 = c.currentTime + delay;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(level || 0.14, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    return {
      flip: function () { tone(520, 0, 0.09, 'sine', 0.07); },
      good: function () { tone(659, 0, 0.12, 'sine', 0.12); tone(880, 0.08, 0.18, 'sine', 0.1); },
      bad: function () { tone(300, 0, 0.12, 'triangle', 0.07); tone(240, 0.09, 0.14, 'triangle', 0.06); },
      win: function () { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.32, 'sine', 0.12)); },
      tick: function () { tone(880, 0, 0.06, 'sine', 0.05); },
      setEnabled: function (v) { enabled = !!v; if (enabled) context(); },
      isEnabled: function () { return enabled; }
    };
  })();

  /* ---------------------------- helpers ---------------------------- */

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function loadSettings() {
    const base = { pairs: 10, front: 'gambar', sound: true };
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      const s = JSON.parse(raw);
      if ([6, 8, 10, 12, 16].indexOf(s.pairs) >= 0) base.pairs = s.pairs;
      if (s.front === 'gambar' || s.front === 'kata') base.front = s.front;
      if (typeof s.sound === 'boolean') base.sound = s.sound;
    } catch (e) { /* localStorage bisa diblokir */ }
    return base;
  }

  function saveSettings() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  /* ---------------------------- setup UI ---------------------------- */

  function setSeg(container, value) {
    const v = String(value);
    Array.prototype.forEach.call(container.querySelectorAll('button[data-v]'), (btn) => {
      btn.classList.toggle('on', btn.dataset.v === v);
    });
  }

  function renderFrontHint() {
    els.frontHint.textContent = settings.front === 'gambar'
      ? 'Depan: gambar. Balik kartu untuk melihat kata bahasa Inggrisnya.'
      : 'Depan: kata bahasa Inggris. Balik kartu untuk melihat gambarnya.';
  }

  function syncSoundUI() {
    sound.setEnabled(settings.sound);
    if (els.ckSound) els.ckSound.checked = settings.sound;
    if (els.btnSound2) els.btnSound2.textContent = settings.sound ? '🔊 Suara: ON' : '🔇 Suara: OFF';
  }

  function updateFullUI() {
    const full = !!document.fullscreenElement;
    if (els.btnFullSetup) els.btnFullSetup.textContent = full ? '⛶  Keluar layar penuh' : '⛶  Layar penuh';
    if (els.btnFull2) els.btnFull2.textContent = full ? '⛶ Keluar penuh' : '⛶ Layar penuh';
  }

  function renderSetup() {
    setSeg(els.segPairs, settings.pairs);
    setSeg(els.segFront, settings.front);
    renderFrontHint();
    syncSoundUI();
    updateFullUI();
  }

  els.segPairs.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-v]');
    if (!btn) return;
    settings.pairs = Number(btn.dataset.v);
    saveSettings();
    renderSetup();
  });

  els.segFront.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-v]');
    if (!btn) return;
    settings.front = btn.dataset.v;
    saveSettings();
    renderSetup();
  });

  els.ckSound.addEventListener('change', () => {
    settings.sound = els.ckSound.checked;
    sound.setEnabled(settings.sound);
    if (settings.sound) sound.tick();
    saveSettings();
    syncSoundUI();
  });

  els.btnSound2.addEventListener('click', () => {
    settings.sound = !settings.sound;
    sound.setEnabled(settings.sound);
    if (settings.sound) sound.tick();
    saveSettings();
    syncSoundUI();
  });

  function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        const p = document.documentElement.requestFullscreen({ navigationUI: 'hide' });
        if (p && p.catch) p.catch(() => {});
      } else {
        const p = document.exitFullscreen();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) {}
  }

  els.btnFullSetup.addEventListener('click', toggleFullscreen);
  els.btnFull2.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullUI);

  /* ---------------------------- screens ---------------------------- */

  function showScreen(name) {
    const screens = { setup: els.setup, game: els.game, results: els.results };
    Object.keys(screens).forEach((key) => {
      const el = screens[key];
      const on = key === name;
      el.hidden = !on;
      el.classList.toggle('is-active', on);
    });
    window.scrollTo(0, 0);
  }

  /* ---------------------------- deck ---------------------------- */

  function faceImage(part) {
    const img = new Image();
    img.src = part.img;
    img.alt = 'Gambar bagian tubuh: ' + part.word;
    img.draggable = false;
    img.decoding = 'async';
    img.className = 'face-img';
    return img;
  }

  function faceWord(part) {
    const wrap = document.createElement('span');
    wrap.className = 'bigword';
    wrap.textContent = part.word;
    return wrap;
  }

  function faceContent(part, kind) {
    return kind === 'gambar' ? faceImage(part) : faceWord(part);
  }

  function currentPart() {
    const deck = state.deck;
    return deck ? deck.cards[deck.index] : null;
  }

  function renderCard(resetFlip) {
    const deck = state.deck;
    if (!deck) return;
    const part = deck.cards[deck.index];

    if (resetFlip) deck.flipped = false;
    els.card.classList.toggle('is-flipped', deck.flipped);

    const frontKind = settings.front;
    const backKind = frontKind === 'gambar' ? 'kata' : 'gambar';

    els.frontTag.textContent = frontKind === 'gambar' ? 'Picture' : 'Word';
    els.backTag.textContent = backKind === 'gambar' ? 'Picture' : 'Word';

    els.frontMedia.textContent = '';
    els.backMedia.textContent = '';
    els.frontMedia.append(faceContent(part, frontKind));
    els.backMedia.append(faceContent(part, backKind));

    els.card.setAttribute('aria-label', 'Kartu ' + (deck.index + 1) + ' dari ' + deck.cards.length +
      (deck.flipped ? ', sudah dibalik' : ', ketuk untuk membalik'));

    const status = deck.marks.get(part.id);
    els.btnKnown.classList.toggle('is-on', status === 'known');
    els.btnAgain.classList.toggle('is-on', status === 'again');

    els.btnPrev.disabled = deck.index === 0;
    els.btnNext.disabled = deck.index === deck.cards.length - 1;

    els.progressText.textContent = (deck.index + 1) + ' / ' + deck.cards.length + ' kartu';
    els.progFill.style.width = ((deck.index + 1) / deck.cards.length) * 100 + '%';

    let known = 0;
    deck.marks.forEach((v) => { if (v === 'known') known += 1; });
    els.knownCount.textContent = String(known);

    updateTip();
  }

  function updateTip() {
    const deck = state.deck;
    if (!deck) return;
    const part = deck.cards[deck.index];
    const status = deck.marks.get(part.id);
    if (deck.flipped) {
      els.deckTip.textContent = 'Jawabannya: ' + part.word + ' — sudah diingat?';
    } else if (settings.front === 'kata') {
      els.deckTip.textContent = 'Tebak gambarnya, lalu balik kartu';
    } else {
      els.deckTip.textContent = 'Sebutkan bagian tubuh ini, lalu balik kartu';
    }
    if (status === 'known' && deck.flipped) els.deckTip.textContent += ' (ditandai hafal)';
    if (status === 'again' && deck.flipped) els.deckTip.textContent += ' (ditandai ulangi)';
  }

  function flipCard() {
    const deck = state.deck;
    if (!deck) return;
    deck.flipped = !deck.flipped;
    els.card.classList.toggle('is-flipped', deck.flipped);
    els.card.setAttribute('aria-label', 'Kartu ' + (deck.index + 1) + ' dari ' + deck.cards.length +
      (deck.flipped ? ', sudah dibalik' : ', ketuk untuk membalik'));
    sound.flip();
    updateTip();
  }

  function goTo(index) {
    const deck = state.deck;
    if (!deck) return;
    if (index < 0 || index >= deck.cards.length) return;
    deck.index = index;
    renderCard(true);
  }

  function mark(kind) {
    const deck = state.deck;
    if (!deck) return;
    const part = deck.cards[deck.index];
    deck.marks.set(part.id, kind);

    if (kind === 'known') {
      sound.good();
      flash('Hafal!', 'Lanjut ke kartu berikutnya', 'good');
    } else {
      sound.bad();
      flash('Ulangi', 'Kartu ini masuk daftar ulangan', 'bad');
    }

    const isLast = deck.index === deck.cards.length - 1;
    els.btnKnown.classList.toggle('is-on', kind === 'known');
    els.btnAgain.classList.toggle('is-on', kind === 'again');
    els.knownCount.textContent = String(countKnown(deck));
    updateTip();

    setTimeout(() => {
      if (state.deck !== deck) return;
      if (isLast) finishDeck();
      else goTo(deck.index + 1);
    }, 380);
  }

  function countKnown(deck) {
    let known = 0;
    deck.marks.forEach((v) => { if (v === 'known') known += 1; });
    return known;
  }

  /* ---------------------------- start / finish ---------------------------- */

  function preload(cards) {
    const unique = {};
    cards.forEach((c) => { unique[c.img] = true; });
    return Promise.all(Object.keys(unique).map((src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = src;
    })));
  }

  async function startDeck(pool) {
    if (!PARTS.length) {
      window.alert('Daftar bagian tubuh tidak termuat. Pastikan js/data.js ada.');
      return;
    }
    if (els.btnStart.disabled) return;
    els.btnStart.disabled = true;
    const label = els.btnStart.textContent;
    els.btnStart.textContent = 'Menyiapkan gambar…';

    let cards;
    if (pool && pool.length) {
      cards = shuffle(pool);
    } else {
      const count = Math.min(settings.pairs, PARTS.length);
      cards = shuffle(PARTS).slice(0, count);
    }

    await preload(cards);

    els.btnStart.disabled = false;
    els.btnStart.textContent = label;

    state.deck = {
      cards: cards,
      index: 0,
      flipped: false,
      marks: new Map(),
      startedAt: Date.now()
    };

    renderCard(true);
    showScreen('game');
    sound.tick();
  }

  els.btnStart.addEventListener('click', () => startDeck(null));

  function finishDeck() {
    const deck = state.deck;
    if (!deck) return;
    renderResults(deck);
    showScreen('results');
    sound.win();
  }

  function renderResults(deck) {
    const total = deck.cards.length;
    let known = 0;
    deck.cards.forEach((c) => { if (deck.marks.get(c.id) === 'known') known += 1; });
    const again = total - known;

    if (again === 0) {
      els.resEmoji.textContent = '🏆';
      els.resTitle.textContent = 'Semua hafal!';
    } else if (known === 0) {
      els.resEmoji.textContent = '📚';
      els.resTitle.textContent = 'Ayo ulangi lagi';
    } else {
      els.resEmoji.textContent = '🌟';
      els.resTitle.textContent = 'Bagus sekali!';
    }

    els.resSub.textContent = known + ' dari ' + total + ' kartu sudah hafal · ' +
      again + ' kartu perlu diulang';

    els.resCards.textContent = '';
    deck.cards.forEach((part) => {
      const status = deck.marks.get(part.id);
      const item = document.createElement('div');
      item.className = 'res-card ' + (status === 'known' ? 'known' : status === 'again' ? 'again' : 'blank');

      const thumb = document.createElement('div');
      thumb.className = 'res-thumb';
      const img = new Image();
      img.src = part.img;
      img.alt = '';
      img.decoding = 'async';
      thumb.append(img);

      const name = document.createElement('b');
      name.textContent = part.word;

      const badge = document.createElement('span');
      badge.className = 'res-badge';
      badge.textContent = status === 'known' ? '✓ hafal' : status === 'again' ? '↺ ulangi' : '– belum ditandai';

      item.append(thumb, name, badge);
      els.resCards.append(item);
    });

    els.btnRetry.disabled = again === 0;
    els.btnRetry.textContent = again === 0 ? 'Semua Sudah Hafal' : 'Ulangi ' + again + ' Kartu';

    const mins = Math.max(1, Math.round((Date.now() - deck.startedAt) / 60000));
    els.resMeta.textContent = total + ' kartu · ' + known + ' hafal · ' + again + ' perlu diulang · sekitar ' + mins + ' menit';
  }

  els.btnFlip.addEventListener('click', flipCard);
  els.card.addEventListener('click', flipCard);

  els.btnPrev.addEventListener('click', () => {
    const deck = state.deck;
    if (deck) goTo(deck.index - 1);
  });

  els.btnNext.addEventListener('click', () => {
    const deck = state.deck;
    if (deck) goTo(deck.index + 1);
  });

  els.btnKnown.addEventListener('click', () => mark('known'));
  els.btnAgain.addEventListener('click', () => mark('again'));
  els.btnFinish.addEventListener('click', finishDeck);

  els.btnRetry.addEventListener('click', () => {
    const deck = state.deck;
    if (!deck) return;
    const again = deck.cards.filter((c) => deck.marks.get(c.id) !== 'known');
    if (!again.length) return;
    startDeck(again);
  });

  els.btnAgainPlay.addEventListener('click', () => startDeck(null));

  els.btnSetup.addEventListener('click', () => {
    state.deck = null;
    showScreen('setup');
    renderSetup();
  });

  els.btnQuit.addEventListener('click', () => {
    if (!state.deck) return;
    const ok = window.confirm('Keluar ke menu utama? Tanda hafal ronde ini akan hilang.');
    if (!ok) return;
    state.deck = null;
    showScreen('setup');
    renderSetup();
  });

  /* ---------------------------- flash feedback ---------------------------- */

  let flashTimer = null;
  function flash(main, sub, tone) {
    els.flash.textContent = '';
    els.flash.append(document.createTextNode(main));
    if (sub) {
      const small = document.createElement('small');
      small.textContent = sub;
      els.flash.append(small);
    }
    els.flash.className = 'flash show' + (tone ? ' ' + tone : '');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      els.flash.classList.remove('show');
    }, 800);
  }

  /* ---------------------------- keyboard ---------------------------- */

  document.addEventListener('keydown', (e) => {
    if (els.game.hidden || !state.deck) return;
    const onControl = e.target && e.target.closest && e.target.closest('button, input');
    if (e.key === ' ' || e.key === 'Enter') {
      if (onControl) return;
      e.preventDefault();
      flipCard();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(state.deck.index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(state.deck.index + 1);
    }
  });

  /* ---------------------------- init ---------------------------- */

  if (document.fullscreenElement === undefined) {
    els.btnFullSetup.hidden = true;
    els.btnFull2.hidden = true;
  }

  renderSetup();
  showScreen('setup');
  sound.setEnabled(settings.sound);
})();
