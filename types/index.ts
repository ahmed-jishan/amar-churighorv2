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
  discountPrice?: number;
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
  isNewArrival: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

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
  isActive: boolean;
  sortOrder?: number;
}

export interface WhyChooseUsItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}