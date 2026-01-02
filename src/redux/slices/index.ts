import productsReducer from "./productSlice";
import cartReducer from "./cartSlice";
import authReducer from "./authSlice";
import productReducer from "./productSlice";

const rootReducer = {
  products: productsReducer,
  cart: cartReducer,
  auth: authReducer,
  product: productReducer,  
};

export default rootReducer;
