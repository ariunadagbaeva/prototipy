const byId = id => document.getElementById(id);
const styles = [
  ['Хип-хоп','style2.jpg','hojQcv4FyDw'],
  ['Джаз-фанк','style1.jpg','eOFfa4PLdog'],
  ['Бачата','style5.jpg','G19W7iiEMZY'],
  ['Хореография','style0.jpg','qC2i3PQHlCE'],
  ['Латино','style3.jpg','n4oi0wk1GPA'],
  ['Стрип-пластика','style4.png','nMuwAWfEsPk'],
  ['Стретчинг','style6.jpg','Q0BnC6BAVMw'],
  ['Восточные танцы','style7.jpg','EYvvui-IS_0']
];
byId('style-grid').innerHTML = styles.map(([name, image, video], i) =>
  `<a ${i >= 4 ? 'hidden' : ''} class="style-card" href="https://www.youtube.com/watch?v=${video}" target="_blank" rel="noopener" aria-label="Смотреть видео школы — ${name}"><img loading="lazy" src="assets/${image}" alt=""><div>${name}<i aria-hidden="true">▶</i></div></a>`
).join('');
byId('more-styles').onclick = event => {
  const expanded = event.currentTarget.getAttribute('aria-expanded') !== 'true';
  document.querySelectorAll('.style-card:nth-child(n+5)').forEach(card => card.hidden = !expanded);
  byId('extra-styles').hidden = !expanded;
  event.currentTarget.setAttribute('aria-expanded', expanded);
  event.currentTarget.textContent = expanded ? 'Свернуть ↑' : 'Все направления ↓';
};

// В расписании и прайсе используются одинаковые группы кнопок с одним выбранным значением.
function options(container, labels, select) {
  const buttons = labels.map((label, index) => {
    const button = document.createElement('button');
    button.textContent = label;
    button.setAttribute('aria-pressed', index === 0);
    container.append(button);
    button.onclick = () => {
      buttons.forEach((item, n) => item.setAttribute('aria-pressed', n === index));
      select(index);
    };
    return button;
  });
}
const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
let hallIndex = 0, dayIndex = 0;
function showLessons() {
  const hall = halls[hallIndex];
  const day = days[dayIndex];
  const groups = hall.groups.filter(([week]) => week.split(' ').includes(day.toLowerCase())).sort((a,b) => a[1]-b[1]);
  byId('lessons').innerHTML = groups.map(([,hour,name,age,teacher]) => {
    const time = `${hour}:00–${hour+1}:00`;
    const context = [name,age,hall.name,day,time].filter(Boolean).join(' · ');
    return `<div class="lesson"><strong>${time}</strong><div><b>${name}</b><small>${[age,teacher].filter(Boolean).join(' · ')}</small></div><button data-book="Пробное занятие" data-context="${context}" aria-label="Записаться: ${context}">↗</button></div>`;
  }).join('') || '<p class="lesson" style="display:block">В этот день в расписании зала занятий нет.</p>';
  byId('schedule-source').href = 'assets/' + hall.image;
}
options(byId('halls'), halls.map(h => h.name), i => { hallIndex = i; showLessons(); });
options(byId('days'), days, i => { dayIndex = i; showLessons(); });
showLessons();

const fees = [
  [[400],[800],[3300,3000],[4400,4100],[5200,4900],[6200,5900]],
  [[400],[800],[3100,2800],[4200,3900],[5000,4700],[6000,5700]],
  [[7300],[8100],[8800]]
];
const money = value => value.toLocaleString('ru-RU') + ' ₽';
function showFees(index) {
  const labels = index === 2 ? ['8 + 8 занятий','8 + 12 занятий','12 + 12 занятий'] : ['Пробное','Разовое занятие','4 занятия','8 занятий','12 занятий','VIP'];
  byId('price-list').innerHTML = fees[index].map(([price,special],i) =>
    `<div class="price"><span>${labels[i]}</span><strong>${money(price)}</strong>${special ? '<small>По спеццене '+money(special)+'</small>' : ''}</div>`
  ).join('');
  byId('price-note').textContent = index === 2
    ? 'Два абонемента для мамы и ребёнка. Можно ходить в одну группу, заниматься в разных залах одновременно или выбрать разное время.'
    : 'Спеццена действует при покупке абонемента в день пробного занятия или в день последнего занятия по действующему абонементу.';
}
options(byId('price-tabs'), ['Взрослые','Дети','Семья'], showFees);
showFees(0);

const coachStyles = ['Хип-хоп','Бачата','Восточные танцы','K-pop','Детский хип-хоп','Хип-хоп','Стрип-пластика','Детское латино','Растяжка'];
byId('team').innerHTML = coachStyles.map((name,i) =>
  `<figure><img loading="lazy" src="assets/coach${i}.jpg" alt="Педагог Pulse Dance — ${name}"><figcaption>${name}</figcaption></figure>`
).join('');
function moveTeam(direction) {
  const team = byId('team');
  team.scrollBy({left: direction * (team.firstElementChild.offsetWidth + 14), behavior:'smooth'});
}
byId('team-prev').onclick = () => moveTeam(-1);
byId('team-next').onclick = () => moveTeam(1);
const menu = byId('menu'), nav = byId('nav');
function toggleMenu(open) {
  nav.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', open);
  menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
}
menu.onclick = () => toggleMenu(!nav.classList.contains('open'));
nav.onclick = () => toggleMenu(false);
document.addEventListener('keydown', e => { if(e.key === 'Escape' && nav.classList.contains('open')) { toggleMenu(false); menu.focus(); } });

const dialog = byId('booking'), form = byId('form');
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-book]');
  if (!trigger) return;
  form.reset();
  form.hidden = false;
  byId('result').hidden = true;
  byId('dialog-title').textContent = trigger.dataset.book;
  byId('context').textContent = trigger.dataset.context || (trigger.dataset.book === 'Пробное занятие' ? 'Первое занятие в школе — 400 ₽.' : 'Оставь контакты для заказа сертификата.');
  dialog.showModal();
});
form.addEventListener('submit', event => {
  event.preventDefault();
  form.hidden = true;
  byId('result').hidden = false;
  byId('close').focus();
});
byId('close').onclick = () => dialog.close();
dialog.onclick = event => { if(event.target === dialog && !event.target.closest('form')) {
  const r = dialog.getBoundingClientRect();
  if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
}};
