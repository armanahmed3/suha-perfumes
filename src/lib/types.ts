export type Variant = {
  id: string;
  productId: string;
  size: string;
  label: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  image: string | null;
  sku: string | null;
  active: boolean;
};

export type Review = {
  id: string;
  productId: string;
  userId?: string | null;
  name: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  originalName: string | null;
  brand: string | null;
  gender: string;
  year: number | null;
  shortDesc: string | null;
  description: string | null;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  accords: string[];
  longevity: string | null;
  sillage: string | null;
  season: string[];
  featured: boolean;
  active: boolean;
  sortOrder: number;
  liquidColor: string;
  variants: Variant[];
  rating: number;
  reviewCount: number;
};

export type OrderItemT = {
  id: string;
  variantId: string | null;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image?: string | null;
};

export type OrderT = {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes?: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItemT[];
  user?: { email: string } | null;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "CUSTOMER";
  phone: string | null;
  address: string | null;
  city: string | null;
};

export type Settings = {
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  address: string;
  shippingFee: number;
  freeShippingOver: number;
  announcement: string;
};

export type View =
  | { name: "home" }
  | { name: "shop"; gender?: string }
  | { name: "product"; slug: string }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "auth"; mode?: "login" | "register" }
  | { name: "user" }
  | { name: "admin" }
  | { name: "about" }
  | { name: "contact" }
  | { name: "order-success"; orderNumber: string; total: number };
