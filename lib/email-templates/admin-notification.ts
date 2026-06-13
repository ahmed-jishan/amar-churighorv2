/**
 * Admin Order Notification Email Template
 *
 * Sent to store admin(s) when a new order is placed.
 * Includes full order details for order fulfillment processing.
 */

import {
  BRAND,
  STYLES,
  renderHeader,
  renderFooter,
  renderInfoCard,
  renderPriceRow,
  wrapEmailDocument,
  escapeHtml,
  formatEmailDate,
  formatPrice,
} from './shared';

// ── Interface ───────────────────────────────────────────────────

export interface AdminNotificationData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAltPhone?: string;
  orderId: string;
  orderDate: string;
  items: Array<{
    name: string;
    productId: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  shippingAddress: string;
  district: string;
  area: string;
  notes?: string;
  paymentMethod: string;
  orderStatus: string;
  trackingToken: string;
  adminOrdersUrl: string;
}

// ── Template ────────────────────────────────────────────────────

export function renderAdminNotificationHtml(data: AdminNotificationData): string {
  const {
    customerName,
    customerEmail,
    customerPhone,
    customerAltPhone,
    orderId,
    orderDate,
    items,
    subtotal,
    deliveryCharge,
    total,
    shippingAddress,
    district,
    area,
    notes,
    paymentMethod,
    orderStatus,
    trackingToken,
    adminOrdersUrl,
  } = data;

  // Build items table
  const itemsRows = items
    .map(
      (item) => `
    <tr>
      <td style="${objectToInlineStyles(STYLES.tableCell)}">
        <span style="font-weight: 600;">${escapeHtml(item.name)}</span>
        <br />
        <span style="font-size: 11px; color: ${BRAND.textMuted};">SKU: ${escapeHtml(item.productId)}</span>
      </td>
      <td style="${objectToInlineStyles(STYLES.tableCellCenter)}">${item.quantity}</td>
      <td style="${objectToInlineStyles(STYLES.tableCellRight)}">${formatPrice(item.price)}</td>
      <td style="${objectToInlineStyles(STYLES.tableCellRight)}">${formatPrice(item.price * item.quantity)}</td>
    </tr>
  `
    )
    .join('');

  const bodyContent = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0a0a; padding: 20px 10px;">
      <tr>
        <td align="center">
          <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="${objectToInlineStyles(STYLES.container)}">
            <!-- Header -->
            <tr>
              <td class="email-header">
                ${renderHeader('🛒 New Order Received!', orderId)}
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td class="email-content" style="${objectToInlineStyles(STYLES.content)}">
                <!-- Alert Banner -->
                <div style="background: linear-gradient(135deg, ${BRAND.primaryColor}22 0%, ${BRAND.primaryColor}11 100%); border: 1px solid ${BRAND.primaryColor}44; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                  <p style="margin: 0; color: ${BRAND.primaryColor}; font-size: 14px; font-weight: 600;">
                    🔔 A new order has been placed and requires attention.
                  </p>
                </div>

                <!-- Order Info -->
                ${renderInfoCard('Order ID', `<span style="color: ${BRAND.primaryColor}; font-family: monospace; font-size: 14px; letter-spacing: 1px;">${escapeHtml(orderId)}</span>`)}
                ${renderInfoCard('Order Date', formatEmailDate(orderDate))}
                ${renderInfoCard('Order Status', `<span style="${objectToInlineStyles(STYLES.statusBadge(orderStatus))}">${orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}</span>`)}

                <hr style="${objectToInlineStyles(STYLES.divider)}" />

                <!-- Customer Information -->
                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: ${BRAND.textPrimary};">
                  👤 Customer Information
                </p>
                ${renderInfoCard('Name', escapeHtml(customerName))}
                ${renderInfoCard('Email', escapeHtml(customerEmail))}
                ${renderInfoCard('Phone', `${escapeHtml(customerPhone)}${customerAltPhone ? ` (Alt: ${escapeHtml(customerAltPhone)})` : ''}`)}

                ${notes ? `
                <div style="${objectToInlineStyles(STYLES.infoCard)}">
                  <p style="${objectToInlineStyles({ ...STYLES.infoLabel, margin: '0 0 4px' })}">Order Notes</p>
                  <p style="${objectToInlineStyles({ ...STYLES.infoValue, margin: 0, fontStyle: 'italic', fontWeight: 400 })}">${escapeHtml(notes)}</p>
                </div>
                ` : ''}

                <hr style="${objectToInlineStyles(STYLES.divider)}" />

                <!-- Shipping Address -->
                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: ${BRAND.textPrimary};">
                  📍 Shipping Address
                </p>
                ${renderInfoCard('Address', escapeHtml(shippingAddress))}
                ${renderInfoCard('Area / Thana', escapeHtml(area))}
                ${renderInfoCard('District', escapeHtml(district))}

                <hr style="${objectToInlineStyles(STYLES.divider)}" />

                <!-- Order Items -->
                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: ${BRAND.textPrimary};">
                  🛒 Order Items
                </p>
                <table class="email-table" style="${objectToInlineStyles(STYLES.table)}">
                  <thead>
                    <tr style="${objectToInlineStyles(STYLES.tableHeader)}">
                      <th style="${objectToInlineStyles(STYLES.tableHeaderCell)}">Item</th>
                      <th style="${objectToInlineStyles(STYLES.tableHeaderCellCenter)}">Qty</th>
                      <th style="${objectToInlineStyles(STYLES.tableHeaderCellRight)}">Unit Price</th>
                      <th style="${objectToInlineStyles(STYLES.tableHeaderCellRight)}">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsRows}
                  </tbody>
                </table>

                <!-- Pricing Summary -->
                <div style="margin-bottom: 24px;">
                  ${renderPriceRow('Subtotal', formatPrice(subtotal))}
                  ${renderPriceRow('Delivery Charge', formatPrice(deliveryCharge))}
                  ${renderPriceRow('Total', formatPrice(total), true)}
                </div>

                <hr style="${objectToInlineStyles(STYLES.divider)}" />

                <!-- Payment Method -->
                ${renderInfoCard('Payment Method', escapeHtml(paymentMethod))}

                <!-- Tracking Info -->
                ${renderInfoCard('Tracking Token', `<span style="font-family: monospace; font-size: 12px; color: ${BRAND.textSecondary};">${escapeHtml(trackingToken)}</span>`)}

                <hr style="${objectToInlineStyles(STYLES.divider)}" />

                <!-- Admin Action Button -->
                <div style="text-align: center; margin-bottom: 16px;">
                  <a href="${adminOrdersUrl}" style="${objectToInlineStyles(STYLES.button)}">
                    ⚡ Manage Order in Dashboard
                  </a>
                </div>

                <!-- Quick Actions -->
                <div style="text-align: center;">
                  <a href="${adminOrdersUrl}?order=${encodeURIComponent(orderId)}" style="${objectToInlineStyles(STYLES.buttonOutline)}">
                    View Order Details
                  </a>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="email-footer">
                ${renderFooter()}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailDocument(bodyContent);
}

/**
 * Convert a CSS-in-JS style object to an inline style string.
 */
function objectToInlineStyles(styles: Record<string, string | number>): string {
  return Object.entries(styles)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value}`;
    })
    .join('; ');
}