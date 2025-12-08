// MENÚ HAMBURGUESA ----
document.addEventListener("DOMContentLoaded", function () {

    const hamburguer = document.getElementById("hamburguer");
    const dropdowns = document.querySelectorAll(".dropdown");

    //funcionalidad del boton hamburguesa
    if (hamburguer) {
        hamburguer.addEventListener("click", () => {
            dropdowns.forEach(d => d.classList.toggle("show")); // mostrar / ocultar menú
            hamburguer.classList.toggle("open");                // animación del ícono hamburguesa
        });
    }

    // Cerrar menú cuando se hace clic en alguna opción
    dropdowns.forEach(drop => {
        const links = drop.querySelectorAll("a");
        links.forEach(link => {
            link.addEventListener("click", () => {
                dropdowns.forEach(d => d.classList.remove("show"));
                hamburguer.classList.remove("open");
            });
        });
    });

});


//--- Carrito funciones----
let products = [];
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

const $ = sel => document.querySelector(sel);
// Formatear número a moneda local
function formatMoney(num) {
  return num.toLocaleString("es-AR", { minimumFractionDigits: 2 });
}
// Guardar carrito en localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}
// Renderizar contador del carrito
function renderCartCount() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const el = $("#cart-count");
  if (el) el.textContent = total;
}
// Cargar productos desde db.json
async function loadProducts() {
  try {
    const res = await fetch("/db.json"); 
    // la barra da ubicacion absoluta
    if (!res.ok) throw new Error("Error al cargar productos");
    products = await res.json();
    renderProducts();
  } catch (err) {
    console.error(err);
    $("#products").innerHTML =
      '<p style="color:red;">No se pudieron cargar los productos.</p>';
  }
}
// Renderizar productos
function renderProducts() {
  const container = $("#products");
  container.innerHTML = "";
  products.forEach(prod => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${prod.image}" alt="${prod.name}">
      <h4>${prod.name}</h4>
      <p>${prod.description}</p>
      <div class="price">$${formatMoney(prod.price)}</div>
      <button class="agregar-carrito" data-id="${prod.id}">Agregar al carrito</button>
    `;
    container.appendChild(card);
  });
}
// Agregar producto al carrito
function addToCart(id) {
  const prod = products.find(p => p.id == id);
  if (!prod) return;
// Verificar si ya está en el carrito
  const item = cart.find(i => i.id == id);
  if (item) item.qty++;
  else cart.push({ ...prod, qty: 1 });
// Guardar y actualizar
  saveCart();
  renderCartCount();
  alert(`${prod.name} agregado al carrito`);
}
// Renderizar modal del carrito
function renderCartModal() {
  const container = $("#cart-items");
  container.innerHTML = "";
// Carrito vacío
  if (cart.length === 0) {
    container.innerHTML = "<p>El carrito está vacío.</p>";
    $("#cart-total").textContent = "0.00";
    return;
  }
// Renderizar cada ítem del carrito
  cart.forEach(i => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img src="${i.image}" alt="${i.name}">
      <div class="meta">
        <h5>${i.name}</h5>
        <small>$${formatMoney(i.price)} c/u</small>
      </div>
      <div class="qty">
        <button class="dec" data-id="${i.id}">-</button>
        <span>${i.qty}</span>
        <button class="inc" data-id="${i.id}">+</button>
        <button class="rm" data-id="${i.id}">Eliminar</button>
      </div>`;
    container.appendChild(div);
  });
// Calcular y mostrar total
  $("#cart-total").textContent = formatMoney(
    cart.reduce((s, i) => s + i.price * i.qty, 0)
  );
}

