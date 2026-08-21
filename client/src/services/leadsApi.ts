import { axiosInstance } from '../api/axiosInstance';

export type LeadStatus = 'new' | 'follow_up' | 'interested' | 'enrolled' | 'not_interested';
export type LeadSource = 'whatsapp' | 'website' | 'referral' | 'walk_in' | 'social' | 'other';
export type LeadGender = 'male' | 'female' | 'other' | 'prefer_not';

export interface LeadDto {
  _id: string;
  name: string;
  phone: string;
  email: string;
  gender?: LeadGender;
  source: LeadSource;
  status: LeadStatus;
  language: string;
  assignment: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  stats: {
    total: number;
    new: number;
    follow_up: number;
    interested: number;
    enrolled: number;
    not_interested: number;
    interestedAndEnrolled: number;
  };
}

export interface ListLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  gender?: LeadGender;
  source?: LeadSource;
  language?: string;
  assignment?: string;
  from?: string;
  to?: string;
}

export type LeadPayload = {
  name: string;
  phone: string;
  email?: string;
  gender?: LeadGender;
  source: LeadSource;
  status: LeadStatus;
  language?: string;
  assignment?: string;
  notes?: string;
};

export async function listLeads(
  params: ListLeadsParams = {},
): Promise<{ leads: LeadDto[]; meta: LeadListMeta }> {
  const { data } = await axiosInstance.get('/leads', { params });
  return { leads: data.data, meta: data.meta };
}

export async function createLead(input: LeadPayload): Promise<LeadDto> {
  const { data } = await axiosInstance.post('/leads', input);
  return data.data;
}

export async function updateLead(id: string, input: Partial<LeadPayload>): Promise<LeadDto> {
  const { data } = await axiosInstance.patch(`/leads/${id}`, input);
  return data.data;
}

export async function deleteLead(id: string): Promise<void> {
  await axiosInstance.delete(`/leads/${id}`);
}
