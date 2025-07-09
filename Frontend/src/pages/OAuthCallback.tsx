// Frontend/src/pages/OAuthCallback.tsx
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
        console.error('OAuthCallback: Session Error:', error?.message || 'No session found.');
        navigate('/'); // Redirect to home on session error
        return;
      }

      const user = session.user;
      const userId = user.id;

      try {
        // Verify that this user exists in your application's 'users' table
        const { data: existingUserInDb, error: lookupError } = await supabase
          .from('users')
          .select('user_id') // We only need to confirm existence here
          .eq('user_id', userId)
          .single();

        if (lookupError && lookupError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('OAuthCallback: Error looking up user in "users" table:', lookupError.message);
          // If there's a real DB error, don't just sign out, maybe alert user
          alert('An error occurred during login. Please try again.');
          navigate('/');
          return;
        }

        if (!existingUserInDb) {
          // This Google account is authenticated with Supabase, but not registered in MediBridge's 'users' table.
          // This means they tried to log in with an account that was never registered via MediBridge's flow.
          await supabase.auth.signOut(); // Sign them out from Supabase Auth
          alert('This Google account is not registered in MediBridge. Please register first.');
          navigate('/'); // Redirect to home/registration page
          return;
        }

        // If we reach here, the user is authenticated via Google AND exists in your 'users' table.
        // --- CRITICAL CHANGE: Redirect to root ---
        // App.tsx's useEffect will now detect the authenticated session,
        // read the user's role and profile completion status, and navigate accordingly.
        navigate('/');

      } catch (e) {
        console.error('OAuthCallback: Unexpected error:', e);
        alert('An unexpected error occurred during login.');
        navigate('/');
      }
    };

    handleOAuthRedirect();
  }, [navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px', color: '#555' }}>
      Signing you in, please wait...
    </div>
  );
};

export default OAuthCallback;