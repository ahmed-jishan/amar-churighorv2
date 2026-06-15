/**
 * Visitor Analytics - Type Definitions
 * 
 * Architecture:
 * - visitor_id: persistent identity stored in localStorage + cookie (6-12 months)
 * - session_id: created per visit, stored in sessionStorage (30 min timeout)
 * - IP: masked/hashed, secondary signal only (not primary identifier)
 * - All timestamps are ISO strings (UTC) for consistent querying
 */

// ─── Device Detection ───────────────────────────────────────
export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type BrowserName = 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown';
export type OSName = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown';

// ─── Visitor Session Document (Firestore) ───────────────────
export interface VisitorSession {
  /** Firestore document ID (auto-generated) */
  id?: string;
  /** Persistent visitor identifier */
  visitorId: string;
  /** Session identifier (generated per visit) */
  sessionId: string;
  /** Masked IP address (last octet removed) */
  ip?: string;
  /** Raw client IP (server-side stored when available) */
  ipRaw?: string;
  /** Masked last IP recorded for the session */
  lastIP?: string;
  /** Raw last IP recorded for the session (server-side) */
  lastIPRaw?: string;
  
  // ─── IP-based Geo Location (ip-api.com) ─────────────────
  /** Country name (from IP geo) */
  country?: string;
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode?: string;
  /** Region / state / division name (from IP geo) */
  region?: string;
  /** Region code (e.g., 'C' for Dhaka division) */
  regionCode?: string;
  /** District (smaller administrative area) */
  district?: string;
  /** City name */
  city?: string;
  /** Postal/ZIP code */
  postalCode?: string;
  /** Latitude coordinate (from IP geo) */
  lat?: number;
  /** Longitude coordinate (from IP geo) */
  lon?: number;
  /** Timezone identifier (e.g., 'Asia/Dhaka') */
  timezone?: string;
  /** ISP name */
  isp?: string;
  /** Organization name */
  org?: string;
  /** AS number / name */
  as?: string;
  /** Whether the IP is from a mobile network */
  isMobile?: boolean;
  /** Whether the IP is a proxy/VPN */
  isProxy?: boolean;
  /** Whether the IP is hosted (datacenter) */
  isHosting?: boolean;

  // ─── GPS-based Location (Browser Geolocation API) ──────
  /** GPS latitude (from browser geolocation, NOT IP) */
  gpsLat?: number;
  /** GPS longitude (from browser geolocation, NOT IP) */
  gpsLon?: number;
  /** GPS accuracy in meters */
  gpsAccuracy?: number;
  /** Street address (from reverse geocoding GPS coords) */
  streetAddress?: string;
  /** Road/street name */
  road?: string;
  /** House/street number */
  houseNumber?: string;
  /** Suburb/neighborhood */
  suburb?: string;
  /** Whether location came from GPS (true) or IP (false) */
  isGpsLocation?: boolean;

  // ─── Device Info ────────────────────────────────────────
  /** Device type classification */
  deviceType: DeviceType;
  /** Browser name */
  browser: BrowserName;
  /** Operating system name */
  os: OSName;

  // ─── Session Info ───────────────────────────────────────
  /** Session start timestamp (ISO) */
  sessionStart: string;
  /** Last activity timestamp (ISO) */
  lastActivity: string;
  /** Session duration in seconds (computed on end) */
  duration?: number;
  /** Landing page URL */
  landingPage: string;
  /** Exit page URL */
  exitPage?: string;
  /** Referral source URL or 'direct' */
  referralSource: string;
  /** Total visits for this visitor */
  visitCount: number;
  /** Whether the session is still active */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: string;
}

// ─── Page View Document (Firestore) ─────────────────────────
export interface PageView {
  /** Firestore document ID */
  id?: string;
  /** Visitor identifier */
  visitorId: string;
  /** Session identifier */
  sessionId: string;
  /** Page URL (full path) */
  pageUrl: string;
  /** Route path (Next.js route) */
  route: string;
  /** Page title */
  pageTitle?: string;
  /** View timestamp (ISO) */
  timestamp: string;
}

