// Frontend/src/pages/OAuthRegisterCallback.tsx
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
        console.error('OAuthRegisterCallback: Session Error:', error?.message || 'No session found.');
        navigate('/'); // Redirect to home on session error
        return;
      }

      const user = session.user;
      const email = user.email;
      const userId = user.id;

      // Retrieve the selected role from localStorage
      const selectedRole = localStorage.getItem('selectedRole');
      localStorage.removeItem('selectedRole'); // Clean up localStorage immediately

      if (!selectedRole) {
        console.error('OAuthRegisterCallback: Missing selected role in localStorage.');
        alert('Registration incomplete: User role not determined. Please try registering again.');
        navigate('/'); // Redirect to home if role is missing
        return;
      }

      try {
        // First, check if the user already exists in your 'users' table
        const { data: existingUserInDb, error: checkError } = await supabase
          .from('users')
          .select('user_id')
          .eq('user_id', userId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('OAuthRegisterCallback: Error checking existing user in DB:', checkError.message);
          alert('An error occurred during registration. Please try again.');
          navigate('/');
          return;
        }

        if (existingUserInDb) {
          // If user already exists in your 'users' table, it means they've been through this flow before.
          // Just ensure their auth metadata is up-to-date and redirect.
          console.warn('OAuthRegisterCallback: User already exists in "users" table. Updating metadata.');
          await supabase.auth.updateUser({
            data: { user_role: selectedRole },
          });
        } else {
          // If user does NOT exist in your 'users' table, insert them.
          // This is a new Google registration for MediBridge.
          const { error: insertError } = await supabase.from('users').insert([
            {
              user_id: userId,
              email: email,
              role: selectedRole,
              created_at: new Date().toISOString(), // Use ISO string for consistency
              updated_at: new Date().toISOString(),
            },
          ]);

          if (insertError) {
            console.error('OAuthRegisterCallback: Error inserting new user into "users" table:', insertError.message);
            alert('Failed to complete registration. Please try again.');
            navigate('/');
            return;
          }

          // Update Supabase auth user metadata with the selected role
          // This ensures the role is immediately available in session.user.user_metadata
          await supabase.auth.updateUser({
            data: { user_role: selectedRole },
          });
        }

        // --- CRITICAL CHANGE: Redirect to root ---
        // App.tsx's useEffect will now detect the authenticated session,
        // read the user's role and profile completion status, and navigate accordingly.
        navigate('/');

      } catch (e) {
        console.error('OAuthRegisterCallback: Unexpected error:', e);
        alert('An unexpected error occurred during registration.');
        navigate('/');
      }
    };

    handleGoogleRegistration();
  }, [navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px', color: '#555' }}>
      Registering your account, please wait...
    </div>
  );
};

export default OAuthRegisterCallback;