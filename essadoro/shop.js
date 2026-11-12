const { base, checkoutActive } = document.body.dataset;
const find = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const formatAmount = n => new Intl.NumberFormat('ru-RU').format(n);
const money = n => `${formatAmount(n)} ₽`;
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);

const productBack = find('[data-product-back]');
if (productBack && document.referrer) {
  const previous = new URL(document.referrer);
  if (previous.origin === location.origin && previous.href !== location.href) {
    productBack.href = previous.href;
    productBack.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || history.length < 2) return;
      event.preventDefault();
      history.back();
    });
  }
}

const productReturn = performance.getEntriesByType('navigation')[0]?.type === 'back_forward'
  ? history.state?.productReturn : null;
function restoreProductScroll() {
  if (!productReturn) return;
  const state = { ...history.state };
  delete state.productReturn;
  history.replaceState(state, '');
  document.fonts.ready.then(() => requestAnimationFrame(() => window.scrollTo(0, productReturn.scroll)));
}

const hitCards = all('[data-hit-grid] .product-card');
if (hitCards.length && 'IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const observer = new IntersectionObserver(entries => {
    let index = 0;
    for (const {target, isIntersecting} of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(target);
      if (reduceMotion.matches || target.contains(document.activeElement)) continue;
      target.animate(
        [{ opacity: 0.25, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 380, delay: index++ * 110, easing: 'ease-out', fill: 'backwards' }
      );
    }
  }, { threshold: 0.15 });
  hitCards.forEach(card => observer.observe(card));
}

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem('essadoro.' + key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem('essadoro.' + key, JSON.stringify(value)); } catch {}
}
const savedFavorites = read('favorites', []);
const favorites = new Set(Array.isArray(savedFavorites) ? savedFavorites : []);
let cart = read('cart', []);
if (!Array.isArray(cart)) cart = [];
cart = cart.filter(line => line && /^\d{1,12}$/.test(line.id) && typeof line.variant === 'string'
  && Number.isInteger(line.qty) && line.qty > 0 && line.qty <= 20);

let pendingCatalog;
const load = () => pendingCatalog ||= fetch(base + 'products.json')
  .then(response => {
    if (!response.ok) throw new Error('Каталог недоступен.');
    return response.json();
  })
  .then(products => new Map(products.map(p => [p.id, p])));

let toastTimer;
function toast(message) {
  const target = find('[data-toast]');
  target.textContent = message;
  target.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { target.hidden = true; }, 2500);
}
function updateBadges() {
  const count = cart.reduce((sum, line) => sum + line.qty, 0);
  find('[data-cart-count]').textContent = count || '';
  all('[data-favorite]').forEach(button => {
    const selected = favorites.has(button.dataset.favorite);
    button.setAttribute('aria-pressed', selected);
    button.textContent = selected ? '♥' : '♡';
  });
}

function catalogSetup(products, form) {
  const fields = ['category', 'sort'];
  const current = new URL(location.href);
  for (const name of fields) form.elements[name].value = current.searchParams.get(name) || '';
  const cards = all('[data-product]');
  const catalog = find('[data-catalog]');
  const more = find('[data-more]');
  let limit = Math.max(12, productReturn?.visibleProducts ?? 0);
  function filter() {
    const values = Object.fromEntries(fields.map(key => [key, form.elements[key].value]));
    const url = new URL(location.href);
    url.searchParams.delete('color');
    url.searchParams.delete('q');
    for (const key of fields) {
      if (values[key]) url.searchParams.set(key, values[key]);
      else url.searchParams.delete(key);
    }
    history.replaceState(history.state, '', url);
    const matched = cards.filter(card => !values.category || products.get(card.dataset.product).category === values.category);
    const getPrice = p => p.price ?? p.priceWB;
    const sorts = { popular: (a,b) => b.votes-a.votes, rating: (a,b) => b.rating-a.rating,
      low: (a,b) => getPrice(a)-getPrice(b), high: (a,b) => getPrice(b)-getPrice(a) };
    if (sorts[values.sort]) matched.sort((a,b) => sorts[values.sort](products.get(a.dataset.product), products.get(b.dataset.product)));
    const visible = new Set(matched.slice(0, limit));
    for (const card of cards) card.hidden = !visible.has(card);
    catalog.append(...visible);
    find('[data-results]').textContent = `Товаров: ${matched.length}`;
    find('[data-empty]').hidden = matched.length !== 0;
    more.hidden = matched.length <= limit;
  }
  form.addEventListener('submit', event => { event.preventDefault(); limit = 12; filter(); });
  form.addEventListener('input', () => { limit = 12; filter(); });
  more.addEventListener('click', () => { limit += 12; filter(); });
  find('[data-reset]').addEventListener('click', () => { form.reset(); limit = 12; filter(); });
  filter();
}

