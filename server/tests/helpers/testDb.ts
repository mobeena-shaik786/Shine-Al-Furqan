import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, UserRole } from '../../src/models/User';

export const TEST_PASSWORDS = {
  admin: 'TestAdmin_Pass1!',
  student: 'TestStudent_Pass1!',
  coordinator: 'TestCoord_Pass1!',
  ustad: 'TestUstad_Pass1!',
} as const;

export const TEST_USERS: Array<{
  name: string;
  email: string;
  password: string;
  role: UserRole;
}> = [
  {
    name: 'Test Admin',
    email: 'test-admin@example.com',
    password: TEST_PASSWORDS.admin,
    role: 'admin',
  },
  {
    name: 'Test Student',
    email: 'test-student@example.com',
    password: TEST_PASSWORDS.student,
    role: 'student',
  },
  {
    name: 'Test Coordinator',
    email: 'test-coordinator@example.com',
    password: TEST_PASSWORDS.coordinator,
    role: 'coordinator',
  },
  {
    name: 'Test Ustad',
    email: 'test-ustad@example.com',
    password: TEST_PASSWORDS.ustad,
    role: 'ustad',
  },
];

let memory: MongoMemoryServer | null = null;

/** Connect in-memory Mongo and seed golden test users. Does not log passwords. */
export async function setupTestDb(): Promise<void> {
  memory = await MongoMemoryServer.create();
  const uri = memory.getUri('shine-al-furqan-test');
  await mongoose.connect(uri);

  for (const item of TEST_USERS) {
    await User.create({
      name: item.name,
      email: item.email,
      password: item.password,
      role: item.role,
      isActive: true,
    });
  }
}

export async function teardownTestDb(): Promise<void> {
  await mongoose.disconnect();
  if (memory) {
    await memory.stop();
    memory = null;
  }
}
