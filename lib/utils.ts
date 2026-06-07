import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return `৳${price.toLocaleString('en-BD')}`;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();
}

export const DISTRICTS = [
  'Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh',
  'Cumilla', 'Narayanganj', 'Gazipur', 'Tangail', 'Faridpur', 'Jessore', 'Bogura', 'Dinajpur',
];

export const DELIVERY_CHARGE = {
  inside_dhaka: 80,
  outside_dhaka: 130,
};