const favoritesRoot = find('[data-favorites]');
const cartRoot = find('[data-cart]');
const checkoutRoot = find('[data-checkout]');
const direct = p => Number.isInteger(p.price) && Number.isInteger(p.stock);
const itemLink = p => base + 'product/' + p.id + '/';
const itemImage = p => p.images.length ? `<img src="${base}media/${escape(p.images[0])}" alt="" width="76" height="95">` : '';
const displayPrice = p => `<span class="price-amount">${formatAmount(p.price ?? p.priceWB)}&nbsp;<span class="price-currency">₽</span></span>`;

function lists(products) {
  if (favoritesRoot) {
    favoritesRoot.innerHTML = [...favorites].filter(id => products.has(id)).map(id => {
      const p = products.get(id);
      return `<article class="line-item">${itemImage(p)}<div><a class="product-name" href="${itemLink(p)}">${escape(p.title)}</a><p class="price">${displayPrice(p)}</p></div>
        <button class="plain" type="button" data-favorite="${id}" aria-label="Убрать из избранного">♥</button></article>`;
    }).join('') || `<p class="empty">В избранном пока ничего нет.</p><a class="button" href="${base}catalog/">Открыть каталог</a>`;
  }
  const lines = cart.map((line,i) => ({ ...line, i, p: products.get(line.id) }));
  const canOrder = lines.length > 0 && lines.every(({ p,qty,variant }) => p && direct(p) && p.stock >= qty
    && (!p.variants?.length || p.variants.includes(variant)));
  if (cartRoot) {
    if (!lines.length) {
      cartRoot.innerHTML = `<p class="empty">Корзина пуста.</p><a class="button" href="${base}catalog/">Открыть каталог</a>`;
      updateBadges();
      return;
    }
    cartRoot.innerHTML = lines.map(({p,i,qty,variant}) => `<article class="line-item">${p ? itemImage(p) : '<span></span>'}
      <div>${p ? `<a class="product-name" href="${itemLink(p)}">${escape(p.title)}</a>${variant ? `<p>${escape(variant)}</p>` : ''}
        <p class="price">${displayPrice(p)}</p>
        ${direct(p) && p.stock < qty ? '<p>Такого количества сейчас нет.</p>' : ''}` : '<p>Товар снят с витрины.</p>'}</div>
      <div class="line-actions"><label>Кол-во<input type="number" min="1" max="20" value="${qty}" data-qty="${i}"></label><button class="plain" type="button" data-remove="${i}">Удалить</button></div></article>`).join('');
    const total = lines.reduce((sum, line) => sum + (line.p ? (line.p.price ?? line.p.priceWB) * line.qty : 0),0);
    cartRoot.innerHTML += `<div class="total"><strong>${canOrder ? 'Стоимость товаров' : 'Стоимость по ценам витрины'} · ${money(total)}</strong>
      ${checkoutActive !== 'true' ? '<p>Оформление заказов на сайте пока недоступно.</p>' : canOrder ? `<a class="button" href="${base}checkout/">Оформить заказ</a>` : '<p>В корзине есть позиции, недоступные для заказа.</p>'}</div>`;
  }
  if (checkoutRoot) {
    find('[data-order]').hidden = !canOrder;
    find('[data-checkout-summary]').textContent = canOrder
      ? `Всего с доставкой: ${money(lines.reduce((sum,line)=>sum+line.qty*line.p.price,Number(checkoutRoot.dataset.deliveryFee)))}`
      : 'Проверьте товары и количество в корзине.';
  }
  updateBadges();
}

