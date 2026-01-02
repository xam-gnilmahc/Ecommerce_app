// types/cartTypes.ts
export interface CartProduct {
  id: number;
  name: string;
  banner_url?: string;
  amount?: number;
  description?: string;
  rating?: number;
}

export interface CartItem {
  [key: string]: any;  
  products?: CartProduct;
}

export interface CartState {
  loading: boolean;
  list: CartItem[];
  response: any | null;
}

// Standard action response interface
export interface ActionResponse {
  success: boolean;
  message: string;
}
