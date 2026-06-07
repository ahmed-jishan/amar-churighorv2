import { z } from 'zod';

export const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^(\+880|01)[0-9]{9}$/, 'Enter a valid Bangladeshi phone number'),
  altPhone: z.string().regex(/^(\+880|01)[0-9]{9}$/, 'Enter a valid phone number').optional().or(z.literal('')),
  address: z.string().min(10, 'Please enter a detailed address'),
  district: z.string().min(2, 'Select a district'),
  area: z.string().min(2, 'Enter your area/thana'),
  notes: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
