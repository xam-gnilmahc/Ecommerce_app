import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../utils/supbase';
import { Product, ProductState } from '../types/productTypes';

// Initial state
const initialState: ProductState = {
    loading: false,
    list: [],
    detail: null,
    response: null,
};

//
interface FetchProductsParams {
    brand?: string;
    from?: number;
    to?: number;
}


// Fetch product list
export const fetchProducts = createAsyncThunk<Product[], FetchProductsParams>(
    'products/fetchProducts',
    async ({ brand, from = 0, to = 20 }) => {
        let query = supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .in('type', ['Mobile', 'Watch', 'Dslr'])
            .order('id', { ascending: false });

        if (brand) query = query.in('brand', [brand]);

        const { data, error } = await query.range(from, to);

        if (error) throw new Error(error.message);
        return data || [];
    }
);

// Fetch product detail
export const fetchProductDetail = createAsyncThunk<Product | null, number>(
    'products/fetchDetail',
    async (id) => {
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

        if (error) throw new Error(error.message);
        return data as Product;
    }
);

// Products slice
const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // Fetch Products
        builder.addCase(fetchProducts.pending, (state) => {
            state.loading = true;
            state.response = null;
        });
        builder.addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
            state.loading = false;
            state.list = action.payload;
            state.response = 'Products loaded successfully';
        });
        builder.addCase(fetchProducts.rejected, (state, action) => {
            state.loading = false;
            state.response = action.error.message || 'Failed to load products';
        });

        // Fetch Product Detail
        builder.addCase(fetchProductDetail.pending, (state) => {
            state.loading = true;
            state.detail = null;
        });
        builder.addCase(fetchProductDetail.fulfilled, (state, action: PayloadAction<any | null>) => {
            state.loading = false;
            state.detail = action.payload;
        });
        builder.addCase(fetchProductDetail.rejected, (state, action) => {
            state.loading = false;
            state.response = action.error.message || 'Failed to fetch product detail';
        });
    },
});

export default productsSlice.reducer;
