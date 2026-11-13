/**
 * Tenuta Finaita - Main Frontend Interactions
 */
document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('tfHeader');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 30);
        }, { passive: true });
    }

    // Automatically open Sidecart Drawer on WooCommerce AJAX add-to-cart
    if (typeof jQuery !== 'undefined') {
        jQuery(document.body).on('added_to_cart', () => {
            const body = document.querySelector('body[x-data]');
            if (body && body._x_dataStack && body._x_dataStack[0]) {
                body._x_dataStack[0].cartOpen = true;
            }
        });
    }

    // Sidecart Drawer -/+ quantity AJAX buttons
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.tf-mini-qty-btn');
        if (!btn || typeof tenutaConfig === 'undefined') return;
        e.preventDefault();

        const key = btn.getAttribute('data-tf-qty-key');
        const nextQty = btn.getAttribute('data-tf-qty-next');
        if (!key) return;

        btn.disabled = true;
        const itemRow = btn.closest('.tf-mini-item');
        if (itemRow) itemRow.style.opacity = '0.55';

        const fd = new FormData();
        fd.append('action', 'tf_update_cart_qty');
        fd.append('nonce', tenutaConfig.nonce);
        fd.append('cart_item_key', key);
        fd.append('quantity', nextQty);

        fetch(tenutaConfig.ajaxUrl, { method: 'POST', body: fd, credentials: 'same-origin' })
            .then((r) => r.json())
            .then((data) => {
                if (data && data.fragments) {
                    Object.entries(data.fragments).forEach(([selector, html]) => {
                        document.querySelectorAll(selector).forEach((el) => {
                            el.outerHTML = html;
                        });
                    });
                    if (typeof jQuery !== 'undefined') {
                        jQuery(document.body).trigger('wc_fragments_refreshed');
                    }
                }
            })
            .catch(() => {
                if (itemRow) itemRow.style.opacity = '1';
                btn.disabled = false;
            });
    });

    // Reusable Product / Cart Quantity Stepper (- / +)
    document.addEventListener('click', (e) => {
        const qtyBtn = e.target.closest('.tf-qty-control .tf-qty-btn');
        if (!qtyBtn) return;
        e.preventDefault();

        const wrap = qtyBtn.closest('.tf-qty-control');
        const input = wrap ? wrap.querySelector('input.qty') : null;
        if (!input || input.readOnly || input.disabled) return;

        const minAttr = parseFloat(input.getAttribute('min'));
        const maxAttr = parseFloat(input.getAttribute('max'));
        const stepAttr = parseFloat(input.getAttribute('step'));

        const min = Number.isFinite(minAttr) ? minAttr : 1;
        const max = Number.isFinite(maxAttr) && maxAttr > 0 ? maxAttr : Infinity;
        const step = Number.isFinite(stepAttr) && stepAttr > 0 ? stepAttr : 1;
        const current = Number.isFinite(parseFloat(input.value)) ? parseFloat(input.value) : min;

        const delta = qtyBtn.classList.contains('tf-qty-plus') ? step : -step;
        const next = Math.round(Math.max(min, Math.min(max, current + delta)) * 1000) / 1000;

        if (next !== current) {
            input.value = String(next);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            if (typeof jQuery !== 'undefined') {
                jQuery(input).trigger('change');
            }
        }
    });
});
