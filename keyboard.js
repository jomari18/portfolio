(() => {
  'use strict';
  const skills = {
    javascript: { title: 'JavaScript', category: 'Web development', summary: 'The language behind interactive interfaces, form validation, and everyday application logic.', projects: ['ZolTrack', 'ZolNutrition', 'MediSched', 'C’est Délicieux', 'Registrix'] },
    react: { title: 'React', category: 'Web development', summary: 'Component-based interfaces with TypeScript for meal logging, restaurant ordering, and student records.', projects: ['ZolNutrition', 'C’est Délicieux', 'Registrix'] },
    html: { title: 'HTML', category: 'Web development', summary: 'The structure of pages, forms, navigation, and content across my browser-based projects.', projects: ['ZolTrack', 'MediSched', 'C’est Délicieux', 'Registrix'] },
    css: { title: 'CSS', category: 'Web development', summary: 'Responsive layouts, themes, and interface styling for desktop and mobile screens.', projects: ['ZolTrack', 'ZolNutrition', 'MediSched', 'C’est Délicieux', 'Registrix'] },
    csharp: { title: 'C#', category: 'Desktop development', summary: 'Event-driven application logic connecting student registration and grading forms to an Access database.', projects: ['Student Records · original Registrix'] },
    dotnet: { title: '.NET / Windows Forms', category: 'Desktop development', summary: 'Windows desktop interfaces for login, a dashboard, student registration, and grading sheets.', projects: ['Student Records · original Registrix'] },
    java: { title: 'Java', category: 'Programming foundation', summary: 'Programming coursework that helped build my foundation in application logic and problem-solving.', projects: ['Academic coursework'] },
    supabase: { title: 'Supabase', category: 'Backend & data', summary: 'Authentication, email OTP, row-level security, and database functions behind all five web applications.', projects: ['ZolTrack', 'ZolNutrition', 'MediSched', 'C’est Délicieux', 'Registrix'] },
    postgres: { title: 'PostgreSQL', category: 'Backend & data', summary: 'Relational data through Supabase, with constraints and transactional functions that keep bookings, orders, and grades consistent.', projects: ['ZolTrack', 'ZolNutrition', 'MediSched', 'C’est Délicieux', 'Registrix'] },
    firebase: { title: 'Firebase / Firestore', category: 'Backend & data', summary: 'Authentication, email verification, and stored appointment data for the first version of a clinic scheduling application.', projects: ['MediSched · original version'] },
    access: { title: 'Microsoft Access', category: 'Desktop data', summary: 'A local database connected to a C# Windows Forms application for account, student, and grading records.', projects: ['Student Records · original Registrix'] },
    git: { title: 'Git', category: 'Development workflow', summary: 'Tracking source changes and keeping project updates organized across development iterations.', projects: ['ZolTrack', 'ZolNutrition', 'MediSched', 'C’est Délicieux', 'Registrix'] },
    github: { title: 'GitHub', category: 'Development workflow', summary: 'Source repositories for sharing code, preserving project work, and connecting deployment workflows.', projects: ['ZolTrack', 'ZolNutrition', 'MediSched', 'C’est Délicieux', 'Registrix'] },
    netlify: { title: 'Netlify', category: 'Deployment', summary: 'Publishing web projects and delivering updates from their connected GitHub repositories.', projects: ['ZolTrack', 'ZolNutrition', 'MediSched', 'C’est Délicieux', 'Registrix'] },
    capacitor: { title: 'Capacitor', category: 'Mobile packaging', summary: 'Packaging web apps as Android builds, with mobile navigation, safe areas, and back-button handling.', projects: ['ZolNutrition', 'C’est Délicieux'] }
  };
  const consoleEl = document.getElementById('skills-console');
  const stage = document.getElementById('keyboard-stage');
  const deck = document.getElementById('keyboard-deck');
  const keys = [...document.querySelectorAll('.skill-key')];
  // Local, trusted Simple Icons assets; names remain readable if an image cannot load.
  const icons = { react: 'react', supabase: 'supabase', git: 'git' };
  keys.forEach(key => {
    const icon = icons[key.dataset.skill];
    if (!icon) return;
    const symbol = key.querySelector('.key-symbol');
    const img = document.createElement('img');
    img.alt = ''; img.width = 30; img.height = 30;
    img.addEventListener('load', () => symbol.replaceChildren(img), { once: true });
    img.src = `assets/tech/${icon}.svg`;
  });
  const view = document.getElementById('keyboard-view');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 540px)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0;
  let tilt = { x: 0, y: 0 };
  const pressTimers = new Map();
  function resetTilt() {
    cancelAnimationFrame(frame); frame = 0;
    deck.style.setProperty('--tilt-x', '0deg');
    deck.style.setProperty('--tilt-y', '0deg');
  }
  function selectKey(key) {
    const skill = skills[key.dataset.skill];
    if (!skill) return;
    keys.forEach(item => item.setAttribute('aria-pressed', String(item === key)));
    document.getElementById('skill-title').textContent = skill.title;
    document.getElementById('skill-category').textContent = skill.category.toUpperCase();
    document.getElementById('skill-summary').textContent = skill.summary;
    document.getElementById('skill-index').textContent = `${String(keys.indexOf(key) + 1).padStart(2, '0')} / ${keys.length}`;
    const list = document.getElementById('skill-projects');
    list.replaceChildren(...skill.projects.map(project => { const li = document.createElement('li'); li.textContent = project; return li; }));
    clearTimeout(pressTimers.get(key));
    key.classList.add('is-down');
    pressTimers.set(key, setTimeout(() => { key.classList.remove('is-down'); pressTimers.delete(key); }, motion.matches ? 0 : 150));
  }
  keys.forEach((key, index) => {
    key.addEventListener('click', () => selectKey(key));
    key.addEventListener('keydown', event => {
      const columns = mobile.matches ? 3 : 5;
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % keys.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + keys.length) % keys.length;
      else if (event.key === 'ArrowDown') next = (index + columns) % keys.length;
      else if (event.key === 'ArrowUp') next = (index - columns + keys.length) % keys.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = keys.length - 1;
      else return;
      event.preventDefault(); keys[next].focus();
    });
  });
  view.hidden = false;
  view.addEventListener('click', () => {
    const flat = consoleEl.classList.toggle('flat');
    view.setAttribute('aria-pressed', String(flat));
    resetTilt();
  });
  stage.addEventListener('pointermove', event => {
    if (motion.matches || mobile.matches || !finePointer.matches || consoleEl.classList.contains('flat')) return;
    const bounds = stage.getBoundingClientRect();
    tilt = { x: -(event.clientY - bounds.top - bounds.height / 2) / bounds.height * 7, y: (event.clientX - bounds.left - bounds.width / 2) / bounds.width * 9 };
    if (!frame) frame = requestAnimationFrame(() => {
      deck.style.setProperty('--tilt-x', `${tilt.x.toFixed(2)}deg`);
      deck.style.setProperty('--tilt-y', `${tilt.y.toFixed(2)}deg`);
      frame = 0;
    });
  });
  stage.addEventListener('pointerleave', resetTilt);
  stage.addEventListener('pointercancel', resetTilt);
  mobile.addEventListener('change', resetTilt);
  motion.addEventListener('change', () => {
    resetTilt();
    if (motion.matches) document.querySelectorAll('.reveal-ready').forEach(item => item.classList.add('is-visible'));
  });
  // Progressive enhancement: content stays visible if observers or scripts fail.
  if ('IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll('.section-heading, .project, .certificate, .about-copy, .experience').forEach(item => {
      if (item.getBoundingClientRect().top > innerHeight) { item.classList.add('reveal-ready'); observer.observe(item); }
    });
  }
})();
