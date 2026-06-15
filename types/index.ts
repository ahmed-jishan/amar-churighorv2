export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export function computeInventoryStatus(available: number): InventoryStatus {
  if (available <= 0) return 'out_of_stock';
  if (available <= 10) return 'low_stock';
  return 'in_stock';
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryId?: string;
  description: string;
  richDescription?: string;
  price: number;
  discountPrice?: number | null;
  sku: string;
  /** Backward-compatible alias for availableStock */
  stock: number;
  /** Total units ever received / initial stock count */
  initialStock: number;
  /** Total units sold to date */
  soldQuantity: number;
  /** Currently available for purchase (computed: initialStock - soldQuantity) */
  availableStock: number;
  weight?: number;
  tags: string[];
  images: string[];
  featuredImage: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isCustomerFavorite?: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // ── Hybrid Best Seller Sales Statistics (auto-calculated) ──
  totalOrders?: number;
  totalUnitsSold?: number;
  totalRevenue?: number;
  bestSellerScore?: number;
  lastCalculatedAt?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  productCount?: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderId: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    altPhone?: string;
    address: string;
    district: string;
    area: string;
    notes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: string; note?: string }[];
  anonymousId?: string;
  trackingToken?: string;
  trackingTokenExpiry?: number;
  notificationSent?: boolean;
  /** When the email was successfully sent (ISO string) */
  emailSentAt?: string;
  /** Additional notification metadata */
  emailInfo?: {
    success: boolean;
    error?: string;
    sentAt: string;
    to: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  avatar?: string;
  designation?: string;
  location?: string;
  isVerified?: boolean;
  productId?: string;
  helpfulCount?: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export type ReviewAnimationType =
  | 'horizontal-left'
  | 'horizontal-right'
  | 'infinite-marquee'
  | 'smooth-continuous'
  | 'floating-cards'
  | 'carousel-slider'
  | 'auto-sliding'
  | 'staggered-cards'
  | 'zig-zag'
  | 'premium-luxury';

export type ReviewAnimationSpeed = 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast';

export interface ReviewAnimationConfig {
  enabled: boolean;
  animationType: ReviewAnimationType;
  speed: ReviewAnimationSpeed;
  customSpeed?: number;
  direction: 'left' | 'right';
  pauseOnHover: boolean;
  autoPlay: boolean;
  loop: boolean;
  mobileOptimized: boolean;
  desktopOptimized: boolean;
}

export const DEFAULT_REVIEW_ANIMATION_CONFIG: ReviewAnimationConfig = {
  enabled: true,
  animationType: 'carousel-slider',
  speed: 'normal',
  customSpeed: 5,
  direction: 'left',
  pauseOnHover: true,
  autoPlay: true,
  loop: true,
  mobileOptimized: true,
  desktopOptimized: true,
};

export const REVIEW_ANIMATION_SPEEDS = {
  'very-slow': { label: 'Very Slow', value: 15 },
  'slow': { label: 'Slow', value: 10 },
  'normal': { label: 'Normal', value: 5 },
  'fast': { label: 'Fast', value: 3 },
  'very-fast': { label: 'Very Fast', value: 2 },
} as const;

export const REVIEW_ANIMATION_TYPES: { value: ReviewAnimationType; label: string; description: string }[] = [
  { value: 'horizontal-left', label: 'Horizontal Left → Right', description: 'Cards slide horizontally from left to right' },
  { value: 'horizontal-right', label: 'Horizontal Right → Left', description: 'Cards slide horizontally from right to left' },
  { value: 'infinite-marquee', label: 'Infinite Marquee', description: 'Continuous scrolling marquee effect' },
  { value: 'smooth-continuous', label: 'Smooth Continuous Scroll', description: 'Smooth infinite scrolling cards' },
  { value: 'floating-cards', label: 'Floating Cards', description: 'Cards gently float up and down' },
  { value: 'carousel-slider', label: 'Carousel Slider', description: 'Standard carousel with navigation dots' },
  { value: 'auto-sliding', label: 'Auto Sliding Testimonials', description: 'Auto-advancing testimonial cards' },
  { value: 'staggered-cards', label: 'Staggered Moving Cards', description: 'Cards enter with staggered timing' },
  { value: 'zig-zag', label: 'Zig-Zag Motion', description: 'Alternating zig-zag movement pattern' },
  { value: 'premium-luxury', label: 'Premium Luxury Motion Style', description: 'Elegant luxury-style motion with scale and opacity' },
];

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
  isSuspended: boolean;
  createdAt: string;
}

export interface HomepageContent {
  heroSlides: HeroSlide[];
  faqItems: FaqItem[];
  whyChooseUs: WhyChooseUsItem[];
}

export type HeroTransition = 'fade' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out' | 'cross-fade';

export interface HeroConfig {
  heroEnabled: boolean;
  autoplay: boolean;
  autoplaySpeed: number;
  defaultTransition: HeroTransition;
}

export const DEFAULT_HERO_CONFIG: HeroConfig = {
  heroEnabled: true,
  autoplay: true,
  autoplaySpeed: 5000,
  defaultTransition: 'fade',
};

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  mobileImage?: string;
  bgImage?: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  badgeText?: string;
  promoLabel?: string;
  discountText?: string;
  overlayOpacity: number;
  textAlign: 'left' | 'center' | 'right';
  contentWidth?: 'narrow' | 'medium' | 'full';
  bgPosition?: 'center' | 'top' | 'bottom';
  bgFit?: 'cover' | 'contain';
  transition: HeroTransition;
  sortOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  altText?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export type FaqCategory = 'All' | 'Delivery' | 'Returns' | 'Payment' | 'Products' | 'General';

export const FAQ_CATEGORIES: FaqCategory[] = ['All', 'Delivery', 'Returns', 'Payment', 'Products', 'General'];

export const FAQ_CATEGORY_OPTIONS = FAQ_CATEGORIES.filter(c => c !== 'All');

export interface WhyChooseUsItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// ──────────────────────────────────────────────────────────────
// Footer Section Manager Types
// ──────────────────────────────────────────────────────────────

/** A single link within a footer section */
export interface FooterLink {
  label: string;
  url: string;
  open_in_new_tab: boolean;
}

/** A footer section (column) displayed on the public site */
export interface FooterSection {
  id: string;
  title: string;
  links: FooterLink[];
  is_visible: boolean;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
}

// ── Hybrid Best Seller Configuration ──────────────────────────
export interface BestSellerConfig {
  /** Weight for number of completed orders containing this product */
  orderCountWeight: number;
  /** Weight for total units sold of this product */
  unitsSoldWeight: number;
  /** Weight for total revenue generated by this product */
  revenueWeight: number;
  /** Number of automatic best sellers to show (slots filled after manual) */
  autoBestSellerLimit: number;
  /** Minimum number of days before a delivered order counts toward the score */
  orderLookbackDays: number;
}

export const DEFAULT_BEST_SELLER_CONFIG: BestSellerConfig = {
  orderCountWeight: 10,
  unitsSoldWeight: 5,
  revenueWeight: 0.01,
  autoBestSellerLimit: 20,
  orderLookbackDays: 365,
};