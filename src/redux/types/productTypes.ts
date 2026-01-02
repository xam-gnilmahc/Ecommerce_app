export interface Product {
  id: number;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  rating?: number;
  reviews_count?: number;
  favourite?: number;
  type?: string;
  is_active?: boolean;
  amount?: number;
  banner_url?: string;
}

export interface ProductState {
  loading: boolean;
  list: Product[];
  detail: any | null;
  response?: string | null;
}
