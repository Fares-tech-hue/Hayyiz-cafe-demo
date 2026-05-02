import { initializeApp }                                          from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getDatabase, ref, onValue, update, remove, query,
         orderByChild, equalTo, get }                            from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js";
 
const firebaseConfig = {
  apiKey: "AIzaSyAfEM2DWNy8dS_b5lCvmja3bNlT13tpyqY",
  authDomain: "hayyiz-cafe.firebaseapp.com",
  projectId: "hayyiz-cafe",
  storageBucket: "hayyiz-cafe.firebasestorage.app",
  messagingSenderId: "210435234772",
  appId: "1:210435234772:web:76e433383200d79c7fd441",
  measurementId: "G-YR2G8V5G1T"
};
 
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
 
let allOrders   = {};
let soundOn     = true;
let isFirstLoad = true;
 
/* ── Clock ── */
function tick() {
  document.getElementById('clock').textContent =
    new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}
tick(); setInterval(tick, 1000);
 
/* ── Elapsed time ── */
function elapsed(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1)  return 'الآن';
  if (m < 60) return `${m} د`;
  return `${Math.floor(m / 60)} س`;
}
 
/* ── Sound toggle ── */
document.getElementById('soundBtn').addEventListener('click', () => {
  soundOn = !soundOn;
  document.getElementById('soundIcon').className = soundOn ? 'fas fa-bell' : 'fas fa-bell-slash';
  document.getElementById('soundBtn').classList.toggle('muted', !soundOn);
});
 
/* ── Notification beep ── */
function beep() {
  if (!soundOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o1 = ctx.createOscillator(), g1 = ctx.createGain();
    o1.connect(g1); g1.connect(ctx.destination);
    o1.type = 'sine';
    o1.frequency.setValueAtTime(880, ctx.currentTime);
    g1.gain.setValueAtTime(0.28, ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    o1.start(ctx.currentTime); o1.stop(ctx.currentTime + 0.3);
    const o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o2.connect(g2); g2.connect(ctx.destination);
    o2.type = 'sine';
    o2.frequency.setValueAtTime(1046, ctx.currentTime + 0.25);
    g2.gain.setValueAtTime(0, ctx.currentTime + 0.25);
    g2.gain.setValueAtTime(0.28, ctx.currentTime + 0.26);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    o2.start(ctx.currentTime + 0.25); o2.stop(ctx.currentTime + 0.7);
  } catch(e) {}
}
 
/* ── Toast ── */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
}
 
/* ── Confirm modal ── */
let pendingAction = null;
 
function openModal(title, desc, onConfirm) {
  document.getElementById('modalTitle').textContent   = title;
  document.getElementById('modalDesc').textContent    = desc;
  document.getElementById('confirmModal').classList.add('show');
  pendingAction = onConfirm;
}
 
document.getElementById('modalCancel').addEventListener('click', () => {
  document.getElementById('confirmModal').classList.remove('show');
  pendingAction = null;
});
 
document.getElementById('modalConfirm').addEventListener('click', () => {
  document.getElementById('confirmModal').classList.remove('show');
  if (pendingAction) { pendingAction(); pendingAction = null; }
});
 
document.getElementById('confirmModal').addEventListener('click', e => {
  if (e.target === document.getElementById('confirmModal')) {
    document.getElementById('confirmModal').classList.remove('show');
    pendingAction = null;
  }
});
 
/* ── Firebase CRUD ── */
const setStatus = (id, s) => update(ref(db, `orders/${id}`), { status: s });
const delOrder  = id      => remove(ref(db, `orders/${id}`));
 
async function deleteByStatus(status) {
  const matches = Object.values(allOrders).filter(o => o.status === status);
  await Promise.all(matches.map(o => remove(ref(db, `orders/${o.id}`))));
  const labels = { new: 'الجديدة', preparing: 'قيد التحضير', done: 'المسلّمة' };
  showToast(`✅ تم مسح الطلبات ${labels[status]}`);
}
 
/* ── Clear-column buttons ── */
document.getElementById('clearNew').addEventListener('click', () => {
  const count = Object.values(allOrders).filter(o => o.status === 'new').length;
  if (!count) { showToast('لا يوجد طلبات لمسحها'); return; }
  openModal('مسح الطلبات الجديدة', `سيتم حذف ${count} طلب نهائياً.`, () => deleteByStatus('new'));
});
 
document.getElementById('clearPrep').addEventListener('click', () => {
  const count = Object.values(allOrders).filter(o => o.status === 'preparing').length;
  if (!count) { showToast('لا يوجد طلبات لمسحها'); return; }
  openModal('مسح طلبات التحضير', `سيتم حذف ${count} طلب نهائياً.`, () => deleteByStatus('preparing'));
});
 
document.getElementById('clearDone').addEventListener('click', () => {
  const count = Object.values(allOrders).filter(o => o.status === 'done').length;
  if (!count) { showToast('لا يوجد طلبات لمسحها'); return; }
  openModal('مسح الطلبات المسلّمة', `سيتم حذف ${count} طلب نهائياً.`, () => deleteByStatus('done'));
});
 
