// Frontend/src/pages/RoomManager.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import supabase from '../lib/supabaseClient';
import './RoomManager.css'; // We will use this for styling the new layout

interface UserProfile {
  user_id: string;
  role: 'doctor' | 'patient' | 'admin' | null;
  full_name: string;
}

const RoomManager: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndRole = async () => {
      setLoadingUser(true);
      setError(null);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error('User not logged in or session expired. Please log in.');
        }

        // Fetch the user's role and name from your 'users' table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('user_id, role, full_name')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          throw new Error('Could not fetch user profile.');
        }

        setCurrentUser(profile as UserProfile);
      } catch (err: any) {
        console.error('Error loading user data:', err);
        setError(err.message || 'An unknown error occurred.');
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserAndRole();

    // Listen for auth changes to re-fetch user data if needed
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserAndRole();
      }
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // --- Render logic ---

  if (loadingUser) {
    return <div className="manager-status">Loading...</div>;
  }

  if (error) {
    return <div className="manager-error">Error: {error}</div>;
  }

  if (!currentUser) {
    return <div className="manager-status">Please log in to access consultations.</div>;
  }

  // --- Main component JSX based on user role ---

  return (
    <div className="room-manager-container">
      <h2 className="room-manager-header">
        Online Consultation Room
      </h2>
      <p className="room-manager-welcome">
        Welcome, {currentUser.full_name}
      </p>

      {currentUser.role === 'doctor' ? (
        <div className="role-section doctor-section">
          <h3>Start a New Consultation</h3>
          <p className="instructions">
            Click the button below to create a new, secure Google Meet room.
            Once the meeting starts, copy the link and send it to your patient via the <strong>Messages</strong> tab.
          </p>
          <a
            href="https://meet.google.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="google-meet-button"
          >
            Start Google Meet
          </a>
        </div>
      ) : (
        <div className="role-section patient-section">
          <h3>Join Your Consultation</h3>
          <p className="instructions">
            Your doctor will start the meeting and send you the Google Meet link through your private messages.
            Please check your messages to join the call.
          </p>
          <Link to="/messages" className="messages-button">
            Go to My Messages
          </Link>
        </div>
      )}
    </div>
  );
};

export default RoomManager;