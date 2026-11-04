import { localApi } from './local.js';
import { createSupabaseApi } from './supabase.js';

// Если в .env указаны ключи Supabase — работаем с настоящей базой, иначе демо-режим в браузере.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const api = url && key ? createSupabaseApi(url, key) : localApi;
