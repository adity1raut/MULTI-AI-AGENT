import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">ResumeMatcher</Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to={user.role === 'applicant' ? '/applicant' : '/requester'} 
                className="hover:bg-blue-700 px-3 py-2 rounded">
                Dashboard
              </Link>
              <Link to="/profile" className="hover:bg-blue-700 px-3 py-2 rounded">
                Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:bg-blue-700 px-3 py-2 rounded">
                Login
              </Link>
              <Link to="/signup" className="bg-white text-blue-600 hover:bg-gray-100 px-3 py-2 rounded">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}