/**
 * Shared email template components and brand styles.
 * Used by both customer confirmation and admin notification templates.
 */

// ── Brand Configuration ─────────────────────────────────────────
export const BRAND = {
  name: 'Amar Churighor',
  tagline: 'by Lumin',
  fullName: 'Amar Churighor by Lumin',
  supportEmail: 'support@yourdomain.com',
  supportPhone: '+880 1700-000000',
  website: 'https://amarcurighor.vercel.app',
  primaryColor: '#d7ffa4',
  darkBg: '#051a1b',
  cardBg: '#0b2a2b',
  borderColor: '#1f3334',
  textPrimary: '#e0e0e0',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  white: '#ffffff',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#eab308',
};

// ── Inline Styles (for email client compatibility) ──────────────
export const STYLES = {
  body: {
    fontFamily: "'Segoe UI', 'Inter', Arial, sans-serif",
    backgroundColor: '#0a0a0a',
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: BRAND.cardBg,
    borderRadius: '16px',
    overflow: 'hidden',
    border: `1px solid ${BRAND.borderColor}`,
  },
  header: {
    background: `linear-gradient(135deg, ${BRAND.primaryColor} 0%, #a8d678 100%)`,
    padding: '36px 28px 28px',
    textAlign: 'center' as const,
  },
  headerTitle: {
    margin: '0 0 4px',
    color: BRAND.darkBg,
    fontSize: '24px',
    fontWeight: 700,
  },
  headerSubtitle: {
    margin: '0',
    color: '#1f3334',
    fontSize: '13px',
    fontWeight: 400,
    opacity: 0.8,
  },
  content: {
    padding: '32px 28px',
  },
  footer: {
    backgroundColor: BRAND.darkBg,
    padding: '28px',
    textAlign: 'center' as const,
    borderTop: `1px solid ${BRAND.borderColor}`,
  },
  divider: {
    border: 'none',
    borderTop: `1px solid ${BRAND.borderColor}`,
    margin: '24px 0',
  },
  button: {
    display: 'inline-block',
    backgroundColor: BRAND.primaryColor,
    color: BRAND.darkBg,
    textDecoration: 'none',
    padding: '14px 32px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '15px',
  },
  buttonOutline: {
    display: 'inline-block',
    backgroundColor: 'transparent',
    color: BRAND.primaryColor,
    textDecoration: 'none',
    padding: '12px 28px',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '13px',
    border: `1px solid ${BRAND.primaryColor}`,
  },
  infoCard: {
    backgroundColor: BRAND.darkBg,
    borderRadius: '12px',
    padding: '16px 20px',
    marginBottom: '16px',
  },
  infoLabel: {
    fontSize: '11px',
    color: BRAND.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  infoValue: {
    fontSize: '15px',
    color: BRAND.textPrimary,
    fontWeight: 600,
    margin: 0,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '24px',
  },
  tableHeader: {
    backgroundColor: BRAND.darkBg,
  },
  tableHeaderCell: {
    padding: '10px 12px',
    textAlign: 'left' as const,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    color: BRAND.textSecondary,
    letterSpacing: '0.5px',
  },
  tableHeaderCellRight: {
    padding: '10px 12px',
    textAlign: 'right' as const,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    color: BRAND.textSecondary,
    letterSpacing: '0.5px',
  },
  tableHeaderCellCenter: {
    padding: '10px 12px',
    textAlign: 'center' as const,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    color: BRAND.textSecondary,
    letterSpacing: '0.5px',
  },
  tableCell: {
    padding: '10px 12px',
    borderBottom: `1px solid ${BRAND.borderColor}`,
    fontSize: '14px',
    color: BRAND.textPrimary,
  },
  tableCellCenter: {
    padding: '10px 12px',
    borderBottom: `1px solid ${BRAND.borderColor}`,
    fontSize: '14px',
    color: BRAND.textPrimary,
    textAlign: 'center' as const,
  },
  tableCellRight: {
    padding: '10px 12px',
    borderBottom: `1px solid ${BRAND.borderColor}`,
    fontSize: '14px',
    color: BRAND.primaryColor,
    textAlign: 'right' as const,
    fontWeight: 600,
  },
  statusBadge: (status: string) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: status === 'cancelled' ? '#3b1a1a' : '#1a3b1a',
    color: status === 'cancelled' ? BRAND.danger : BRAND.success,
    border: `1px solid ${status === 'cancelled' ? '#5c2a2a' : '#2a5c2a'}`,
  }),
  trackingSection: {
    backgroundColor: BRAND.darkBg,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    border: `1px dashed ${BRAND.borderColor}`,
  },
  trackingFutureBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 600,
    backgroundColor: 'rgba(215, 255, 164, 0.15)',
    color: BRAND.primaryColor,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
};

