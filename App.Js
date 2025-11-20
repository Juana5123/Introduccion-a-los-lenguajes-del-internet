const API_PRODUCTS = 'https://fakestoreapi.com/products';
const LOGIN_API = 'https://reqres.in/api/login';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const catalogEl = $('#catalogo-productos');
const templateCard = $('#product-card-template');
const modalLogin = $('#modal-login');
const btnLogin = $('#btn-login');
const btnLogout = $('#btn-logout');
const btnOpenCart = $('#btn-open-cart');
const cartEl = $('#carrito');
const cartItemsEl = $('#carrito-items');
const cartTotalEl = $('#cart-total');
const cartCountEl = $('#cart-count');
const btnClearCart = $('#btn-clear-cart');
const btnCheckout = $('#btn-checkout');
const userGreeting = $('#user-greeting');
const usernameEl = $('#username');

const formLogin = $('#form-login');
const loginEmail = $('#login-email');
const loginPassword = $('#login-password');
const loginError = $('#login-error');
const demoLoginBtn = $('#demo-login');
const closeLoginBtn = $('#close-login');

const carrito = {
  items: [],
  agregarItem(product){
    const existing = this.items.find(i=>i.id===product.id);
    if(existing){
      existing.qty += 1;
    } else {
      this.items.push({
        id: product.id,
        title: product.title,
        price: product.price,
        qty: 1,
        desc: product.customDesc,
        image: product.image
      });
    }
    this.persist();
  },
  quitarItem(productId){
    this.items = this.items.filter(i=>i.id !== productId);
    this.persist();
  },
  cambiarCantidad(productId, qty){
    const it = this.items.find(i=>i.id===productId);
    if(!it) return;
    it.qty = Math.max(1, qty);
    this.persist();
  },
  calcularTotal(){
    return this.items.reduce((s,i)=> s + i.price * i.qty, 0);
  },
  vaciar(){
    this.items = [];
    this.persist();
  },
  renderizarCarrito(){
    cartItemsEl.innerHTML = '';
    if(this.items.length === 0){
      cartItemsEl.innerHTML = '<p>Tu carrito esta vacio.</p>';
    } else {
      this.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
          <img src="${item.image}" alt="${escapeHtml(item.title)}" />
          <div class="ci-info">
            <div style="font-weight:600">${escapeHtml(item.title)}</div>
            <div style="font-size:.9rem;color:#6b7280">${escapeHtml(item.desc)}</div>
            <div style="margin-top:.35rem;font-weight:700;">$${(item.price).toFixed(2)}</div>
          </div>
          <div class="ci-actions">
            <button class="btn-qty" data-action="minus" data-id="${item.id}">-</button>
            <div style="min-width:28px;text-align:center">${item.qty}</div>
            <button class="btn-qty" data-action="plus" data-id="${item.id}">+</button>
            <button style="margin-left:.4rem" data-action="remove" data-id="${item.id}">Eliminar</button>
          </div>
        `;
        cartItemsEl.appendChild(div);
      });
    }
    cartTotalEl.textContent = this.calcularTotal().toFixed(2);
    cartCountEl.textContent = this.items.reduce((s,i)=>s+i.qty,0);
  },

  persist(){
    localStorage.setItem('miCarrito', JSON.stringify(this.items));
    this.renderizarCarrito();
  },

  restore(){
    try{
      const raw = localStorage.getItem('miCarrito');
      if(raw) this.items = JSON.parse(raw);
    }catch(e){ this.items = []; }
    this.renderizarCarrito();
  }
};

function escapeHtml(text){
  if(!text) return '';
  return text.replace(/[&<>"']/g, (ch) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  })[ch]);
}

function generateCustomDescription(p){

  const categoryPhrases = {
    "men's clothing": "Diseño para obtener una gran comodidad todos los dias",
    "women's clothing": "Elegante perfecto para cualquier ocasion",
    "jewelery": "Pieza con acabados detallados",
    "electronics": "Tecnologia con alto rendimiento",
    "default": "Producto especialmente eligido por su gran calidad y precio"
  };
  const base = categoryPhrases[p.category] || categoryPhrases['default'];
  // Añadir un toque con el precio
  const priceHint = p.price > 100 ? "un articulo premium" : "excelente compra";
  return `${base} Es ${priceHint}`;
}

async function cargarYRenderizarProductos(){
  try{
    const resp = await fetch(API_PRODUCTS);
    if(!resp.ok) throw new Error('No se pudo obtener productos');
    const productos = await resp.json();
    const productosConDesc = productos.map(p => {
      return {
        ...p,
        customDesc: generateCustomDescription(p)
      };
    });

    renderCatalogo(productosConDesc);
  } catch(err){
    catalogEl.innerHTML = `<p>Error cargando productos: ${err.message}</p>`;
    console.error(err);
  }
}

function renderCatalogo(productos){
  catalogEl.innerHTML = '';
  productos.forEach(p => {
    const tpl = templateCard.content.cloneNode(true);
    const card = tpl.querySelector('.product-card');
    const img = card.querySelector('.product-image');
    const title = card.querySelector('.product-title');
    const desc = card.querySelector('.product-desc');
    const price = card.querySelector('.product-price');
    const btn = card.querySelector('.btn-add');

    img.src = p.image;
    img.alt = p.title;
    title.textContent = p.title;
    desc.textContent = p.customDesc;
    price.textContent = `$${p.price.toFixed(2)}`;

    btn.addEventListener('click', () => {
      carrito.agregarItem(p);
      carrito.renderizarCarrito();
    });

    catalogEl.appendChild(card);
  });
}
document.addEventListener('click', (ev) => {
  const a = ev.target;
  if(a.matches('[data-action="remove"]')){
    const id = Number(a.dataset.id);
    carrito.quitarItem(id);
  } else if(a.matches('[data-action="plus"]')){
    const id = Number(a.dataset.id);
    const it = carrito.items.find(i=>i.id===id);
    if(it) carrito.cambiarCantidad(id, it.qty + 1);
  } else if(a.matches('[data-action="minus"]')){
    const id = Number(a.dataset.id);
    const it = carrito.items.find(i=>i.id===id);
    if(it) carrito.cambiarCantidad(id, Math.max(1, it.qty - 1));
  }
});

btnOpenCart.addEventListener('click', () => {
  cartEl.classList.toggle('hidden');
});

btnClearCart.addEventListener('click', () => {
  if(confirm('Desea vaciar el carrito?')) carrito.vaciar();
});

btnCheckout.addEventListener('click', () => {
  if(carrito.items.length === 0) {
    alert('El carrito esta vacio.');
    return;
  }
  alert(`Total: $${carrito.calcularTotal().toFixed(2)} Gracias por tu compra (demo).`);
  carrito.vaciar();
});
btnLogin.addEventListener('click', () => {
  modalLogin.classList.remove('hidden');
});

closeLoginBtn.addEventListener('click', () => {
  modalLogin.classList.add('hidden');
  loginError.classList.add('hidden');
});

demoLoginBtn.addEventListener('click', () => {
  loginEmail.value = 'eve.holt@reqres.in';
  loginPassword.value = 'cityslicka';
});

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  try{
    const res = await fetch(LOGIN_API, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email,password})
    });
    const data = await res.json();
    if(res.ok && data.token){
      localStorage.setItem('miTokenDemo', data.token);
      localStorage.setItem('miUsuario', email);
      modalLogin.classList.add('hidden');
      updateUIForAuth();
    } else {
      throw new Error(data.error || 'Credenciales incorrectas');
    }
  }catch(err){
    loginError.textContent = err.message;
    loginError.classList.remove('hidden');
  }
});

btnLogout.addEventListener('click', () =>{
  localStorage.removeItem('miTokenDemo');
  localStorage.removeItem('miUsuario');
  updateUIForAuth();
});

function updateUIForAuth(){
  const token = localStorage.getItem('miTokenDemo');
  const user = localStorage.getItem('miUsuario');
  if(token){
    userGreeting.classList.remove('hidden');
    usernameEl.textContent = user || 'usuario';
    btnLogin.classList.add('hidden');
    btnLogout.classList.remove('hidden');
  } else {
    userGreeting.classList.add('hidden');
    usernameEl.textContent = '';
    btnLogin.classList.remove('hidden');
    btnLogout.classList.add('hidden');
  }
}

function init(){
  carrito.restore();
  updateUIForAuth();
  cargarYRenderizarProductos();
}

init();
