(() => {
  'use strict';
  const PRODUCTS = window.PRECI_PRODUCTS || [];
  const CATEGORIES = window.PRECI_CATEGORIES || [];
  const CFG = window.PRECI_CONFIG || {};
  const CART_KEY = 'preci-cart-v1';
  const ORDER_KEY = 'preci-last-order-v1';
  const lookup = Object.assign(Object.create(null), Object.fromEntries(PRODUCTS.map(p => [p.id, p])));
  const currency = n => `${CFG.currency || '৳'}${Number(n || 0).toLocaleString('en-BD')}`;
  const escapeHTML = text => String(text ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const getPage = () => document.body.dataset.page;
  const $ = selector => document.querySelector(selector);
  const storageGet = key => { try {return JSON.parse(localStorage.getItem(key));} catch {return null;} };
  const storageSet = (key, value) => { try {localStorage.setItem(key, JSON.stringify(value));return true;} catch {return false;} };
  function cartGet() {
    const raw = storageGet(CART_KEY);
    if (!Array.isArray(raw)) return [];
    const amounts = new Map();
    raw.forEach(line => {if (line && lookup[line.id] && Number.isInteger(line.qty) && line.qty > 0) amounts.set(line.id, Math.min(99, (amounts.get(line.id)||0) + line.qty));});
    return Array.from(amounts, ([id,qty]) => ({id,qty}));
  }
  function cartSet(cart) {storageSet(CART_KEY, cart);updateBagCount();renderDrawer();}
  function itemCount(cart=cartGet()) {return cart.reduce((sum, line) => sum + line.qty, 0);}
  function subtotal(cart=cartGet()) {return cart.reduce((sum, line) => sum + lookup[line.id].price*line.qty, 0);}
  function addItem(id, qty=1) {
    if (!lookup[id]) return;
    const cart = cartGet();
    const item = cart.find(l => l.id === id);
    if (item) item.qty = Math.min(99, item.qty + qty);
    else cart.push({id,qty:Math.min(99,qty)});
    cartSet(cart);
    showToast(`${lookup[id].name} added to your happy bag ♡`);
    openCart();
  }
  function changeItem(id, delta) {
    const cart = cartGet();
    const line = cart.find(l => l.id === id);
    if (!line) return;
    line.qty = Math.max(0, Math.min(99, line.qty + delta));
    cartSet(cart.filter(l => l.qty));
    if (getPage() === 'checkout') updateCheckoutSummary();
  }
  function removeItem(id) {
    cartSet(cartGet().filter(l => l.id !== id));
    if (getPage() === 'checkout') updateCheckoutSummary();
  }
  let toastTimeout;
  function showToast(message) {
    const root = $('#toast-root');
    if (!root) return;
    root.innerHTML = `<div class="toast" role="status">${escapeHTML(message)}</div>`;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {const t=root.querySelector('.toast');if(t){t.classList.add('fade');setTimeout(()=>t.remove(),220);}}, 2900);
  }
  function headerHTML() {
    const is = v => ['products','product'].includes(getPage()) ? v==='products' : getPage()==='index' && v==='index';
    return `<div class="announcement">♥ PRECI NOT PRICEY ♥ &nbsp; little treasures, lots of happy!</div>
    <div class="header-shell"><header class="header-inner section-wrap"><a href="index.html" class="brand" aria-label="PRECI home"><span class="brand-mark" aria-hidden="true">✿</span> PRECI <span class="brand-heart" aria-hidden="true">♥</span></a>
      <nav class="desktop-nav" aria-label="Main navigation"><a href="index.html" class="${is('index')?'active':''}">Home</a><a href="products.html" class="${is('products')?'active':''}">Shop all</a><a href="products.html?category=Keychains">Keychains</a><a href="products.html?category=Figures">Cute figures</a><a href="products.html?category=Mini%20Bricks">Mini bricks</a></nav>
      <div class="header-actions"><button type="button" class="header-icon-button" data-open-cart aria-label="Open shopping bag"><span class="bag-icon" aria-hidden="true">♡</span><span class="bag-label">My bag</span><span class="bag-count" data-bag-count>0</span></button><button type="button" class="header-icon-button menu-toggle" data-menu-toggle aria-controls="mobile-navigation" aria-expanded="false" aria-label="Toggle navigation">☰</button></div></header>
    <nav id="mobile-navigation" class="mobile-links section-wrap" aria-label="Mobile navigation"><a href="index.html">Home</a><a href="products.html">Shop all cuties</a><a href="products.html?category=Keychains">Keychains</a><a href="products.html?category=Figures">Figures</a><a href="products.html?category=Stickers">Stickers</a><a href="products.html?category=Mini%20Bricks">Mini bricks</a></nav></div>`;
  }
  function footerHTML() {
    return `<footer class="site-footer"><div class="section-wrap footer-main"><div class="footer-brand"><a href="index.html" class="brand"><span class="brand-mark" aria-hidden="true">✿</span> PRECI <span class="brand-heart" aria-hidden="true">♥</span></a><p>Cute little things, happy little moments. A home for pastel-loving, charm-collecting, sticker-obsessed sweethearts.</p><div class="footer-love">Preci not pricey ♡</div></div><div class="footer-col"><h3>Explore</h3><a href="index.html">Home</a><a href="products.html">All products</a><a href="products.html?category=Gift%20Sets">Gift ideas</a><a href="checkout.html">Checkout</a></div><div class="footer-col"><h3>Find your cute</h3><a href="products.html?category=Keychains">Keychains</a><a href="products.html?category=Figures">Cat figures</a><a href="products.html?category=Stickers">Stickers</a><a href="products.html?category=Mini%20Bricks">Mini bricks</a></div><div class="footer-col"><h3>Little note ♡</h3><p>Made as a demo storefront for PRECI. Product names, prices, availability and images are sample content.</p><p>Add your actual contact details, policies, shipping rules and payment gateway before launch.</p></div></div><div class="section-wrap footer-bottom"><span>© <span id="footer-year"></span> PRECI. Made with a lot of ♡</span><span>A sweet little corner of the internet ✿</span></div></footer>`;
  }
  function cartHTML() {
    return `<div id="cart-overlay" class="cart-overlay" data-close-cart aria-hidden="true"></div><aside class="cart-drawer" id="cart-drawer" role="dialog" aria-label="Shopping bag" aria-modal="true" aria-hidden="true"><div class="drawer-header"><h2>Your happy bag <span>♡</span></h2><button type="button" class="close-cart" data-close-cart aria-label="Close shopping bag">×</button></div><div id="drawer-items" class="drawer-items"></div><div id="drawer-footer" class="drawer-footer"></div></aside>`;
  }
  function openCart() {$('#cart-overlay')?.classList.add('open');$('#cart-drawer')?.classList.add('open');$('#cart-drawer')?.setAttribute('aria-hidden','false');document.body.classList.add('cart-open');$('.close-cart')?.focus();}
  function closeCart() {$('#cart-overlay')?.classList.remove('open');$('#cart-drawer')?.classList.remove('open');$('#cart-drawer')?.setAttribute('aria-hidden','true');document.body.classList.remove('cart-open');}
  function updateBagCount(){document.querySelectorAll('[data-bag-count]').forEach(el => el.textContent = itemCount());}
  function renderDrawer(){
    const list = $('#drawer-items'), footer = $('#drawer-footer');if (!list || !footer) return;
    const cart = cartGet();
    if (!cart.length){list.innerHTML=`<div class="empty-cart"><div class="empty-icon">🐰</div><h3>Nothing in your bag yet!</h3><p>Don't leave our cute little friends hanging.</p><a href="products.html" class="btn btn-outline">Find your new favorite ↗</a></div>`;footer.innerHTML='';return;}
    list.innerHTML=cart.map(({id,qty}) => {const p=lookup[id];return `<div class="drawer-item"><a href="product.html?id=${encodeURIComponent(id)}"><img src="${p.image}" alt="${escapeHTML(p.name)}"></a><div><a href="product.html?id=${encodeURIComponent(id)}" class="drawer-item-title">${escapeHTML(p.name)}</a><div class="drawer-item-price">${currency(p.price)} each</div><div class="drawer-item-controls"><div class="mini-qty"><button type="button" data-change-id="${id}" data-delta="-1" aria-label="Decrease quantity of ${escapeHTML(p.name)}">−</button><span>${qty}</span><button type="button" data-change-id="${id}" data-delta="1" aria-label="Increase quantity of ${escapeHTML(p.name)}">+</button></div><button type="button" class="remove-item" data-remove-id="${id}">Remove</button></div></div><span class="drawer-item-total">${currency(p.price*qty)}</span></div>`;}).join('');
    footer.innerHTML=`<div class="drawer-subtotal"><span>Subtotal</span><strong>${currency(subtotal(cart))}</strong></div><p>Shipping and discounts calculated at checkout.</p><a class="btn btn-primary" href="checkout.html">Go to checkout ↗</a>`;
  }
  function productCard(p){
    return `<article class="product-card"><a href="product.html?id=${encodeURIComponent(p.id)}" class="product-image-link"><img src="${p.image}" alt="Illustration of ${escapeHTML(p.name)}" loading="lazy"><span class="product-tag">${escapeHTML(p.tag)}</span></a><div class="product-card-body"><div class="product-category">${escapeHTML(p.category)}</div><h3 class="product-name"><a href="product.html?id=${encodeURIComponent(p.id)}">${escapeHTML(p.name)}</a></h3><div class="price-line"><span class="price">${currency(p.price)}</span>${p.compareAt?`<span class="old-price">${currency(p.compareAt)}</span>`:''}</div><button class="card-add" type="button" data-add-id="${p.id}" aria-label="Add ${escapeHTML(p.name)} to bag">♡ &nbsp; Add to bag</button></div></article>`;
  }
  function initHome(){
    const cats=$('#category-grid'), featured=$('#featured-products');
    if(cats)cats.innerHTML=CATEGORIES.map(cat=>`<a class="category-card" href="products.html?category=${encodeURIComponent(cat.name)}"><div class="category-art" style="background:${cat.color}"><img src="${cat.image}" loading="lazy" alt="${escapeHTML(cat.name)} illustration"></div><h3>${escapeHTML(cat.name)}</h3><p>${escapeHTML(cat.subtitle)}</p><span class="category-arrow" aria-hidden="true">↗</span></a>`).join('');
    if(featured)featured.innerHTML=[PRODUCTS[0],PRODUCTS[3],PRODUCTS[5],PRODUCTS[6]].map(productCard).join('');
  }
  function initShop(){
    const params=new URLSearchParams(location.search);
    const options=['All',...new Set(PRODUCTS.map(p=>p.category))];
    let active = options.includes(params.get('category')) ? params.get('category') : 'All';
    let query='';let sort='featured';
    const filters=$('#category-filters'), results=$('#all-products'), count=$('#result-count'), empty=$('#shop-empty');
    function render(){
      filters.innerHTML=options.map(name=>`<button class="filter-chip ${active===name?'active':''}" type="button" data-filter="${escapeHTML(name)}" aria-pressed="${active===name?'true':'false'}">${escapeHTML(name==='All'?'♡ All cuties':name)}</button>`).join('');
      let items=PRODUCTS.filter(p=>(active==='All'||p.category===active) && `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(query.toLowerCase().trim()));
      if(sort==='price-low')items.sort((a,b)=>a.price-b.price);else if(sort==='price-high')items.sort((a,b)=>b.price-a.price);else if(sort==='name')items.sort((a,b)=>a.name.localeCompare(b.name));
      count.textContent=`Showing ${items.length} cute ${items.length===1?'thing':'things'}`;
      results.innerHTML=items.map(productCard).join('');empty.hidden=items.length!==0;
    }
    filters.addEventListener('click',ev=>{const button=ev.target.closest('[data-filter]');if(!button)return;active=button.dataset.filter;const url=new URL(location.href);if(active==='All')url.searchParams.delete('category');else url.searchParams.set('category',active);history.replaceState(null,'',url);render();});
    $('#shop-search').addEventListener('input',ev=>{query=ev.target.value;render();});
    $('#shop-sort').addEventListener('change',ev=>{sort=ev.target.value;render();});
    $('#clear-filters').addEventListener('click',()=>{active='All';query='';sort='featured';$('#shop-search').value='';$('#shop-sort').value='featured';history.replaceState(null,'','products.html');render();});
    render();
  }
  function initProduct(){
    const id=new URLSearchParams(location.search).get('id');const p=lookup[id];const container=$('#product-detail');if(!container)return;
    if(!p){container.innerHTML='<div class="empty-results"><div>🐰</div><h2>This cutie wandered away!</h2><p>We couldn\'t find that product.</p><a class="btn btn-primary" href="products.html">See all products ↗</a></div>';return;}
    document.title=`${p.name} | PRECI`;let qty=1;
    container.innerHTML=`<div class="breadcrumbs"><a href="index.html">Home</a><span>›</span><a href="products.html">Shop</a><span>›</span><a href="products.html?category=${encodeURIComponent(p.category)}">${escapeHTML(p.category)}</a><span>›</span><span>${escapeHTML(p.name)}</span></div><div class="product-detail-grid"><div class="detail-photo"><img src="${p.image}" alt="Illustration of ${escapeHTML(p.name)}"><span class="product-tag">${escapeHTML(p.tag)}</span></div><div class="detail-info"><div class="eyebrow">✿ ${escapeHTML(p.category.toUpperCase())} ✿</div><h1>${escapeHTML(p.name)}</h1><div class="detail-price"><span class="price">${currency(p.price)}</span>${p.compareAt?`<span class="old-price">${currency(p.compareAt)}</span>`:''}</div><p class="detail-description">${escapeHTML(p.description)}</p><div class="detail-highlights"><strong>A few tiny details ♡</strong><ul>${p.details.map(d=>`<li>${escapeHTML(d)}</li>`).join('')}</ul></div><div class="qty-action"><div class="quantity-picker" aria-label="Quantity"><button type="button" id="detail-minus" aria-label="Decrease quantity">−</button><span id="detail-qty" aria-live="polite">1</span><button type="button" id="detail-plus" aria-label="Increase quantity">+</button></div><button type="button" id="detail-add" class="btn btn-primary">♡ &nbsp; Add to happy bag</button></div><p class="detail-extra">🎀 Little treasures, happy prices &nbsp; · &nbsp; 📦 Delivery options at checkout</p></div></div>`;
    const sync=()=>$('#detail-qty').textContent=qty;
    $('#detail-minus').addEventListener('click',()=>{qty=Math.max(1,qty-1);sync();});
    $('#detail-plus').addEventListener('click',()=>{qty=Math.min(99,qty+1);sync();});
    $('#detail-add').addEventListener('click',()=>addItem(p.id,qty));
    const related=PRODUCTS.filter(item=>item.id!==p.id&&item.category===p.category).concat(PRODUCTS.filter(item=>item.id!==p.id&&item.category!==p.category)).slice(0,4);
    $('#related-products').innerHTML=related.map(productCard).join('');
  }
  let couponApplied=false;
  function checkoutMath(cart, area='dhaka') {
    const sub=subtotal(cart);const discount=couponApplied?Math.round(sub*CFG.couponPercent/100):0;
    const shipping=sub>=CFG.freeDeliveryThreshold ? 0 : (area==='outside'?CFG.deliveryOutside:CFG.deliveryDhaka);
    return {sub,discount,shipping,total:sub-discount+shipping};
  }
  function updateCheckoutSummary(){
    const cart=cartGet();const empty=$('#checkout-empty'), content=$('#checkout-content');if(!empty||!content)return;
    empty.hidden=cart.length>0;content.hidden=cart.length===0;if(!cart.length)return;
    $('#checkout-items').innerHTML=cart.map(({id,qty})=>{const p=lookup[id];return `<div class="checkout-item"><img src="${p.image}" alt="${escapeHTML(p.name)}"><div><div class="checkout-item-title">${escapeHTML(p.name)}</div><div class="checkout-item-meta">Qty: ${qty}</div></div><div class="checkout-item-price">${currency(p.price*qty)}</div></div>`;}).join('');
    const area=$('#delivery-area')?.value ||'dhaka';const t=checkoutMath(cart,area);
    $('#checkout-totals').innerHTML=`<div class="total-row"><span>Subtotal</span><span>${currency(t.sub)}</span></div>${t.discount?`<div class="total-row discount"><span>PRECI10 discount</span><span>−${currency(t.discount)}</span></div>`:''}<div class="total-row"><span>Delivery</span><span>${t.shipping?currency(t.shipping):'FREE ♡'}</span></div><div class="total-row grand-total"><span>Total</span><span>${currency(t.total)}</span></div>`;
    const btn=$('#submit-order');if(btn){const method=$('input[name="paymentMethod"]:checked')?.value||'bkash-demo';btn.innerHTML=method==='cod'?'Place demo COD order <span aria-hidden="true">♡</span>':'Confirm demo payment <span aria-hidden="true">♡</span>';}
  }
  function initCheckout(){
    const form=$('#checkout-form');if(!form)return;
    updateCheckoutSummary();
    $('#delivery-area').addEventListener('change',updateCheckoutSummary);
    document.querySelectorAll('input[name="paymentMethod"]').forEach(input=>input.addEventListener('change',updateCheckoutSummary));
    $('#coupon-apply').addEventListener('click',()=>{
      const code=$('#coupon-input').value.trim().toUpperCase();const message=$('#coupon-message');
      if(!code){couponApplied=false;message.textContent='Add a code first ♡';}
      else if(code===CFG.couponCode){couponApplied=true;message.textContent='Yay! 10% off applied to your demo order ♡';}
      else{couponApplied=false;message.textContent='That code doesn\'t seem right. Try PRECI10!';}
      updateCheckoutSummary();
    });
    form.addEventListener('submit',ev=>{
      ev.preventDefault();
      if(!form.reportValidity())return;
      const cart=cartGet();if(!cart.length){updateCheckoutSummary();return;}
      const data=new FormData(form),area=String(data.get('area')||'dhaka'),payment=String(data.get('paymentMethod')||'bkash-demo');
      const details={fullName:String(data.get('fullName')||'').trim(),phone:String(data.get('phone')||'').trim(),email:String(data.get('email')||'').trim(),address:String(data.get('address')||'').trim(),note:String(data.get('note')||'').trim(),area};
      if(!details.fullName || !/^(?:\+?88)?01\d{9}$/.test(details.phone) || details.address.length < 10){showToast('Please check your name, phone and delivery address.');return;}
      const amounts=checkoutMath(cart,area);
      const order={id:`PRECI-${Date.now().toString(36).slice(-7).toUpperCase()}`,createdAt:new Date().toISOString(),items:cart.map(l=>({...l,price:lookup[l.id].price,name:lookup[l.id].name})),...amounts,firstName:details.fullName.split(/\s+/)[0],area,payment,isDemo:true};
      if(!storageSet(ORDER_KEY,order)){showToast('Browser storage is unavailable. Please enable storage to continue the demo.');return;}
      storageSet(CART_KEY,[]);updateBagCount();
      location.href=payment==='cod'?'thank-you.html':'payment-success.html';
    });
  }
  function initCompletion(){
    const order=storageGet(ORDER_KEY);
    const target=getPage()==='payment-success'?'#success-order':'#thanks-order';
    const node=$(target);if(!node)return;
    if(!order || !order.isDemo || !Array.isArray(order.items)){
      node.innerHTML='<div><strong>No recent demo order</strong><small>Browse the shop and try a sample checkout.</small></div><span>♡</span>';
      if(getPage()==='payment-success')$('#success-description').textContent='This is the sample payment-success screen. Try a demo checkout to see your order confirmation here.';
      return;
    }
    node.innerHTML=`<div><small>Your demo order number</small><strong>${escapeHTML(order.id)}</strong></div><span>${currency(order.total)}</span>`;
    if(getPage()==='payment-success' && order.payment==='cod'){
      $('.completion-card h1').innerHTML='Order <span>received!</span>';
      $('#success-description').textContent='Your sample cash-on-delivery order was created. No real payment has been made.';
    }
    if(getPage()==='thank-you'){
      const first=order.firstName || ''; 
      $('#thanks-description').textContent=`${first?`Thank you, ${first}! `:'Thank you! '}Your PRECI demo order ${order.id} has been created. You can keep exploring all the cute things in our shop!`;
    }
  }
  function initGlobal(){
    $('#site-header').innerHTML=headerHTML();$('#site-footer').innerHTML=footerHTML();$('#cart-root').innerHTML=cartHTML();$('#footer-year').textContent=new Date().getFullYear();
    updateBagCount();renderDrawer();
    document.addEventListener('click',ev=>{
      const button=ev.target.closest('button, [data-close-cart]');if(!button)return;
      if(button.matches('[data-open-cart]')){openCart();return;}
      if(button.matches('[data-close-cart]')){closeCart();return;}
      if(button.matches('[data-menu-toggle]')){const nav=$('#mobile-navigation');nav.classList.toggle('open');button.setAttribute('aria-expanded',String(nav.classList.contains('open')));return;}
      if(button.matches('[data-add-id]')){addItem(button.dataset.addId);return;}
      if(button.matches('[data-change-id]')){changeItem(button.dataset.changeId,Number(button.dataset.delta));return;}
      if(button.matches('[data-remove-id]')){removeItem(button.dataset.removeId);return;}
    });
    document.addEventListener('keydown',ev=>{if(ev.key==='Escape')closeCart();});
    // Keep the bag quantity current if a second tab edits the cart.
    window.addEventListener('storage',ev=>{if(ev.key===CART_KEY){updateBagCount();renderDrawer();if(getPage()==='checkout')updateCheckoutSummary();}});
  }
  document.addEventListener('DOMContentLoaded',()=>{
    initGlobal();
    switch(getPage()){
      case 'index':initHome();break;
      case 'products':initShop();break;
      case 'product':initProduct();break;
      case 'checkout':initCheckout();break;
      case 'payment-success':case 'thank-you':initCompletion();break;
    }
  });
})();
