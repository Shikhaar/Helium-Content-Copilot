/**
 * TypeScript interfaces for BrandBrew Content Copilot frontend.
 * Mirrors the Pydantic schemas from the backend exactly.
 */

export type Platform = 'Instagram' | 'LinkedIn' | 'X';
export type PostFormat = 'Carousel' | 'Reel' | 'Static Post';
export type Objective =
  | 'Engagement'
  | 'Product Discovery'
  | 'Engagement + Product Discovery'
  | 'Conversion'
  | 'Education'
  | 'Education + Engagement'
  | 'Awareness';
export type ContentStatus = 'draft' | 'approved' | 'scheduled' | 'published';
export type Confidence = 'High' | 'Medium' | 'Low';
export type InventoryStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface BrandAudience {
  age_range: string;
  location: string;
  interests: string[];
  shopping_behavior: string[];
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  tone: string[];
  audience: BrandAudience;
  campaign: string;
}

export interface CreateBrandRequest {
  name: string;
  description?: string;
  tone: string[];
  campaign: string;
  audience?: BrandAudience;
  id?: string;
}

export interface BrandStats {
  brand_id: string;
  products: number;
  historical_posts: number;
  opportunities: number;
  content_drafts: number;
  calendar_entries: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price_inr: number;
  description: string;
  features: string[];
  season: string;
  target_audience: string;
  inventory_status: InventoryStatus;
  views: number;
  sales: number;
}

export interface ScoreBreakdown {
  historical: number;   // /25
  product: number;      // /25
  audience: number;     // /20
  seasonal: number;     // /15
  objective: number;    // /15
  total: number;        // /100
}

export interface Opportunity {
  id: string;
  title: string;
  content_angle: string;
  audience: string;
  objective: string;
  platform: string;
  format: string;
  suggested_product_id: string;
  suggested_product_name: string;
  why: string;
  historical_signal: string;
  product_signal: string;
  audience_signal: string;
  seasonal_signal: string;
  business_signal: string;
  score: number;
  score_breakdown: ScoreBreakdown;
  confidence: Confidence;
  confidence_reason: string;
  created_at: string;
  is_demo: boolean;
}

export interface FormatPerformance {
  format: string;
  avg_engagement_rate: number;
  post_count: number;
}

export interface AudiencePerformance {
  audience: string;
  avg_engagement_rate: number;
  post_count: number;
}

export interface PerformanceSummary {
  brand_avg_engagement_rate: number;
  total_posts: number;
  by_format: FormatPerformance[];
  by_audience: AudiencePerformance[];
  top_performing_format: string;
  top_performing_audience: string;
}

export interface AnalyzeResponse {
  opportunities: Opportunity[];
  performance_summary: PerformanceSummary;
  is_demo: boolean;
}

export interface CarouselSlide {
  slide_number: number;
  headline: string;
  body: string;
  visual_cue: string;
}

export interface ContentDraft {
  id: string;
  opportunity_id: string;
  platform: string;
  format: string;
  audience: string;
  objective: string;
  slides: CarouselSlide[];
  caption: string;
  cta: string;
  hashtags: string[];
  status: ContentStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  created_at: string;
  updated_at: string;
  is_demo: boolean;
}

export interface CalendarEntry {
  id: string;
  draft_id: string;
  title: string;
  platform: string;
  format: string;
  status: ContentStatus;
  scheduled_datetime: string;
}

export interface GenerateContentRequest {
  opportunity_id: string;
  platform: Platform;
  format: PostFormat;
  audience: string;
  objective: Objective;
}

export interface ScheduleRequest {
  scheduled_date: string;
  scheduled_time: string;
  platform: Platform;
}

export interface UpdateBrandRequest {
  name?: string;
  description?: string;
  tone?: string[];
  campaign?: string;
  audience?: BrandAudience;
}

export interface CreateProductRequest {
  name: string;
  category: string;
  price_inr: number;
  description?: string;
  features?: string[];
  season?: string;
  target_audience?: string;
  inventory_status?: InventoryStatus;
  views?: number;
  sales?: number;
}

export interface UserResponse {
  id: string;
  clerk_user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

