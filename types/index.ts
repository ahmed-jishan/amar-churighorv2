export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  richDescription?: string;
  price: number;
  discountPrice?: number;
  sku: string;
  stock: number;
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

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  isActive: boolean;
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

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
}

export interface WhyChooseUsItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}
