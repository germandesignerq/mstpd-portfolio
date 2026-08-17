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
      // leave the waveform (seek), the Spotify link and the button itself alone
      if (e.target.closest('[data-wave], .feature__out, .player__btn')) return;
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
    onOpen: showPackage,
  });
  bindModal($('#distroModal'), { triggerSelector: '[data-distro-modal]', focusSelector: '#d-artist' });

  /* ── forms → Web3Forms ──────────────────────────────────────
     Free access key from web3forms.com — it's meant to live in
     client-side code, so it's fine in the repo. Until it's filled
     in (or if the request fails) the form falls back to opening
     the visitor's mail client, so it never dead-ends.            */
  const FORM_ENDPOINT = 'https://api.web3forms.com/submit';
  const FORM_ACCESS_KEY = 'f39b0474-3b97-4934-9cdb-67591e71d404';
  const MAIL_TO = 'offmstpd@gmail.com';
  const keyReady = /^[0-9a-f-]{30,}$/i.test(FORM_ACCESS_KEY);

  /* Two or more name parts, each at least two letters. \p{L} so Cyrillic
     and Latin both pass; hyphens and apostrophes are common in surnames
     (Ivanov-Petrov, O'Brien) but can't start or end a part. */
  const FULL_NAME = /^\p{L}[\p{L}'’-]*\p{L}(?:\s+\p{L}[\p{L}'’-]*\p{L})+$/u;

  const bindForm = (form, { requiredFields, validators = {}, buildSubject, buildFields,
                            endpoint, preflight }) => {
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
                ...fields,
              }),
            });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) throw new Error(json.message || 'Request failed');

        form.reset();                                  // fires 'reset', which clears the cover note
        $$('.field.is-invalid', form).forEach(f => f.classList.remove('is-invalid'));
        say(T('js.sent', 'Sent — I\'ll get back to you shortly.'), 'ok');
      } catch (err) {
        // falling back to mailto would silently drop the attachment, so the
        // file path reports the failure instead of pretending to degrade
        if (endpoint) {
          say(T('js.cant_send_direct', 'Couldn\'t send. Please email offmstpd@gmail.com directly.'), 'error');
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
  bindForm($('#modalForm'), enquiry);
  bindForm($('#contactForm'), enquiry);

  /* ── cover art: checked in the browser before it can be submitted ──
     Distributors want a square master; 3000px is the size Apple asks
     for. Verified here so a wrong file is caught while the visitor can
     still fix it, rather than after the release is in the queue. */
  const COVER_MIN = 3000;
  const COVER_MAX_BYTES = 4 * 1024 * 1024;
  const COVER_TYPES = ['image/jpeg', 'image/png'];

  const coverInput = $('#d-cover');
  const coverNote = $('#coverNote');
  /* held as a producer, not a string, so the message resolves in the
     language active when it's shown — not the one active when it was set */
  const NO_COVER = () => T('js.cover_attach', 'Attach the track cover.');
  let coverProblem = NO_COVER;

  const readSize = file => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    img.src = url;
  });

  if (coverInput && coverNote) {
    const noteState = (text, state) => {
      coverNote.textContent = text;
      coverNote.classList.toggle('is-ok', state === 'ok');
      coverNote.classList.toggle('is-error', state === 'error');
    };

    const clearCover = () => {
      coverProblem = NO_COVER;
      noteState('', null);
    };
    coverInput.form.addEventListener('reset', () => setTimeout(clearCover, 0));

    coverInput.addEventListener('change', async () => {
      const file = coverInput.files && coverInput.files[0];
      if (!file) return clearCover();

      const reject = msgFn => { coverProblem = msgFn; noteState(msgFn(), 'error'); };

      if (!COVER_TYPES.includes(file.type)) {
        return reject(() => T('js.cover_type', 'Cover must be a JPEG or PNG.'));
      }
      if (file.size > COVER_MAX_BYTES) {
        const mb = (file.size / 1048576).toFixed(1);
        return reject(() => T('js.cover_size', 'Cover is {mb} MB — the limit is 4 MB. Save it as JPEG.', { mb }));
      }

      let size;
      try { size = await readSize(file); }
      catch { return reject(() => T('js.cover_unreadable', 'That file could not be read as an image.')); }

      if (size.w !== size.h) {
        return reject(() => T('js.cover_square', 'Cover must be square — this one is {w}×{h}.', { w: size.w, h: size.h }));
      }
      if (size.w < COVER_MIN) {
        return reject(() => T('js.cover_min', 'Cover must be at least {min}×{min} — this one is {w}×{h}.', { min: COVER_MIN, w: size.w, h: size.h }));
      }

      coverProblem = null;
      noteState(`${file.name} — ${size.w}×${size.h}, ${Math.round(file.size / 1024)} KB`, 'ok');

      // a submit may have been refused over this file; stop nagging now it's fixed
      const formNote = $('.form__note', coverInput.form);
      if (formNote && formNote.classList.contains('is-error')) {
        formNote.textContent = '';
        formNote.classList.remove('is-error');
      }
    });
  }

  bindForm($('#distroForm'), {
    // own endpoint rather than Web3Forms: file attachments are a paid
    // feature there, and the cover is the point of this form
    endpoint: '/api/distro',
    preflight: () => coverProblem && coverProblem(),
    requiredFields: ['artist', 'email', 'release', 'performer', 'genre'],
    validators: {
      artist: {
        test: v => FULL_NAME.test(v),
        message: () => T('js.artist_fullname', 'Artist name: please give the full legal name, first and last.'),
      },
    },
    // the endpoint composes the mail itself; these only feed the
    // mailto fallback, which the file path never takes
    buildSubject: data => `Distribution — ${data.get('artist')} — ${data.get('release')}`,
    buildFields: data => ({
      'Artist (legal name)': data.get('artist'),
      'Email': data.get('email'),
      'Release': data.get('release'),
    }),
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

  /* ── hero masked heading: media under the letters ───────── */
  const maskTitle = $('.hero__title');
  if (maskTitle) {
    /* Offsets are fractions of 1em (see the CSS): the overscan is .38em,
       so pointer travel + idle drift stay inside it at any type size. */
    const PARALLAX = .19;
    const DRIFT    = .13;

    const set = (x, y) => {
      maskTitle.style.setProperty('--mx', x.toFixed(4));
      maskTitle.style.setProperty('--my', y.toFixed(4));
    };

    /* The masked text is transparent, so an image that never arrives would
       erase the name — only switch the fill on once it has decoded. */
    const photo = new Image();
    photo.onload = () => {
      maskTitle.classList.add('is-masked');
      if (reduced) return;

      let px = 0, py = 0;                       // pointer, -1…1
      const t0 = performance.now();
      let frame = 0;

      /* Drift runs on its own; the pointer just biases it. Two primes
         apart so the loop never visibly repeats. */
      const tick = now => {
        const t = (now - t0) / 1000;
        set(
          px * PARALLAX + Math.sin(t * .21) * DRIFT,
          py * PARALLAX + Math.cos(t * .17) * DRIFT
        );
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);

      if (matchMedia('(hover: hover)').matches) {
        addEventListener('pointermove', e => {
          px = (e.clientX / innerWidth  - .5) * 2;
          py = (e.clientY / innerHeight - .5) * 2;
        }, { passive: true });
      }

      /* Nothing to animate once the hero has scrolled away. */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) {
            if (!frame) frame = requestAnimationFrame(tick);
          } else if (frame) {
            cancelAnimationFrame(frame);
            frame = 0;
          }
        }, { threshold: 0 }).observe(maskTitle);
      }
    };
    photo.src = 'assets/img/studio-1.jpg';
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
