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
      const userId = user.id;

      const { data: existingUser, error: lookupError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (lookupError || !existingUser) {
        await supabase.auth.signOut();
        alert('This account is not registered in MediBridge.');
        navigate('/');
        return;
      }

      const role = existingUser.role;

      if (role === 'doctor') {
        const { data: doctorProfile, error: doctorError } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (doctorError || !doctorProfile) {
          navigate('/completedoctorprofile');
        } else {
          navigate('/doctordashboard');
        }

      } else if (role === 'patient') {
        const { data: patientProfile, error: patientError } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (patientError || !patientProfile) {
          navigate('/completepatientprofile');
        } else {
          navigate('/patientdashboard');
        }

      } else if (role === 'admin') {
        navigate('/admindashboard');
      } else {
        navigate('/');
      }
    };

    handleOAuthRedirect();
  }, [navigate]);

  return <div>Signing you in, please wait...</div>;
};

export default OAuthCallback;
