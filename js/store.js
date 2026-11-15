'use strict';

const MMS_STORE = (() => {
  const CART_KEY = 'mms-cart-v1';
  const ORDERS_KEY = 'mms-orders-v1';
  const products = [
    {id:'p1',name:'Protein Smoothie',category:'Drinks',price:4.50,icon:'🥤',description:'A chilled high-protein fruit smoothie.'},
    {id:'p2',name:'Electrolyte Water',category:'Drinks',price:2.20,icon:'💧',description:'Refreshing hydration for active sessions.'},
    {id:'p3',name:'Oat Energy Bar',category:'Snacks',price:1.80,icon:'🍫',description:'Oats, seeds and dried fruit in a compact snack.'},
    {id:'p4',name:'Fruit Cup',category:'Snacks',price:3.10,icon:'🍓',description:'Fresh mixed fruit prepared for collection.'},
    {id:'p5',name:'Resistance Band',category:'Equipment',price:8.99,icon:'🏋️',description:'Light resistance band for warm-up and mobility.'},
    {id:'p6',name:'MMS Water Bottle',category:'Equipment',price:7.50,icon:'🧴',description:'Reusable 750 ml sports bottle.'}
  ];
  const read = key => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const cart = () => read(CART_KEY);
  const saveCart = items => write(CART_KEY, items);
  const add = id => {
    const item = products.find(p => p.id === id); if (!item) return;
    const items = cart(); const existing = items.find(x => x.id === id);
    if (existing) existing.quantity = Math.min(existing.quantity + 1, 10); else items.push({id,quantity:1});
    saveCart(items); updateCartCount();
  };
  const update = (id, quantity) => {
    const items = cart(); const target = items.find(x => x.id === id);
    if (!target) return; target.quantity = Math.max(1, Math.min(Number(quantity) || 1, 10)); saveCart(items);
  };
  const remove = id => saveCart(cart().filter(x => x.id !== id));
  const detailedCart = () => cart().map(i => ({...products.find(p=>p.id===i.id),quantity:i.quantity})).filter(x=>x.id);
  const total = () => detailedCart().reduce((sum,x)=>sum+x.price*x.quantity,0);
  const orders = () => read(ORDERS_KEY);
  const mine = () => {
    const user = window.MMS_AUTH?.currentUser?.();
    return user ? orders().filter(o => o.userId === user.id) : [];
  };
  const placeOrder = details => {
    const user = window.MMS_AUTH?.currentUser?.();
    if (!user) throw new Error('Please log in before placing an order.');
    const items = detailedCart(); if (!items.length) throw new Error('Your cart is empty.');
    const all = orders();
    const order = {id:`ORD-${Date.now().toString().slice(-8)}`,userId:user.id,items,total:total(),customerName:details.customerName,email:details.email,collection:details.collection,payment:details.payment,notes:details.notes,status:'Pending collection',createdAt:new Date().toISOString()};
    all.unshift(order); write(ORDERS_KEY,all); saveCart([]); return order;
  };
  function updateCartCount(){const el=document.getElementById('cart-count');if(el)el.textContent=cart().reduce((n,x)=>n+x.quantity,0);}
  return {products,cart,add,update,remove,detailedCart,total,orders,mine,placeOrder,updateCartCount};
})();
window.MMS_STORE = MMS_STORE;

function money(value){return `£${Number(value).toFixed(2)}`;}
function showMessage(el,text,error=false){if(!el)return;el.textContent=text;el.className=error?'form-message error':'form-message success';}

