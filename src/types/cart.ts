import { Product } from './product';

export type CartItem = {
  id: number;
  product_id: number;
  user_id: string;
  quantity: number;
  amount: number;
  products?: Product;
};
