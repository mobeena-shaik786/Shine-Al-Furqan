import type { FilterQuery } from 'mongoose';
import { Enrollment } from '../models/academic';
import { IUser, User, UserRole } from '../models/User';
import { AppError } from '../utils/AppError';
import { escapeRegExp } from '../utils/escapeRegExp';
import { revokeAllRefreshTokensForUser } from './auth.service';
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
  UpdateUserStatusInput,
} from '../validators/user.validator';

export type ManagedUser = {
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
};

export type Actor = {
  id: string;
  role: UserRole;
};

/** Roles the actor may create/edit/deactivate. */
export function allowedManagedRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === 'admin') return ['admin', 'coordinator', 'ustad', 'student'];
  if (actorRole === 'coordinator') return ['student'];
  return [];
}

/** Roles the actor may list (read). Coordinators can list ustads for course assignment. */
export function allowedListRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === 'admin') return ['admin', 'coordinator', 'ustad', 'student'];
  if (actorRole === 'coordinator') return ['student', 'ustad'];
  return [];
}

function assertCanManageRole(actor: Actor, targetRole: UserRole): void {
  const allowed = allowedManagedRoles(actor.role);
  if (!allowed.includes(targetRole)) {
    throw new AppError('You do not have permission to manage this role', 403);
  }
}

export function toManagedUser(user: IUser): ManagedUser {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    gender: user.gender || '',
    languages: Array.isArray(user.languages) ? user.languages : [],
    phone: user.phone || '',
    alternatePhone: user.alternatePhone || '',
    workLocation: user.workLocation || '',
    lastLogin: user.lastLogin ? user.lastLogin.toISOString() : undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function isDuplicateEmailError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: number }).code === 11000,
  );
}

export async function listUsers(actor: Actor, query: ListUsersQuery) {
  const listable = allowedListRoles(actor.role);
  if (listable.length === 0) {
    throw new AppError('You do not have permission to list users', 403);
  }

  if (query.role) {
    if (!listable.includes(query.role)) {
      throw new AppError('You do not have permission to manage this role', 403);
    }
  }

  const filter: FilterQuery<IUser> = {
    role: query.role ? query.role : { $in: listable },
  };

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.gender) {
    filter.gender = query.gender;
  }

  if (query.language) {
    filter.languages = query.language;
  }

  if (query.batchId) {
    const studentIds = await Enrollment.find({
      batch: query.batchId,
      status: { $in: ['active', 'pending', 'completed'] },
    }).distinct('student');
    filter._id = { $in: studentIds };
  }

  const search = query.search?.trim();
  if (search) {
    const rx = new RegExp(escapeRegExp(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    name: { name: 1 },
    email: { email: 1 },
    role: { role: 1 },
    created: { createdAt: -1 },
  };
  const sort = sortMap[query.sort] ?? sortMap.name;

  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const roleForStats = query.role ?? (listable.length === 1 ? listable[0] : undefined);
  const statsFilter: FilterQuery<IUser> = roleForStats
    ? { role: roleForStats }
    : { role: { $in: listable } };

  const [total, users, statsTotal, statsActive, statsMale, statsFemale] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(statsFilter),
    User.countDocuments({ ...statsFilter, isActive: true }),
    User.countDocuments({ ...statsFilter, gender: 'male' }),
    User.countDocuments({ ...statsFilter, gender: 'female' }),
  ]);

  return {
    users: users.map(toManagedUser),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats: {
        total: statsTotal,
        active: statsActive,
        inactive: statsTotal - statsActive,
        male: statsMale,
        female: statsFemale,
      },
    },
  };
}

export async function getUserById(actor: Actor, id: string) {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (!allowedListRoles(actor.role).includes(user.role)) {
    throw new AppError('You do not have permission to manage this role', 403);
  }
  return toManagedUser(user);
}

export async function createUser(actor: Actor, input: CreateUserInput) {
  assertCanManageRole(actor, input.role);

  try {
    const user = await User.create({
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      password: input.password,
      role: input.role,
      isActive: true,
      ...(input.gender ? { gender: input.gender } : {}),
      ...(input.languages ? { languages: input.languages } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.alternatePhone !== undefined ? { alternatePhone: input.alternatePhone } : {}),
      ...(input.workLocation !== undefined ? { workLocation: input.workLocation } : {}),
    });
    return toManagedUser(user);
  } catch (err) {
    if (isDuplicateEmailError(err)) {
      throw new AppError('A user with this email already exists', 409, [
        { field: 'email', message: 'Email is already in use' },
      ]);
    }
    throw err;
  }
}

export async function updateUser(actor: Actor, id: string, input: UpdateUserInput) {
  const user = await User.findById(id).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  assertCanManageRole(actor, user.role);

  if (input.name !== undefined) user.name = input.name.trim();
  if (input.email !== undefined) user.email = input.email.toLowerCase().trim();
  if (input.password !== undefined) {
    user.password = input.password;
  }
  if (input.gender !== undefined) user.gender = input.gender;
  if (input.languages !== undefined) user.languages = input.languages;
  if (input.phone !== undefined) user.phone = input.phone;
  if (input.alternatePhone !== undefined) user.alternatePhone = input.alternatePhone;
  if (input.workLocation !== undefined) user.workLocation = input.workLocation;

  try {
    await user.save();
  } catch (err) {
    if (isDuplicateEmailError(err)) {
      throw new AppError('A user with this email already exists', 409, [
        { field: 'email', message: 'Email is already in use' },
      ]);
    }
    throw err;
  }

  if (input.password !== undefined) {
    await revokeAllRefreshTokensForUser(String(user._id));
  }

  return toManagedUser(user);
}

export async function updateUserStatus(
  actor: Actor,
  id: string,
  input: UpdateUserStatusInput,
) {
  if (actor.id === id && input.isActive === false) {
    throw new AppError('You cannot deactivate your own account', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  assertCanManageRole(actor, user.role);

  user.isActive = input.isActive;
  await user.save();

  if (!input.isActive) {
    await revokeAllRefreshTokensForUser(String(user._id));
  }

  return toManagedUser(user);
}
