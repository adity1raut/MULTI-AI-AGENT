import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Signup({ onSubmit }) {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    idToken: '',
    role: searchParams.get('role') || 'applicant'
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.idToken) {
      setError('Google Sign-In is required');
      return;
    }
    if (!formData.role) {
      setError('Please select a role');
      return;
    }
    setError('');
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sign up with Google
        </label>
        <div id="google-signin-button" className="flex justify-center">
          {/* This will be replaced with actual Google Sign-In button */}
          <div className="bg-white border border-gray-300 rounded-md px-4 py-2 flex items-center cursor-pointer hover:bg-gray-50">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </div>
        </div>
        <input
          type="hidden"
          name="idToken"
          value={formData.idToken}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          I am signing up as a:
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className={`border rounded-lg p-4 cursor-pointer ${
            formData.role === 'applicant' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}>
            <input
              type="radio"
              name="role"
              value="applicant"
              checked={formData.role === 'applicant'}
              onChange={handleChange}
              className="sr-only"
            />
            <div className="font-medium">Job Seeker</div>
            <p className="text-sm text-gray-600 mt-1">Find jobs that match your skills</p>
          </label>
          
          <label className={`border rounded-lg p-4 cursor-pointer ${
            formData.role === 'requester' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}>
            <input
              type="radio"
              name="role"
              value="requester"
              checked={formData.role === 'requester'}
              onChange={handleChange}
              className="sr-only"
            />
            <div className="font-medium">Employer</div>
            <p className="text-sm text-gray-600 mt-1">Post jobs and find candidates</p>
          </label>
        </div>
      </div>

      {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Sign Up
      </button>

      <p className="text-sm text-gray-600 text-center mt-4">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:underline">Log in</a>
      </p>
    </form>
  );
}