// src/pages/OAuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabaseClient';

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const user = session.user;
          const selectedRole = localStorage.getItem('selectedRole');
          localStorage.removeItem('selectedRole');

          if (!selectedRole) {
            console.warn('No selected role in localStorage');
            navigate('/');
            return;
          }

          // Save role in user metadata
          await supabase.auth.updateUser({
            data: { user_role: selectedRole },
          });

          const userId = user.id;

          // Insert into users table
          const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          'Unnamed User'; // Ensure fallback always applies

          await supabase.from('users').upsert([
  {
          user_id: userId,
          email: user.email,
          full_name: fullName, // Use safe value
          role: selectedRole,
          created_at: new Date(),
          updated_at: new Date(),
          },
          ]);

          if (selectedRole === 'doctor') {
            await supabase.from('doctors').upsert([
              {
                user_id: userId,
                is_available: true,
                consultation_fee: 0,
              },
            ]);
            navigate('/completedoctorprofile');
          } else if (selectedRole === 'patient') {
            await supabase.from('patients').upsert([
              {
                user_id: userId,
              },
            ]);
            navigate('/completepatientprofile');
          } else {
            navigate('/');
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return <div>Signing you in, please wait...</div>;
};

export default OAuthCallback;
