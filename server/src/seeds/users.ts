import { User, UserRole } from '../models/User';

export const SEED_USERS: Array<{
  name: string;
  email: string;
  password: string;
  role: UserRole;
  gender?: 'male' | 'female' | 'other' | 'prefer_not';
}> = [
  {
    name: 'Admin User',
    email: 'admin@shinealfurqan.com',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'Coordinator User',
    email: 'coordinator@shinealfurqan.com',
    password: 'Coordinator@123',
    role: 'coordinator',
    gender: 'male',
  },
  {
    name: 'Ustad User',
    email: 'ustad@shinealfurqan.com',
    password: 'Ustad@123',
    role: 'ustad',
  },
  {
    name: 'Student User',
    email: 'student@shinealfurqan.com',
    password: 'Student@123',
    role: 'student',
  },
];

export async function ensureSeedUsers(): Promise<void> {
  // Never auto-create demo accounts in production.
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  for (const item of SEED_USERS) {
    const existing = await User.findOne({ email: item.email.toLowerCase() }).select('+password');
    if (existing) {
      // Keep demo passwords stable in local/dev so logins always match README.
      existing.password = item.password;
      existing.isActive = true;
      existing.role = item.role;
      existing.name = item.name;
      if (item.gender) {
        existing.gender = item.gender;
      }
      await existing.save();
      continue;
    }

    await User.create({
      name: item.name,
      email: item.email,
      password: item.password,
      role: item.role,
      isActive: true,
      ...(item.gender ? { gender: item.gender } : {}),
    });
    console.log(`✅ Seeded ${item.role}: ${item.email}`);
  }
}
