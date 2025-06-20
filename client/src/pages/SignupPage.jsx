import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth.jsx';
import Signup from '../components/Auth/Signup';

export default function SignupPage() {
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (credentials) => {
    try {
      setError('');
      await signup(credentials);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Create Your Account</h1>
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      <Signup onSubmit={handleSignup} />
    </div>
  );
}