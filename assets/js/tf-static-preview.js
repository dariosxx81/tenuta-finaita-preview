/**
 * Tenuta Finaita - Static GitHub Pages Interactive Preview Helper
 */
(function () {
    const STORAGE_KEY = 'tf_static_preview_cart_v1';
    const SHIPPING_THRESHOLD = 49.0;
    const SHIPPING_FEE = 6.90;
    const BASE = window.TF_PREVIEW_BASE || '';
    const CATALOG = {
    "15": {
        "id": 15,
        "name": "Pasta Pura di Nocciola",
        "price": 9.9000000000000004,
        "img": "wp-content/uploads/2026/11/photo_2_1092x1440-300x300.webp",
        "url": "product/pasta-pura-di-nocciola/"
    },
    "16": {
        "id": 16,
        "name": "Crema alla Nocciola",
        "price": 8.9000000000000004,
        "img": "wp-content/uploads/2026/11/photo_7_1092x1440-300x300.webp",
        "url": "product/crema-alla-nocciola/"
    },
    "17": {
        "id": 17,
        "name": "Crema alla Gianduia",
        "price": 8.9000000000000004,
        "img": "wp-content/uploads/2026/11/photo_3_1092x1440-300x300.webp",
        "url": "product/crema-alla-gianduia/"
    },
    "18": {
        "id": 18,
        "name": "Crema al Pistacchio",
        "price": 10.9,
        "img": "wp-content/uploads/2026/11/photo_4_1092x1440-300x300.webp",
        "url": "product/crema-al-pistacchio/"
    }
};

    function formatEur(n) {
        return '€ ' + Number(n || 0).toFixed(2).replace('.', ',');
    }

    function readCart() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            return Array.isArray(raw) ? raw.filter((i) => i && CATALOG[String(i.id)] && i.qty > 0) : [];
        } catch (e) {
            return [];
        }
    }

    function saveCart(items) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        syncUI();
    }

    function addItem(productId, qty) {
        const key = String(productId);
        if (!CATALOG[key]) return;
        const items = readCart();
        const found = items.find((i) => String(i.id) === key);
        if (found) found.qty += qty;
        else items.push({ id: Number(key), qty: qty });
        saveCart(items);
        openSidecart();
    }

    function updateQty(productId, qty) {
        const key = String(productId);
        let items = readCart();
        if (qty <= 0) {
            items = items.filter((i) => String(i.id) !== key);
        } else {
            items = items.map((i) => (String(i.id) === key ? { id: i.id, qty: qty } : i));
        }
        saveCart(items);
    }

    function openSidecart() {
        const body = document.querySelector('body[x-data]');
        if (body && body._x_dataStack && body._x_dataStack[0]) {
            body._x_dataStack[0].cartOpen = true;
            return;
        }
        const drawer = document.querySelector('.tf-cart-drawer');
        const overlay = document.querySelector('.tf-cart-overlay');
        if (drawer) drawer.classList.add('open');
        if (overlay) overlay.classList.add('open');
    }

    function getSummary(items) {
        let count = 0;
        let subtotal = 0;
        const enriched = items.map((i) => {
            const p = CATALOG[String(i.id)];
            const line = p.price * i.qty;
            count += i.qty;
            subtotal += line;
            return { ...p, qty: i.qty, line: line };
        });
        const missing = Math.max(0, SHIPPING_THRESHOLD - subtotal);
        const pct = Math.min(100, (subtotal / SHIPPING_THRESHOLD) * 100);
        const freeShipping = subtotal >= SHIPPING_THRESHOLD;
        const shipping = subtotal > 0 ? (freeShipping ? 0 : SHIPPING_FEE) : 0;
        return { enriched, count, subtotal, missing, pct, freeShipping, shipping, total: subtotal + shipping };
    }

    function syncUI() {
        const s = getSummary(readCart());

        document.querySelectorAll('.tf-cart-count-badge').forEach((el) => {
            el.textContent = String(s.count);
        });

        document.querySelectorAll('.tf-shipping-progress').forEach((bar) => {
            const textHtml = s.missing > 0
                ? '<i class="lni lni-delivery"></i><span>Ti mancano <strong>' + formatEur(s.missing) + '</strong> per la spedizione gratuita!</span>'
                : '<i class="lni lni-checkmark-circle"></i><span>Hai sbloccato la <strong>spedizione gratuita</strong>!</span>';
            bar.innerHTML =
                '<div class="tf-shipping-progress-text">' + textHtml + '</div>' +
                '<div class="tf-shipping-bar-bg"><div class="tf-shipping-bar-fill" style="width:' + s.pct.toFixed(2) + '%;"></div></div>';
        });

        const drawerBody = document.querySelector('.tf-cart-drawer-body');
        if (drawerBody) {
            if (s.enriched.length === 0) {
                drawerBody.innerHTML =
                    '<div class="tf-mini-empty">' +
                    '<div class="tf-mini-empty-icon"><i class="lni lni-cart"></i></div>' +
                    '<h4>Il tuo carrello è vuoto</h4>' +
                    '<p>Scopri i nostri quattro vasetti artigianali raccolti alle pendici dell’Etna.</p>' +
                    '<a href="' + BASE + 'shop/" class="tf-btn tf-btn-primary">Scopri i prodotti <i class="lni lni-arrow-right"></i></a>' +
                    '</div>';
            } else {
                const listHtml = s.enriched.map((item) =>
                    '<li class="woocommerce-mini-cart-item tf-mini-item">' +
                    '<div class="tf-mini-thumb"><a href="' + BASE + item.url + '"><img src="' + BASE + item.img + '" alt="' + item.name + '"></a></div>' +
                    '<div class="tf-mini-details">' +
                    '<div class="tf-mini-top">' +
                    '<a href="' + BASE + item.url + '" class="tf-mini-title">' + item.name + '</a>' +
                    '<a role="button" href="#" class="tf-mini-remove tf-static-remove" data-tf-id="' + item.id + '" aria-label="Rimuovi"><i class="lni lni-trash-can"></i></a>' +
                    '</div>' +
                    '<div class="tf-mini-meta">Vasetto 190 g &bull; ' + formatEur(item.price) + '</div>' +
                    '<div class="tf-mini-bottom">' +
                    '<div class="tf-mini-qty-ctrl">' +
                    '<button type="button" class="tf-mini-qty-btn tf-static-qty" data-tf-id="' + item.id + '" data-tf-next="' + (item.qty - 1) + '" aria-label="Riduci"><i class="lni lni-minus"></i></button>' +
                    '<span class="tf-mini-qty-val">' + item.qty + '</span>' +
                    '<button type="button" class="tf-mini-qty-btn tf-static-qty" data-tf-id="' + item.id + '" data-tf-next="' + (item.qty + 1) + '" aria-label="Aumenta"><i class="lni lni-plus"></i></button>' +
                    '</div>' +
                    '<div class="tf-mini-line-price">' + formatEur(item.line) + '</div>' +
                    '</div></div></li>'
                ).join('');
                drawerBody.innerHTML =
                    '<ul class="woocommerce-mini-cart cart_list product_list_widget tf-mini-cart-list">' + listHtml + '</ul>' +
                    '<div class="tf-mini-footer">' +
                    '<div class="tf-mini-summary-row"><span>Spedizione stimata</span><span>' + (s.freeShipping ? '<strong style="color:var(--tf-verde);">Gratuita</strong>' : formatEur(SHIPPING_FEE)) + '</span></div>' +
                    '<p class="woocommerce-mini-cart__total total tf-mini-total-row"><strong>Subtotale:</strong> <span class="woocommerce-Price-amount amount">' + formatEur(s.subtotal) + '</span></p>' +
                    '<p class="woocommerce-mini-cart__buttons buttons tf-mini-buttons">' +
                    '<a href="' + BASE + 'cart/" class="button wc-forward">Vedi carrello</a>' +
                    '<a href="' + BASE + 'checkout/" class="button checkout wc-forward">Checkout</a>' +
                    '</p></div>';
            }
        }

        const cartMount = document.getElementById('tfStaticCartMount');
        if (cartMount) renderCartPage(cartMount, s);

        const checkoutMount = document.getElementById('tfStaticCheckoutMount');
        if (checkoutMount) renderCheckoutPage(checkoutMount, s);
    }

    function renderCartPage(mount, s) {
        if (s.enriched.length === 0) {
            mount.innerHTML =
                '<div style="background:var(--tf-bianco);border:1px solid rgba(28,25,23,0.08);border-radius:16px;padding:48px 24px;text-align:center;">' +
                '<h3 style="font-family:var(--tf-font-serif);margin-bottom:10px;">Il tuo carrello è attualmente vuoto</h3>' +
                '<p style="color:var(--tf-grigio);margin-bottom:24px;">Aggiungi uno o più vasetti dallo Shop per provare la spedizione gratuita da 49 €.</p>' +
                '<a href="' + BASE + 'shop/" class="tf-btn tf-btn-primary">Vai allo Shop <i class="lni lni-arrow-right"></i></a>' +
                '</div>';
            return;
        }
        const rows = s.enriched.map((item) =>
            '<div style="display:grid;grid-template-columns:76px 1fr auto;gap:18px;align-items:center;padding:18px 0;border-bottom:1px solid rgba(28,25,23,0.08);">' +
            '<a href="' + BASE + item.url + '"><img src="' + BASE + item.img + '" alt="' + item.name + '" style="width:76px;height:76px;object-fit:cover;border-radius:10px;"></a>' +
            '<div>' +
            '<a href="' + BASE + item.url + '" style="font-family:var(--tf-font-serif);font-size:1.15rem;color:var(--tf-nero);font-weight:500;">' + item.name + '</a>' +
            '<div style="font-size:0.86rem;color:var(--tf-grigio);margin:4px 0 10px;">Vasetto 190 g &bull; ' + formatEur(item.price) + '</div>' +
            '<div class="tf-mini-qty-ctrl" style="display:inline-flex;">' +
            '<button type="button" class="tf-mini-qty-btn tf-static-qty" data-tf-id="' + item.id + '" data-tf-next="' + (item.qty - 1) + '"><i class="lni lni-minus"></i></button>' +
            '<span class="tf-mini-qty-val">' + item.qty + '</span>' +
            '<button type="button" class="tf-mini-qty-btn tf-static-qty" data-tf-id="' + item.id + '" data-tf-next="' + (item.qty + 1) + '"><i class="lni lni-plus"></i></button>' +
            '</div>' +
            '</div>' +
            '<div style="text-align:right;">' +
            '<div style="font-weight:600;color:var(--tf-nero);margin-bottom:8px;">' + formatEur(item.line) + '</div>' +
            '<a href="#" class="tf-static-remove" data-tf-id="' + item.id + '" style="font-size:0.8rem;color:var(--tf-grigio);text-decoration:underline;">Rimuovi</a>' +
            '</div></div>'
        ).join('');

        mount.innerHTML =
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:28px;align-items:start;">' +
            '<div style="background:var(--tf-bianco);border:1px solid rgba(28,25,23,0.08);border-radius:16px;padding:12px 24px 24px;">' + rows + '</div>' +
            '<div style="background:var(--tf-bianco);border:1px solid rgba(28,25,23,0.08);border-radius:16px;padding:24px;">' +
            '<h3 style="font-family:var(--tf-font-serif);font-size:1.35rem;margin-bottom:16px;">Riepilogo Carrello</h3>' +
            '<div style="display:flex;justify-content:space-between;padding:8px 0;color:var(--tf-grigio);"><span>Subtotale</span><span>' + formatEur(s.subtotal) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;padding:8px 0;color:var(--tf-grigio);"><span>Spedizione stimata</span><span>' + (s.freeShipping ? '<strong style="color:var(--tf-verde);">Gratuita</strong>' : formatEur(s.shipping)) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;padding:14px 0 20px;margin-top:8px;border-top:1px solid rgba(28,25,23,0.1);font-size:1.15rem;font-weight:700;"><span>Totale</span><span>' + formatEur(s.total) + '</span></div>' +
            '<a href="' + BASE + 'checkout/" class="tf-btn tf-btn-primary" style="width:100%;justify-content:center;">Procedi al Checkout <i class="lni lni-arrow-right"></i></a>' +
            '</div></div>';
    }

    function renderCheckoutPage(mount, s) {
        const summaryItems = s.enriched.length
            ? s.enriched.map((i) => '<div style="display:flex;justify-content:space-between;font-size:0.92rem;padding:6px 0;"><span>' + i.name + ' &times; ' + i.qty + '</span><strong>' + formatEur(i.line) + '</strong></div>').join('')
            : '<p style="font-size:0.9rem;color:var(--tf-grigio);margin:0;">Nessun vasetto nel carrello demo. Aggiungili dallo Shop o usa i campi sotto per vedere il layout.</p>';

        mount.innerHTML =
            '<form id="tfStaticCheckoutForm" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:28px;align-items:start;">' +
            '<div style="background:var(--tf-bianco);border:1px solid rgba(28,25,23,0.08);border-radius:16px;padding:24px;display:grid;gap:14px;">' +
            '<h3 style="font-family:var(--tf-font-serif);font-size:1.35rem;margin-bottom:4px;">Indirizzo di fatturazione e consegna</h3>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><input type="text" placeholder="Nome *" required style="padding:12px 14px;border:1px solid rgba(28,25,23,0.16);border-radius:10px;"><input type="text" placeholder="Cognome *" required style="padding:12px 14px;border:1px solid rgba(28,25,23,0.16);border-radius:10px;"></div>' +
            '<input type="email" placeholder="Indirizzo email *" required style="padding:12px 14px;border:1px solid rgba(28,25,23,0.16);border-radius:10px;">' +
            '<input type="text" placeholder="Via e numero civico *" required style="padding:12px 14px;border:1px solid rgba(28,25,23,0.16);border-radius:10px;">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><input type="text" placeholder="CAP *" required style="padding:12px 14px;border:1px solid rgba(28,25,23,0.16);border-radius:10px;"><input type="text" placeholder="Città *" required style="padding:12px 14px;border:1px solid rgba(28,25,23,0.16);border-radius:10px;"></div>' +
            '</div>' +
            '<div style="background:var(--tf-bianco);border:1px solid rgba(28,25,23,0.08);border-radius:16px;padding:24px;">' +
            '<h3 style="font-family:var(--tf-font-serif);font-size:1.35rem;margin-bottom:14px;">Riepilogo dell’ordine</h3>' +
            summaryItems +
            '<div style="display:flex;justify-content:space-between;padding:12px 0 6px;margin-top:10px;border-top:1px solid rgba(28,25,23,0.08);color:var(--tf-grigio);"><span>Spedizione</span><span>' + (s.subtotal === 0 ? '€ 0,00' : (s.freeShipping ? '<strong style="color:var(--tf-verde);">Gratuita</strong>' : formatEur(s.shipping))) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;padding:8px 0 20px;font-size:1.15rem;font-weight:700;"><span>Totale</span><span>' + formatEur(s.total) + '</span></div>' +
            '<button type="submit" class="tf-btn tf-btn-primary" style="width:100%;justify-content:center;">Simula invio ordine (Anteprima)</button>' +
            '<div id="tfStaticOrderFeedback" style="display:none;margin-top:14px;padding:12px 14px;border-radius:10px;background:rgba(31,58,46,0.08);color:var(--tf-verde);font-size:0.88rem;">Ordine simulato con successo nell’anteprima statica. In produzione verrà elaborato tramite WooCommerce.</div>' +
            '</div></form>';
    }

    document.addEventListener('click', (e) => {
        const quickBtn = e.target.closest('a.ajax_add_to_cart[data-product_id], a[href^="#add-to-cart-"]');
        if (quickBtn) {
            e.preventDefault();
            e.stopPropagation();
            const pid = quickBtn.getAttribute('data-product_id') || (quickBtn.getAttribute('href') || '').replace('#add-to-cart-', '');
            addItem(pid, 1);
            return;
        }

        const singleAdd = e.target.closest('form.cart button.single_add_to_cart_button');
        if (singleAdd) {
            e.preventDefault();
            e.stopPropagation();
            const form = singleAdd.closest('form.cart');
            const pid = singleAdd.value || (form.querySelector('input[name="add-to-cart"]') || {}).value;
            const qtyInput = form.querySelector('input.qty');
            const qty = Math.max(1, parseInt(qtyInput ? qtyInput.value : '1', 10) || 1);
            if (pid) addItem(pid, qty);
            return;
        }

        const rmBtn = e.target.closest('.tf-static-remove');
        if (rmBtn) {
            e.preventDefault();
            updateQty(rmBtn.getAttribute('data-tf-id'), 0);
            return;
        }

        const qtyBtn = e.target.closest('.tf-static-qty');
        if (qtyBtn) {
            e.preventDefault();
            updateQty(qtyBtn.getAttribute('data-tf-id'), parseInt(qtyBtn.getAttribute('data-tf-next'), 10));
        }
    }, true);

    document.addEventListener('submit', (e) => {
        const form = e.target;
        if (form.id === 'tfStaticCheckoutForm') {
            e.preventDefault();
            const fb = document.getElementById('tfStaticOrderFeedback');
            if (fb) fb.style.display = 'block';
            return;
        }
        if (form.closest('.tf-contatti-form-col') || form.closest('footer.tf-footer') || form.matches('form.login, form.register')) {
            e.preventDefault();
            let note = form.querySelector('.tf-static-form-msg');
            if (!note) {
                note = document.createElement('div');
                note.className = 'tf-static-form-msg';
                note.style.cssText = 'margin-top:12px;padding:12px 14px;border-radius:10px;background:rgba(31,58,46,0.08);color:var(--tf-verde);font-size:0.88rem;line-height:1.5;';
                form.appendChild(note);
            }
            note.textContent = 'Anteprima statica GitHub Pages: i moduli invieranno dati e notifiche email reali una volta pubblicati su WordPress.';
        }
    }, true);

    document.addEventListener('DOMContentLoaded', syncUI);
})();