import { api } from "@/lib/api-client";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

function toQuery(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export type CampaignChannel = "Google Search" | "LinkedIn Ads" | "Meta Ads" | "WhatsApp" | "Email" | "Webinar" | "Marketplace";
export type CampaignStatus = "Draft" | "Active" | "Review" | "Scale" | "Archived";
export type SourceType = "Organic" | "Paid" | "Referral" | "Outbound" | "Event" | "Partner" | "Offline";
export type SourceStatus = "Active" | "Review" | "Paused" | "Archived";
export type SourceQuality = "High" | "High Intent" | "Enterprise" | "Warm" | "Mixed" | "Nurture" | "Low";

type MarketingCampaignApiRecord = {
  id: string;
  campaign_code: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  status_label: string;
  objective: string;
  audience_segment: string;
  budget_amount: string;
  spent_amount: string;
  leads: number;
  mql: number;
  pipeline_amount: string;
  start_date: string;
  end_date: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  landing_page: string;
  lead_form: string;
  owner: string;
  next_action: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type LeadSourceApiRecord = {
  id: string;
  source_code: string;
  source: string;
  source_type: SourceType;
  type_label: string;
  normalized_key: string;
  default_utm_source: string;
  default_utm_medium: string;
  owner: string;
  quality: SourceQuality;
  quality_label: string;
  leads: number;
  mql: number;
  sql: number;
  won: number;
  last_30_change: number;
  status: SourceStatus;
  status_label: string;
  next_action: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MarketingCampaignRecord = {
  backendId: string;
  id: string;
  name: string;
  channel: CampaignChannel;
  objective: string;
  audienceSegment: string;
  budgetAmount: number;
  spentAmount: number;
  leads: number;
  mql: number;
  pipelineAmount: number;
  startDate: string;
  endDate: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  landingPage: string;
  leadForm: string;
  owner: string;
  status: CampaignStatus;
  statusLabel: string;
  nextAction: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MarketingCampaignPayload = {
  name: string;
  channel: CampaignChannel;
  objective: string;
  audience_segment: string;
  budget_amount: string;
  spent_amount: string;
  leads: number;
  mql: number;
  pipeline_amount: string;
  start_date: string;
  end_date: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  landing_page: string;
  lead_form: string;
  owner: string;
  status: CampaignStatus;
  next_action: string;
};

export type LeadSourceRecord = {
  backendId: string;
  id: string;
  source: string;
  type: SourceType;
  normalizedKey: string;
  defaultUtmSource: string;
  defaultUtmMedium: string;
  owner: string;
  quality: SourceQuality;
  leads: number;
  mql: number;
  sql: number;
  won: number;
  last30Change: number;
  status: SourceStatus;
  statusLabel: string;
  qualityLabel: string;
  typeLabel: string;
  nextAction: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LeadSourcePayload = {
  source: string;
  source_type: SourceType;
  normalized_key?: string;
  default_utm_source: string;
  default_utm_medium: string;
  owner: string;
  quality: SourceQuality;
  leads: number;
  mql: number;
  sql: number;
  won: number;
  last_30_change: number;
  status: SourceStatus;
  next_action: string;
};

function mapCampaign(record: MarketingCampaignApiRecord): MarketingCampaignRecord {
  return {
    backendId: record.id,
    id: record.campaign_code,
    name: record.name,
    channel: record.channel,
    objective: record.objective,
    audienceSegment: record.audience_segment,
    budgetAmount: Number(record.budget_amount) || 0,
    spentAmount: Number(record.spent_amount) || 0,
    leads: Number(record.leads) || 0,
    mql: Number(record.mql) || 0,
    pipelineAmount: Number(record.pipeline_amount) || 0,
    startDate: record.start_date,
    endDate: record.end_date,
    utmSource: record.utm_source,
    utmMedium: record.utm_medium,
    utmCampaign: record.utm_campaign,
    landingPage: record.landing_page,
    leadForm: record.lead_form,
    owner: record.owner,
    status: record.status,
    statusLabel: record.status_label,
    nextAction: record.next_action,
    isActive: record.is_active,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapSource(record: LeadSourceApiRecord): LeadSourceRecord {
  return {
    backendId: record.id,
    id: record.source_code,
    source: record.source,
    type: record.source_type,
    normalizedKey: record.normalized_key,
    defaultUtmSource: record.default_utm_source,
    defaultUtmMedium: record.default_utm_medium,
    owner: record.owner,
    quality: record.quality,
    leads: Number(record.leads) || 0,
    mql: Number(record.mql) || 0,
    sql: Number(record.sql) || 0,
    won: Number(record.won) || 0,
    last30Change: Number(record.last_30_change) || 0,
    status: record.status,
    statusLabel: record.status_label,
    qualityLabel: record.quality_label,
    typeLabel: record.type_label,
    nextAction: record.next_action,
    isActive: record.is_active,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function listMarketingCampaigns(params?: { search?: string; status?: string; channel?: string }) {
  const response = await api.get<ApiResponse<MarketingCampaignApiRecord[]>>(`/marketing/campaigns/${toQuery(params)}`);
  return response.data.map(mapCampaign);
}

export async function createMarketingCampaign(payload: MarketingCampaignPayload) {
  const response = await api.post<ApiResponse<MarketingCampaignApiRecord>>("/marketing/campaigns/", payload);
  return mapCampaign(response.data);
}

export async function updateMarketingCampaign(campaignId: string, payload: Partial<MarketingCampaignPayload>) {
  const response = await api.put<ApiResponse<MarketingCampaignApiRecord>>(`/marketing/campaigns/${campaignId}/`, payload);
  return mapCampaign(response.data);
}

export async function listMarketingSources(params?: { search?: string; status?: string; source_type?: string }) {
  const response = await api.get<ApiResponse<LeadSourceApiRecord[]>>(`/marketing/sources/${toQuery(params)}`);
  return response.data.map(mapSource);
}

export async function createMarketingSource(payload: LeadSourcePayload) {
  const response = await api.post<ApiResponse<LeadSourceApiRecord>>("/marketing/sources/", payload);
  return mapSource(response.data);
}

export async function updateMarketingSource(sourceId: string, payload: Partial<LeadSourcePayload>) {
  const response = await api.put<ApiResponse<LeadSourceApiRecord>>(`/marketing/sources/${sourceId}/`, payload);
  return mapSource(response.data);
}

