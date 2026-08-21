import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleHome } from '../../types/auth';

export function Unauthorized() {
  const { user, isAuthenticated } = useAuth();
  const home = user ? getRoleHome(user.role) : '/login';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-[#E03040]">403</p>
      <h1 className="mt-4 text-2xl font-bold text-[#1E2531]">Unauthorized</h1>
      <p className="mt-2 max-w-md text-sm text-[#758188]">
        You do not have permission to access this page. Contact an administrator if you believe this
        is a mistake.
      </p>
      <Link
        to={isAuthenticated ? home : '/login'}
        className="mt-6 inline-flex rounded-xl bg-[#E03040] px-4 py-2.5 text-sm font-semibold text-[#F8F8F8] hover:bg-[#B01828]"
      >
        {isAuthenticated ? 'Go to my dashboard' : 'Back to login'}
      </Link>
    </div>
  );
}

export default Unauthorized;
