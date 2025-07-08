// src/pages/RoomManager.tsx
import React, { useState, useEffect } from 'react';
import OnlineConsultation from './OnlineConsultation';
import supabase from '../lib/supabaseClient'; // <--- UPDATED IMPORT PATH to your existing client!
import './RoomManager.css'; // Create this CSS file for styling

// Define the shape of your Supabase user profile data, particularly the 'role'
interface UserProfile {
  user_id: string; // <--- CHANGED: Use 'user_id' as per your Supabase table schema
  role: 'doctor' | 'patient' | 'admin' | null; // Assuming 'doctor', 'patient', or 'admin'
  full_name: string; // Assuming 'full_name' for user_name
  email: string;
  // Add other fields you might need from your 'users' table, e.g., 'phone_number', 'address'
  phone_number?: string;
  address?: string;
  date_of_birth?: string; // or Date type if you parse it
}

const RoomManager: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [roomNameInput, setRoomNameInput] = useState('');
  const [activeRoomName, setActiveRoomName] = useState<string | null>(null);
  const [jitsiJwt, setJitsiJwt] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCall, setLoadingCall] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Function to fetch user and their role from Supabase
    const fetchUserAndRole = async () => {
      setLoadingUser(true);
      setError(null);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setError('User not logged in or session expired. Please log in.');
          setCurrentUser(null); // Ensure currentUser is null if no logged-in user
          setLoadingUser(false);
          return;
        }

        // Assuming your user profile data is in a table named 'users'
        // and linked by user.id
        const { data: profile, error: profileError } = await supabase
          .from('users') // Replace 'users' with your actual user profile table name
          // <--- CHANGED: Select 'user_id' instead of 'id'
          // <--- ADDED: Select other fields from your schema for potential use
          .select('user_id, role, full_name, email, phone_number, date_of_birth, address')
          .eq('user_id', user.id) // <--- CHANGED: Filter by 'user_id'
          .single();

        if (profileError || !profile) {
          setError('Could not fetch user profile. Ensure user profile table is correctly set up for this user.');
          setCurrentUser(null); // Ensure currentUser is null if profile fetch fails
          setLoadingUser(false);
          return;
        }

        // <--- Ensure correct mapping to UserProfile interface
        setCurrentUser({
            user_id: profile.user_id, // Map user_id from fetched profile
            role: profile.role,
            full_name: profile.full_name,
            email: profile.email,
            phone_number: profile.phone_number,
            date_of_birth: profile.date_of_birth,
            address: profile.address,
        } as UserProfile); // Cast to our UserProfile interface
        setLoadingUser(false);

      } catch (err: any) {
        console.error('Error fetching user or profile:', err);
        setError(`Failed to load user data: ${err.message || 'Unknown error'}`);
        setCurrentUser(null); // Ensure currentUser is null on exception
        setLoadingUser(false);
      }
    };

    fetchUserAndRole();

    // Optional: Listen for auth state changes if you want to react to login/logout dynamically
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserAndRole(); // Re-fetch user data on login/session refresh
      } else {
        setCurrentUser(null); // Clear user on logout
        setActiveRoomName(null);
        setJitsiJwt(null);
        setLoadingUser(false);
      }
    });

    return () => {
        authListener?.subscription.unsubscribe(); // Clean up auth listener
    };
  }, []); // Empty dependency array means this runs once on mount/auth change listener setup

  const generateUniqueRoomName = (prefix: string = 'consultation') => {
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(2, 8); // Short random string
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleGenerateAndJoin = async () => {
    if (!currentUser) {
      setError('User not loaded. Cannot create/join room.');
      return;
    }

    setLoadingCall(true);
    setError(null);

    const roomToUse = currentUser.role === 'doctor' ? generateUniqueRoomName() : roomNameInput;

    // Validate room name for patient
    if (currentUser.role === 'patient' && !roomToUse.trim()) {
      setError('Please enter a room code to join the consultation.');
      setLoadingCall(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/generate-jitsi-jwt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: roomToUse,
          user_id: currentUser.user_id, // <--- CHANGED: Send currentUser.user_id to backend
          user_name: currentUser.full_name,
          user_email: currentUser.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to get JWT from backend (Status: ${response.status})`);
      }

      const data = await response.json();
      setJitsiJwt(data.jwt);
      setActiveRoomName(roomToUse); // Set the room name that Jitsi will use
      setLoadingCall(false);

    } catch (err: any) {
      console.error('Error fetching JWT:', err);
      setError(`Failed to start call: ${err.message || 'An unknown error occurred.'}`);
      setLoadingCall(false);
    }
  };

  const handleHangup = () => {
    console.log('Call ended. Returning to room selection.');
    setActiveRoomName(null);
    setJitsiJwt(null);
    setRoomNameInput(''); // Clear input after hangup
  };

  if (loadingUser) {
    return <div className="manager-status">Loading user data...</div>;
  }

  if (error) {
    return <div className="manager-error">Error: {error}</div>;
  }

  // This check is important: If currentUser is still null after loading,
  // it means no user is logged in or their profile couldn't be fetched.
  if (!currentUser) {
    return <div className="manager-status">Please log in to access consultations.</div>;
  }

  // If a room is active, render the Jitsi consultation
    if (activeRoomName && jitsiJwt) {
    return (
        <OnlineConsultation
        roomName={activeRoomName}
        jwt={jitsiJwt}
        onHangup={handleHangup}
        userDisplayName={currentUser.full_name || currentUser.email}
        userEmail={currentUser.email} // <--- ADDED THIS LINE
        userId={currentUser.user_id} // <--- ADDED THIS LINE, using user_id from your profile
        />
    );
    }

  // Otherwise, render the room selection UI based on role
  return (
    <div className="room-manager-container">
      <h2 className="room-manager-header">Welcome, {currentUser.full_name} ({currentUser.role})</h2>
      {currentUser.role === 'doctor' ? (
        <div className="doctor-section">
          <h3>Start a New Consultation</h3>
          <p>A unique room name will be generated for your call.</p>
          <button onClick={handleGenerateAndJoin} disabled={loadingCall}>
            {loadingCall ? 'Starting Call...' : 'Create & Join Room'}
          </button>
        </div>
      ) : ( // Patient role
        <div className="patient-section">
          <h3>Join an Existing Consultation</h3>
          <input
            type="text"
            placeholder="Enter room code"
            value={roomNameInput}
            onChange={(e) => setRoomNameInput(e.target.value)}
            disabled={loadingCall}
          />
          <button onClick={handleGenerateAndJoin} disabled={!roomNameInput.trim() || loadingCall}>
            {loadingCall ? 'Joining Call...' : 'Join Room'}
          </button>
        </div>
      )}
      {loadingCall && <p className="manager-status">Preparing your call...</p>}
    </div>
  );
};

export default RoomManager;