/* ── Firebase listener ── */
onValue(ref(db, 'orders'), snap => {
  const prevCount = Object.keys(allOrders).length;
  allOrders = {};
  if (snap.exists()) snap.forEach(c => { allOrders[c.key] = { id: c.key, ...c.val() }; });
 
  if (!isFirstLoad && Object.keys(allOrders).length > prevCount) {
    beep();
    showToast('🔔 طلب جديد وصل!');
  }
  isFirstLoad = false;
  render();
});
 
/* Refresh timers every minute */
setInterval(() => { if (Object.keys(allOrders).length) render(); }, 60000);
 
/* ── Render ── */
function render() {
  const orders  = Object.values(allOrders).sort((a, b) => a.timestamp - b.timestamp);
  const buckets = { new: [], preparing: [], done: [] };
  orders.forEach(o => { if (buckets[o.status]) buckets[o.status].push(o); });
 
  document.getElementById('sNew').textContent  = buckets.new.length;
  document.getElementById('sPrep').textContent = buckets.preparing.length;
  document.getElementById('sDone').textContent = buckets.done.length;
  document.getElementById('sRev').textContent  = orders.reduce((s, o) => s + (o.total || 0), 0);
 
  document.getElementById('countNew').textContent  = buckets.new.length;
  document.getElementById('countPrep').textContent = buckets.preparing.length;
  document.getElementById('countDone').textContent = buckets.done.length;
 
  renderCol('colNew',  'emptyNew',  buckets.new,       'new');
  renderCol('colPrep', 'emptyPrep', buckets.preparing, 'preparing');
  renderCol('colDone', 'emptyDone', buckets.done,      'done');
}
 
function renderCol(colId, emptyId, orders, status) {
  const col   = document.getElementById(colId);
  const empty = document.getElementById(emptyId);
  col.querySelectorAll('.order-card').forEach(c => c.remove());
 
  if (!orders.length) { empty.style.display = 'flex'; return; }
  empty.style.display = 'none';
 
  orders.forEach(order => {
    const mins   = Math.floor((Date.now() - order.timestamp) / 60000);
    const urgent = status === 'preparing' && mins >= 5;
    const t      = new Date(order.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
 
    const name = order.customerName || 'زبون';
 
    let typePill = '';
    let locationPill = '';
 
    if (order.orderType === 'takeaway') {
      typePill = `<span class="order-type-pill takeaway"><i class="fas fa-car"></i> استلام بالسيارة</span>`;
      if (order.carPlate) {
        locationPill = `<span class="location-pill"><i class="fas fa-id-card"></i> ${order.carPlate.letters} ${order.carPlate.numbers}</span>`;
      }
    } else {
      typePill = `<span class="order-type-pill dine-in"><i class="fas fa-utensils"></i> داخل المطعم</span>`;
      if (order.tableNumber) {
        locationPill = `<span class="location-pill"><i class="fas fa-table"></i> طاولة ${order.tableNumber}</span>`;
      }
    }
 
    const items = (order.items || []).map(i => `
      <div class="card-item">
        <span class="card-item-icon">${i.icon || '☕'}</span>
        <span class="card-item-name">${i.name}</span>
        <span class="card-item-qty">×${i.quantity}</span>
      </div>`).join('');
 
    /* ── Action buttons: always show the correct move button ── */
    let actions = '';
    if (status === 'new') {
      actions = `
        <button class="card-btn btn-prepare" data-id="${order.id}" data-action="preparing">
          <i class="fas fa-fire"></i> ابدأ التحضير
        </button>`;
    }
    if (status === 'preparing') {
      actions = `
        <button class="card-btn btn-done" data-id="${order.id}" data-action="done">
          <i class="fas fa-check"></i> تم التسليم
        </button>`;
    }
    /* done column: no move button, only delete */
    actions += `<button class="card-btn btn-del" data-id="${order.id}" data-action="delete" title="حذف الطلب"><i class="fas fa-xmark"></i></button>`;
 
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <div class="card-top">
        <span class="card-id">#${order.id.slice(-5).toUpperCase()}</span>
        <span class="card-timer${urgent ? ' urgent' : ''}">${elapsed(order.timestamp)}</span>
        <span class="card-time">${t}</span>
      </div>
      <div class="card-customer">
        <span class="customer-name"><i class="fas fa-user"></i>${name}</span>
        ${typePill}
        ${locationPill}
      </div>
      <div class="card-items">${items}</div>
      <div class="card-foot">
        <span class="card-total">${order.total} ر.س</span>
        <div class="card-actions">${actions}</div>
      </div>`;
 
    card.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.action === 'delete') {
          delOrder(btn.dataset.id);
        } else {
          setStatus(btn.dataset.id, btn.dataset.action);
        }
      });
    });
 
    col.appendChild(card);
  });
}
 