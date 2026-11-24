// ============================================================
// TechStore - E-commerce (script.js corrigido)
// ============================================================

// --- ESTADO INICIAL (com leitura segura do localStorage) ---
let products = [];
let cart = readStorage('ecommerce_cart', []);
let currentUser = readStorage('ecommerce_user', null);
let isRegisterMode = false;

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Lê o localStorage e devolve o valor parseado, ou o fallback se vazio/corrompido. */
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === '') return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (err) {
    console.warn(`localStorage "${key}" corrompido — ignorando.`, err);
    localStorage.removeItem(key);
    return fallback;
  }
}

/** Formata um número como moeda brasileira (ex.: R$ 4.299,90). */
function formatPrice(value) {
  return BRL.format(Number(value) || 0);
}

// --- 1. CARREGAR PRODUTOS ---
async function fetchProducts() {
  const grid = document.getElementById('product-grid');

  // Em um app real, aqui haveria um fetch('/api/produtos').
  // Como não há backend nesta versão, os produtos ficam em um array local.
  const serverProducts = [
    {
      id: 1,
      title: 'Notebook Pro 15" 16GB RAM',
      price: 4299.90,
      image: 'https://images.kabum.com.br/produtos/fotos/430136/notebook-gamer-asus-vivobook-pro-15-intel-core-i9-11900h-16gb-ram-geforce-rtx3050-ssd-512gb-15-6-full-hd-windows-11-azul-escuro-k6502hc-lp095w_1710268975_gg.jpg',
    },
    {
      id: 2,
      title: 'Fone Bluetooth Noise Cancelling',
      price: 549.00,
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_IlQ0IV4A6gQjtjvO4l85d_XD7lK2ypbcBIMc_-V2ug&s=10',
    },
    {
      id: 3,
      title: 'Smartwatch Esportivo GPS',
      price: 899.90,
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_IlQ0IV4A6gQjtjvO4l85d_XD7lK2ypbcBIMc_-V2ug&s=10',
    },
    {
      id: 4,
      title: 'Teclado Mecânico RGB',
      price: 349.50,
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0Ze-wjRbSQZg5dEyMCCvHAqOWvLWHMePRB39DZdyooQ&s=10',
    },
    {
      id: 5,
      title: 'Câmera Digital 4K',
      price: 2790.00,
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWGjcsbFTTACNQfoYbeLEs1Aqv-kss2oBgt9Sr1eUDhA&s=10',
    },
    {
      id: 6,
      title: 'Tênis Running Ultra Leve',
      price: 429.90,
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0u9Pxb5tJhuskiag9kZPWUoKm-HfQLMQty3_rUgn0dg&s=10s',
    },
  ];

  products = serverProducts;
  renderProducts();
}

/** Desenha a grade de produtos no DOM. */
function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = '<p>Nenhum produto disponível no momento.</p>';
    return;
  }

  grid.innerHTML = products
    .map(
      (p) => `
    <div class="card">
      <div>
        <img src="${p.image}" alt="${p.title}" loading="lazy" width="400" height="300"
             onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
        <div class="img-fallback" style="display:none;">Imagem indisponível</div>
        <h3>${p.title}</h3>
      </div>
      <div>
        <div class="price">${formatPrice(p.price)}</div>
        <button style="width: 100%;" onclick="addToCart(${p.id})">Adicionar ao Carrinho</button>
      </div>
    </div>`
    )
    .join('');
}

// --- 2. LOGIN E CADASTRO ---
function switchAuthMode(e) {
  e.preventDefault();
  isRegisterMode = !isRegisterMode;

  const nameField = document.getElementById('name-field');
  const nameInput = document.getElementById('auth-name');

  document.getElementById('auth-title').textContent = isRegisterMode ? 'Criar Conta' : 'Entrar';
  document.getElementById('auth-submit').textContent = isRegisterMode ? 'Cadastrar' : 'Entrar';
  nameField.style.display = isRegisterMode ? 'block' : 'none';
  nameInput.required = isRegisterMode;

  document.getElementById('auth-switch').textContent = isRegisterMode
    ? 'Já tem conta? Faça login'
    : 'Não tem conta? Cadastre-se';
}

