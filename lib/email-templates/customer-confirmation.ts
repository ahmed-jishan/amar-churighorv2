/**
 * Customer Order Confirmation Email Template
 *
 * Sent to the customer after a successful order placement.
 * Includes order details, shipping info, tracking, and next steps.
 */

import {
  BRAND,
  STYLES,
  renderHeader,
  renderFooter,
  renderInfoCard,
  renderPriceRow,
  renderTrackingSection,
  renderNextSteps,
  wrapEmailDocument,
  escapeHtml,
  formatEmailDate,
  formatPrice,
} from './shared';

// ── Interface ───────────────────────────────────────────────────

export interface CustomerConfirmationData {
  customerName: string;
  orderId: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  shippingAddress: string;
  district: string;
  area: string;
  phone: string;
  email: string;
  paymentMethod: string;
  orderStatus: string;
  trackingUrl: string;
  myOrdersUrl: string;
}

// ── Next Steps Timeline ─────────────────────────────────────────

const NEXT_STEPS = [
  {
    icon: '📞',
    title: 'Order Confirmation Call',
    description: 'We will call you within 24 hours to confirm your order details.',
  },
  {
    icon: '⚙️',
    title: 'Processing & Packing',
    description: 'Your items will be carefully packed and prepared for shipment.',
  },
  {
    icon: '🚚',
    title: 'Shipped',
    description: 'Your order will be dispatched to your delivery address.',
  },
  {
    icon: '🎉',
    title: 'Delivered!',
    description: 'Your package will arrive at your doorstep. Enjoy your purchase!',
  },
];

// ── Template ────────────────────────────────────────────────────

export function renderCustomerConfirmationHtml(data: CustomerConfirmationData): string {
  const {
    customerName,
    orderId,
    orderDate,
    items,
    subtotal,
    deliveryCharge,
    total,
    shippingAddress,
    district,
    area,
    phone,
    email,
    paymentMethod,
    orderStatus,
    trackingUrl,
    myOrdersUrl,
  } = data;

  // Build items table
  const itemsRows = items
    .map(
      (item) => `
    <tr>
      <td style="${objectToInlineStyles(STYLES.tableCell)}">${escapeHtml(item.name)}</td>
      <td style="${objectToInlineStyles(STYLES.tableCellCenter)}">${item.quantity}</td>
      <td style="${objectToInlineStyles(STYLES.tableCellRight)}">${formatPrice(item.price)}</td>
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
                ${renderHeader('Order Confirmed! 🎉', orderId)}
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td class="email-content" style="${objectToInlineStyles(STYLES.content)}">
                <!-- Greeting -->
                <p style="margin: 0 0 8px; font-size: 16px; color: ${BRAND.textPrimary};">
                  Hi <strong style="color: ${BRAND.primaryColor};">${escapeHtml(customerName)}</strong>,
                </p>
                <p style="margin: 0 0 24px; font-size: 14px; color: ${BRAND.textSecondary}; line-height: 1.6;">
                  Your order has been placed successfully! We're now processing it and will keep you updated
                  every step of the way.
                </p>

                <!-- Order Info Cards -->
                ${renderInfoCard('Order ID', `<span style="color: ${BRAND.primaryColor}; font-family: monospace; font-size: 14px; letter-spacing: 1px;">${escapeHtml(orderId)}</span>`)}
                ${renderInfoCard('Order Date', formatEmailDate(orderDate))}
                ${renderInfoCard('Order Status', `<span style="${objectToInlineStyles(STYLES.statusBadge(orderStatus))}">${orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}</span>`)}

                <hr style="${objectToInlineStyles(STYLES.divider)}" />

                <!-- Order Items Table -->
                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: ${BRAND.textPrimary};">
                  🛒 Order Items
                </p>
                <table class="email-table" style="${objectToInlineStyles(STYLES.table)}">
                  <thead>
                    <tr style="${objectToInlineStyles(STYLES.tableHeader)}">
                      <th style="${objectToInlineStyles(STYLES.tableHeaderCell)}">Item</th>
                      <th style="${objectToInlineStyles(STYLES.tableHeaderCellCenter)}">Qty</th>
                      <th style="${objectToInlineStyles(STYLES.tableHeaderCellRight)}">Price</th>
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

                <!-- Shipping Address -->
                ${renderInfoCard('Shipping Address', `
                  ${escapeHtml(shippingAddress)}, ${escapeHtml(area)}, ${escapeHtml(district)}
                `)}

                <!-- Contact Info -->
                ${renderInfoCard('Contact', `
                  ${escapeHtml(phone)} | ${escapeHtml(email)}
                `)}

                <hr style="${objectToInlineStyles(STYLES.divider)}" />

                <!-- Tracking Section (future expansion ready) -->
                ${renderTrackingSection(trackingUrl, orderId)}

                <!-- View My Orders -->
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${myOrdersUrl}" style="${objectToInlineStyles(STYLES.buttonOutline)}">
                    📋 View All My Orders →
                  </a>
                </div>

                <!-- What Happens Next -->
                ${renderNextSteps(NEXT_STEPS)}

                <!-- Support -->
                <div style="text-align: center; margin-top: 24px; padding: 16px; background-color: ${BRAND.darkBg}; border-radius: 12px;">
                  <p style="margin: 0; color: ${BRAND.textSecondary}; font-size: 12px;">
                    💬 Questions about your order?
                    <br />
                    <a href="mailto:${BRAND.supportEmail}" style="color: ${BRAND.primaryColor}; text-decoration: underline; font-weight: 600;">
                      Contact Support
                    </a>
                  </p>
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