export type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  category?: string;
};

export type Address = {
  id: string;
  line1: string; // flat no, building, area
  pincode: string;
  state: string;
  city: string;
};

export type Customer = {
  id: string;
  username: string;
  password: string;
  favorites: string[];
  cart: { productId: string; qty: number; savedForLater?: boolean }[];
  addresses: Address[];
};

export type Coupon = {
  id: string;
  code: string;
  minAmount: number;
  discount: number; // flat amount off
};

export type ConfirmedOrder = {
  id: string;
  customerId: string;
  items: { productId: string; name: string; price: number; qty: number }[];
  total: number;
  address: Address;
  receiverName: string;
  receiverPhone: string;
  status: "pending" | "accepted";
  createdAt: number;
};

export type Admin = { username: string; password: string };

export type SiteSettings = {
  name: string;
  logo?: string; // dataURL
  tagline: string;
  social: { instagram?: string; facebook?: string; twitter?: string };
  website?: string;
  locationLink?: string;
  address: string;
  phone?: string;
};
