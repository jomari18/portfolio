(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Welcome splash
  const intro = $('#intro');
  const introShown = !root.classList.contains('no-intro');
  const finishIntro = () => { intro.classList.add('done'); startLanyard(); };
  if (introShown) {
    const timer = setTimeout(finishIntro, 1900);
    const skip = () => { clearTimeout(timer); finishIntro(); };
    intro.addEventListener('click', skip, {once: true});
    window.addEventListener('keydown', skip, {once: true});
  }

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

  // Typing subtitle
  const typed = $('#typed');
  const phrases = ['Computer Science graduate', 'React + TypeScript builder', 'Supabase & PostgreSQL', 'Building for web & desktop'];
  if (typed && !reduced) {
    let phrase = 0, chars = phrases[0].length, deleting = true;
    const tick = () => {
      const text = phrases[phrase];
      chars += deleting ? -1 : 1;
      typed.textContent = text.slice(0, chars);
      let wait = deleting ? 38 : 70;
      if (!deleting && chars === text.length) { deleting = true; wait = 2200; }
      else if (deleting && chars === 0) { deleting = false; phrase = (phrase + 1) % phrases.length; wait = 380; }
      setTimeout(tick, wait);
    };
    setTimeout(tick, 2600);
  }

  // Scroll reveal and active navigation
  const revealer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealer.unobserve(entry.target);
    });
  }, {rootMargin: '0px 0px -8% 0px'});
  $$('.reveal').forEach(el => revealer.observe(el));

  const navLinks = $$('[data-nav]');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        const active = link.dataset.nav === entry.target.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin: '-45% 0px -50% 0px'});
  $$('main > section').forEach(section => spy.observe(section));

  // Count-up statistics
  const counter = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      counter.unobserve(entry.target);
      const end = Number(entry.target.dataset.count);
      if (reduced) return;
      const start = performance.now();
      const step = now => {
        const p = Math.min(1, (now - start) / 1100);
        entry.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });
  $$('[data-count]').forEach(el => counter.observe(el));

  // Hanging ID card: a damped pendulum you can grab and swing
  const lanyard = $('#lanyard');
  const badge = $('#badge');
  let angle = 0, velocity = 0, dragging = false, running = false, last = 0, started = false;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const render = () => {
    lanyard.style.setProperty('--angle', `${angle.toFixed(2)}deg`);
    badge.style.setProperty('--tilt', `${clamp(velocity * 0.12, -24, 24).toFixed(2)}deg`);
  };
  const loop = now => {
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
    last = now;
    if (!dragging) {
      velocity += (-58 * angle - 2.1 * velocity) * dt;
      angle += velocity * dt;
    }
    render();
    if (dragging || Math.abs(angle) > 0.04 || Math.abs(velocity) > 0.04) requestAnimationFrame(loop);
    else { angle = 0; velocity = 0; render(); running = false; }
  };
  const wake = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); } };
  function startLanyard() {
    if (started || !lanyard || reduced) return;
    started = true;
    angle = 26; velocity = 0;
    wake();
  }
  if (lanyard && !reduced) {
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
      const target = clamp(-Math.atan2(event.clientX - p.x, event.clientY - p.y) * 180 / Math.PI, -70, 70);
      const now = performance.now();
      const dt = Math.max(0.008, (now - prevTime) / 1000);
      velocity = clamp((target - prevAngle) / dt, -900, 900);
      angle = target; prevAngle = target; prevTime = now;
    });
    const release = () => { dragging = false; wake(); };
    badge.addEventListener('pointerup', release);
    badge.addEventListener('pointercancel', release);
    if (!introShown) setTimeout(startLanyard, 250);
  }

  // Portfolio tabs
  const tabList = $('.tabs');
  const tabs = $$('[role=tab]', tabList);
  const selectTab = (tab, focus = false) => {
    tabs.forEach((t, i) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $(`#${t.getAttribute('aria-controls')}`).hidden = !on;
      if (on) tabList.style.setProperty('--tab', i);
    });
    if (focus) tab.focus();
  };
  tabs.forEach(tab => tab.addEventListener('click', () => selectTab(tab)));
  tabList.addEventListener('keydown', event => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
  });
  $$('[data-open-tab]').forEach(link => link.addEventListener('click', () => selectTab($(`#tab-${link.dataset.openTab}`))));

  // Project details dialog
  const modal = $('#project-modal');
  const openProject = card => {
    const tpl = $('template', card).content;
    const shot = $('.shot img', card);
    const features = $$('[data-features] li', tpl);
    const tech = $$('[data-tech] li', tpl);
    $('#pm-title').textContent = $('h3', card).textContent;
    $('#pm-body').replaceChildren(...[...tpl.children].filter(el => el.matches('p:not([data-links])')).map(p => p.cloneNode(true)));
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
    img.src = shot.currentSrc || shot.src; img.alt = shot.alt; img.width = 1600; img.height = 800;
    modal.showModal();
    $('.modal-inner', modal).scrollTop = 0;
  };
  $$('.project-card').forEach(card => $('[data-details]', card).addEventListener('click', () => openProject(card)));

  // Certificate lightbox
  const lightbox = $('#lightbox');
  $$('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
    const img = $('#lb-img');
    img.src = button.dataset.lightbox;
    img.alt = $('img', button).alt;
    $('#lb-caption').textContent = button.dataset.caption;
    lightbox.showModal();
  }));

  [modal, lightbox].forEach(dialog => {
    $$('[data-close]', dialog).forEach(btn => btn.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  });

  // Contact form (Netlify Forms)
  const form = $('#contact-form');
  const status = $('#form-status');
  if (new URLSearchParams(location.search).has('sent')) {
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

  // Copy email
  $('#copy-email').addEventListener('click', async () => {
    const copyStatus = $('#copy-status');
    try {
      await navigator.clipboard.writeText('jomaricandido18@gmail.com');
      copyStatus.textContent = 'Email copied.';
    } catch (error) {
      copyStatus.textContent = 'Copy unavailable. Email: jomaricandido18@gmail.com';
    }
  });
})();