const productGrid=document.getElementById('product-grid');
function renderProducts(){if(!productGrid)return;const category=document.getElementById('product-category')?.value||'all';const q=(document.getElementById('product-search')?.value||'').trim().toLowerCase();const list=MMS_STORE.products.filter(p=>(category==='all'||p.category===category)&&(!q||`${p.name} ${p.description}`.toLowerCase().includes(q)));productGrid.innerHTML=list.length?list.map(p=>`<article class="product-card"><div class="product-icon" aria-hidden="true">${p.icon}</div><span class="sport-pill">${p.category}</span><h2>${p.name}</h2><p>${p.description}</p><div class="product-card-footer"><strong>${money(p.price)}</strong><button class="button button-small" type="button" data-add-product="${p.id}">Add to cart</button></div></article>`).join(''):'<div class="empty-state"><h2>No products found</h2><p>Try a different category or search term.</p></div>';}
if(productGrid){renderProducts();MMS_STORE.updateCartCount();document.getElementById('product-category')?.addEventListener('change',renderProducts);document.getElementById('product-search')?.addEventListener('input',renderProducts);productGrid.addEventListener('click',e=>{const b=e.target.closest('[data-add-product]');if(b){MMS_STORE.add(b.dataset.addProduct);const old=b.textContent;b.textContent='Added';setTimeout(()=>b.textContent=old,700);}});}

const cartList=document.getElementById('cart-list');
function renderCart(){if(!cartList)return;const items=MMS_STORE.detailedCart();cartList.innerHTML=items.length?items.map(x=>`<article class="cart-row"><div><h2>${x.name}</h2><p>${money(x.price)} each</p></div><label>Quantity<input type="number" min="1" max="10" value="${x.quantity}" data-cart-quantity="${x.id}"></label><strong>${money(x.price*x.quantity)}</strong><button class="text-button danger-text" type="button" data-remove-product="${x.id}">Remove</button></article>`).join(''):'<div class="empty-state"><h2>Your cart is empty</h2><p>Add a healthy product to continue.</p><a class="button" href="products.html">Browse products</a></div>';const total=document.getElementById('cart-total');if(total)total.textContent=money(MMS_STORE.total());const link=document.getElementById('checkout-link');if(link){link.classList.toggle('disabled-link',!items.length);link.setAttribute('aria-disabled',String(!items.length));}}
if(cartList){renderCart();cartList.addEventListener('change',e=>{if(e.target.matches('[data-cart-quantity]')){MMS_STORE.update(e.target.dataset.cartQuantity,e.target.value);renderCart();}});cartList.addEventListener('click',e=>{const b=e.target.closest('[data-remove-product]');if(b){MMS_STORE.remove(b.dataset.removeProduct);renderCart();}});document.getElementById('checkout-link')?.addEventListener('click',e=>{if(!MMS_STORE.detailedCart().length)e.preventDefault();});}

const checkoutForm=document.getElementById('checkout-form');
if(checkoutForm){const user=window.MMS_AUTH?.currentUser?.();if(!user){window.location.replace('login.html?required=1');}else{checkoutForm.customerName.value=user.name||'';checkoutForm.email.value=user.email||'';const items=MMS_STORE.detailedCart();if(!items.length)window.location.replace('cart.html');const summary=document.getElementById('checkout-summary');if(summary)summary.innerHTML=`<h2>Order summary</h2>${items.map(x=>`<p>${x.quantity} × ${x.name}<strong>${money(x.quantity*x.price)}</strong></p>`).join('')}<p class="summary-total">Total<strong>${money(MMS_STORE.total())}</strong></p>`;checkoutForm.addEventListener('submit',e=>{e.preventDefault();const msg=checkoutForm.querySelector('.form-message');if(!checkoutForm.checkValidity()){checkoutForm.reportValidity();showMessage(msg,'Please complete the required fields.',true);return;}try{const order=MMS_STORE.placeOrder(Object.fromEntries(new FormData(checkoutForm)));showMessage(msg,`Order ${order.id} placed successfully. Opening your order history…`);setTimeout(()=>window.location.href='member/orders.html',500);}catch(err){showMessage(msg,err.message,true);}});}}

const orderList=document.getElementById('order-list');
if(orderList){const list=MMS_STORE.mine();orderList.innerHTML=list.length?list.map(o=>`<article class="order-row"><div class="request-heading"><h2>${o.id}</h2><span class="status-badge pending">${o.status}</span></div><p>${new Date(o.createdAt).toLocaleString()} · ${o.collection}</p><ul>${o.items.map(i=>`<li>${i.quantity} × ${i.name}</li>`).join('')}</ul><strong>${money(o.total)}</strong><p class="helper-text">${o.payment}</p></article>`).join(''):'<div class="empty-state"><h2>No orders yet</h2><p>Your completed orders will appear here.</p></div>';}
