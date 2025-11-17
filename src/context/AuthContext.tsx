import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../utils/supbase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwt_decode from "jwt-decode";

// App's User type
type User = {
  id: string;
  email: string;
  name?: string;
  profile?: string;
};

// Decoded JWT type
type DecodedToken = {
  sub: string;
  email: string;
  exp: number;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};

type Product = {
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
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  fetchProducts: () => Promise<Product[]>;
  fetchProductDetail: (id: number) => Promise<Product | null>;
  fetchCart: () => Promise<any>;
  addToCart: (productId: number) => Promise<{ success: boolean; message: string }>;
  addToCartQuantity: (productId: number, quantityChange: number) => Promise<{ success: boolean; message: string }>;
  deleteFromCart: (cartId: number) => Promise<{ success: boolean; message: string }>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  fetchProducts: async () => [],
  fetchProductDetail: async () => null,
  fetchCart: async () => [],
  addToCart: async () => ({ success: false, message: "Not implemented" }),
  addToCartQuantity: async () => ({ success: false, message: "Not implemented" }),
  deleteFromCart: async () => ({ success: false, message: "Not implemented" }),
  
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(false);

  // Verify JWT token
  const verifyToken = (token: string): DecodedToken | null => {
    try {
      const decoded: DecodedToken = jwt_decode(token);
      return decoded;
    } catch (err) {
      console.log('Token verification failed:', err);
      return null;
    }
  };

  const handleToken = async (token: string | null) => {
    if (!token) {
      await AsyncStorage.removeItem('accessToken');
      setUser(null);
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      await AsyncStorage.removeItem('accessToken');
      setUser(null);
      return;
    }

    await AsyncStorage.setItem('accessToken', token);

    // Check if user exists in Supabase "users" table
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', decoded.email)
      .single();

    let finalUser: User | null = null;

    if (selectError && selectError.code !== 'PGRST116') {
      console.log('Error fetching user:', selectError);
    }

    if (!existingUser) {
      const newUser: User = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.user_metadata?.full_name || '',
        profile: decoded.user_metadata?.avatar_url || '',
      };

      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (insertError) {
        console.log('Error inserting user:', insertError);
      } else {
        finalUser = insertedUser;
      }
    } else {
      finalUser = existingUser;
    }

    setUser(finalUser);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // Load token from storage
      const token = await AsyncStorage.getItem('accessToken');
      if (token) await handleToken(token);

      // Get session from Supabase
      const { data } = await supabase.auth.getSession();
      const sessionToken = data?.session?.access_token;
      if (sessionToken) await handleToken(sessionToken);

      setLoading(false);
    };

    init();

    // Listen to auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.access_token) {
          await handleToken(session.access_token);
        } else if (event === 'SIGNED_OUT') {
          await handleToken(null);
        }
      }
    );
  
    return () => subscription.subscription.unsubscribe();
  }, []);


  // fetchProducts now accepts a brand
  const fetchProducts = async (brand?:string, from = 0, to = 20) => {
    let query = supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    if (brand) {
      query = query.in("brand", [brand]);
    }

    const { data, error } = await query.range(from, to);

    if (error) {
      console.error("Error fetching products:", error.message);
      return [];
    }

    return data;
  };

  const fetchProductDetail = async (id: number) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  };

  const fetchCart = async (): Promise<any[]> => {
    if (!user) return [];

    // Fetch cart items for the logged-in user
    const { data, error } = await supabase
        .from("cart")
        .select(
          `*, products:product_id (
          id,
          name,
          banner_url,
          amount,
          description,
          rating
        )`
        )
        .eq("user_id", user.id)
        .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching cart:", error.message);
      return [];
    }

    return data;
  };

  const addToCart = async (productId: number): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: "User not logged in" };

    const { data: existingItem, error: selectError } = await supabase
      .from("cart")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      return { success: false, message: selectError.message || "Error checking cart item" };
    }

    if (!existingItem) {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("amount")
        .eq("id", productId)
        .single();

      if (productError) {
        return { success: false, message: productError.message || "Error fetching product details" };
      }

      const { error: insertError } = await supabase.from("cart").insert([
        {
          product_id: productId,
          user_id: user.id,
          amount: productData?.amount ?? 0,
          quantity: 1,
        },
      ]);

      if (insertError) {
        return { success: false, message: insertError.message || "Error adding product to cart" };
      }

      return { success: true, message: "Product added to cart" };
    } else {
      const { error: updateError } = await supabase
        .from("cart")
        .update({ quantity: existingItem.quantity + 1 })
        .eq("id", existingItem.id);

      if (updateError) {
        return { success: false, message: updateError.message || "Error updating cart quantity" };
      }

      return { success: true, message: "Product quantity updated in cart" };
    }
  };

  const addToCartQuantity = async (productId: number, quantityChange: number) => {
    if (!user) return { success: false, message: "User not logged in" };

    try {
      // Fetch existing cart item
      const { data: existingItem, error: selectError } = await supabase
        .from("cart")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .single();

      if (selectError && selectError.code !== "PGRST116") {
        return { success: false, message: selectError.message };
      }

      if (!existingItem) {
        return { success: false, message: "Item not found in cart" };
      }

      const newQuantity = existingItem.quantity + quantityChange;
      if (newQuantity < 1) return { success: false, message: "Quantity cannot be less than 1" };

      const { error: updateError } = await supabase
        .from("cart")
        .update({ quantity: newQuantity })
        .eq("id", existingItem.id);

      if (updateError) return { success: false, message: updateError.message };

      return { success: true, message: "Cart updated" };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to update cart" };
    }
  };

  const deleteFromCart = async (cartId: number) => {
    if (!user) return { success: false, message: "User not logged in" };

    try {
      const { error } = await supabase.from("cart").delete().eq("id", cartId);

      if (error) return { success: false, message: error.message };
      return { success: true, message: "Item removed from cart" };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to remove item" };
    }
  };




  return (
    <AuthContext.Provider value={{ user, loading, setUser, fetchProducts, fetchProductDetail , fetchCart, addToCart, addToCartQuantity, deleteFromCart}}>
      {children}
    </AuthContext.Provider>
  );
};
