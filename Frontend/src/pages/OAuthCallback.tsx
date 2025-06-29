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

    if (error || !session) {
      console.error('Session Error:', error?.message || 'No session found.');
      navigate('/');
      return;
    }

    const user = session.user;
    const selectedRole = localStorage.getItem('selectedRole');
    localStorage.removeItem('selectedRole');

    if (!selectedRole) {
      console.warn('No selected role in localStorage');
      navigate('/');
      return;
    }

    // Store role in metadata (optional but helpful)
    await supabase.auth.updateUser({
      data: { user_role: selectedRole },
    });

    const userId = user.id;

    // Insert into users table (avoid duplicate)
    await supabase
      .from('users')
      .upsert([
        {
          user_id: userId,
          email: user.email,
          role: selectedRole,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

    if (selectedRole === 'doctor') {
      // ✅ Safely upsert doctor record
      await supabase
        .from('doctors')
        .upsert([
          {
            user_id: userId,
            is_available: true,
            consultation_fee: 0,
          },
        ]);
      navigate('/completedoctorprofile');
    } else if (selectedRole === 'patient') {
      await supabase
        .from('patients')
        .upsert([
          {
            user_id: userId,
          },
        ]);
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
