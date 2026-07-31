/* =========================================================
   Vyacheslav MSTPD — interactions
   No dependencies. Everything degrades gracefully.
   ========================================================= */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  $$('#menu a, #menu button').forEach(a => a.addEventListener('click', () => setMenu(false)));
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

  /* ── genre filter (Credits section) ────────────────────── */
  const genreBtns = $$('.genre-filter__btn');
  const genreEmpty = $('#genreEmpty');
  if (genreBtns.length) {
    genreBtns.forEach(btn => btn.addEventListener('click', () => {
      const genre = btn.dataset.genreFilter;
      genreBtns.forEach(b => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      let visible = 0;
      rows.forEach(row => {
        const match = genre === 'all' || row.dataset.genre === genre;
        row.classList.toggle('is-filtered', !match);
        if (match) visible++;
      });
      if (genreEmpty) genreEmpty.hidden = visible > 0;
    }));
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

  /* ── contact modal ─────────────────────────────────────── */
  const modal = $('#contactModal');
  if (modal) {
    const panel = $('.modal__panel', modal);
    const openModal = () => {
      modal.classList.add('is-open');
      modal.removeAttribute('aria-hidden');
      document.body.classList.add('modal-open');
      const first = $('#m-name', modal);
      if (first) setTimeout(() => first.focus(), 350);
    };
    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    };

    $$('[data-contact-modal]').forEach(el => el.addEventListener('click', e => {
      e.preventDefault();
      openModal();
    }));
    $('#modalClose').addEventListener('click', closeModal);
    $('#modalBackdrop').addEventListener('click', closeModal);
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }

  /* ── contact form → mail client (swap for a real endpoint) ── */
  const form = $('#modalForm');
  const note = $('#modalFormNote');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      $$('.field', form).forEach(f => {
        const input = $('input, textarea', f);
        const valid = input.checkValidity() && input.value.trim() !== '';
        f.classList.toggle('is-invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) { note.textContent = 'Please fill in every field.'; return; }

      const data = new FormData(form);
      const body = `${data.get('message')}\n\n— ${data.get('name')} (${data.get('email')})`;
      location.href = `mailto:offmstpd@gmail.com?subject=${encodeURIComponent('Project enquiry — ' + data.get('name'))}&body=${encodeURIComponent(body)}`;
      note.textContent = 'Opening your mail client…';
      form.reset();
    });
  }

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
