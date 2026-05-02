import { initializeApp }          from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAnalytics }           from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAfEM2DWNy8dS_b5lCvmja3bNlT13tpyqY",
  authDomain:        "hayyiz-cafe.firebaseapp.com",
  projectId:         "hayyiz-cafe",
  storageBucket:     "hayyiz-cafe.firebasestorage.app",
  messagingSenderId: "210435234772",
  appId:             "1:210435234772:web:76e433383200d79c7fd441",
  measurementId:     "G-YR2G8V5G1T"
};

const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db        = getDatabase(app);

/* ── State ── */
let cart      = [];
let orderType = 'dine-in';

/* ── Custom cursor ── */
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');

if (cursor && cursorRing) {
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  function animateCursor() {
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    cursorRing.style.left = rx + 'px';
    cursorRing.style.top  = ry + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  document.querySelectorAll('a, button, [data-filter]').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

/* ── Navbar scroll ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── Mobile menu ──
   Opening: hamburger button (in nav) toggles the overlay open.
   Closing:  the dedicated close button INSIDE the overlay handles it.
             Also closed by clicking any nav link or pressing Escape.
*/
const mobileMenu      = document.getElementById('mobileMenu');
const hamburger       = document.getElementById('hamburger');
const mobileMenuClose = document.getElementById('mobileMenuClose');

function openMobileMenu() {
  mobileMenu.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', openMobileMenu);
mobileMenuClose.addEventListener('click', closeMobileMenu);

mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', closeMobileMenu);
});

/* ── Category filter ── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.filter;
    document.querySelectorAll('.product-card').forEach(card => {
      const show = cat === 'all' || card.dataset.category === cat;
      card.classList.toggle('hidden', !show);
    });
  });
});

/* ── Cart open / close ── */
const cartPanel   = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');

function openCart() {
  cartPanel.classList.add('open');
  cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartPanel.classList.remove('open');
  cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('cartTriggerBtn').addEventListener('click', openCart);
document.getElementById('cartCloseBtn').addEventListener('click', closeCart);
document.getElementById('mobileCartOpenBtn').addEventListener('click', openCart);
cartOverlay.addEventListener('click', closeCart);

/* ── Order type toggle ── */
const btnDineIn   = document.getElementById('btnDineIn');
const btnTakeaway = document.getElementById('btnTakeaway');
const dineInSec   = document.getElementById('dineInSection');
const takeawaySec = document.getElementById('takeawaySection');

btnDineIn.addEventListener('click', () => {
  orderType = 'dine-in';
  btnDineIn.classList.add('active');
  btnTakeaway.classList.remove('active');
  dineInSec.classList.add('visible');
  takeawaySec.classList.remove('visible');
});

btnTakeaway.addEventListener('click', () => {
  orderType = 'takeaway';
  btnTakeaway.classList.add('active');
  btnDineIn.classList.remove('active');
  takeawaySec.classList.add('visible');
  dineInSec.classList.remove('visible');
});

/* ── Add to cart ── */
function addToCart(name, price, icon) {
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ name, price: Number(price), icon: icon || '☕', quantity: 1 });
  }
  renderCart();
  bumpBadge();
  openCart();
}

document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    addToCart(btn.dataset.name, btn.dataset.price, btn.dataset.icon);
  });
});

/* ── Quantity controls ── */
function changeQty(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) cart.splice(index, 1);
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
}

function clearCart() {
  if (!cart.length) return;
  cart = [];
  renderCart();
}

document.getElementById('clearBtn').addEventListener('click', clearCart);

/* ── Badge bump ── */
function bumpBadge() {
  const badge = document.getElementById('cartCount');
  badge.classList.remove('bump');
  void badge.offsetWidth;
  badge.classList.add('bump');
  setTimeout(() => badge.classList.remove('bump'), 300);
}

