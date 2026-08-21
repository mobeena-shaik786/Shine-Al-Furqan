import axiosInstance from '../api/axiosInstance';
import type { UserRole } from '../types/auth';

export interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  gender?: string;
  languages?: string[];
  phone?: string;
  alternatePhone?: string;
  workLocation?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsersListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  stats: {
    total: number;
    active: number;
    inactive: number;
    male?: number;
    female?: number;
  };
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  gender?: 'male' | 'female' | 'other' | 'prefer_not';
  language?: string;
  batchId?: string;
  sort?: 'name' | 'email' | 'created' | 'role';
}

/** Core fields persisted when creating a managed user from the UI. */
export interface AddUserCorePayload {
  name: string;
  email: string;
  password: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not';
  languages?: string[];
  phone?: string;
  alternatePhone?: string;
  workLocation?: string;
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function listUsers(
  params: ListUsersParams,
): Promise<{ users: ManagedUser[]; meta: UsersListMeta }> {
  const { data } = await axiosInstance.get('/users', {
    params: {
      ...params,
      isActive: params.isActive === undefined ? undefined : String(params.isActive),
    },
  });
  if (!data?.success) {
    throw new Error(data?.message || 'Unable to load users');
  }
  return { users: data.data as ManagedUser[], meta: data.meta as UsersListMeta };
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  gender?: 'male' | 'female' | 'other' | 'prefer_not';
  languages?: string[];
  phone?: string;
  alternatePhone?: string;
  workLocation?: string;
}): Promise<ManagedUser> {
  try {
    const { data } = await axiosInstance.post('/users', input);
    if (!data?.success) throw new Error(data?.message || 'Unable to create user');
    return data.data as ManagedUser;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to create user'));
  }
}

export async function updateUser(
  id: string,
  input: { name?: string; email?: string; password?: string },
): Promise<ManagedUser> {
  try {
    const { data } = await axiosInstance.patch(`/users/${id}`, input);
    if (!data?.success) throw new Error(data?.message || 'Unable to update user');
    return data.data as ManagedUser;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to update user'));
  }
}

export async function updateUserStatus(id: string, isActive: boolean): Promise<ManagedUser> {
  try {
    const { data } = await axiosInstance.patch(`/users/${id}/status`, { isActive });
    if (!data?.success) throw new Error(data?.message || 'Unable to update status');
    return data.data as ManagedUser;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to update status'));
  }
}
