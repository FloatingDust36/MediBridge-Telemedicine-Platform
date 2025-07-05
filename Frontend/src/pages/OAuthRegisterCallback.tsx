import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabaseClient';

const OAuthRegisterCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleGoogleRegistration = async () => {
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
      const email = user.email;
      const userId = user.id;

      // Step 1: Check if email is already in your `users` table
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        // ❌ Already registered — reject
        await supabase.auth.signOut();
        alert('This Google account is already registered in MediBridge.');
        navigate('/');
        return;
      }

      // ✅ Proceed with registration
      const selectedRole = localStorage.getItem('selectedRole');
      localStorage.removeItem('selectedRole');

      if (!selectedRole) {
        alert('Missing selected role.');
        navigate('/');
        return;
      }

      await supabase.auth.updateUser({
        data: { user_role: selectedRole },
      });

      await supabase.from('users').insert([
        {
          user_id: userId,
          email,
          role: selectedRole,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      if (selectedRole === 'doctor') {
        await supabase.from('doctors').insert([{ user_id: userId }]);
        navigate('/completedoctorprofile');
      } else if (selectedRole === 'patient') {
        await supabase.from('patients').insert([{ user_id: userId }]);
        navigate('/completepatientprofile');
      } else {
        navigate('/');
      }
    };

    handleGoogleRegistration();
  }, [navigate]);

  return <div>Registering your account, please wait...</div>;
};

export default OAuthRegisterCallback;
