/* =========================================================
   Viacheslav MSTPD — interactions
   No dependencies. Everything degrades gracefully.
   ========================================================= */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* i18n.js provides window.T; if it ever fails to load, fall back to
     the English strings passed inline so nothing breaks */
  const T = window.T || ((key, fallback, vars) => {
    let s = fallback;
    if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  });

  /* ── entrance ─────────────────────────────────────────── */
  requestAnimationFrame(() => document.documentElement.classList.add('is-loaded'));
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── nav: stuck state + active section ────────────────── */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 24);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  const links = $$('.nav__links a');
  const sections = links
    .map(a => $(a.getAttribute('href')))
    .filter(Boolean);

  if (sections.length) {
    const navObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => navObs.observe(s));
  }

  /* ── mobile menu ──────────────────────────────────────── */
  const burger = $('#burger');
  const menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => { menu.hidden = true; }, 400);
    }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  // lang buttons excluded: switching language shouldn't dismiss the menu
  $$('#menu a, #menu button:not(.lang__btn)').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ── scroll reveal ────────────────────────────────────── */
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((e, i) => {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = `${Math.min(i * 70, 280)}ms`;
      e.target.classList.add('is-in');
      obs.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  $$('.reveal').forEach(el => revealObs.observe(el));

  /* ── stat counters (About section) ─────────────────────── */
  const counters = $$('[data-count]');
  if (counters.length) {
    const easeOutCubic = t => 1 - (1 - t) ** 3;
    const countUp = el => {
      const target = parseInt(el.dataset.count, 10);
      if (reduced) return;
      const dur = 1400;
      const start = performance.now();
      const tick = now => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(target * easeOutCubic(p));
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    };
    const countObs = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        countUp(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => countObs.observe(el));
  }

  /* ── featured cards: hover badges on the meta line ─────────
     One small icon per fact, each opening a tooltip. Built from data
     attributes rather than written into the markup, so the numbers get
     grouped and the wording translated for whichever language is showing,
     and a card with no figures carries no badges at all. */
  const badgeCards = $$('.feature[data-chart], .feature[data-plays]');
  if (badgeCards.length) {
    /* The seal is the one already used for "Verified credits" in the
       socials list, so the mark means the same thing in both places. */
    const ICONS = {
      chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M12 2.6 14 4.6 16.7 3.8 17.7 6.4 20.3 7.4 19.6 10 21.4 12 19.6 14 20.3 16.6 17.7 17.6 16.7 20.2 14 19.4 12 21.4 10 19.4 7.3 20.2 6.3 17.6 3.7 16.6 4.4 14Z"/><path d="M8.4 12.3 10.6 14.5 15.4 9.5"/></svg>',
      plays: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M12 11v5.6"/><path d="M12 7.7v.1"/></svg>',
    };

    /* A <button>, not a decorated span: that makes the tooltip reachable
       by keyboard and openable by tap, since a touch device has no hover
       to give. */
    const badge = (meta, kind, id, text) => {
      let el = $(`.feature__badge--${kind}`, meta);
      if (!el) {
        el = document.createElement('button');
        el.className = `feature__badge feature__badge--${kind}`;
        el.type = 'button';
        el.innerHTML = ICONS[kind];                  // static markup, no data in it
        const tip = document.createElement('span');
        tip.className = 'feature__tip';
        tip.id = id;
        tip.setAttribute('role', 'tooltip');
        el.appendChild(tip);
        el.setAttribute('aria-describedby', id);
        meta.prepend(el);                            // first, so tooltips open inward
      }
      // textContent, not innerHTML: chart names and counts are data
      $('.feature__tip', el).textContent = text;
      el.setAttribute('aria-label', text);
    };

    const render = () => {
      badgeCards.forEach((card, i) => {
        const meta = $('.feature__meta', card);
        if (!meta) return;

        // prepended, so plays is built first to leave the seal leading
        const n = parseInt(card.dataset.plays, 10);
        if (Number.isFinite(n)) {
          const lang = document.documentElement.lang || 'en';
          badge(meta, 'plays', `playsTip${i}`, T('js.plays', '{n} plays', { n: n.toLocaleString(lang) }));
        }

        const chart = (card.dataset.chart || '').trim();
        if (chart) {
          const pos = parseInt(card.dataset.chartPos, 10);
          badge(meta, 'chart', `chartTip${i}`, Number.isFinite(pos)
            ? T('js.chart_pos', '#{pos} in {chart}', { pos, chart })
            : chart);
        }
      });
    };
    render();
    document.addEventListener('langchange', render);
  }

  /* ── work rows: thumbnail that follows the cursor ─────── */
  const preview = $('#preview');
  const rows = $$('#rows .row');

  if (preview && rows.length && matchMedia('(hover: hover)').matches) {
    const img = $('img', preview);
    let x = 0, y = 0, tx = 0, ty = 0, raf = null;

    const loop = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      preview.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%) scale(${preview.classList.contains('is-visible') ? 1 : 0.92})`;
      raf = requestAnimationFrame(loop);
    };

    rows.forEach(row => {
      row.addEventListener('mouseenter', () => {
        const src = row.dataset.img;
        if (src && img.getAttribute('src') !== src) img.src = src;
        preview.classList.add('is-visible');
        if (!raf) { x = tx; y = ty; loop(); }
      });
      row.addEventListener('mouseleave', () => preview.classList.remove('is-visible'));
    });

    addEventListener('mousemove', e => { tx = e.clientX + 120; ty = e.clientY; }, { passive: true });
    $('#rows').addEventListener('mouseleave', () => {
      preview.classList.remove('is-visible');
      cancelAnimationFrame(raf); raf = null;
    });
  }

  /* ── audio ────────────────────────────────────────────── */
  const BUCKETS = 120;
  const peakCache = new Map();
  let current = null;                    // the Player that owns playback

  const fmt = t => {
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // deterministic fallback shape, used when the file can't be decoded
  const seedPeaks = (key, n) => {
    let h = 2166136261;
    for (const ch of String(key)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    const rnd = () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const out = [];
    for (let i = 0; i < n; i++) {
      const p = i / n;
      const body = 0.35 + 0.45 * Math.sin(p * Math.PI);              // arrangement arc
      const beat = 0.75 + 0.25 * Math.sin(p * n * 0.55);             // pulse
      out.push(Math.min(1, Math.max(0.06, body * beat * (0.7 + rnd() * 0.6))));
    }
    return out;
  };

  // real peaks when the audio can be fetched + decoded (needs http://, not file://)
  const getPeaks = async (src) => {
    if (peakCache.has(src)) return peakCache.get(src);
    const job = (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error('fetch');
        const AC = window.AudioContext || window.webkitAudioContext;
        const ctx = new AC();
        const audio = await ctx.decodeAudioData(await res.arrayBuffer());
        const data = audio.getChannelData(0);
        const size = Math.floor(data.length / BUCKETS) || 1;
        const out = [];
        for (let i = 0; i < BUCKETS; i++) {
          let max = 0;
          for (let j = 0; j < size; j += 6) {
            const v = Math.abs(data[i * size + j] || 0);
            if (v > max) max = v;
          }
          out.push(max);
        }
        const duration = audio.duration;
        ctx.close();
        const top = Math.max(...out) || 1;
        return { peaks: out.map(v => Math.max(0.05, v / top)), duration };
      } catch {
        return { peaks: seedPeaks(src, BUCKETS), duration: 0 };
      }
    })();
    peakCache.set(src, job);
    return job;
  };

  const css = getComputedStyle(document.documentElement);
  const C_IDLE   = css.getPropertyValue('--faint').trim() || '#575450';
  const C_PLAYED = css.getPropertyValue('--accent').trim() || '#D9583C';
  const C_HEAD   = css.getPropertyValue('--fg').trim() || '#F2F0EC';

  class Player {
    constructor(el) {
      this.el = el;
      // the track can be declared on the player itself or on its card
      this.src = el.dataset.src || el.closest('[data-src]')?.dataset.src || '';
      this.btn = $('.player__btn', el) || $('.row__btn', el);
      this.canvas = $('[data-wave]', el);
      this.timeEl = $('[data-time]', el);
      this.bar = $('[data-bar]', el);
      this.audio = null;
      this.peaks = null;
      this.progress = 0;
      this.raf = null;

      this.btn.addEventListener('click', e => { e.stopPropagation(); this.toggle(); });

      if (this.canvas) {
        getPeaks(this.src).then(({ peaks, duration }) => {
          this.peaks = peaks;
          if (duration && this.timeEl && !this.audio) this.timeEl.textContent = fmt(duration);
          this.draw();
        });
        this.ro = new ResizeObserver(() => this.draw());
        this.ro.observe(this.canvas);
        this.canvas.addEventListener('click', e => this.seek(e));
      }
    }

    ensure() {
      if (this.audio) return this.audio;
      const a = new Audio();
      a.src = this.src;
      a.preload = 'metadata';
      a.addEventListener('timeupdate', () => this.tick());
      a.addEventListener('loadedmetadata', () => this.tick());
      a.addEventListener('ended', () => {
        this.progress = 0;
        this.stop();
        this.tick();
        NowPlaying.advance(1, true);          // roll on like a real queue
      });
      a.addEventListener('error', () => {
        if (this.timeEl) this.timeEl.textContent = '—:—';
        this.stop();
      });
      this.audio = a;
      return a;
    }

    // artist / title / artwork, wherever this player happens to live
    meta() {
      const row = this.el.closest('.row');
      if (row) return {
        title: $('.row__track', row)?.textContent.trim() || '',
        artist: $('.row__artist', row)?.textContent.trim() || '',
        art: row.dataset.img || '',
        url: $('.row__out', row)?.href || ''
      };
      const card = this.el.closest('.feature');
      return {
        title: $('.feature__title', card)?.textContent.trim() || '',
        artist: $('.feature__meta span', card)?.textContent.trim() || '',
        art: $('.feature__media img', card)?.src || '',
        url: $('.feature__out', card)?.href || ''
      };
    }

    toggle() {
      if (current && current !== this) current.stop();
      const a = this.ensure();
      if (a.paused) {
        a.play().then(() => {
          current = this;
          this.el.classList.add('is-playing');
          const card = this.el.closest('.feature');
          if (card) card.classList.add('is-playing');
          NowPlaying.attach(this);
          // a featured card is a "listen to this now" moment — open the full
          // player on every screen; rows just surface the mini bar
          if (card) NowPlaying.open();
          this.frame();
        }).catch(() => { if (this.timeEl) this.timeEl.textContent = '—:—'; });
      } else {
        this.stop();
      }
    }

    stop() {
      if (this.audio) this.audio.pause();
      this.el.classList.remove('is-playing');
      const card = this.el.closest('.feature');
      if (card) card.classList.remove('is-playing');
      cancelAnimationFrame(this.raf); this.raf = null;
      if (current === this) current = null;
      NowPlaying.setPlaying(false);
      this.draw();
    }

    frame() {
      this.tick();
      this.raf = requestAnimationFrame(() => this.frame());
    }

    tick() {
      const a = this.audio;
      if (a && a.duration) this.progress = a.currentTime / a.duration;
      if (this.timeEl && a) {
        const left = a.duration ? (a.paused && !a.currentTime ? a.duration : a.duration - a.currentTime) : 0;
        this.timeEl.textContent = a.duration ? fmt(left) : '0:00';
      }
      if (this.bar) this.bar.style.width = `${this.progress * 100}%`;
      if (current === this) NowPlaying.progress(a, this.progress);
      this.draw();
    }

    seek(e) {
      const a = this.ensure();
      const r = this.canvas.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      if (a.duration) { a.currentTime = p * a.duration; }
      this.progress = p;
      this.tick();
    }

    draw() {
      if (!this.canvas || !this.peaks) return;
      const c = this.canvas;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = c.clientWidth, h = c.clientHeight;
      if (!w || !h) return;
      if (c.width !== w * dpr || c.height !== h * dpr) {
        c.width = w * dpr; c.height = h * dpr;
      }
      const g = c.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);

      const gap = 2;
      const bw = Math.max(1.5, (w - gap * (BUCKETS - 1)) / BUCKETS);
      const mid = h / 2;
      const playing = this.el.classList.contains('is-playing');

      for (let i = 0; i < BUCKETS; i++) {
        const x = i * (bw + gap);
        const amp = Math.max(0.04, this.peaks[i]) * (h * 0.46);
        const done = i / BUCKETS <= this.progress;
        g.fillStyle = done ? C_PLAYED : C_IDLE;
        g.globalAlpha = done ? 1 : (playing ? 0.55 : 0.4);
        const r = Math.min(bw / 2, 1.5);
        const bh = Math.max(2, amp * 2);
        if (g.roundRect) { g.beginPath(); g.roundRect(x, mid - bh / 2, bw, bh, r); g.fill(); }
        else g.fillRect(x, mid - bh / 2, bw, bh);
      }

      if (playing || this.progress > 0) {
        g.globalAlpha = 1;
        g.fillStyle = C_HEAD;
        g.fillRect(Math.min(w - 1, this.progress * w), 0, 1, h);
      }
      g.globalAlpha = 1;
    }
  }

  const players = $$('[data-player]').map(el => new Player(el));
  // the discography list is the queue; featured cards map onto it by src
  const queue = players.filter(p => p.el.classList.contains('row'));

  // clicking anywhere on a row toggles it too — rows without audio have no button
  rows.forEach(row => {
    const btn = $('.row__btn', row);
    if (!btn) return;
    row.addEventListener('click', e => {
      if (e.target.closest('.row__out')) return;   // let the outbound link through
      btn.click();
    });
  });

  /* ── genre filter + title search (Credits section) ──────── */
  const genreBtns = $$('.genre-filter__btn');
  const genreEmpty = $('#genreEmpty');
  const rowSearch = $('#rowSearch');
  const rowsWrap = $('#rows');
  if (genreBtns.length) {
    let curGenre = 'all';
    let curQuery = '';

    // title + artist per row, built once (rows never change after load)
    const haystack = new Map(rows.map(row => [row,
      ((($('.row__track', row) || {}).textContent || '') + ' ' +
       (($('.row__artist', row) || {}).textContent || '')).toLowerCase()]));

    const applyRowFilters = () => {
      let visible = 0;
      rows.forEach(row => {
        const match = (curGenre === 'all' || row.dataset.genre === curGenre)
                   && (!curQuery || haystack.get(row).includes(curQuery));
        row.classList.toggle('is-filtered', !match);
        if (match) visible++;
      });
      // while searching, collapsed extras join in — otherwise "no results"
      // would lie about tracks that merely sit behind the show-all toggle
      if (rowsWrap) rowsWrap.classList.toggle('is-searching', !!curQuery);
      if (genreEmpty) {
        genreEmpty.hidden = visible > 0;
        genreEmpty.textContent = curQuery
          ? T('cred.search_empty', 'Nothing matches your search.')
          : T('cred.empty', 'Nothing in this genre yet — try another filter.');
      }
    };

    genreBtns.forEach(btn => btn.addEventListener('click', () => {
      curGenre = btn.dataset.genreFilter;
      genreBtns.forEach(b => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      applyRowFilters();
    }));

    if (rowSearch) rowSearch.addEventListener('input', () => {
      curQuery = rowSearch.value.trim().toLowerCase();
      applyRowFilters();
    });

    // the empty-state message is composed here, so retranslate on switch
    document.addEventListener('langchange', () => { if (genreEmpty && !genreEmpty.hidden) applyRowFilters(); });
  }

  // whole featured card acts as one big play/open target
  $$('.feature').forEach(card => {
    const btn = $('.player__btn', card);
    if (!btn) return;
    card.addEventListener('click', e => {
      // leave the waveform (seek), the Spotify link, the chart badge (its
      // tap is what opens the tooltip on touch) and the button itself alone
      if (e.target.closest('[data-wave], .feature__out, .feature__badge, .player__btn')) return;
      btn.click();
    });
  });

  /* ── mobile now-playing: mini bar + Apple-Music-style sheet ── */
  const NowPlaying = (() => {
    const mini = $('#mini'), np = $('#np');
    if (!mini || !np) return { attach() {}, setPlaying() {}, progress() {}, advance() {}, open() {}, close() {}, dismiss() {} };

    const el = {
      art: $('#miniArt'), title: $('#miniTitle'), artist: $('#miniArtist'), bar: $('#miniBar'),
      npArt: $('#npArt'), npBg: $('#npBg'), npTitle: $('#npTitle'), npArtist: $('#npArtist'),
      track: $('#npTrack'), fill: $('#npFill'), knob: $('#npKnob'),
      cur: $('#npCur'), left: $('#npLeft'), out: $('#npOut'),
      prev: $('#npPrev'), next: $('#npNext')
    };

    let active = null;        // Player currently loaded into the panel
    let scrubbing = false;

    const setOpen = open => {
      np.classList.toggle('is-open', open);
      document.body.classList.toggle('np-open', open);
    };

    const api = {
      attach(player) {
        active = player;
        const m = player.meta();
        el.title.textContent = el.npTitle.textContent = m.title;
        el.artist.textContent = el.npArtist.textContent = m.artist;
        if (m.art) {
          el.art.src = el.npArt.src = m.art;
          el.npBg.style.backgroundImage = `url("${m.art}")`;
        }
        el.out.href = m.url || '#';
        el.out.style.display = m.url ? '' : 'none';

        mini.classList.add('is-on');
        document.body.classList.add('has-mini');
        api.setPlaying(true);

        const i = api.index();
        el.prev.disabled = i <= 0;
        el.next.disabled = i < 0 || i >= queue.length - 1;
      },

      setPlaying(on) {
        mini.classList.toggle('is-playing', on);
        np.classList.toggle('is-playing', on);
      },

      progress(audio, p) {
        if (!audio || !audio.duration) return;
        const pct = `${p * 100}%`;
        el.bar.style.width = pct;
        if (!scrubbing) {
          el.fill.style.width = pct;
          el.knob.style.left = pct;
          el.track.setAttribute('aria-valuenow', Math.round(p * 100));
        }
        el.cur.textContent = fmt(audio.currentTime);
        el.left.textContent = '-' + fmt(Math.max(0, audio.duration - audio.currentTime));
      },

      // position of the active track inside the queue (matched by source)
      index() {
        if (!active) return -1;
        return queue.findIndex(p => p.src === active.src);
      },

      advance(step, onlyIfPlaying) {
        const i = api.index();
        if (i < 0) return;
        const next = queue[i + step];
        if (!next) { if (onlyIfPlaying) api.setPlaying(false); return; }
        next.toggle();
      },

      open() { setOpen(true); },
      close() { setOpen(false); },

      // stop playback entirely and tuck the mini bar away
      dismiss() {
        if (active) active.stop();
        setOpen(false);
        mini.classList.remove('is-on');
        document.body.classList.remove('has-mini');
        active = null;
      }
    };

    /* open / close */
    $('#miniOpen').addEventListener('click', () => setOpen(true));
    $('#miniClose').addEventListener('click', e => { e.stopPropagation(); api.dismiss(); });
    $('#npClose').addEventListener('click', () => setOpen(false));
    $('#npX').addEventListener('click', () => setOpen(false));

    /* share the current track — native share sheet where available,
       otherwise copy the Spotify link and flash a small confirmation */
    const shareBtn = $('#npShare');
    shareBtn.addEventListener('click', async () => {
      if (!active) return;
      const m = active.meta();
      const shareData = { title: `${m.title} — ${m.artist}`, text: 'Give this a listen:', url: m.url || location.href };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch { /* user cancelled — not an error */ }
        return;
      }
      try {
        await navigator.clipboard.writeText(shareData.url);
        shareBtn.classList.add('is-copied');
        clearTimeout(shareBtn._t);
        shareBtn._t = setTimeout(() => shareBtn.classList.remove('is-copied'), 1800);
      } catch { /* clipboard unavailable — silently do nothing rather than fake success */ }
    });
    // desktop: click the dark surround (outside the centred content) to dismiss
    np.addEventListener('click', e => { if (e.target === np || e.target === el.npBg) setOpen(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });

    /* transport */
    const toggleActive = () => { if (active) active.toggle(); };
    $('#miniToggle').addEventListener('click', e => { e.stopPropagation(); toggleActive(); });
    $('#npPlay').addEventListener('click', toggleActive);
    el.prev.addEventListener('click', () => api.advance(-1));
    el.next.addEventListener('click', () => api.advance(1));

    /* scrubbing */
    const seekTo = clientX => {
      const a = active && active.audio;
      const r = el.track.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      el.fill.style.width = el.knob.style.left = `${p * 100}%`;
      if (a && a.duration) {
        a.currentTime = p * a.duration;
        el.cur.textContent = fmt(a.currentTime);
        el.left.textContent = '-' + fmt(Math.max(0, a.duration - a.currentTime));
      }
    };
    el.track.addEventListener('pointerdown', e => {
      scrubbing = true;
      el.track.classList.add('is-scrubbing');
      el.track.setPointerCapture(e.pointerId);
      seekTo(e.clientX);
    });
    el.track.addEventListener('pointermove', e => { if (scrubbing) seekTo(e.clientX); });
    const endScrub = () => { scrubbing = false; el.track.classList.remove('is-scrubbing'); };
    el.track.addEventListener('pointerup', endScrub);
    el.track.addEventListener('pointercancel', endScrub);
    el.track.addEventListener('keydown', e => {
      const a = active && active.audio;
      if (!a || !a.duration) return;
      if (e.key === 'ArrowRight') a.currentTime = Math.min(a.duration, a.currentTime + 5);
      else if (e.key === 'ArrowLeft') a.currentTime = Math.max(0, a.currentTime - 5);
      else return;
      e.preventDefault();
    });

    /* swipe the sheet down to dismiss */
    let y0 = null;
    np.addEventListener('touchstart', e => {
      if (e.target.closest('.np__track, .np__ctrl')) return;
      y0 = e.touches[0].clientY;
      np.classList.add('is-dragging');
    }, { passive: true });
    np.addEventListener('touchmove', e => {
      if (y0 === null) return;
      const dy = Math.max(0, e.touches[0].clientY - y0);
      np.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    np.addEventListener('touchend', e => {
      if (y0 === null) return;
      const dy = Math.max(0, (e.changedTouches[0].clientY - y0));
      np.classList.remove('is-dragging');
      np.style.transform = '';
      if (dy > 110) setOpen(false);
      y0 = null;
    });

    return api;
  })();

  /* ── modals (contact + distribution) ──────────────────────── */
  const openModals = new Set();
  const bindModal = (modal, { triggerSelector, focusSelector, onOpen }) => {
    if (!modal) return;
    const backdrop = $('.modal__backdrop', modal);
    const closeBtn = $('.modal__close', modal);
    const openModal = trigger => {
      if (onOpen) onOpen(trigger);            // before paint, so it opens already filled in
      modal.classList.add('is-open');
      modal.removeAttribute('aria-hidden');
      openModals.add(modal);
      document.body.classList.add('modal-open');
      const first = focusSelector && $(focusSelector, modal);
      if (first) setTimeout(() => first.focus(), 350);
    };
    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      openModals.delete(modal);
      if (!openModals.size) document.body.classList.remove('modal-open');
    };

    $$(triggerSelector).forEach(el => el.addEventListener('click', e => {
      e.preventDefault();
      openModal(el);
    }));
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  };

  /* the same modal serves the generic "get in touch" CTAs and the
     Services cards — the package block only appears for the latter */
  const pkgPick = $('#pkgPick');
  const showPackage = trigger => {
    if (!pkgPick) return;
    const name = trigger && trigger.dataset.package;
    const price = trigger && trigger.dataset.price;
    pkgPick.hidden = !name;
    $('#pkgPickName').textContent = name || '';
    $('#pkgPickPrice').textContent = price || '';
    $('#pkgPickInput').value = name || '';
    $('#pkgPickRateInput').value = price || '';
    $('#modalTitle').innerHTML = name
      ? T('js.book_title', 'Book<br>{name}.', { name })
      : T('con.title', 'Send me<br>the rough mix.');
    $('#modalSub').innerHTML = name
      ? T('js.book_sub', 'Tell me about the release and I\'ll confirm the details.')
      : T('con.formlead', 'Name, email, and what you need — I\'ll reply within a day.');
  };

  bindModal($('#contactModal'), {
    triggerSelector: '[data-contact-modal]',
    focusSelector: '#m-name',
    onOpen: trigger => {
      showPackage(trigger);
      // otherwise a second booking opens straight into the last one's confirmation
      if (modalBody) modalBody.hidden = false;
      if (modalSuccess) modalSuccess.hidden = true;
    },
  });
  /* ── distribution modal: two steps ────────────────────────
     Step 1 is the offer, step 2 the form. Toggled with [hidden], which
     keeps the inactive step out of the tab order without any extra aria
     bookkeeping. The panel's label follows the visible step's heading,
     and the panel is scrolled back to the top on each move — otherwise
     step 2 opens wherever step 1 was left scrolled to. */
  const distroModal = $('#distroModal');
  const distroPanel = distroModal && $('.modal__panel', distroModal);
  // step 3 is the confirmation screen — reuses the [hidden] toggle, but
  // isn't really "3 / 2" so it gets no number and no aria-labelledby
  const distroSteps = [$('#distroStep1'), $('#distroStep2'), $('#distroStep3')];
  const distroCount = $('#distroStepNow');
  const distroCountWrap = distroCount && distroCount.closest('.wizard__count');

  const showDistroStep = n => {
    if (!distroSteps[0]) return;
    distroSteps.forEach((s, i) => { if (s) s.hidden = i !== n - 1; });
    if (distroCountWrap) distroCountWrap.hidden = n > 2;
    if (n <= 2 && distroCount) distroCount.textContent = String(n);
    if (distroPanel) {
      if (n <= 2) distroPanel.setAttribute('aria-labelledby', n === 1 ? 'distroTitle' : 'distroTitle2');
      distroPanel.scrollTop = 0;
    }
  };

  /* ── one-time form token ──────────────────────────────────
     The endpoint signs a timestamp and hands it back on GET; the POST is
     only accepted with a valid, recent one. It costs a real visitor
     nothing — the fetch happens while they're reading the terms — but a
     bot posting straight at /api/distro never asked for a token and so
     never has one, which is exactly how the spam has been arriving.
     Fetched per opening rather than per page load, so it can't go stale
     in a tab left open for hours. */
  const DISTRO_ENDPOINT = '/api/distro';
  const tokenField = $('#distroFormToken');

  const fetchFormToken = async () => {
    if (!tokenField) return '';
    try {
      const res = await fetch(DISTRO_ENDPOINT, { headers: { Accept: 'application/json' } });
      const { token } = await res.json();
      if (token) tokenField.value = token;
      return tokenField.value;
    } catch {
      return tokenField.value;          // keep whatever we already had
    }
  };

  bindModal(distroModal, {
    triggerSelector: '[data-distro-modal]',
    // step 1 has nothing to type into, so the first field is only worth
    // focusing once step 2 is the one on screen
    onOpen: () => { showDistroStep(1); fetchFormToken(); },
  });

  const distroNext = $('#distroNext');
  const distroBack = $('#distroBack');
  if (distroNext) distroNext.addEventListener('click', () => {
    showDistroStep(2);
    const first = $('#d-artist');
    if (first) setTimeout(() => first.focus(), 60);
  });
  if (distroBack) distroBack.addEventListener('click', () => {
    showDistroStep(1);
    if (distroNext) setTimeout(() => distroNext.focus(), 60);
  });

  /* ── forms → Web3Forms ──────────────────────────────────────
     Free access key from web3forms.com — it's meant to live in
     client-side code, so it's fine in the repo. Until it's filled
     in (or if the request fails) the form falls back to opening
     the visitor's mail client, so it never dead-ends.            */
  const FORM_ENDPOINT = 'https://api.web3forms.com/submit';
  const FORM_ACCESS_KEY = 'f39b0474-3b97-4934-9cdb-67591e71d404';
  const MAIL_TO = 'offmstpd@gmail.com';
  const keyReady = /^[0-9a-f-]{30,}$/i.test(FORM_ACCESS_KEY);

  /* ── hCaptcha ───────────────────────────────────────────────
     Only the distribution form carries one — it posts to our own
     endpoint, verified server-side against HCAPTCHA_SECRET. The site key
     is public by design (meant to sit in client-side code); the matching
     secret lives only in the backend. Set before hCaptcha's own api.js
     (loaded at the bottom of the page) does its auto-render pass, which
     is what turns a keyless div into an error instead of a widget. */
  const HCAPTCHA_SITE_KEY = '5f5c8836-fac4-4eea-89e0-b65887000d0a';

  const captchaHost = $('#distroCaptcha');
  if (captchaHost && HCAPTCHA_SITE_KEY) {
    captchaHost.className = 'h-captcha captcha';
    captchaHost.dataset.theme = 'dark';
    captchaHost.dataset.sitekey = HCAPTCHA_SITE_KEY;
  }

  /* the token lands in a textarea hCaptcha injects into the form */
  const captchaToken = form => {
    const el = $('textarea[name="h-captcha-response"]', form);
    return el ? el.value : '';
  };
  const captchaPresent = form => !!$('.h-captcha', form);
  /* Reset by widget id, not a bare reset(): several widgets share the page
     and a bare call has no way to know which one this form owns. Auto-render
     doesn't expose the id as an attribute, but it names the response
     textarea after it — h-captcha-response-<id>. */
  const CAPTCHA_FIELD = 'h-captcha-response';
  const resetCaptcha = form => {
    const el = $(`textarea[name="${CAPTCHA_FIELD}"]`, form);
    if (!window.hcaptcha || !el) return;
    const id = el.id.startsWith(`${CAPTCHA_FIELD}-`) ? el.id.slice(CAPTCHA_FIELD.length + 1) : '';
    try { id ? window.hcaptcha.reset(id) : window.hcaptcha.reset(); }
    catch { /* not rendered yet */ }
  };

  const bindForm = (form, { requiredFields, validators = {}, buildSubject, buildFields,
                            endpoint, preflight, onSuccess }) => {
    if (!form) return;
    const note = $('.form__note', form);
    const submit = $('button[type="submit"]', form);
    const label = $('span', submit);

    const say = (text, state) => {
      note.textContent = text;
      note.classList.toggle('is-ok', state === 'ok');
      note.classList.toggle('is-error', state === 'error');
    };

    const mailtoFallback = (subject, fields) => {
      const body = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n');
      location.href = `mailto:${MAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    // drop the red state as soon as they start correcting the field
    form.addEventListener('input', e => {
      const f = e.target.closest('.field');
      if (f && f.classList.contains('is-invalid')) f.classList.remove('is-invalid');
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.classList.contains('is-sending')) return;

      let ok = true;
      let reason = '';
      $$('.field', form).forEach(f => {
        const input = $('input, textarea', f);
        if (!input || !requiredFields.includes(input.name)) return;
        const value = input.value.trim();
        let valid = input.checkValidity() && value !== '';
        const rule = validators[input.name];
        if (valid && rule && !rule.test(value)) {
          valid = false;
          // first specific complaint wins; resolved lazily so it lands
          // in whichever language is active at submit time
          if (!reason) reason = typeof rule.message === 'function' ? rule.message() : rule.message;
        }
        f.classList.toggle('is-invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) { say(reason || T('js.fill_required', 'Please fill in the required fields.'), 'error'); return; }

      // gate for things a per-field rule can't express, e.g. image dimensions
      const blocker = preflight && preflight();
      if (blocker) { say(blocker, 'error'); return; }

      /* Say so here rather than letting the server bounce it: the visitor
         can see the widget sitting right there unsolved. */
      if (captchaPresent(form) && !captchaToken(form)) {
        say(T('js.captcha', 'Please confirm you\'re not a robot.'), 'error');
        return;
      }

      /* One retry if the token fetch failed when the modal opened — a
         blip there shouldn't cost a real visitor their submission. */
      const tokenInput = $('input[name="formtoken"]', form);
      if (tokenInput && !tokenInput.value) await fetchFormToken();

      const data = new FormData(form);
      if (data.get('botcheck')) return;               // honeypot tripped
      const subject = buildSubject(data);
      const fields = buildFields(data);

      // the Web3Forms path needs a key; the own-endpoint path doesn't
      if (!endpoint && !keyReady) {
        say(T('js.opening_mail', 'Opening your mail client…'));
        mailtoFallback(subject, fields);
        return;
      }

      // captured here, not at bind time, so a language switch between
      // page load and submit restores the right label afterwards
      const idle = label.textContent;
      form.classList.add('is-sending');
      submit.disabled = true;
      label.textContent = T('js.sending', 'Sending…');
      say(T('js.sending', 'Sending…'));

      try {
        const res = endpoint
          // multipart, so the cover file rides along; the browser sets the boundary
          ? await fetch(endpoint, { method: 'POST', body: data })
          : await fetch(FORM_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({
                access_key: FORM_ACCESS_KEY,
                subject,
                from_name: 'mstpd.com',
                replyto: data.get('email') || undefined,
                /* the endpoint path sends FormData, which already carries
                   the textarea; the JSON path has to pass it by hand */
                'h-captcha-response': captchaToken(form) || undefined,
                ...fields,
              }),
            });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) {
          const err = new Error(json.message || 'Request failed');
          err.fromServer = Boolean(json.message);      // a real explanation, not a network blip
          throw err;
        }

        form.reset();                                  // fires 'reset', which clears the cover note
        resetCaptcha(form);                            // the token was single-use
        $$('.field.is-invalid', form).forEach(f => f.classList.remove('is-invalid'));
        say(T('js.sent', 'Sent — I\'ll get back to you shortly.'), 'ok');
        /* The note above is 13px under the button, easy to miss once the
           fields it sat beside are all empty again — worth more than that
           for something the visitor is waiting to hear back on. */
        if (onSuccess) onSuccess();
      } catch (err) {
        /* If the server answered at all it has already spent the token, so
           the widget has to be reset or the retry is refused for the wrong
           reason. A network failure never reached it, so leave that alone. */
        if (err.fromServer) resetCaptcha(form);

        // falling back to mailto would silently drop the attachment, so the
        // file path reports the failure instead of pretending to degrade
        if (endpoint) {
          /* Show what the endpoint actually said when it said something —
             the browser stopped checking file sizes, so "Track is larger
             than 28 MB" now only exists server-side, and burying it under
             a generic line would leave no way to tell what went wrong. */
          say(err.fromServer
            ? err.message
            : T('js.cant_send_direct', 'Couldn\'t send. Please email offmstpd@gmail.com directly.'), 'error');
        } else {
          say(T('js.cant_send_mailto', 'Couldn\'t send. Opening your mail client instead…'), 'error');
          setTimeout(() => mailtoFallback(subject, fields), 800);
        }
      } finally {
        form.classList.remove('is-sending');
        submit.disabled = false;
        label.textContent = idle;
      }
    });
  };

  /* same enquiry, two entry points: inline in the Contact section, and
     the modal behind the nav / Services CTAs further up the page */
  const enquiry = {
    requiredFields: ['name', 'email', 'message'],
    buildSubject: data => data.get('package')
      ? `New booking — ${data.get('package')} — ${data.get('name')}`
      : `New enquiry — ${data.get('name')}`,
    // the inline Contact form has no package input, so these stay absent there
    buildFields: data => ({
      ...(data.get('package') ? {
        Package: data.get('package'),
        Rate: data.get('packageRate'),
      } : {}),
      Name: data.get('name'),
      Email: data.get('email'),
      Message: data.get('message'),
    }),
  };
  /* the inline Contact form has nothing to swap to — it just keeps the
     small note. The modal has room for a real confirmation screen. */
  const modalBody = $('#modalBody');
  const modalSuccess = $('#modalSuccess');
  bindForm($('#modalForm'), {
    ...enquiry,
    onSuccess: () => {
      if (modalBody) modalBody.hidden = true;
      if (modalSuccess) modalSuccess.hidden = false;
    },
  });
  bindForm($('#contactForm'), enquiry);

  /* ── attached files: reported, never refused ───────────────
     Nothing here blocks a submit. The notes just read back what was
     attached — dimensions for the cover, bit depth and sample rate for
     the track — so both sides can see what came through. The size
     ceilings that do exist live in the backends, because they're limits
     on what an email can carry rather than rules about the files. */
  const readSize = file => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    img.src = url;
  });

  const fileSize = bytes => bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;

  const coverInput = $('#d-cover');
  const coverNote = $('#coverNote');
  if (coverInput && coverNote) {
    coverInput.form.addEventListener('reset', () => setTimeout(() => {
      coverNote.textContent = '';
      coverNote.classList.remove('is-ok');
    }, 0));

    coverInput.addEventListener('change', async () => {
      const file = coverInput.files && coverInput.files[0];
      if (!file) { coverNote.textContent = ''; coverNote.classList.remove('is-ok'); return; }

      // an image the browser can't decode simply gets no dimensions
      let size = null;
      try { size = await readSize(file); } catch { /* not decodable */ }
      coverNote.textContent = size
        ? `${file.name} — ${size.w}×${size.h}, ${fileSize(file.size)}`
        : `${file.name} — ${fileSize(file.size)}`;
      coverNote.classList.add('is-ok');
    });
  }

  /* Reads the WAV's own header for the note — the sample rate and bit
     depth are ~44 bytes in. Walks the RIFF chunk list rather than
     assuming "fmt " sits at byte 12: plenty of encoders write a JUNK or
     LIST block ahead of it. Nothing is rejected on what it finds; the
     numbers are just shown. */
  const readWavSpec = async file => {
    const buf = await file.slice(0, 65536).arrayBuffer();
    if (buf.byteLength < 44) return null;
    const view = new DataView(buf);
    const tag = o => String.fromCharCode(view.getUint8(o), view.getUint8(o + 1), view.getUint8(o + 2), view.getUint8(o + 3));
    if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;

    let off = 12;
    while (off + 8 <= buf.byteLength) {
      const id = tag(off);
      const size = view.getUint32(off + 4, true);
      if (id === 'fmt ') {
        if (off + 24 > buf.byteLength) return null;
        return {
          channels: view.getUint16(off + 10, true),
          rate: view.getUint32(off + 12, true),
          bits: view.getUint16(off + 22, true),
        };
      }
      off += 8 + size + (size % 2);        // chunks are word-aligned
    }
    return null;
  };

  const audioInput = $('#d-audio');
  const audioNote = $('#audioNote');
  if (audioInput && audioNote) {
    audioInput.form.addEventListener('reset', () => setTimeout(() => {
      audioNote.textContent = '';
      audioNote.classList.remove('is-ok');
    }, 0));

    audioInput.addEventListener('change', async () => {
      const file = audioInput.files && audioInput.files[0];
      if (!file) { audioNote.textContent = ''; audioNote.classList.remove('is-ok'); return; }

      let spec = null;
      try { spec = await readWavSpec(file); } catch { /* not a WAV we can read */ }
      const khz = spec ? (spec.rate / 1000).toFixed(1).replace(/\.0$/, '') : null;
      audioNote.textContent = spec
        ? `${file.name} — ${spec.bits}-bit, ${khz} kHz, ${fileSize(file.size)}`
        : `${file.name} — ${fileSize(file.size)}`;
      audioNote.classList.add('is-ok');
    });
  }

  /* ── repeatable name rows — Featuring, Producers ─────────
     One row per person, added and removed with the buttons, synced into
     a hidden input as a comma-joined string. The server side reads a
     single value per field either way (api/distro.js, api/distro.php),
     so the wire format never changed — only how the UI builds it. */
  const bindNameRows = (wrap, addBtn, hidden) => {
    if (!wrap || !addBtn || !hidden) return;

    const sync = () => {
      hidden.value = $$('.multi__input', wrap)
        .map(i => i.value.trim())
        .filter(Boolean)
        .join(', ');
    };
    // the remove button only makes sense once there's more than one row
    const syncRemoveVisibility = () => {
      const rows = $$('.multi__row', wrap);
      rows.forEach(r => r.classList.toggle('has-remove', rows.length > 1));
    };

    addBtn.addEventListener('click', () => {
      /* cloned from the live first row rather than a template kept from
         load, so a row added after a language switch carries the
         placeholder in the language now showing — i18n only knows about
         the elements that existed when it captured them */
      const row = $('.multi__row', wrap).cloneNode(true);
      $('.multi__input', row).value = '';
      wrap.appendChild(row);
      syncRemoveVisibility();
      $('.multi__input', row).focus();
    });

    wrap.addEventListener('click', e => {
      const btn = e.target.closest('.multi__remove');
      if (!btn) return;
      if ($$('.multi__row', wrap).length <= 1) return;   // always leave one
      btn.closest('.multi__row').remove();
      syncRemoveVisibility();
      sync();
    });

    wrap.addEventListener('input', e => {
      if (e.target.classList.contains('multi__input')) sync();
    });

    // extra rows don't survive a reset — the form goes back to its
    // as-loaded shape, same as the cover note just above
    hidden.form.addEventListener('reset', () => setTimeout(() => {
      $$('.multi__row', wrap).slice(1).forEach(r => r.remove());
      $('.multi__input', wrap).value = '';
      syncRemoveVisibility();
      sync();
    }, 0));
  };

  bindNameRows($('#artistRows'), $('#artistAdd'), $('#d-artist'));
  bindNameRows($('#featRows'), $('#featAdd'), $('#d-feat'));
  bindNameRows($('#producerRows'), $('#producerAdd'), $('#d-producer'));

  bindForm($('#distroForm'), {
    // own endpoint rather than Web3Forms: file attachments are a paid
    // feature there, and the cover is the point of this form
    endpoint: '/api/distro',
    /* Email only. Everything else — the artist's legal name, the release
       title, the file formats — is left to whoever fills this in; a form
       that argues with you is worse than one that takes what it's given
       and lets the reply sort out the rest. Email is the exception
       because it's the address the reply goes to. */
    requiredFields: ['email'],
    // the endpoint composes the mail itself; these only feed the
    // mailto fallback, which the file path never takes
    buildSubject: data => `Distribution — ${data.get('artist')} — ${data.get('release')}`,
    buildFields: data => ({
      'Artist (legal name)': data.get('artist'),
      'Email': data.get('email'),
      'Release': data.get('release'),
    }),
    onSuccess: () => showDistroStep(3),
  });

  /* ── hero parallax (desktop, motion allowed) ──────────── */
  const heroImgs = $$('.hero__media img');
  if (heroImgs.length && !reduced && matchMedia('(min-width: 901px)').matches) {
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        // shifts the crop, not the element — keeps the load animation's transform free
        const p = Math.min(1, scrollY / innerHeight);
        const pos = `50% ${46 + p * 9}%`;
        heroImgs.forEach(img => { img.style.objectPosition = pos; });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ── hero intro: the name resolving out of a waveform ───── */
  const waveCanvas = $('#heroWave');
  const waveTitle  = $('.hero__title');
  /* document.hidden: rAF does not tick in a background tab, so the intro
     would never run and the mask would sit there with the name wiped out.
     A tab opened in the background just gets the name, no intro. */
  if (waveCanvas && waveTitle && waveCanvas.getContext && !reduced && !document.hidden) {
    const IDLE     = .38;    // s of wave alone before the playhead starts
    const SWEEP    = 1.35;   // s for the playhead to cross
    const COLLAPSE = .16;    // fraction of the width a bar takes to fall away
    /* Bar count follows the width: at a fixed 96 the bars stop fitting on a
       phone (they clamp to a 1.5px floor and the row runs past the edge). */
    let N = 0, peaks = null;

    /* Class goes on now, synchronously: `is-loaded` is only queued for the
       next frame, so the CSS rise never gets a chance to start. */
    waveTitle.classList.add('is-emerging');

    const g = waveCanvas.getContext('2d');
    let w = 0, h = 0;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = waveCanvas.clientWidth; h = waveCanvas.clientHeight;
      if (!w || !h) return false;
      if (waveCanvas.width !== w * dpr || waveCanvas.height !== h * dpr) {
        waveCanvas.width = w * dpr; waveCanvas.height = h * dpr;
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(24, Math.min(96, Math.round(w / 5.5)));
      if (n !== N) { N = n; peaks = seedPeaks('viacheslav-mstpd', N); }
      return true;
    };

    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const start   = performance.now();

    const finish = () => {
      waveTitle.classList.remove('is-emerging');
      waveTitle.style.removeProperty('--wave');
      waveCanvas.style.opacity = '0';
    };
    /* The mask must never outlive the animation. If the frame loop stalls
       part-way — tab hidden mid-intro, a starved rAF — the name would stay
       half-wiped, so this always finishes the job. setTimeout still fires
       when rAF does not. */
    const watchdog = setTimeout(finish, (IDLE + SWEEP) * 1000 + 1500);

    const frame = now => {
      if (!size()) { requestAnimationFrame(frame); return; }
      const t = (now - start) / 1000;

      /* Playhead position. Before IDLE the wave just breathes on its own,
         which is what makes the name look like it comes *out* of it. */
      const p = t <= IDLE ? 0 : easeOut(Math.min(1, (t - IDLE) / SWEEP));
      waveTitle.style.setProperty('--wave', p.toFixed(4));

      g.clearRect(0, 0, w, h);
      const gap = 2;
      const bw  = Math.max(1.5, (w - gap * (N - 1)) / N);
      const mid = h / 2;

      for (let i = 0; i < N; i++) {
        const at = i / (N - 1);
        /* how far the playhead has moved past this bar, 0→1 */
        const past = Math.min(1, Math.max(0, (p - at) / COLLAPSE));
        const live = 1 - easeOut(past);
        if (live <= 0.001) continue;

        /* breathing while it waits its turn, stilled once the sweep lands */
        const breathe = 0.82 + 0.18 * Math.sin(t * 3.1 + i * 0.42);
        const amp = peaks[i] * (h * 0.42) * live * breathe;
        const bh  = Math.max(1.5, amp * 2);
        const x   = i * (bw + gap);

        /* the bar under the playhead flares to the accent, like a played
           bar in the track players; everything ahead of it stays faint */
        const heat = Math.max(0, 1 - Math.abs(at - p) / 0.05);
        g.fillStyle = heat > 0 ? C_PLAYED : C_IDLE;
        g.globalAlpha = live * (heat > 0 ? 0.35 + 0.65 * heat : 0.5);
        const r = Math.min(bw / 2, 1.5);
        if (g.roundRect) { g.beginPath(); g.roundRect(x, mid - bh / 2, bw, bh, r); g.fill(); }
        else g.fillRect(x, mid - bh / 2, bw, bh);
      }

      /* the playhead itself */
      if (p > 0 && p < 1) {
        g.globalAlpha = 1;
        g.fillStyle = C_PLAYED;
        g.fillRect(p * w - 0.75, mid - h * 0.34, 1.5, h * 0.68);
      }

      if (t < IDLE + SWEEP + 0.25) {
        waveCanvas.style.opacity = t < 0.3 ? String(t / 0.3) : '1';
        requestAnimationFrame(frame);
      } else {
        /* done: drop the mask entirely rather than leave it at 100% */
        clearTimeout(watchdog);
        waveTitle.style.setProperty('--wave', '1');
        waveCanvas.style.opacity = '0';
        setTimeout(() => { finish(); g.clearRect(0, 0, w, h); }, 460);
      }
    };
    requestAnimationFrame(frame);
  }

  /* ── distribution panel: spotlight under the pointer ────── */
  const distroCta = $('.distro-cta');
  if (distroCta && matchMedia('(hover: hover)').matches) {
    /* Coalesced into a frame: pointermove fires far more often than the
       screen refreshes, and each write invalidates the gradient. The CSS
       fades the layer in on :hover, so nothing here has to track enter
       and leave. */
    let px = 0, py = 0, queued = false;
    const paint = () => {
      queued = false;
      distroCta.style.setProperty('--sx', `${px}px`);
      distroCta.style.setProperty('--sy', `${py}px`);
    };
    distroCta.addEventListener('pointermove', e => {
      const r = distroCta.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      if (!queued) { queued = true; requestAnimationFrame(paint); }
    }, { passive: true });
  }

  /* ── hero slider: autoplay + swipe, story-style bars ───── */
  const slider = $('#heroSlider');
  if (slider) {
    const track = $('#sliderTrack');
    const slides = $$('.slider__slide', track);
    const bars = $$('#sliderBars span');
    const DUR = 5000;                        // must match --slide-dur
    slider.style.setProperty('--slide-dur', DUR + 'ms');

    let index = 0, timer = null, paused = false;
    let startX = 0, dx = 0, dragging = false;

    const paint = () => {
      track.style.transform = `translate3d(${-index * 100}%,0,0)`;
      bars.forEach((b, i) => {
        b.classList.toggle('is-done', i < index);
        b.classList.toggle('is-active', i === index);
      });
    };

    const stop = () => { clearTimeout(timer); timer = null; };
    const schedule = () => {
      stop();
      if (!paused && !reduced) timer = setTimeout(() => go(index + 1), DUR);
    };

    function go(next) {
      index = (next + slides.length) % slides.length;
      paint();
      schedule();
    }

    const setPaused = on => {
      paused = on;
      slider.classList.toggle('is-paused', on);
      on ? stop() : schedule();
    };

    $('#sliderPrev').addEventListener('click', () => go(index - 1));
    $('#sliderNext').addEventListener('click', () => go(index + 1));

    // pause while the tab is hidden or the pointer rests on the slider
    document.addEventListener('visibilitychange', () => setPaused(document.hidden));
    if (matchMedia('(hover: hover)').matches) {
      slider.addEventListener('mouseenter', () => setPaused(true));
      slider.addEventListener('mouseleave', () => setPaused(false));
    }

    /* swipe */
    track.addEventListener('pointerdown', e => {
      dragging = true; startX = e.clientX; dx = 0;
      track.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId);
      setPaused(true);
    });
    track.addEventListener('pointermove', e => {
      if (!dragging) return;
      dx = e.clientX - startX;
      track.style.transform = `translate3d(calc(${-index * 100}% + ${dx}px),0,0)`;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      const threshold = slider.clientWidth * 0.18;
      if (dx > threshold) go(index - 1);
      else if (dx < -threshold) go(index + 1);
      else paint();
      setPaused(false);
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    go(0);
  }
})();