// ─── Product View Document (Firestore) ──────────────────────
export interface ProductView {
  /** Firestore document ID */
  id?: string;
  /** Visitor identifier */
  visitorId: string;
  /** Session identifier */
  sessionId: string;
  /** Product ID */
  productId: string;
  /** Product name (for display) */
  productName: string;
  /** Product slug */
  productSlug?: string;
  /** View timestamp (ISO) */
  timestamp: string;
}

// ─── Daily Analytics Aggregation (Firestore) ────────────────
export interface DailyAnalytics {
  /** Document ID format: YYYY-MM-DD */
  id: string;
  /** Date string YYYY-MM-DD */
  date: string;
  /** Total visitors */
  totalVisitors: number;
  /** Unique visitor count */
  uniqueVisitors: number;
  /** Returning visitor count */
  returningVisitors: number;
  /** Total page views */
  pageViews: number;
  /** Total product views */
  productViews: number;
  /** Total session count */
  sessions: number;
  /** Average session duration in seconds */
  avgSessionDuration: number;
  /** Device breakdown */
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  /** Top visited pages (url -> count) */
  topPages: { url: string; count: number }[];
  /** Top viewed products (productId -> count) */
  topProducts: { productId: string; productName: string; count: number }[];
  /** Browser breakdown */
  browsers: Record<string, number>;
  /** OS breakdown */
  os: Record<string, number>;
  /** Referral sources (source -> count) */
  referrals: Record<string, number>;
  /** Timestamp of last update */
  updatedAt: string;
}

// ─── Monthly Analytics Aggregation (Firestore) ──────────────
export interface MonthlyAnalytics {
  /** Document ID format: YYYY-MM */
  id: string;
  /** Year-Month string YYYY-MM */
  month: string;
  /** Total visitors */
  totalVisitors: number;
  /** Unique visitor count */
  uniqueVisitors: number;
  /** Returning visitor count */
  returningVisitors: number;
  /** Total page views */
  pageViews: number;
  /** Total product views */
  productViews: number;
  /** Total session count */
  sessions: number;
  /** Average session duration in seconds */
  avgSessionDuration: number;
  /** Device breakdown */
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  /** Top pages aggregated */
  topPages: { url: string; count: number }[];
  /** Top products aggregated */
  topProducts: { productId: string; productName: string; count: number }[];
  /** Browser breakdown */
  browsers: Record<string, number>;
  /** OS breakdown */
  os: Record<string, number>;
  /** Referral sources */
  referrals: Record<string, number>;
  /** Updated timestamp */
  updatedAt: string;
}

// ─── Analytics Filter / Query Parameters ────────────────────
export type AnalyticsDateFilter =
  | 'today'
  | 'yesterday'
  | 'last-7-days'
  | 'last-30-days'
  | 'this-month'
  | 'this-year'
  | 'custom';

export interface AnalyticsFilter {
  dateFilter: AnalyticsDateFilter;
  startDate?: string;
  endDate?: string;
}

// ─── Dashboard Summary ──────────────────────────────────────
export interface AnalyticsSummary {
  totalVisitors: number;
  activeVisitors: number;
  todayVisitors: number;
  monthlyVisitors: number;
  returningVisitors: number;
  totalPageViews: number;
  totalProductViews: number;
  avgSessionDuration: number;
}

// ─── Daily Traffic Point (for charts) ───────────────────────
export interface DailyTrafficPoint {
  date: string;
  visitors: number;
  pageViews: number;
}

// ─── Monthly Traffic Point ──────────────────────────────────
export interface MonthlyTrafficPoint {
  month: string;
  visitors: number;
  pageViews: number;
}

// ─── Yearly Traffic Point ───────────────────────────────────
export interface YearlyTrafficPoint {
  year: string;
  visitors: number;
  pageViews: number;
}

// ─── Device Distribution ────────────────────────────────────
export interface DeviceDistribution {
  name: DeviceType;
  count: number;
  percentage: number;
}

// ─── API Response ───────────────────────────────────────────
export interface TrackResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

// ─── Heartbeat Request ──────────────────────────────────────
export interface HeartbeatData {
  sessionId: string;
  currentPage: string;
  currentRoute: string;
}