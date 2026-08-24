/**
 * API client for BrandBrew Content Copilot backend.
 * Supports multi-tenant brand scoping across all endpoints.
 */

import type {
  AnalyzeResponse,
  Brand,
  BrandStats,
  CalendarEntry,
  ContentDraft,
  CreateBrandRequest,
  CreateProductRequest,
  GenerateContentRequest,
  Opportunity,
  PerformanceSummary,
  Product,
  ScheduleRequest,
  UpdateBrandRequest,
  UserResponse,
} from './types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.port !== '3000'
    ? '/api'
    : 'http://localhost:8000/api');

// Store a token-getter function rather than a static token.
// Clerk short-lived JWTs expire every ~60 seconds, so we must call
// getToken() before every request to always get a fresh, valid token.
let _getToken: (() => Promise<string | null>) | null = null;

export const setApiAuthToken = (token: string | null) => {
  // Legacy single-value setter — wrap in a getter for backward compat.
  if (token) {
    _getToken = () => Promise.resolve(token);
  } else {
    _getToken = null;
  }
};

/** Register Clerk's getToken function so every request fetches a fresh JWT. */
export const setTokenGetter = (getter: (() => Promise<string | null>) | null) => {
  _getToken = getter;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (_getToken) {
    const token = await _getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
    const detail = Array.isArray(error.detail)
      ? error.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
      : error.detail || `HTTP ${res.status}`;
    throw new Error(detail);
  }
  return res.json();
}

// ── Brand & Multi-Tenant Data ────────────────────────────────────────────────
export const api = {
  getMe: () => request<UserResponse>('/auth/me'),
  listBrands: () => request<Brand[]>('/brands'),
  getBrand: (brandId?: string) =>
    brandId ? request<Brand>(`/brands/${brandId}`) : request<Brand>('/brand'),
  createBrand: (body: CreateBrandRequest) =>
    request<Brand>('/brands', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateBrand: (updates: UpdateBrandRequest, brandId?: string) =>
    brandId
      ? request<Brand>(`/brands/${brandId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        })
      : request<Brand>('/brand', {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }),
  getBrandStats: (brandId: string) =>
    request<BrandStats>(`/brands/${brandId}/stats`),
  deleteBrand: (brandId: string) =>
    request<{ status: string; message: string }>(`/brands/${brandId}`, {
      method: 'DELETE',
    }),

  getProducts: (brandId?: string) =>
    brandId ? request<Product[]>(`/brands/${brandId}/products`) : request<Product[]>('/products'),
  createProduct: (body: CreateProductRequest, brandId?: string) =>
    brandId
      ? request<Product>(`/brands/${brandId}/products`, {
          method: 'POST',
          body: JSON.stringify(body),
        })
      : request<Product>('/products', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
  deleteProduct: (id: string, brandId?: string) =>
    brandId
      ? request<{ status: string; message: string }>(`/brands/${brandId}/products/${id}`, {
          method: 'DELETE',
        })
      : request<{ status: string; message: string }>(`/products/${id}`, {
          method: 'DELETE',
        }),

  getPerformance: (brandId?: string) =>
    brandId
      ? request<PerformanceSummary>(`/brands/${brandId}/performance`)
      : request<PerformanceSummary>('/performance'),

  // ── Analysis & Opportunities ─────────────────────────────────────────────────
  analyze: (brandId?: string) =>
    brandId
      ? request<AnalyzeResponse>(`/brands/${brandId}/analyze`, { method: 'POST' })
      : request<AnalyzeResponse>('/analyze', { method: 'POST' }),

  getOpportunities: (brandId?: string) =>
    brandId
      ? request<Opportunity[]>(`/brands/${brandId}/opportunities`)
      : request<Opportunity[]>('/opportunities'),
  getOpportunity: (id: string, brandId?: string) =>
    request<Opportunity>(`/opportunities/${id}`),

  // ── Content Studio ───────────────────────────────────────────────────────────
  generateContent: (body: GenerateContentRequest) =>
    request<ContentDraft>('/content/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  regenerateContent: (body: GenerateContentRequest) =>
    request<ContentDraft>('/content/regenerate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getDraft: (id: string) => request<ContentDraft>(`/content/${id}`),
  listDrafts: (brandId?: string) =>
    brandId ? request<ContentDraft[]>(`/brands/${brandId}/drafts`) : request<ContentDraft[]>('/content/drafts'),

  updateDraft: (id: string, updates: Partial<Pick<ContentDraft, 'slides' | 'caption' | 'cta' | 'hashtags'>>) =>
    request<ContentDraft>(`/content/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  approveDraft: (id: string) =>
    request<ContentDraft>(`/content/${id}/approve`, { method: 'POST' }),

  deleteDraft: (id: string) =>
    request<{ status: string; message: string }>(`/content/${id}`, { method: 'DELETE' }),

  scheduleDraft: (id: string, body: ScheduleRequest) =>
    request<ContentDraft>(`/content/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // ── Calendar ──────────────────────────────────────────────────────────────────
  getCalendar: (brandId?: string) =>
    brandId
      ? request<CalendarEntry[]>(`/brands/${brandId}/calendar`)
      : request<CalendarEntry[]>('/calendar'),
  deleteCalendarEntry: (id: string) =>
    request<{ status: string; message: string }>(`/calendar/${id}`, {
      method: 'DELETE',
    }),
};
