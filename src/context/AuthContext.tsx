// src/context/AuthContext.tsx
import React, { createContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { supabase } from '../utils/supbase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwt_decode from "jwt-decode";
import { sendOrderEmail } from '../service/emailService';
import { User, DecodedToken } from '../types/auth';
import { Product } from '../types/product';
import { CartItem } from '../types/cart';
import { OrderData, StripeData } from '../types/order';

// Define the shape of the AuthContext
export type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  fetchProducts: (brand?: string, from?: number, to?: number) => Promise<Product[]>;
  fetchProductDetail: (id: number) => Promise<Product & { product_images?: any[] }>;
  fetchCart: () => Promise<CartItem[]>;
  addToCart: (productId: number) => Promise<{ success: boolean; message: string }>;
  addToCartQuantity: (productId: number, quantityChange: number) => Promise<{ success: boolean; message: string }>;
  deleteFromCart: (cartId: number) => Promise<{ success: boolean; message: string }>;
  fetchNotifications: (from?: number, to?: number) => Promise<any[]>;
  placeOrder: (orderData: OrderData, stripeData: StripeData) => Promise<number | { success: false; message: string }>;
  searchProducts: (query?: string, from?: number, to?: number) => Promise<any[]>;
};

// Create the AuthContext with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => { },
  fetchProducts: async () => [],
  fetchProductDetail: async () => ({} as any),
  fetchCart: async () => [],
  addToCart: async () => ({ success: false, message: "Not implemented" }),
  addToCartQuantity: async () => ({ success: false, message: "Not implemented" }),
  deleteFromCart: async () => ({ success: false, message: "Not implemented" }),
  fetchNotifications: async () => [],
  placeOrder: async () => ({ success: false, message: "Not implemented" }),
  searchProducts: async () => [],
});

