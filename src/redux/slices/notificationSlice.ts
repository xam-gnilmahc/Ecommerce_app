import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../utils/supbase';
import { Notification, NotificationState, ActionResponse } from '../types/notificationTypes';

// Initial state
const initialState: NotificationState = {
  loading: false,
  list: [],
  response: null,
};

// Parameters for fetching notifications
interface FetchNotificationParams {
    from?: number;
    to?: number;
    userId?: number;
}

// Fetch notifications
export const fetchNotifications = createAsyncThunk<Notification[], FetchNotificationParams, { rejectValue: ActionResponse}>(
  'notifications/fetchNotifications',
  async ({ from = 0, to = 20, userId }, {rejectWithValue }) => {
    try {

      if (!userId) return rejectWithValue({ success: false, message: 'User not logged in' });

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false })
        .range(from, to);

      if (error) return rejectWithValue({ success: false, message: error.message });

      return data || [];
    } catch (err: any) {
      return rejectWithValue({ success: false, message: err.message || 'Failed to fetch notifications' });
    }
  }
);

// Notifications slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.pending, (state) => {
      state.loading = true;
      state.response = null;
    });

    builder.addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
      state.loading = false;
      state.list = action.payload;
      state.response = { success: true, message: 'Notifications loaded successfully' };
    });

    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.loading = false;
      state.response = action.payload || { success: false, message: 'Failed to load notifications' };
    });
  },
});

export default notificationsSlice.reducer;
