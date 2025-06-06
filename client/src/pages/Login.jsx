import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { signInWithGoogle, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      navigate('/profile', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      await signInWithGoogle({ signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem',
      padding: '1rem',
      textAlign: 'center'
    }}>
      <h1>Login</h1>
      <p>Sign in with your Google account</p>
      
      <button 
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          fontSize: '1rem',
          transition: 'opacity 0.2s ease'
        }}
      >
        {isLoading ? (
          'Signing in...'
        ) : (
          <>
            <FcGoogle size={20} />
            Sign in with Google
          </>
        )}
      </button>

      {error && (
        <div style={{ 
          color: 'red', 
          marginTop: '1rem',
          maxWidth: '300px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default Login;   