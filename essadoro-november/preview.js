const main = document.querySelector('#content');
const media = 'public/media/';
const categories = ['Капоры','Шапки','Манишки','Одежда'];
const hits = hitIds.map(id => inventory.find(p => p.id === id));
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => n.toLocaleString('ru-RU') + ' ₽';
const colors = p => (p.color || '').split(';').map(v=>v.trim()).filter(Boolean);
const unique = values => [...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));
const img = (file,alt,lazy=true) => `<img src="${media}${esc(file)}" alt="${esc(alt)}" ${lazy?'loading="lazy"':''}>`;
const catalogLink = params => '#catalog' + (params.size ? '?'+params : '');
const card = p => `<a class="item" href="#product/${p.id}"><div class="frame">${img(p.images[0],'')}${hitIds.includes(p.id)?'<span class="badge">Хит продаж</span>':''}</div><strong>${esc(p.title)}</strong><span class="muted">${esc(colors(p)[0])}</span><span class="price">${money(p.priceWB)}</span></a>`;
function home(){
  return `<section class="hero">${img('editorial.webp','Модель в шоколадном капоре',false)}<div class="wrap reveal"><h1>Холода вам к лицу</h1><p>Вязаные аксессуары для долгих прогулок</p><a class="action" href="#catalog">Смотреть коллекцию</a></div></section>
  <section class="wrap section" id="hits"><div class="heading"><h2>Хиты продаж</h2><a class="under" href="#catalog">Весь каталог</a></div><div class="grid">${hits.map(card).join('')}</div></section>
  <section class="category-showcase"><div class="wrap section"><div class="heading"><h2>Каталог</h2><a class="under" href="#catalog">Все товары</a></div><nav aria-label="Разделы каталога">${categories.map(category=>{
    const count=inventory.filter(p=>p.category===category).length;
    const coverId={'Капоры':'534511279','Шапки':'496547877','Манишки':'497470455','Одежда':'846357847'}[category];
    const cover=inventory.find(p=>p.id===coverId);
    return `<a class="category-cover" href="${catalogLink(new URLSearchParams({category}))}">${img(cover.images[0],'')}<span class="category-caption"><strong>${category}</strong><small>Товаров: ${count}</small></span></a>`;
  }).join('')}</nav></div></section>
  <div class="edition wrap section"><div class="heading"><h2>Образы сезона</h2></div>
    <section id="seasons" class="season-layout" aria-label="Сезонные образы">
      <div class="season-photos">${looks.map(([photo,title],i)=>`<img class="${i===0?'current':''}" src="${media}${photo}" alt="${esc(title)}" aria-hidden="${i!==0}">`).join('')}</div>
      <div class="season-side"><div class="look-copy"></div><div class="look-controls"><button type="button" data-step="-1" aria-label="Предыдущий образ">←</button><span class="position"></span><button type="button" data-step="1" aria-label="Следующий образ">→</button><button type="button" class="play"></button></div></div>
    </section>
    <section id="about" class="brand-spread"><div class="brand-copy"><h2>О бренде</h2><p>В 2013 году мы задумали ESSADORO как магазин вещей, которые легко сочетать с тем, что уже есть в шкафу.</p><p>Поэтому мы показываем, как капор ложится поверх лацканов пальто и как свободная рубашка сидит поверх водолазки. Хочется, чтобы ещё до покупки вы могли представить вещь на себе.</p></div>${img('essadoro-brand-portrait.jpg','Модель в молочной косынке')}</section>
  </div>`;
}
const looks=[
  ['look-autumn.webp','Рубашка поверх водолазки','Осень','Серая клетка и графитовые брюки. Бордовая сумка подхватывает розовую полоску на рубашке.','409979650','Рассмотреть рубашку'],
  ['look-winter.webp','Капор и длинное пальто','Зима','Молочный капор обрамляет лицо. Длинные завязки можно оставить поверх тёмных лацканов.','258760330','Рассмотреть капор'],
  ['534511279-1.webp','Косынка и чёрная куртка','Межсезонье','Леопардовый рисунок хорошо виден на фоне гладкой чёрной кожи. Завязки можно свободно опустить вдоль куртки.','534511279','Рассмотреть косынку'],
  ['256277128-3.webp','Манишка в бежевом','Зима','Мягкая вязка и светлый мех в одном образе. Молнию у воротника можно немного расстегнуть.','256277128','Рассмотреть манишку']
];
let cleanupLooks=()=>{};
function startLooks(){
  const block=main.querySelector('.season-layout');
  if(!block)return;
  let index=0, timer, visible=false, paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toggle=block.querySelector('.play');
  function paint(){
    const [,title,season,copy,id,link]=looks[index];
    block.querySelectorAll('.season-photos img').forEach((photo,i)=>{
      photo.classList.toggle('current',i===index);
      photo.setAttribute('aria-hidden',String(i!==index));
    });
    block.querySelector('.look-copy').innerHTML=`<div class="reveal"><span class="muted">${season}</span><h3>${title}</h3><p>${copy}</p><a class="under" href="#product/${id}">${link}</a></div>`;
    block.querySelector('.position').textContent=(index+1)+' / '+looks.length;
  }
  function schedule(){
    clearInterval(timer);
    toggle.textContent=paused?'Автопоказ':'Пауза';
    if(!paused && visible && !document.hidden)timer=setInterval(()=>{index=(index+1)%looks.length;paint();},5000);
  }
  block.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{index=(index+Number(b.dataset.step)+looks.length)%looks.length;paused=true;paint();schedule();});
  toggle.onclick=()=>{paused=!paused;schedule();};
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();});
  observer.observe(block);
  document.addEventListener('visibilitychange',schedule);
  cleanupLooks=()=>{clearInterval(timer);observer.disconnect();document.removeEventListener('visibilitychange',schedule);};
  paint();schedule();
}
const options = {
  category:['Категория',categories], color:['Цвет',unique(inventory.flatMap(colors))],
  season:['Сезон',unique(inventory.map(p=>p.facts['Сезон']))],
  lining:['Подкладка',unique(inventory.map(p=>p.facts['Материал подкладки']))],
  price:['Цена',['До 2 000 ₽','2 000–3 000 ₽','От 3 000 ₽']],
  sort:['Сортировка',['Сначала хиты','Сначала дешевле','Сначала дороже']]
};
function select(key,q){
  const [label,values]=options[key];
  const selected=q.get(key) || (key==='sort'?values[0]:'');
  return `<label class="${key==='sort'?'sort':''}">${label}<select name="${key}">${(key==='sort'?[]:['']).concat(values).map(v=>`<option value="${esc(v)}" ${v===selected?'selected':''}>${esc(v)||'Все'}</option>`).join('')}</select></label>`;
}
function filtered(q){
  const matches=(key,v)=>!q.get(key)||q.get(key)===v;
  const products=inventory.filter(p=>matches('category',p.category)&&(!q.get('color')||colors(p).includes(q.get('color')))&&matches('season',p.facts['Сезон'])&&matches('lining',p.facts['Материал подкладки'])&&matches('price',options.price[1][p.priceWB<2000?0:p.priceWB<3000?1:2]));
  if(q.get('sort')===options.sort[1][1])return products.sort((a,b)=>a.priceWB-b.priceWB);
  if(q.get('sort')===options.sort[1][2])return products.sort((a,b)=>b.priceWB-a.priceWB);
  return products.sort((a,b)=>Number(hitIds.includes(b.id))-Number(hitIds.includes(a.id))||b.votes-a.votes);
}
function catalog(q){
  const products=filtered(q);
  return `<section class="catalog wrap section"><p class="crumb"><a href="#home">Главная</a> / Каталог</p><div class="heading"><h1>Каталог</h1><span aria-live="polite">Найдено: ${products.length}</span></div><div class="filters">${Object.keys(options).map(key=>select(key,q)).join('')}${q.size?'<a class="under" href="#catalog">Сбросить</a>':''}</div><div class="grid">${products.map(card).join('')}</div>${products.length?'':'<p class="empty">По этим условиям ничего не найдено. <a class="under" href="#catalog">Сбросить фильтры</a></p>'}</section>`;
}
function product(p){
  const fact=(heading,keys,open=false)=>{
    const rows=keys.filter(k=>p.facts[k]).map(k=>`<p><strong>${esc(k)}</strong> — ${esc(p.facts[k])}</p>`);
    return rows.length?`<details ${open?'open':''}><summary>${heading}</summary>${rows.join('')}</details>`:'';
  };
  return `<section class="wrap section product"><p class="crumb"><a href="#home">Главная</a> / <a href="${esc(lastCatalog)}">Каталог</a> / ${esc(p.category)}</p><div class="details"><div class="gallery">${p.images.map((f,i)=>img(f,p.title+' — фото '+(i+1),i>1)).join('')}</div><div class="info"><p class="muted">ESSADORO / ${esc(p.category)}</p><h1>${esc(p.title)}</h1><p>${money(p.priceWB)}</p><p class="muted">Цена из каталога · артикул ${p.id}</p><p>Цвет — ${esc(colors(p).join(', '))}</p><a class="action" href="${esc(p.wb)}" target="_blank" rel="noopener">Уточнить цену и наличие на WB</a>${fact('Состав и уход',['Состав','Уход за вещами'],true)}${fact('Детали модели',['Сезон','Материал подкладки','Фактура материала','Покрой','Вид застежки','Страна производства'])}${fact('Размер на фото',['Размер на модели','Рост модели на фото','Параметры модели на фото (ОГ-ОТ-ОБ)'])}<details><summary>Доставка и возврат</summary><p>Варианты доставки доступны при оформлении на Wildberries. Условия возврата смотрите в своём заказе.</p></details></div></div></section>`;
}
let lastCatalog='#catalog', previous='', focusFilter='';
function render(){
  cleanupLooks();
  const [page,query]=(location.hash.slice(1)||'home').split('?');
  const q=new URLSearchParams(query), sameCatalog=previous==='catalog'&&page==='catalog';
  document.querySelector('.ribbon').innerHTML=categories.map(category=>{
    const p=hits.find(product=>product.category===category);
    return `<a href="${catalogLink(new URLSearchParams({category}))}" aria-current="${page==='catalog'&&q.get('category')===category}">${img(p.images[0],'',false)}${category}</a>`;
  }).join('');
  if(page==='catalog'){lastCatalog=catalogLink(q);main.innerHTML=catalog(q);}
  else if(page.startsWith('product/')){const p=inventory.find(item=>item.id===page.slice(8));main.innerHTML=p?product(p):catalog(q);}
  else {main.innerHTML=home();startLooks();}
  if(['hits','about','service','seasons'].includes(page))document.getElementById(page).scrollIntoView();
  else if(!sameCatalog)window.scrollTo(0,0);
  if(focusFilter){main.querySelector('select[name="'+focusFilter+'"]')?.focus({preventScroll:true});focusFilter='';}
  previous=page;
}
main.addEventListener('change',event=>{
  const field=event.target.closest('.filters select');
  if(!field)return;
  const q=new URLSearchParams(location.hash.split('?')[1]);
  if(field.value)q.set(field.name,field.value);else q.delete(field.name);
  focusFilter=field.name;location.hash=catalogLink(q);
});
window.addEventListener('hashchange',render);
render();