/* ── Render cart ── */
function renderCart() {
  const itemsEl     = document.getElementById('cartItems');
  const emptyEl     = document.getElementById('cartEmpty');
  const footerEl    = document.getElementById('cartFooter');
  const infoSec     = document.getElementById('orderInfoSection');
  const countBadge  = document.getElementById('cartCount');
  const headerCount = document.getElementById('cartHeaderCount');
  const footerCount = document.getElementById('footerCount');
  const totalEl     = document.getElementById('cartTotal');
  const mbBar       = document.getElementById('mobileCartBar');
  const mbCount     = document.getElementById('mbCount');
  const mbTotal     = document.getElementById('mbTotal');

  let total = 0, totalQty = 0;
  itemsEl.innerHTML = '';

  cart.forEach((item, i) => {
    total    += item.price * item.quantity;
    totalQty += item.quantity;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-icon">${item.icon}</div>
      <div class="cart-item-info">
        <strong>${item.name}</strong>
        <span>${item.price} ر.س × ${item.quantity} = ${item.price * item.quantity} ر.س</span>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn remove" data-action="remove" data-index="${i}" title="حذف">
          <i class="fas fa-trash" style="font-size:.6rem"></i>
        </button>
        <button class="qty-btn" data-action="minus" data-index="${i}">−</button>
        <span class="qty-num">${item.quantity}</span>
        <button class="qty-btn" data-action="plus" data-index="${i}">+</button>
      </div>`;
    itemsEl.appendChild(div);
  });

  itemsEl.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.index);
      if      (btn.dataset.action === 'remove') removeItem(idx);
      else if (btn.dataset.action === 'minus')  changeQty(idx, -1);
      else if (btn.dataset.action === 'plus')   changeQty(idx, 1);
    });
  });

  const isEmpty = cart.length === 0;
  emptyEl.style.display  = isEmpty ? 'flex' : 'none';
  footerEl.style.display = isEmpty ? 'none'  : 'block';
  infoSec.style.display  = isEmpty ? 'none'  : 'block';

  countBadge.textContent  = totalQty;
  headerCount.textContent = totalQty + ' منتج';
  footerCount.textContent = totalQty + ' منتج';
  totalEl.textContent     = total + ' ر.س';

  mbBar.style.display = (!isEmpty && window.innerWidth <= 768) ? 'flex' : 'none';
  mbCount.textContent = totalQty + ' منتج';
  mbTotal.textContent = total + ' ر.س';
}

/* ── Checkout ── */
document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (!cart.length) return;

  const customerName = document.getElementById('customerName').value.trim();
  const tableNumber  = document.getElementById('tableNumber').value.trim();
  const plateLetter  = document.getElementById('plateLetter').value.trim();
  const plateNumber  = document.getElementById('plateNumber').value.trim();

  if (!customerName) {
    alert('من فضلك أدخل اسمك.');
    document.getElementById('customerName').focus();
    return;
  }

  if (orderType === 'dine-in' && !tableNumber) {
    alert('من فضلك أدخل رقم الطاولة.');
    document.getElementById('tableNumber').focus();
    return;
  }

  if (orderType === 'takeaway' && (!plateLetter || !plateNumber)) {
    alert('من فضلك أدخل لوحة السيارة كاملة.');
    (!plateLetter ? document.getElementById('plateLetter') : document.getElementById('plateNumber')).focus();
    return;
  }

  const orderData = {
    customerName,
    orderType,
    tableNumber: orderType === 'dine-in' ? tableNumber : null,
    carPlate:    orderType === 'takeaway' ? { letters: plateLetter.toUpperCase(), numbers: plateNumber } : null,
    items:       cart,
    total:       cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    status:      'new',
    timestamp:   Date.now()
  };

  push(ref(db, 'orders'), orderData)
    .then(() => {
      alert(`شكراً ${customerName}! تم إرسال طلبك ✅`);
      clearCart();
      closeCart();
      ['customerName', 'tableNumber', 'plateLetter', 'plateNumber'].forEach(id => {
        document.getElementById(id).value = '';
      });
    })
    .catch(err => console.error('خطأ في إرسال الطلب:', err));
});

/* ── Scroll reveal ── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── ESC ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeCart();
    closeMobileMenu();
  }
});

window.addEventListener('resize', renderCart, { passive: true });
renderCart();
