export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  image: string;
  images?: string[];
  category: string;
  featured?: boolean;
  favourite?: boolean;
  isNew?: boolean;
  rating: number;
  reviews: number;
  stock: number;
  tags?: string[];
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
}

export interface Business {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: string;
  taxId: string;
  website?: string;
  owner: {
    fullName: string;
  };
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  slug: string;
  description?: string;
  productCount: number;
}