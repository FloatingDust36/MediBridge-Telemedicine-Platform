// src/pages/OAuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabaseClient';

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Error retrieving session:', error.message);
        navigate('/');
        return;
      }

      if (!session) {
        console.warn('No session found.');
        navigate('/');
        return;
      }

      //  Read selected role from localStorage (set before Google login)
      const selectedRole = localStorage.getItem('selectedRole');

      //  Clean up the role from localStorage
      localStorage.removeItem('selectedRole');

      if (!selectedRole) {
        console.warn('No selected role found in localStorage');
        navigate('/');
        return;
      }

      //  Optionally store user role in Supabase metadata (optional but recommended)
      await supabase.auth.updateUser({
        data: { user_role: selectedRole },
      });

      //  Redirect to proper profile completion page
      if (selectedRole === 'doctor') {
        navigate('/completedoctorprofile');
      } else if (selectedRole === 'patient') {
        navigate('/completepatientprofile');
      } else {
        navigate('/');
      }
    };

    handleOAuthRedirect();
  }, [navigate]);

  return <div>Signing you in, please wait...</div>;
};

export default OAuthCallback;
