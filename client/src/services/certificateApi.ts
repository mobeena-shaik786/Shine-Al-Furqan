import axiosInstance from '../api/axiosInstance';

export interface CertificateDto {
  _id: string;
  certificateNo: string;
  studentId: string;
  batchId: string;
  courseId: string;
  studentName: string;
  batchName: string;
  courseTitle: string;
  issuedAt: string;
  issuedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EligibleStudentDto {
  studentId: string;
  studentName: string;
  studentEmail: string;
  batchId: string;
  batchName: string;
  courseId: string;
  courseTitle: string;
  enrollmentId: string;
}

export interface CompletedBatchOption {
  _id: string;
  name: string;
  courseId: string;
  courseTitle: string;
}

export interface CertificateListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function listIssuedCertificates(params?: {
  search?: string;
  batchId?: string;
  page?: number;
  limit?: number;
}): Promise<{ certificates: CertificateDto[]; meta: CertificateListMeta }> {
  try {
    const { data } = await axiosInstance.get('/certificates', { params });
    if (!data?.success) throw new Error(data?.message || 'Unable to load certificates');
    return {
      certificates: Array.isArray(data.data) ? data.data : [],
      meta: data.meta || { page: 1, limit: 50, total: 0, totalPages: 1 },
    };
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to load certificates'));
  }
}

export async function listEligibleStudents(params?: {
  search?: string;
  batchId?: string;
  page?: number;
  limit?: number;
}): Promise<{ students: EligibleStudentDto[]; meta: CertificateListMeta }> {
  try {
    const { data } = await axiosInstance.get('/certificates/eligible', { params });
    if (!data?.success) throw new Error(data?.message || 'Unable to load eligible students');
    return {
      students: Array.isArray(data.data) ? data.data : [],
      meta: data.meta || { page: 1, limit: 50, total: 0, totalPages: 1 },
    };
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to load eligible students'));
  }
}

export async function listCompletedBatchesForCertificates(): Promise<CompletedBatchOption[]> {
  try {
    const { data } = await axiosInstance.get('/certificates/batches/completed');
    if (!data?.success) throw new Error(data?.message || 'Unable to load batches');
    return Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to load batches'));
  }
}

export async function issueCertificates(input: {
  batchId: string;
  studentIds?: string[];
}): Promise<CertificateDto[]> {
  try {
    const { data } = await axiosInstance.post('/certificates/issue', input);
    if (!data?.success) throw new Error(data?.message || 'Unable to issue certificates');
    return Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to issue certificates'));
  }
}