function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name').value.trim();
  const users = readStorage('ecommerce_users_db', []);

  if (isRegisterMode) {
    if (!name) {
      alert('Por favor, preencha seu nome.');
      return;
    }
    if (!email || !password) {
      alert('Preencha e-mail e senha.');
      return;
    }
    if (password.length < 6) {
      alert('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (users.some((u) => u.email === email)) {
      alert('Este e-mail já está cadastrado!');
      return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('ecommerce_users_db', JSON.stringify(users));
    loginUser(newUser);
  } else {
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) {
      alert('E-mail ou senha inválidos!');
      return;
    }
    loginUser(user);
  }

  document.getElementById('auth-form').reset();
  toggleModal('auth-modal');
}

function loginUser(user) {
  currentUser = { name: user.name, email: user.email };
  localStorage.setItem('ecommerce_user', JSON.stringify(currentUser));
  updateAuthUI();
}

function logout() {
  currentUser = null;
  localStorage.removeItem('ecommerce_user');
  updateAuthUI();
}

function updateAuthUI() {
  const greeting = document.getElementById('user-greeting');
  const btnAuth = document.getElementById('btn-auth');

  if (currentUser) {
    greeting.textContent = `Olá, ${currentUser.name}`;
    btnAuth.textContent = 'Sair';
    btnAuth.onclick = logout;
  } else {
    greeting.textContent = 'Visitante';
    btnAuth.textContent = 'Entrar / Cadastrar';
    btnAuth.onclick = () => toggleModal('auth-modal');
  }
}

// --- 3. CARRINHO COM LOCALSTORAGE ---
function saveCart() {
  try {
    localStorage.setItem('ecommerce_cart', JSON.stringify(cart));
  } catch (err) {
    console.warn('Não foi possível salvar o carrinho.', err);
  }
  renderCart();
}

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: Number(product.price),
      image: product.image,
      qty: 1,
    });
  }
  saveCart();
}

function updateQty(productId, delta) {
  const item = cart.find((i) => i.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((i) => i.id !== productId);
  }
  saveCart();
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');

  if (!container || !countEl || !totalEl) return;

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  countEl.textContent = totalItems;
  totalEl.textContent = formatPrice(totalPrice);

  if (cart.length === 0) {
    container.innerHTML = '<p class="empty-cart">Seu carrinho está vazio.</p>';
    return;
  }

  container.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.title}" width="48" height="48"
           onerror="this.style.display='none';">
      <div style="max-width: 45%;">
        <strong>${item.title}</strong><br>
        <small>${formatPrice(item.price)} un.</small>
      </div>
      <div class="cart-controls">
        <button aria-label="Diminuir quantidade" onclick="updateQty(${item.id}, -1)">−</button>
        <span>${item.qty}</span>
        <button aria-label="Aumentar quantidade" onclick="updateQty(${item.id}, 1)">+</button>
      </div>
    </div>`
    )
    .join('');
}

// --- 4. FINALIZAÇÃO DA COMPRA ---
function checkout() {
  if (cart.length === 0) {
    alert('Adicione produtos ao carrinho primeiro.');
    return;
  }

  if (!currentUser) {
    toggleModal('cart-modal');
    toggleModal('auth-modal');
    alert('Você precisa estar logado para finalizar a compra.');
    return;
  }

  alert(`Compra realizada com sucesso, ${currentUser.name}!`);
  cart = [];
  saveCart();
  toggleModal('cart-modal');
}

// --- UTILITÁRIO DE MODAL ---
function toggleModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  const isOpen = modal.classList.contains('active');
  // Fecha todos os modais antes de abrir o pedido (evita sobreposição).
  document.querySelectorAll('.modal-overlay.active').forEach((m) => {
    if (m.id !== id) m.classList.remove('active');
  });
  modal.classList.toggle('active', !isOpen);

  if (!isOpen) {
    const firstInput = modal.querySelector('input, button:not([aria-label])');
    if (firstInput) firstInput.focus();
  }
}

/** Fecha o modal ao clicar fora da caixa (no backdrop). */
function closeOnBackdrop(event) {
  if (event.target.classList.contains('modal-overlay')) {
    event.target.classList.remove('active');
  }
}

/** Fecha o modal com a tecla Esc. */
function closeOnEscape(event) {
  if (event.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach((m) =>
      m.classList.remove('active')
    );
  }
}

// --- INICIALIZAÇÃO SEGURA ---
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  renderCart();
  fetchProducts();

  // Fechar modais clicando fora / com Esc
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', closeOnBackdrop);
  });
  document.addEventListener('keydown', closeOnEscape);
});