let orderKey;
let sending = false;
async function submitOrder(form, products) {
  if (sending) return;
  const status = find('[data-order-status]');
  const button = form.querySelector('button[type=submit]');
  orderKey ||= crypto.randomUUID();
  sending = true;
  button.disabled = true;
  status.textContent = 'Сохраняем заказ…';
  try {
    const fields = Object.fromEntries(new FormData(form));
    const response = await fetch(base+'api/orders', { method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ ...fields, key:orderKey, items:cart.map(line=>({ ...line, price:products.get(line.id)?.price })) }) });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 409) pendingCatalog = null;
      throw new Error(result.error);
    }
    cart = [];
    save('cart', cart);
    updateBadges();
    checkoutRoot.replaceChildren();
    const message = document.createElement('p');
    message.setAttribute('role','status');
    message.textContent = `Заказ № ${result.id} принят. Сумма ${money(result.total)}. Оплата при получении.`;
    checkoutRoot.append(message);
  } catch (error) {
    status.textContent = error.message || 'Не удалось отправить заказ. Попробуйте ещё раз.';
    button.disabled = false;
  } finally { sending = false; }
}

const form = find('[data-filter]');
if (form || favoritesRoot || cartRoot || checkoutRoot) {
  load().then(products => {
    if (form) catalogSetup(products,form);
    lists(products);
    restoreProductScroll();
    if (checkoutRoot) find('[data-order]').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      try { await submitOrder(form, await load()); }
      catch { toast('Не удалось загрузить каталог.'); }
    });
  }).catch(() => toast('Не удалось загрузить каталог. Обновите страницу.'));
} else restoreProductScroll();

document.addEventListener('click', async event => {
  const link = event.target.closest('a[href]');
  if (link && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    const destination = new URL(link.href);
    const productPrefix = new URL(base + 'product/', location.href).pathname;
    if (destination.origin === location.origin && destination.pathname.startsWith(productPrefix)) {
      history.replaceState({
        ...history.state,
        productReturn: { scroll: window.scrollY, visibleProducts: all('[data-catalog] [data-product]:not([hidden])').length },
      }, '');
    }
  }
  const button = event.target.closest('button');
  if (!button) return;
  const { favorite, add, photo, remove, menu } = button.dataset;
  if (menu !== undefined) {
    button.setAttribute('aria-expanded', find('.top-nav').classList.toggle('open'));
  }
  if (photo) {
    find('[data-main-image]').src = photo;
    all('[data-photo]').forEach(item => item.setAttribute('aria-pressed', item === button));
  }
  if (favorite) {
    favorites.has(favorite) ? favorites.delete(favorite) : favorites.add(favorite);
    save('favorites', [...favorites]);
    updateBadges();
    if (favoritesRoot) lists(await load());
  }
  if (add) {
    try {
      const p = (await load()).get(add);
      if (!p) return toast('Товар снят с витрины.');
      const variant = find('[data-variant]')?.value || '';
      const line = cart.find(item => item.id === add && item.variant === variant);
      const total = cart.filter(item => item.id === add).reduce((sum,item)=>sum+item.qty,0);
      if (total >= (direct(p) ? Math.min(20,p.stock) : 20)) return toast('Достигнуто доступное количество.');
      if (line) line.qty++;
      else cart.push({ id:add,variant,qty:1 });
      save('cart',cart);
      updateBadges();
      toast('Товар в корзине');
    } catch { toast('Не удалось добавить товар.'); }
  }
  if (remove !== undefined) {
    cart.splice(Number(remove),1);
    save('cart',cart);
    lists(await load());
  }
});
document.addEventListener('change', async event => {
  if (event.target.matches('[data-qty]')) {
    const line = cart[Number(event.target.dataset.qty)];
    line.qty = Math.max(1,Math.min(20,Math.floor(Number(event.target.value) || 1)));
    save('cart',cart);
    lists(await load());
  }
});
updateBadges();
