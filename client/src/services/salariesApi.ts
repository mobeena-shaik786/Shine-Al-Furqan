import axiosInstance from '../api/axiosInstance';

export type SalaryMode = 'unique' | 'fixed';

export interface SalaryBatchSummary {
  _id: string;
  name: string;
  studentCount: number;
  classCount: number;
}

export interface UstadSalaryRow {
  ustadId: string;
  name: string;
  email: string;
  batchCount: number;
  studentTotal: number;
  batches: SalaryBatchSummary[];
  totalPresent: number;
  usedDays: number;
  uniqueDays: number;
  fixedDays: number;
  ratio: number;
  basePay: number;
  incentiveRate: number;
  incentive: number;
  total: number;
  mode: SalaryMode;
  year: number;
  month: number;
}

export interface SalaryListMeta {
  year: number;
  month: number;
  mode: SalaryMode;
  basePay: number;
  incentiveRate: number;
  stats: {
    totalSalary: number;
    ustadCount: number;
    totalPresent: number;
    classDays: number;
    activeBatches: number;
  };
}

export interface UstadSalaryDetail {
  ustadId: string;
  name: string;
  email: string;
  year: number;
  month: number;
  mode: SalaryMode;
  totalPresent: number;
  usedDays: number;
  uniqueDays: number;
  fixedDays: number;
  ratio: number;
  basePay: number;
  incentiveRate: number;
  incentive: number;
  total: number;
  batches: SalaryBatchSummary[];
  calculation: { steps: string[] };
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function listSalaries(params: {
  year: number;
  month: number;
  mode: SalaryMode;
  search?: string;
}): Promise<{ rows: UstadSalaryRow[]; meta: SalaryListMeta }> {
  try {
    const { data } = await axiosInstance.get('/salaries', { params });
    if (!data?.success) throw new Error(data?.message || 'Unable to load salaries');
    return { rows: data.data, meta: data.meta };
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to load salaries'));
  }
}

export async function getSalaryDetail(
  ustadId: string,
  params: { year: number; month: number; mode: SalaryMode },
): Promise<UstadSalaryDetail> {
  try {
    const { data } = await axiosInstance.get(`/salaries/${ustadId}`, { params });
    if (!data?.success) throw new Error(data?.message || 'Unable to load salary detail');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to load salary detail'));
  }
}
