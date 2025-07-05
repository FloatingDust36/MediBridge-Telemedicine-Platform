// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'; // Import useNavigate
import supabase from './lib/supabaseClient';


import Layout from './components/Layout'; // Ensure correct path for Layout

// Import your pages
import Home from './pages/Home';
import Services from './pages/Services';
import AboutUs from './pages/AboutUs';
import Reviews from './pages/Reviews';
import Emergency from './pages/Emergency';

import CompleteDoctorProfile from './pages/CompleteDoctorProfile';
import CompletePatientProfile from './pages/CompletePatientProfile';

import DoctorDashboard from './pages/DoctorDashboard';
import OnlineConsultation from './pages/OnlineConsultation';
import ConsultationSummary from './pages/ConsultationSummary';
import AddSchedule from './pages/AddSchedule';

import PatientDashboard from './pages/PatientDashboard';
import Appointments from "./pages/AppointmentsPage";
import Messages from "./pages/MessagesPage";
import Chatbot from "./pages/ChatbotPage";
import PatientProfile from './pages/PatientProfile';
import DoctorProfile from './pages/DoctorProfile';

import AdminDashboard from './pages/AdminDashboard';

import "./pages/Home.css"; // Keep this if Home.css is specifically for the Home page
import OAuthCallback from './pages/OAuthCallback';


type UserRole = 'guest' | 'patient' | 'doctor' | 'admin';

interface CurrentUser {
  id: string;
  role: UserRole;
  email: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate(); // Initialize useNavigate hook here

  // --- START: Temporary Hardcoded Account Simulation ---
  const [mockUserRole, setMockUserRole] = useState<UserRole>('guest'); // Change this to 'patient', 'doctor', 'admin' to test
  const MOCK_USERS: { [key in UserRole]: CurrentUser | null } = {
  guest: null, // ✅ Now explicitly null
  patient: { id: 'patient-id-123', role: 'patient', email: 'test.patient@example.com' },
  doctor: { id: 'doctor-id-456', role: 'doctor', email: 'test.doctor@example.com' },
  admin: { id: 'admin-id-789', role: 'admin', email: 'test.admin@example.com' },
};

  // --- END: Temporary Hardcoded Account Simulation ---


  useEffect(() => {
    // This effect handles actual Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const user = session.user;
          const userRole = (user.user_metadata?.user_role as UserRole) || 'patient'; // Default if not found
          setCurrentUser({
            id: user.id,
            role: userRole,
            email: user.email || '',
          });
        } else {
          setCurrentUser(null);
        }
        setLoadingUser(false);
      }
    );

    // Initial check for session on app load
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const user = session.user;
            const userRole = (user.user_metadata?.user_role as UserRole) || 'patient';
            setCurrentUser({
                id: user.id,
                role: userRole,
                email: user.email || '',
            });
        } else {
            // If no Supabase session, use the mock user for initial display
            // Only set mock user if Supabase session is genuinely null
            setCurrentUser(MOCK_USERS[mockUserRole]); // Set initial currentUser from mockUserRole
        }
        setLoadingUser(false);
    };

    checkSession();

    // Clean up the auth listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [mockUserRole]); // Add mockUserRole to dependencies to re-run when changed


  // Determine the user type to pass to Navbar and Layout
  const userTypeForNavbarAndLayout: UserRole = currentUser ? currentUser.role : 'guest';

  if (loadingUser) {
    return <div>Loading application...</div>;
  }

  // Helper component for protected routes
  const ProtectedRoute: React.FC<{
    children: React.ReactNode;
    allowedRoles: UserRole[];
    redirectPath?: string;
    
  }> = ({ children, allowedRoles, redirectPath = '/' }) => {
    if (!currentUser && allowedRoles.includes('guest')) {
      // Guest is allowed, and no user is logged in
      return <>{children}</>;
    }
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      // Not logged in, or role not allowed
      return <Navigate to={redirectPath} replace />;
    }
    return <>{children}</>;
  };


  return (
    <> {/* Use a React Fragment as the top-level element if no single div wrapper is needed */}
      {/* Test User Role Selector UI (positioned outside the main layout flow) */}
      <div style={{
        position: 'fixed',
        top: '50px', // Just below the navbar
        right: '20px',
        zIndex: 1002, // Ensure it's above other content but possibly below popups
        background: '#f0f0f0',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        display: 'none',
        flexDirection: 'column',
        gap: '5px',
        color: '#666'
      }}>
        <strong>Test User Role:</strong>
        <select
          value={mockUserRole}
          onChange={(e) => {
            const newRole = e.target.value as UserRole;
            setMockUserRole(newRole);
            // Optionally clear Supabase session when switching mock roles
            supabase.auth.signOut();
            setCurrentUser(MOCK_USERS[newRole]); // Instantly update view with mock user
            navigate('/'); // Navigate to home to reflect changes and re-render Layout/Routes
          }}
          style={{ padding: '5px', borderRadius: '5px' }}
        >
          <option value="guest">Guest</option>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>
        <small style={{ fontSize: '0.7em', color: '#666' }}>
            Current: {currentUser ? `${currentUser.role} (${currentUser.email})` : 'Guest'}
        </small>
      </div>

      <Routes>
        <Route path="/" element={<Layout userType={userTypeForNavbarAndLayout} />}>
          {/* Public Routes */}
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="about" element={<AboutUs />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="emergency" element={<Emergency />} />

          {/* Profile Completion Routes - Protected as needed */}
          <Route
            path="completedoctorprofile"
            element={
              <ProtectedRoute allowedRoles={['guest', 'doctor']}>
                <CompleteDoctorProfile />
                <AddSchedule/>
              </ProtectedRoute>
            }
          />
         <Route
           path="completepatientprofile"
           element={
            <ProtectedRoute allowedRoles={['guest', 'patient']}>
               <CompletePatientProfile />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard and Related Routes */}
          <Route
            path="doctordashboard"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
                />
          <Route
            path="addschedule"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <AddSchedule />
              </ProtectedRoute> 
            }
          />
          <Route
            path="doctorprofile"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorProfile />
              </ProtectedRoute>
            }
            />
          <Route
            path="summary"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <ConsultationSummary />
              </ProtectedRoute>
            }
          />

          <Route
            path="patientdashboard"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="appointments"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="chatbot"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Chatbot />
              </ProtectedRoute>
            }
          />
          <Route
            path="patientprofile"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientProfile />
              </ProtectedRoute>
            }
            /> {/* Patient Profile route */}

          {/* Messages accessible by both doctor and patient */}
          <Route
            path="consultation"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'patient']}>
                <OnlineConsultation />
              </ProtectedRoute>
            }
          />

          <Route
            path="messages"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'patient']}>
                <Messages />
              </ProtectedRoute>
            }
          />

          <Route
            path="admindashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          {/* Fallback for unmatched routes within the Layout */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Route>

         {/* Google OAuth callback route */}
         <Route path="/oauth-callback" element={<OAuthCallback />} />
      </Routes>
    </>
  );
}

export default App;