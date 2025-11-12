import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import setting from '../config/setting';

export const supabase = createClient(setting.SUPABASE_URL, setting.SUPABASE_KEY);
