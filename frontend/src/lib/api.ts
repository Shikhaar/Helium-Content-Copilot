/**
 * API client for Helium Content Copilot backend.
 * All calls are to the FastAPI server at localhost:8000.
 */

import type {
  AnalyzeResponse,
  Brand,
  CalendarEntry,
  ContentDraft,
  CreateProductRequest,
  GenerateContentRequest,
  Opportunity,
  PerformanceSummary,
  Product,
  ScheduleRequest,
  UpdateBrandRequest,
} from './types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.port !== '3000'
    ? '/api'
    : 'http://localhost:8000/api');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
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

// ── Brand & Data ──────────────────────────────────────────────────────────────
export const api = {
  getBrand: () => request<Brand>('/brand'),
  updateBrand: (updates: UpdateBrandRequest) =>
    request<Brand>('/brand', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  getProducts: () => request<Product[]>('/products'),
  createProduct: (body: CreateProductRequest) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteProduct: (id: string) =>
    request<{ status: string; message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),
  getPerformance: () => request<PerformanceSummary>('/performance'),

  // ── Analysis ─────────────────────────────────────────────────────────────────
  analyze: () => request<AnalyzeResponse>('/analyze', { method: 'POST' }),

  // ── Opportunities ─────────────────────────────────────────────────────────────
  getOpportunities: () => request<Opportunity[]>('/opportunities'),
  getOpportunity: (id: string) => request<Opportunity>(`/opportunities/${id}`),

  // ── Content ───────────────────────────────────────────────────────────────────
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

  updateDraft: (id: string, updates: Partial<Pick<ContentDraft, 'slides' | 'caption' | 'cta' | 'hashtags'>>) =>
    request<ContentDraft>(`/content/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  approveDraft: (id: string) =>
    request<ContentDraft>(`/content/${id}/approve`, { method: 'POST' }),

  scheduleDraft: (id: string, body: ScheduleRequest) =>
    request<ContentDraft>(`/content/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // ── Calendar ──────────────────────────────────────────────────────────────────
  getCalendar: () => request<CalendarEntry[]>('/calendar'),
  deleteCalendarEntry: (id: string) =>
    request<{ status: string; message: string }>(`/calendar/${id}`, {
      method: 'DELETE',
    }),
};