// ── Helper Functions ────────────────────────────────────────────

/**
 * Generate the email header HTML with Lumin branding.
 */
export function renderHeader(title: string, subtitle?: string): string {
  return `
    <div style="${objectToInlineStyles(STYLES.header)}">
      <h1 style="${objectToInlineStyles(STYLES.headerTitle)}">${title}</h1>
      ${subtitle ? `<p style="${objectToInlineStyles(STYLES.headerSubtitle)}">${subtitle}</p>` : ''}
      <div style="margin-top: 8px;">
        <span style="color: #1f3334; font-size: 11px; opacity: 0.7; letter-spacing: 1px; text-transform: uppercase;">
          ${BRAND.fullName}
        </span>
      </div>
    </div>
  `;
}

/**
 * Generate the email footer with support contact and Lumin branding.
 */
export function renderFooter(): string {
  return `
    <div style="${objectToInlineStyles(STYLES.footer)}">
      <div style="margin-bottom: 16px;">
        <p style="margin: 0 0 4px; color: ${BRAND.textSecondary}; font-size: 13px; font-weight: 600;">
          ${BRAND.name}
        </p>
        <p style="margin: 0 0 12px; color: ${BRAND.textMuted}; font-size: 11px;">
          ${BRAND.tagline} &bull; Premium Shopping in Bangladesh
        </p>
        <p style="margin: 0; color: ${BRAND.textMuted}; font-size: 12px;">
          Need help?
          <a href="mailto:${BRAND.supportEmail}" style="color: ${BRAND.primaryColor}; text-decoration: underline;">${BRAND.supportEmail}</a>
          &nbsp;|&nbsp;
          <a href="tel:${BRAND.supportPhone}" style="color: ${BRAND.primaryColor}; text-decoration: underline;">${BRAND.supportPhone}</a>
        </p>
      </div>
      <hr style="border: none; border-top: 1px solid ${BRAND.borderColor}; margin: 16px 0;" />
      <p style="margin: 0; color: ${BRAND.textMuted}; font-size: 11px;">
        &copy; ${new Date().getFullYear()} ${BRAND.name} ${BRAND.tagline}. All rights reserved.
        <br />
        <span style="font-size: 10px; opacity: 0.7;">
          This email was sent automatically. Please do not reply to this email.
        </span>
      </p>
    </div>
  `;
}

/**
 * Render an info card (key-value pair display).
 */
export function renderInfoCard(label: string, value: string): string {
  return `
    <div style="${objectToInlineStyles(STYLES.infoCard)}">
      <p style="${objectToInlineStyles({ ...STYLES.infoLabel, margin: '0 0 4px' })}">${label}</p>
      <p style="${objectToInlineStyles({ ...STYLES.infoValue, margin: 0 })}">${value}</p>
    </div>
  `;
}

/**
 * Render a row in a pricing summary.
 */
