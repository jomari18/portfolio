(() => {
  const work = document.getElementById('work');
  const gallery = document.getElementById('work-gallery');
  const stage = document.getElementById('gallery-stage');
  if (!work || !gallery || !stage) return;
  const cards = [...stage.querySelectorAll('.gallery-card')];
  const projects = [...work.querySelectorAll('article.project')];
  if (cards.length !== projects.length || !cards.length) return;
  const status = document.getElementById('gallery-status');
  let selected = 0;
  function select(index, focus = false) {
    selected = (index + cards.length) % cards.length;
    cards.forEach((card, i) => {
      let offset = (i - selected + cards.length) % cards.length;
      if (offset > cards.length / 2) offset -= cards.length;
      const distance = Math.abs(offset);
      card.style.setProperty('--offset', offset);
      card.style.setProperty('--scale', [1, .8, .63][distance]);
      card.style.setProperty('--angle', `${offset * -9}deg`);
      card.style.setProperty('--layer', cards.length - distance);
      card.style.setProperty('--opacity', [1, .72, .4][distance]);
      card.setAttribute('aria-pressed', String(i === selected));
      card.tabIndex = i === selected ? 0 : -1;
      projects[i].hidden = i !== selected;
    });
    status.textContent = `${String(selected + 1).padStart(2, '0')} / 05 · ${projects[selected].querySelector('h3').textContent}`;
    if (focus) cards[selected].focus({preventScroll: true});
  }
  cards.forEach((card, i) => card.addEventListener('click', () => select(i)));
  document.getElementById('gallery-prev').addEventListener('click', () => select(selected - 1));
  document.getElementById('gallery-next').addEventListener('click', () => select(selected + 1));
  stage.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = selected + 1;
    if (event.key === 'ArrowLeft') next = selected - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = cards.length - 1;
    if (next !== undefined) {event.preventDefault(); select(next, true);}
  });
  let start = null;
  let suppressClick = false;
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || !event.isPrimary) return;
    start = {x:event.clientX, y:event.clientY, id:event.pointerId};
  });
  stage.addEventListener('pointerup', event => {
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      select(selected + (dx < 0 ? 1 : -1));
      suppressClick = true;
      setTimeout(() => {suppressClick = false;}, 350);
    }
  });
  stage.addEventListener('pointercancel', () => {start = null;});
  stage.addEventListener('click', event => {
    if (suppressClick) {event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false;}
  }, true);
  gallery.querySelector('.gallery-controls').hidden = false;
  document.getElementById('gallery-help').hidden = false;
  work.classList.add('gallery-enhanced');
  select(0);
})();
