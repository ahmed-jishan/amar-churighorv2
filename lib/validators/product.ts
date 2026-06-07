import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description is required'),
  richDescription: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  discountPrice: z.number().min(0).optional(),
  sku: z.string().min(1, 'SKU is required'),
  stock: z.number().min(0, 'Stock cannot be negative').int(),
  weight: z.number().optional(),
  tags: z.array(z.string()),
  isFeatured: z.boolean(),
  isBestSeller: z.boolean(),
  isNewArrival: z.boolean(),
  isActive: z.boolean(),
});

export type ProductFormData = z.infer<typeof productSchema>;
