(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Welcome splash
  const intro = $('#intro');
  if (!root.classList.contains('no-intro')) {
    const finish = () => intro.classList.add('done');
    const timer = setTimeout(finish, 1900);
    const skip = () => { clearTimeout(timer); finish(); };
    intro.addEventListener('click', skip, {once: true});
    window.addEventListener('keydown', skip, {once: true});
  }

  // Theme toggle
  const themeButton = $('#theme-toggle');
  const syncTheme = () => {
    const dark = root.dataset.theme === 'dark';
    themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    $('meta[name=theme-color]').content = dark ? '#0e1013' : '#dcdde0';
  };
  syncTheme();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('jc-theme', root.dataset.theme); } catch (e) {}
    syncTheme();
  });

  // Mobile menu
  const menuButton = $('#menu-toggle');
  const navLinks = $('#nav-links');
  const setMenu = open => {
    navLinks.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuButton.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  $$('a', navLinks).forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => { if (!event.target.closest('.nav')) setMenu(false); });

  // Spotlight that follows the pointer on desktop
  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    let frame = 0;
    window.addEventListener('pointermove', event => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        root.style.setProperty('--mx', `${event.clientX}px`);
        root.style.setProperty('--my', `${event.clientY}px`);
        frame = 0;
      });
    }, {passive: true});
  }

  // Typing helpers
  async function typeInto(el, text, speed = 55) {
    for (let i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await wait(speed); }
  }
  async function eraseFrom(el, speed = 30) {
    for (let i = el.textContent.length - 1; i >= 0; i--) { el.textContent = el.textContent.slice(0, i); await wait(speed); }
  }
  async function cycle(el, phrases, hold = 2200) {
    let i = 0;
    for (;;) {
      await wait(hold);
      await eraseFrom(el);
      i = (i + 1) % phrases.length;
      await wait(300);
      await typeInto(el, phrases[i], 65);
    }
  }
  if (!reduced) {
    cycle($('#typed'), ['Computer Science graduate', 'React + TypeScript builder', 'Supabase & PostgreSQL', 'Building for web & desktop']);
    cycle($('#trait'), ['Problem Solver', 'Web Developer', 'Lifelong Learner'], 2600);
  }

  // Section titles type themselves when they scroll into view
  const titles = $$('[data-type]');
  if (!reduced) {
    titles.forEach(title => { title.dataset.text = title.textContent; title.setAttribute('aria-label', title.textContent); title.textContent = ' '; });
    const titleObserver = new IntersectionObserver(entries => {
      entries.forEach(async entry => {
        if (!entry.isIntersecting) return;
        titleObserver.unobserve(entry.target);
        entry.target.classList.add('typing-now');
        await typeInto(entry.target, entry.target.dataset.text, 60);
        await wait(1200);
        entry.target.classList.remove('typing-now');
      });
    }, {rootMargin: '0px 0px -15% 0px'});
    titles.forEach(title => titleObserver.observe(title));
  }

  // Scroll reveal, active navigation and back-to-top
  const revealer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealer.unobserve(entry.target);
    });
  }, {rootMargin: '0px 0px -8% 0px'});
  $$('.reveal').forEach(el => revealer.observe(el));

  const links = $$('[data-nav]');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => {
        const active = link.dataset.nav === entry.target.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin: '-45% 0px -50% 0px'});
  $$('main > section[id]').forEach(section => spy.observe(section));

  const toTop = $('#to-top');
  window.addEventListener('scroll', () => toTop.classList.toggle('show', scrollY > 700), {passive: true});

  // Count-up numbers
  const counter = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      counter.unobserve(entry.target);
      if (reduced) return;
      const end = Number(entry.target.dataset.count), start = performance.now();
      const step = now => {
        const p = Math.min(1, (now - start) / 1100);
        entry.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });
  $$('[data-count]').forEach(el => counter.observe(el));

  // Project details dialog (content comes from each row's template)
  const rows = $$('.project-row');
  const modal = $('#project-modal');
  const tourVideo = $('#pm-video'), playButton = $('#pm-play');
  const setPlayLabel = playing => { playButton.textContent = playing ? 'Pause tour' : 'Play tour'; };
  playButton.addEventListener('click', () => {
    if (tourVideo.paused) tourVideo.play().then(() => setPlayLabel(true), () => setPlayLabel(false));
    else { tourVideo.pause(); setPlayLabel(false); }
  });
  modal.addEventListener('close', () => tourVideo.pause());
  const openProject = row => {
    const tpl = $('template', row).content;
    const features = $$('[data-features] li', tpl);
    const tech = $$('[data-tech] li', tpl);
    const shot = $('img', tpl);
    $('#pm-title').textContent = $('h3', row).textContent;
    $('#pm-body').replaceChildren(...[...tpl.children].filter(el => el.matches('p:not([data-links]), .case')).map(p => p.cloneNode(true)));
    $('#pm-tech-count').textContent = tech.length;
    $('#pm-feature-count').textContent = features.length;
    $('#pm-tech').replaceChildren(...tech.map(li => li.cloneNode(true)));
    $('#pm-features').replaceChildren(...features.map(li => li.cloneNode(true)));
    $('#pm-links').replaceChildren(...$$('[data-links] a', tpl).map((a, i) => {
      const link = a.cloneNode(true);
      link.className = i === 0 ? 'btn primary' : 'btn';
      link.target = '_blank'; link.rel = 'noopener';
      link.textContent = `${a.textContent} ↗`;
      return link;
    }));
    const img = $('#pm-shot');
    img.src = shot.getAttribute('src'); img.alt = shot.alt;
    const video = $('#pm-video'), hasVideo = Boolean(row.dataset.video);
    video.pause();
    img.hidden = hasVideo;
    video.hidden = !hasVideo;
    $('#pm-tour').hidden = !hasVideo;
    $('#pm-tour-controls').hidden = !hasVideo;
    if (hasVideo) {
      video.poster = shot.getAttribute('src');
      if (video.getAttribute('src') !== row.dataset.video) video.src = row.dataset.video;
      video.currentTime = 0;
      video.setAttribute('aria-label', `Walkthrough of ${$('h3', row).textContent}`);
      $('#pm-tour-note').textContent = row.dataset.videoNote || 'Recorded with test accounts';
      if (reduced) setPlayLabel(false); else video.play().then(() => setPlayLabel(true), () => setPlayLabel(false));
    }
    // Case-study side menu built from the section headings
    const sections = [...$$('#pm-body .case'), $('.pm-features', modal)];
    const toc = $('#pm-toc');
    toc.replaceChildren(...sections.map((section, i) => {
      section.id = `pm-sec-${i}`;
      const link = document.createElement('a');
      link.href = `#pm-sec-${i}`;
      const label = $('h4, h3', section).textContent.replace(/^The /i, '');
      link.textContent = label.charAt(0).toUpperCase() + label.slice(1);
      link.addEventListener('click', event => {
        event.preventDefault();
        tocLock = performance.now() + 900;
        $$('#pm-toc a').forEach(a => a.classList.toggle('active', a === link));
        const inner = $('.modal-inner', modal);
        inner.scrollTo({top: section.getBoundingClientRect().top - inner.getBoundingClientRect().top + inner.scrollTop - 24, behavior: reduced ? 'auto' : 'smooth'});
      });
      return link;
    }));
    modal.showModal();
    $('.modal-inner', modal).scrollTop = 0;
    syncToc();
  };
  let tocLock = 0;
  const syncToc = () => {
    if (performance.now() < tocLock) return;
    const inner = $('.modal-inner', modal), links = $$('#pm-toc a');
    if (!links.length) return;
    const limit = inner.getBoundingClientRect().top + 150;
    // Case sections are in reading order; the features box (last link) is active only at the end.
    let active = 0;
    links.slice(0, -1).forEach((link, i) => { const target = $(link.getAttribute('href'), modal); if (target && target.getBoundingClientRect().top <= limit) active = i; });
    if (inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 8) active = links.length - 1;
    links.forEach((link, i) => link.classList.toggle('active', i === active));
  };
  $('.modal-inner', modal).addEventListener('scroll', syncToc, {passive: true});
  rows.forEach(row => $('[data-details]', row).addEventListener('click', () => openProject(row)));

  // Auto-rotation that never moves things under the user: paused while hovered,
  // focused, off-screen or while a project is open; stopped for good after any manual use.
  const autoRotate = (area, step, ms) => {
    let timer = 0, hovered = false, focused = false, visible = false, used = reduced;
    const run = () => {
      const ok = !used && !hovered && !focused && visible && !modal.open;
      if (ok && !timer) timer = setInterval(step, ms);
      if (!ok && timer) { clearInterval(timer); timer = 0; }
    };
    area.addEventListener('pointerenter', () => { hovered = true; run(); });
    area.addEventListener('pointerleave', () => { hovered = false; run(); });
    area.addEventListener('focusin', () => { focused = true; run(); });
    area.addEventListener('focusout', event => { if (!area.contains(event.relatedTarget)) { focused = false; run(); } });
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; run(); }).observe(area);
    modal.addEventListener('close', run);
    return {stop: () => { used = true; run(); }, sync: run};
  };

  // Hero project deck: three stacked cards that shuffle; the top card opens its details
  const deckStack = $('#deck-stack');
  const deckCards = rows.map((row, i) => {
    const shot = $('img', $('template', row).content);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'deck-card';
    card.innerHTML = `<img alt="" width="1600" height="800"><span class="deck-label"></span><strong></strong><small></small>`;
    $('img', card).src = shot.getAttribute('src');
    $('.deck-label', card).textContent = $('.row-meta', row).textContent.split('·')[0].trim();
    $('strong', card).textContent = $('h3', row).textContent;
    $('small', card).textContent = $('.row-meta', row).textContent.split('·')[1]?.trim() || '';
    card.setAttribute('aria-label', `Open ${$('h3', row).textContent} details`);
    card.addEventListener('click', () => {
      deckAuto.stop();
      if (card.dataset.pos === '0') openProject(row);
      else { deckTop = i; layoutDeck(); }
    });
    deckStack.append(card);
    return card;
  });
  let deckTop = 0;
  const layoutDeck = (outgoing = -1) => {
    deckCards.forEach((card, i) => {
      const pos = (i - deckTop + deckCards.length) % deckCards.length;
      card.dataset.pos = i === outgoing ? 'out' : pos < 3 ? String(pos) : 'hidden';
      card.style.zIndex = String(10 - pos);
      card.tabIndex = pos < 3 ? 0 : -1;
      card.setAttribute('aria-hidden', String(pos >= 3));
      const name = $('strong', card).textContent;
      card.setAttribute('aria-label', pos === 0 ? `Open ${name} details` : `Show ${name}`);
    });
  };
  const shuffle = () => {
    const out = deckTop;
    deckTop = (deckTop + 1) % deckCards.length;
    layoutDeck(out);
    setTimeout(() => layoutDeck(), reduced ? 0 : 450);
  };
  layoutDeck();
  const deckAuto = autoRotate($('#deck'), shuffle, 4200);
  $('#deck-shuffle').addEventListener('click', () => { deckAuto.stop(); shuffle(); });

  // Work gallery coverflow
  const cards = $$('.cf-card');
  const stage = $('#cf-stage');
  let current = 0;
  const select = index => {
    current = (index + cards.length) % cards.length;
    cards.forEach((card, i) => {
      let offset = (i - current + cards.length) % cards.length;
      if (offset > cards.length / 2) offset -= cards.length;
      const d = Math.abs(offset);
      card.style.setProperty('--offset', offset);
      card.style.setProperty('--angle', `${offset * -24}deg`);
      // With an even number of cards, the one straight behind (d = 3) is hidden.
      card.style.setProperty('--scale', [1, .78, .6, .5][d]);
      card.style.setProperty('--depth', d * 120);
      card.style.setProperty('--opacity', [1, .85, .45, 0][d]);
      card.style.setProperty('--bright', [1, .7, .5, .4][d]);
      card.style.setProperty('--layer', 10 - d);
      card.setAttribute('aria-current', String(i === current));
      card.tabIndex = i === current ? 0 : -1;
    });
    const row = rows[current];
    $('#cf-title').textContent = $('h3', row).textContent;
    $('#cf-summary').textContent = $('.row-summary', row).textContent;
    $('#cf-live').href = $('.row-actions a', row).href;
    $('#cf-count').textContent = `${String(current + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
  };
  const manual = fn => (...args) => { galleryAuto.stop(); fn(...args); };
  cards.forEach((card, i) => card.addEventListener('click', manual(() => (i === current ? openProject(rows[i]) : select(i)))));
  $('#cf-prev').addEventListener('click', manual(() => select(current - 1)));
  $('#cf-next').addEventListener('click', manual(() => select(current + 1)));
  $('#cf-details').addEventListener('click', manual(() => openProject(rows[current])));
  stage.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); galleryAuto.stop(); select(current + 1); cards[current].focus(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); galleryAuto.stop(); select(current - 1); cards[current].focus(); }
  });
  let swipe = null;
  stage.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') swipe = {x: event.clientX, y: event.clientY}; });
  stage.addEventListener('pointerup', event => {
    if (!swipe) return;
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { galleryAuto.stop(); select(current + (dx < 0 ? 1 : -1)); }
  });
  const galleryAuto = autoRotate($('#coverflow'), () => select(current + 1), 4500);
  select(0);

  // Hanging ID card: a damped pendulum you can grab and swing
  const lanyard = $('#lanyard');
  const badge = $('#badge');
  let angle = 0, velocity = 0, dragging = false, running = false, last = 0, started = false;
  const render = () => {
    lanyard.style.setProperty('--angle', `${angle.toFixed(2)}deg`);
    badge.style.setProperty('--tilt', `${clamp(velocity * 0.12, -24, 24).toFixed(2)}deg`);
  };
  const loop = now => {
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
    last = now;
    if (!dragging) { velocity += (-58 * angle - 2.1 * velocity) * dt; angle += velocity * dt; }
    render();
    if (dragging || Math.abs(angle) > 0.04 || Math.abs(velocity) > 0.04) requestAnimationFrame(loop);
    else { angle = 0; velocity = 0; render(); running = false; }
  };
  const wake = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); } };
  if (!reduced) {
    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting || started) return;
      started = true; observer.disconnect();
      angle = 26; velocity = 0; wake();
    }, {threshold: .35}).observe($('#lanyard-zone'));
    let prevAngle = 0, prevTime = 0;
    const pivot = () => {
      const zone = lanyard.offsetParent.getBoundingClientRect();
      return {x: zone.left + lanyard.offsetLeft + lanyard.offsetWidth / 2, y: zone.top + lanyard.offsetTop};
    };
    badge.addEventListener('pointerdown', event => {
      dragging = true; started = true;
      badge.setPointerCapture(event.pointerId);
      prevAngle = angle; prevTime = performance.now();
      wake();
    });
    badge.addEventListener('pointermove', event => {
      if (!dragging) return;
      const p = pivot();
      const target = clamp(-Math.atan2(event.clientX - p.x, event.clientY - p.y) * 180 / Math.PI, -60, 60);
      const now = performance.now(), dt = Math.max(0.008, (now - prevTime) / 1000);
      velocity = clamp((target - prevAngle) / dt, -900, 900);
      angle = target; prevAngle = target; prevTime = now;
    });
    const release = () => { dragging = false; wake(); };
    badge.addEventListener('pointerup', release);
    badge.addEventListener('pointercancel', release);
  }

  // Certificate lightbox
  const lightbox = $('#lightbox');
  $$('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
    const img = $('#lb-img');
    img.src = button.dataset.lightbox;
    const source = $('img', button) || $(`img[src="${button.dataset.lightbox}"]`);
    img.alt = source ? source.alt : '';
    $('#lb-caption').textContent = button.dataset.caption;
    lightbox.showModal();
  }));
  [modal, lightbox].forEach(dialog => {
    $$('[data-close]', dialog).forEach(btn => btn.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  });

  // Floating "send me a message" window
  const win = $('#message-window');
  const minButton = $('#mw-min');
  let opener = null;
  const setMinimized = min => {
    win.classList.toggle('minimized', min);
    minButton.setAttribute('aria-expanded', String(!min));
    minButton.setAttribute('aria-label', min ? 'Expand message window' : 'Minimize message window');
  };
  $$('[data-open-message]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    win.hidden = false;
    setMinimized(false);
    $('input[name=name]', win).focus();
  }));
  const closeWindow = () => { win.hidden = true; if (opener) opener.focus(); };
  $('#mw-close').addEventListener('click', closeWindow);
  minButton.addEventListener('click', () => setMinimized(!win.classList.contains('minimized')));
  win.addEventListener('keydown', event => { if (event.key === 'Escape') closeWindow(); });

  // Copy email pill
  $('#copy-email').addEventListener('click', async () => {
    const copyStatus = $('#copy-status');
    try {
      await navigator.clipboard.writeText('jomaricandido18@gmail.com');
      copyStatus.textContent = 'Copied!';
    } catch (error) {
      copyStatus.textContent = 'Copy unavailable';
    }
    setTimeout(() => { copyStatus.textContent = ''; }, 2500);
  });

  // Contact form (Netlify Forms)
  const form = $('#contact-form');
  const status = $('#form-status');
  if (new URLSearchParams(location.search).has('sent')) {
    win.hidden = false;
    status.textContent = 'Thanks! Your message was sent.'; status.className = 'form-status ok';
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = $('button[type=submit]', form);
    button.disabled = true;
    status.className = 'form-status'; status.textContent = 'Sending…';
    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams(new FormData(form)).toString()
      });
      if (!response.ok) throw new Error(String(response.status));
      form.reset();
      status.className = 'form-status ok'; status.textContent = 'Thanks! Your message was sent. I’ll get back to you soon.';
    } catch (error) {
      status.className = 'form-status err'; status.textContent = 'The message could not be sent. Please email jomaricandido18@gmail.com directly.';
    } finally {
      button.disabled = false;
    }
  });
})();