// AuthProvider component to wrap the app and provide AuthContext values
export const AuthProvider = ({ children }: { children: ReactNode }) => {

  // State to hold user and loading status
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verify JWT token
  const verifyToken = (token: string): DecodedToken | null => {
    try {
      return jwt_decode<DecodedToken>(token);
    } catch (err) {
      console.error("Token verification failed:", err);
      return null;
    }
  };

  // Handle token and user session
  const handleToken = async (token: string | null) => {
    if (!token) return await AsyncStorage.removeItem('accessToken'), setUser(null);

    const decoded = verifyToken(token);
    if (!decoded) return await AsyncStorage.removeItem('accessToken'), setUser(null);

    await AsyncStorage.setItem('accessToken', token);

    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', decoded.email)
      .single();

    if (selectError && selectError.code !== 'PGRST116') return setUser(null);

    const finalUser =
      existingUser ??
      (await supabase
        .from('users')
        .insert({
          id: decoded.sub,
          email: decoded.email,
          name: decoded.user_metadata?.full_name || '',
          profile: decoded.user_metadata?.avatar_url || '',
        })
        .select()
        .single()
        .then(res => {
          if (res.error) return null;
          return res.data;
      }));

    setUser(finalUser || null);
  };

  // Initialize AuthProvider
  useEffect(() => {
    const init = async () => {
      setLoading(true);
    
      const token = await AsyncStorage.getItem('accessToken') 
        ?? (await supabase.auth.getSession()).data?.session?.access_token;

      await handleToken(token || null);
      setLoading(false);
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) await handleToken(session.access_token);
      else if (event === 'SIGNED_OUT') await handleToken(null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  // Fetch Products
  const fetchProducts = async (brand?: string, from = 0, to = 20): Promise<Product[]> => {
    let query = supabase.from('products').select('*').eq('is_active', true).order('id', { ascending: true });
    if (brand) query = query.in('brand', [brand]);

    const { data, error } = await query.range(from, to);
    if (error) return [];
    return data ?? [];
  };

  // Search Products
  const searchProducts = async (query?: string, from = 0, to = 20): Promise<any[]> => {
    if (!query) return [];

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(
        `name.ilike.%${query}%,brand.ilike.%${query}%,type.ilike.%${query}%,description.ilike.%${query}%`
      )
      .eq('is_active', true)
      .range(from, to)
      .order('id', { ascending: true });

    if (error) return [];

    return data ?? [];
  };

  // Product Details
  const fetchProductDetail = async (id: number): Promise<Product & { product_images?: any[] }> => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images:product_images (
          id,
          image_url,
          product_id
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data!;
  };

  // Fetch Cart Items
  const fetchCart = async (): Promise<CartItem[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('cart')
      .select(`
        *,
        products:product_id (
          id,
          name,
          banner_url,
          amount,
          description,
          rating
        )
      `)
      .eq('user_id', user.id)
      .order('id', { ascending: false });
    if (error) return [];
    return data ?? [];
  };

  // Add to Cart
  const addToCart = async (productId: number): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: "User not logged in" };

    const { data: existingItem, error: selectError } = await supabase
      .from('cart')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') return { success: false, message: selectError.message };

    if (!existingItem) {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('amount')
        .eq('id', productId)
        .single();
      if (productError) return { success: false, message: productError.message };

      const { error: insertError } = await supabase.from('cart').insert({
        product_id: productId,
        user_id: user.id,
        amount: productData?.amount ?? 0,
        quantity: 1,
      });
      if (insertError) return { success: false, message: insertError.message };
      return { success: true, message: "Product added to cart" };
    } else {
      const { error: updateError } = await supabase
        .from('cart')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id);
      if (updateError) return { success: false, message: updateError.message };
      return { success: true, message: "Cart quantity updated" };
    }
  };

  // Adjust Cart Quantity
  const addToCartQuantity = async (productId: number, quantityChange: number) => {
    if (!user) return { success: false, message: "User not logged in" };
    const { data: existingItem, error: selectError } = await supabase
      .from('cart')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single();
    if (selectError && selectError.code !== 'PGRST116') return { success: false, message: selectError.message };
    if (!existingItem) return { success: false, message: "Item not found in cart" };

    const newQuantity = existingItem.quantity + quantityChange;
    if (newQuantity < 1) return { success: false, message: "Quantity cannot be less than 1" };

    const { error: updateError } = await supabase.from('cart').update({ quantity: newQuantity }).eq('id', existingItem.id);
    if (updateError) return { success: false, message: updateError.message };
    return { success: true, message: "Cart updated" };
  };

  // Delete from Cart
  const deleteFromCart = async (cartId: number) => {
    if (!user) return { success: false, message: "User not logged in" };
    const { error } = await supabase.from('cart').delete().eq('id', cartId);
    if (error) return { success: false, message: error.message };
    return { success: true, message: "Item removed from cart" };
  };

  // Fetch Notifications
  const fetchNotifications = async (from = 0, to = 20) => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .range(from, to);
    if (error) return [];
    return data ?? [];
  };

  // Remove items from cart after order placement
  const removeFromCartAfterOrder = async () => {
    if (!user) return;
    await supabase.from('cart').delete().eq('user_id', user.id);
  };

  // Place Order
  const placeOrder = async (orderData: OrderData, stripeData: StripeData): Promise<number | { success: false; message: string }> => {
    if (!user) return { success: false, message: "User not logged in or cart empty" };

    const cart = await fetchCart();
    if (!cart.length) return { success: false, message: "Cart is empty" };

    try {
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + (orderData.shipping_method === 'free' ? Math.floor(Math.random() * 17 + 7) : Math.floor(Math.random() * 3 + 1)));

      const generateTrackingCode = (): string => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return `ORD-${Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`;
      };

      let trackingCode: string;
      while (true) {
        trackingCode = generateTrackingCode();
        const { data: existing } = await supabase.from('orders').select('id').eq('tracking_number', trackingCode).limit(1);
        if (!existing?.length) break;
      }

      const { data: newOrder, error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        status: orderData.payment_status === 'success' ? 'Confirmed' : 'Pending',
        created_at: new Date(),
        total_amount: orderData.amount,
        shipping_address: orderData.address,
        payment_status: orderData.payment_status,
        order_date: deliveryDate.toISOString(),
        tracking_number: trackingCode,
        shipping_method: orderData.shipping_method,
      }).select().single();
      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_each: item.amount,
      }));

      await supabase.from('order_items').insert(orderItems);

      await supabase.from('orderpayments_logs').insert({
        order_id: newOrder.id,
        stripe_payment_id: stripeData.transactionId,
        charge_id: stripeData.chargeId,
        status: stripeData.message,
        amount: orderData.amount,
        currency: 'USD',
        response_data: stripeData,
      });

      sendOrderEmail(user.name, orderData.email, cart, orderData.address, orderData.amount, newOrder.id, deliveryDate.toISOString());
      await supabase.from('notifications').insert({
        user_id: user.id,
        order_id: newOrder.id,
        message: `✨Your order #${newOrder.id} has been placed successfully!`,
        read: false,
        type: 0,
      });

      await removeFromCartAfterOrder();
      return newOrder.id;
    } catch (err: any) {
      throw err;
    }
  };
  
  // Memoize context values to optimize performance
  const value = useMemo(() => ({
    user,
    loading,
    setUser,
    fetchProducts,
    fetchProductDetail,
    fetchCart,
    addToCart,
    addToCartQuantity,
    deleteFromCart,
    fetchNotifications,
    placeOrder,
    searchProducts,
  }), [user, loading]);

  // Provide context values to children components
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
