/**
 * Shine Al Furqan — Role-based Authentication Setup
 *
 * Roles: admin | coordinator | ustad | student
 * Login: email + password only (role comes from MongoDB)
 */

/*
INSTALL
=======
cd server
npm install
copy .env.example .env   # or ensure JWT_SECRET + MONGO_URI are set

cd ../client
npm install
copy .env.example .env   # VITE_API_BASE_URL=http://localhost:5000/api

SEED USERS (requires MongoDB running)
=====================================
cd server
npm run seed

Sample accounts:
  admin@shinealfurqan.com       / Admin@123        (admin)
  coordinator@shinealfurqan.com / Coordinator@123  (coordinator)
  ustad@shinealfurqan.com       / Ustad@123        (ustad)
  student@shinealfurqan.com     / Student@123      (student)

RUN
===
# terminal 1
cd server
npm start

# terminal 2
cd client
npm run dev

Open http://localhost:5173/login

API
===
POST /api/auth/login
GET  /api/auth/me          (Bearer token)
POST /api/auth/logout
GET  /api/admin/dashboard
GET  /api/coordinator/dashboard
GET  /api/ustad/dashboard
GET  /api/student/dashboard
*/
