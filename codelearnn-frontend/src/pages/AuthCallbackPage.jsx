import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setCharchaToken } from '../services/charchaApi';
import Loader from '../components/common/Loader';

/**
 * Google OAuth Callback Page
 * Handles the redirect from Google OAuth and stores the token
 */
const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const charchaToken = searchParams.get('charchaToken');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + error);
      return;
    }

    if (token) {
      // Store the Medha token
      localStorage.setItem('token', token);
      
      // Store the Charcha token if available (SSO integration)
      if (charchaToken) {
        setCharchaToken(charchaToken);
      }
      
      // Fetch user data and update context
      const fetchUser = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          
          if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.data));
            updateUser(data.data);
            navigate('/dashboard');
          } else {
            navigate('/login?error=auth_failed');
          }
        } catch (err) {
          console.error('Failed to fetch user:', err);
          navigate('/login?error=auth_failed');
        }
      };
      
      fetchUser();
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, updateUser]);

  return <Loader isLoading={true} />;
};

export default AuthCallbackPage;
