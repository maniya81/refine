export enum LeadStage {
  RAW = "RAW (UNQUALIFIED)",
  NEW = "NEW",
  DISCUSSION = "DISCUSSION",
  DEMO = "DEMO",
  PROPOSAL = "PROPOSAL",
  WON = "WON",
  LOST = "LOST",
}

export const LEAD_STAGE_OPTIONS = [
  { value: LeadStage.RAW, label: "RAW" },
  { value: LeadStage.NEW, label: "NEW" },
  { value: LeadStage.DISCUSSION, label: "DISCUSSION" },
  { value: LeadStage.DEMO, label: "DEMO" },
  { value: LeadStage.PROPOSAL, label: "PROPOSAL" },
  { value: LeadStage.WON, label: "WON" },
  { value: LeadStage.LOST, label: "LOST" },
];

export const LEAD_STAGE_ORDER = [
  LeadStage.RAW,
  LeadStage.NEW,
  LeadStage.DISCUSSION,
  LeadStage.DEMO,
  LeadStage.PROPOSAL,
  LeadStage.WON,
  LeadStage.LOST,
];

export const LEAD_STAGE_COLORS: Record<LeadStage, string> = {
  [LeadStage.RAW]: "default",
  [LeadStage.NEW]: "blue",
  [LeadStage.DISCUSSION]: "orange",
  [LeadStage.DEMO]: "purple",
  [LeadStage.PROPOSAL]: "cyan",
  [LeadStage.WON]: "green",
  [LeadStage.LOST]: "red",
};

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  [LeadStage.RAW]: "RAW",
  [LeadStage.NEW]: "NEW",
  [LeadStage.DISCUSSION]: "DISCUSSION",
  [LeadStage.DEMO]: "DEMO",
  [LeadStage.PROPOSAL]: "PROPOSAL",
  [LeadStage.WON]: "WON",
  [LeadStage.LOST]: "LOST",
};

export interface Lead {
  id: string;
  since: string;
  stage: LeadStage;
  tags: string[];
  requirements: string;
  notes: string;
  potential: number;
  business: {
    id: string;
    business: string;
    name: string;
    title?: string;
    designation?: string;
    mobile: string;
    email: string;
    website?: string;
    address_line_1?: string;
    address_line_2?: string;
    country?: string;
    city?: string;
    gstin?: string;
    code?: string;
  };
  product?: {
    id: number;
    name: string;
  };
  source?: {
    id: number;
    name: string;
    is_default?: boolean;
  };
  assigned_user?: {
    id: string;
    name: string;
  };
}

export interface CreateLeadPayload {
  stage: LeadStage | string;
  title?: string;
  since: string;
  country?: string;
  assigned_user_id?: string;
  source_id?: number;
  product_id?: number;
  potential?: number;
  tags?: string[];
  requirements?: string;
  notes?: string;
  business: {
    business: string;
    name: string;
    title?: string;
    designation?: string;
    mobile: string;
    email: string;
    website?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    country?: string;
    gstin?: string;
    code?: string;
  };
}

export interface UpdateLeadPayload {
  stage?: LeadStage | string;
  requirements?: string;
  notes?: string;
  assigned_to?: string;
  tags?: string[];
  source_id?: number;
  product_id?: number;
  potential?: number;
  business?: {
    id: string;
    business: string;
    name: string;
    title?: string | null;
    designation?: string;
    mobile: string;
    email: string;
    website?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    country?: string;
    gstin?: string;
    code?: string;
  };
  since?: string;
}