export function renderPriceRow(label: string, value: string, isTotal = false): string {
  const style = isTotal
    ? `font-size: 16px; font-weight: 700; color: ${BRAND.primaryColor};`
    : `font-size: 14px; color: ${BRAND.textPrimary};`;
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; ${isTotal ? 'border-top: 1px solid ' + BRAND.borderColor + '; margin-top: 6px; padding-top: 10px;' : ''}">
      <span style="color: ${isTotal ? BRAND.textPrimary : BRAND.textSecondary}; font-size: ${isTotal ? '15px' : '14px'};">${label}</span>
      <span style="${style}">${value}</span>
    </div>
  `;
}

/**
 * Generate the order tracking section (ready for future real-time tracking).
 */
export function renderTrackingSection(trackingUrl: string, orderId: string): string {
  return `
    <div style="${objectToInlineStyles(STYLES.trackingSection)}">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div>
          <span style="${objectToInlineStyles(STYLES.trackingFutureBadge)}">📦 Order Tracking</span>
          <p style="margin: 8px 0 0; color: ${BRAND.textSecondary}; font-size: 13px;">
            Track your order in real-time
          </p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 16px;">
        <a href="${trackingUrl}" style="${objectToInlineStyles(STYLES.button)}">
          📍 Track Your Order
        </a>
      </div>
      <p style="margin: 12px 0 0; color: ${BRAND.textMuted}; font-size: 11px; text-align: center;">
        Order ID: <span style="color: ${BRAND.primaryColor}; font-family: monospace;">${orderId}</span>
      </p>
      <!-- Future expansion: real-time tracking timeline will be inserted here -->
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed ${BRAND.borderColor}; text-align: center;">
        <span style="color: ${BRAND.textMuted}; font-size: 10px; font-style: italic;">
          Real-time tracking updates coming soon
        </span>
      </div>
    </div>
  `;
}

/**
 * Generate the "What Happens Next" section for customer emails.
 */
export function renderNextSteps(steps: { icon: string; title: string; description: string }[]): string {
  const itemsHtml = steps
    .map(
      (step, index) => `
    <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: ${index < steps.length - 1 ? '10px' : '0'};">
      <span style="color: ${BRAND.primaryColor}; font-size: 14px; width: 20px; text-align: center;">${step.icon}</span>
      <div style="flex: 1;">
        <p style="margin: 0; color: ${BRAND.textPrimary}; font-size: 13px; font-weight: 600;">${step.title}</p>
        <p style="margin: 2px 0 0; color: ${BRAND.textSecondary}; font-size: 12px;">${step.description}</p>
      </div>
    </div>
  `
    )
    .join('');

  return `
    <div style="${objectToInlineStyles(STYLES.infoCard)}">
      <p style="margin: 0 0 14px; font-size: 14px; font-weight: 700; color: ${BRAND.primaryColor};">
        📋 What Happens Next?
      </p>
      ${itemsHtml}
    </div>
  `;
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

/**
 * Escape HTML entities to prevent injection.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

/**
 * Format a date string for display in emails.
 */
export function formatEmailDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Format price with BDT currency symbol.
 */
export function formatPrice(amount: number): string {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Wraps content in the full email document (HTML + head + body).
 */
export function wrapEmailDocument(bodyContent: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <title>${BRAND.name}</title>
      <style type="text/css">
        /* Responsive styles for mobile */
        @media only screen and (max-width: 600px) {
          .email-container { width: 100% !important; border-radius: 0 !important; }
          .email-content { padding: 24px 16px !important; }
          .email-header { padding: 24px 16px !important; }
          .email-footer { padding: 20px 16px !important; }
          .email-table { width: 100% !important; }
          .email-table th,
          .email-table td { padding: 8px 8px !important; font-size: 12px !important; }
          .email-button { padding: 12px 24px !important; font-size: 14px !important; display: block !important; text-align: center !important; }
          .email-info-card { padding: 12px 16px !important; }
          .email-price-row { flex-direction: column !important; gap: 4px !important; }
          .email-tracking-section { padding: 16px !important; }
          .email-header-title { font-size: 20px !important; }
        }
        /* Dark mode support for email clients */
        @media (prefers-color-scheme: dark) {
          .email-dark-bg { background-color: #0a0a0a !important; }
        }
        /* Reset */
        body, table, td, p, a, li, blockquote {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
        table, td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
        img {
          -ms-interpolation-mode: bicubic;
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
        }
        body {
          margin: 0;
          padding: 0;
          width: 100% !important;
          height: 100% !important;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', 'Inter', Arial, sans-serif;">
      <!-- Preheader text for email preview -->
      <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
        Order confirmation from ${BRAND.name} ${BRAND.tagline}
      </div>
      ${bodyContent}
    </body>
    </html>
  `;
}