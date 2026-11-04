// Если крадёте, то крадите ради реально хороших людей
import { localApi } from './local.js';
import { createSupabaseApi } from './supabase.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const api = url && key ? createSupabaseApi(url, key) : localApi;
