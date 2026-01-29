import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";
import { supabase } from "../../utils/supbase";
import { AuthState, User, DecodedToken } from "../types/authTypes";

// Initial State
const initialState: AuthState = {
  user: null,
  loading: true,
  response: null,
};

// ------------------------------------------------
// VERIFY TOKEN
// ------------------------------------------------
const verifyTokenInternal = (token: string): DecodedToken | null => {
  try {
    return jwt_decode(token);
  } catch (err) {
    console.log("Token verification failed:", err);
    return null;
  }
};

// ------------------------------------------------
// ASYNC THUNKS
// ------------------------------------------------
export const handleToken = createAsyncThunk<User | null, string | null>(
  "auth/handleToken",
  async (token) => {
    if (!token) {
      await AsyncStorage.removeItem("accessToken");
      return null;
    }

    const decoded = verifyTokenInternal(token);
    if (!decoded) {
      await AsyncStorage.removeItem("accessToken");
      return null;
    }

    await AsyncStorage.setItem("accessToken", token);

    // check if user exists in Supabase
    const { data: existingUser, error: selectErr } = await supabase
      .from("users")
      .select("*")
      .eq("email", decoded.email)
      .single();

    let finalUser: User | null = null;

    if (selectErr && selectErr.code !== "PGRST116") {
      console.log("Error fetching user:", selectErr);
    }

    if (!existingUser) {
      const newUser: User = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.user_metadata?.full_name || "",
        profile: decoded.user_metadata?.avatar_url || "",
      };

      const { data: insertedUser, error: insertErr } = await supabase
        .from("users")
        .insert(newUser)
        .select()
        .single();

      if (insertErr) console.log("Error inserting user:", insertErr);
      else finalUser = insertedUser;
    } else {
      finalUser = existingUser;
    }

    return finalUser;
  }
);

export const initAuth = createAsyncThunk("auth/initAuth", async (_, thunk) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) await thunk.dispatch(handleToken(token));

  const { data } = await supabase.auth.getSession();
  const sessionToken = data?.session?.access_token;

  if (sessionToken) await thunk.dispatch(handleToken(sessionToken));

  // listen to Supabase auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN") {
      await thunk.dispatch(handleToken(session?.access_token || null));
    } else if (event === "SIGNED_OUT") {
      await thunk.dispatch(handleToken(null));
    }
  });
});

// ------------------------------------------------
// AUTH SLICE
// ------------------------------------------------
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      AsyncStorage.removeItem('accessToken');
    },
  },

  extraReducers: (builder) => {
    // HandleToken
    builder
      .addCase(handleToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(handleToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(handleToken.rejected, (state) => {
        state.loading = false;
        state.user = null;
      });

    // initAuth
    builder.addCase(initAuth.fulfilled, (state) => {
      state.loading = false;
    });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
