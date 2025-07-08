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

      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        await supabase.auth.signOut();
        alert('This Google account is already registered in MediBridge.');
        navigate('/');
        return;
      }

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

      // ✅ Only insert empty profile if truly new
      if (selectedRole === 'doctor') {
        const { data: existingDoctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!existingDoctor) {
          await supabase.from('doctors').insert([{ user_id: userId }]);
        }

        navigate('/completedoctorprofile');

      } else if (selectedRole === 'patient') {
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!existingPatient) {
          await supabase.from('patients').insert([{ user_id: userId }]);
        }

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
