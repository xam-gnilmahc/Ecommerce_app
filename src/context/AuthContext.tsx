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
  fetchProductDetail: () => Promise<any>;
  fetchCart: () => Promise<any>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  fetchProducts: async () => [],
  fetchProductDetail: async () => [],
  fetchCart: async () => [],
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

  const fetchCart = async() => {
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
        .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching cart:", error.message);
      return [];
    }

    return data;
  };


  return (
    <AuthContext.Provider value={{ user, loading, setUser, fetchProducts, fetchProductDetail , fetchCart}}>
      {children}
    </AuthContext.Provider>
  );
};