// Eventos globales
document.addEventListener("click", e => {
  if (e.target.matches(".card button")) addToCart(e.target.dataset.id);
  if (e.target.id === "open-cart") openModal("#cart-modal");
  if (e.target.id === "close-cart") closeModal("#cart-modal");
  if (e.target.id === "close-checkout") closeModal("#checkout-modal");
// Modificar cantidades en el carrito
  if (e.target.matches(".inc")) {
    const item = cart.find(x => x.id == e.target.dataset.id);
    item.qty++;
    saveCart(); renderCartModal(); renderCartCount();
  }
// Disminuir cantidad o eliminar del carrito
  if (e.target.matches(".dec")) {
    const it = cart.find(x => x.id == e.target.dataset.id);
    it.qty--;
    if (it.qty <= 0) cart = cart.filter(x => x.id != it.id);
    saveCart(); renderCartModal(); renderCartCount();
  }
// Eliminar del carrito
  if (e.target.matches(".rm")) {
    cart = cart.filter(x => x.id != e.target.dataset.id);
    saveCart(); renderCartModal(); renderCartCount();
  }
});

// Checkout
const checkoutBtn = $("#checkout-btn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    closeModal("#cart-modal");
    openModal("#checkout-modal");
  });
}

// === AUTOTAB TARJETA ===
function setupAutoTab() {
  const inputs = Array.from(
    document.querySelectorAll("#card-number input[data-autotab]")
  );
// Auto tab y limpieza de inputs
  inputs.forEach((input, idx) => {
    input.addEventListener("input", () => {
      const cleaned = input.value.replace(/\D/g, "").slice(0, input.maxLength);
      if (input.value !== cleaned) input.value = cleaned;
      if (cleaned.length >= input.maxLength) inputs[idx + 1]?.focus();
    });
  });
}

// === FORM DE CHECKOUT ===
const checkoutForm = $("#checkout-form");
if (checkoutForm) {
  checkoutForm.addEventListener("submit", e => {
    e.preventDefault();
// Obtener datos del formulario
    const name = $("#customer-name").value.trim();
    const cardParts = Array.from(document.querySelectorAll("#card-number input")).map(
      i => i.value.trim()
    );
    const cardNumber = cardParts.join("");
    // Validaciones básicas
    if (cardNumber.length < 12) {
      $("#payment-result").textContent = "Número de tarjeta inválido.";
      return;
    }

    $("#payment-result").textContent = "Procesando pago...";
    setTimeout(() => {
      const masked = cardNumber.replace(/.(?=.{4})/g, "*");
      $("#payment-result").textContent = `Pago aprobado. Gracias ${name}! Tarjeta: ${masked}.`;
      // Vaciar carrito
      cart = [];
      saveCart();
      renderCartModal();
      renderCartCount();
      checkoutForm.reset();
    }, 1200);
  });
}
// === MODALES ===
function openModal(sel) {
  document.querySelector(sel)?.setAttribute("aria-hidden", "false");
  if (sel === "#cart-modal") renderCartModal();
}
// Cerrar modal
function closeModal(sel) {
  document.querySelector(sel)?.setAttribute("aria-hidden", "true");
}

// === SUSCRIPCIÓN ===
const newsletter = $("#newsletterform");
if (newsletter) {
  newsletter.addEventListener("submit", e => {
    e.preventDefault();
    const em = $("#subscribemail").value.trim();
    alert("Gracias — te suscribimos (simulado): " + em);
    $("#subscribemail").value = "";
  });
}

// === comportamineto de los botones en el header === ===
document.addEventListener("DOMContentLoaded", () => {
  const dropdownBtn = document.querySelector(".dropdown-toggle");
  const dropdownMenu = document.querySelector(".dropdown-menu");

  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener("click", () => {
      dropdownMenu.classList.toggle("show-anim");
    });
  }
});
// Inicializacion
window.addEventListener("load", () => {
  loadProducts();
  renderCartCount();
  setupAutoTab();
});
  //--- Dropdowns con diferentes modos de cierre ----
document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dd => {
        const btn = dd.querySelector('.dropdown-btn');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dd.classList.toggle('open');
        });

        const closeMode = dd.dataset.close; // true, inside, outside, false

        // cerrar al hacer clic DENTRO
        if (closeMode === 'inside') {
            dd.addEventListener('click', () => {
                dd.classList.remove('open');
            });
        }

        // cerrar al hacer clic AFUERA
        document.addEventListener('click', (e) => {
            if (!dd.contains(e.target)) {
                if (closeMode === 'true' || closeMode === 'outside') {
                    dd.classList.remove('open');
                }
            }
        });
    });
});
