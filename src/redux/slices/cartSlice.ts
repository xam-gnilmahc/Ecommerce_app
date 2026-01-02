import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../utils/supbase';
import { CartItem, CartState, ActionResponse } from '../types/cartTypes';

// Initial State
const initialState: CartState = {
    loading: false,
    list: [],
    response: null,
};

// Fetch Cart Items
export const fetchCart = createAsyncThunk<
    CartItem[],
    number | string,
    { rejectValue: ActionResponse }
>('cart/fetchCart', async (userId, { rejectWithValue }) => {
    const { data, error } = await supabase
        .from('cart')
        .select(
            `
        *,
        products:product_id (
          id,
          name,
          banner_url,
          amount,
          description,
          rating
        )
      `
        )
        .eq('user_id', userId)
        .order('id', { ascending: false });

    if (error) {
        return rejectWithValue({ success: false, message: error.message });
    }

    return data || [];
});

// Add to Cart
export const addToCart = createAsyncThunk<
    ActionResponse,
    { productId?: number; userId?: number | string },
    { rejectValue: ActionResponse }
>('cart/addToCart', async ({ productId, userId }, { rejectWithValue }) => {
    if (!userId) return rejectWithValue({ success: false, message: 'User not logged in' });

    const { data: existingItem, error: selectError } = await supabase
        .from('cart')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

    if (selectError && selectError.code !== 'PGRST116') {
        return rejectWithValue({ success: false, message: selectError.message });
    }

    if (!existingItem) {
        const { data: productData, error: productError } = await supabase
            .from('products')
            .select('amount')
            .eq('id', productId)
            .single();

        if (productError) {
            return rejectWithValue({ success: false, message: productError.message });
        }

        const { error: insertError } = await supabase.from('cart').insert([
            {
                product_id: productId,
                user_id: userId,
                amount: productData?.amount ?? 0,
                quantity: 1,
            },
        ]);

        if (insertError) {
            return rejectWithValue({ success: false, message: insertError.message });
        }

        return { success: true, message: 'Product added to cart' };
    }

    // Update quantity
    const { error: updateError } = await supabase
        .from('cart')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id);

    if (updateError) {
        return rejectWithValue({ success: false, message: updateError.message });
    }

    return { success: true, message: 'Product quantity updated' };
});

// Update Cart Quantity
export const updateCartQuantity = createAsyncThunk<
    ActionResponse,
    { productId?: number; quantityChange?: number; userId?: number | string },
    { rejectValue: ActionResponse }
>('cart/updateCartQuantity', async ({ productId, quantityChange, userId }, { rejectWithValue }) => {
    if (!userId)
        return rejectWithValue({ success: false, message: 'User not logged in' });

    try {
        const { data: existingItem, error: selectError } = await supabase
            .from('cart')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            return rejectWithValue({ success: false, message: selectError.message });
        }

        if (!existingItem)
            return rejectWithValue({ success: false, message: 'Item not found' });

        const newQty = existingItem.quantity + (quantityChange || 0);
        if (newQty < 1) {
            return rejectWithValue({
                success: false,
                message: 'Quantity cannot be less than 1',
            });
        }

        const { error: updateError } = await supabase
            .from('cart')
            .update({ quantity: newQty })
            .eq('id', existingItem.id);

        if (updateError) {
            return rejectWithValue({ success: false, message: updateError.message });
        }

        return { success: true, message: 'Cart updated successfully' };
    } catch (err: any) {
        return rejectWithValue({
            success: false,
            message: err?.message || 'Failed to update cart',
        });
    }
});


export const deleteFromCart = createAsyncThunk<
  ActionResponse,
  { cartId?: number; userId?: number | string },
  { rejectValue: ActionResponse }
>('cart/deleteFromCart', async ({ cartId, userId }, { rejectWithValue }) => {
  if (!userId) {
    return rejectWithValue({ success: false, message: "User not logged in" });
  }

  try {
    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("id", cartId)
      .eq("user_id", userId);

    if (error) {
      return rejectWithValue({ success: false, message: error.message });
    }

    return { success: true, message: "Item removed from cart" };
  } catch (err: any) {
    return rejectWithValue({
      success: false,
      message: err?.message || "Failed to remove item",
    });
  }
});


// Slice
const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // Fetch Cart
        builder.addCase(fetchCart.pending, (state) => {
            state.loading = true;
            state.response = null;
        });
        builder.addCase(fetchCart.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
            state.loading = false;
            state.list = action.payload;
            state.response = { success: true, message: 'Cart loaded successfully' };
        });
        builder.addCase(fetchCart.rejected, (state, action) => {
            state.loading = false;
            state.response = action.payload || { success: false, message: 'Failed' };
        });

        // Add to Cart
        builder.addCase(addToCart.pending, (state) => {
            state.loading = true;
            state.response = null;
        });
        builder.addCase(addToCart.fulfilled, (state, action: PayloadAction<ActionResponse>) => {
            state.loading = false;
            state.response = action.payload;
        });
        builder.addCase(addToCart.rejected, (state, action) => {
            state.loading = false;
            state.response = action.payload || null;
        });

        // Update Quantity
        builder.addCase(updateCartQuantity.pending, (state) => {
            state.loading = true;
            state.response = null;
        });
        builder.addCase(updateCartQuantity.fulfilled, (state, action: PayloadAction<ActionResponse>) => {
            state.loading = false;
            state.response = action.payload;
        });
        builder.addCase(updateCartQuantity.rejected, (state, action) => {
            state.loading = false;
            state.response = action.payload || null;
        });

        // Delete from Cart
        builder.addCase(deleteFromCart.pending, (state) => {
            state.loading = true;
            state.response = null;
        });
        builder.addCase(deleteFromCart.fulfilled, (state, action: PayloadAction<ActionResponse>) => {
            state.loading = false;
            state.response = action.payload;
        });
        builder.addCase(deleteFromCart.rejected, (state, action) => {
            state.loading = false;
            state.response = action.payload || null;
        });
    },
});

export default cartSlice.reducer;
