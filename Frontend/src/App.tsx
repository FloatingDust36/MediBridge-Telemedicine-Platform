// Frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import supabase from './lib/supabaseClient';

// Import Components
import Layout from './components/Layout';
import OAuthRegisterCallback from './pages/OAuthRegisterCallback';
import OAuthCallback from './pages/OAuthCallback';

// Import Pages
import Home from './pages/Home';
import Services from './pages/Services';
import AboutUs from './pages/AboutUs';
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
import RoomManager from './pages/RoomManager';

// Import CSS
import "./pages/Home.css";

// Define Types
type UserRole = 'guest' | 'patient' | 'doctor' | 'admin';
interface CurrentUser {
  id: string;
  role: UserRole;
  email: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoadingUser(true);

    const handleSession = async (session: any) => {
      if (session) {
        const user = session.user;

        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('user_id', user.id)
          .single();

        const userRole = (profile?.role as UserRole) || 'guest';

        setCurrentUser({
          id: user.id,
          role: userRole,
          email: user.email || '',
        });

        // Redirect new users to complete their profile
        if (userRole === 'patient') {
          const { data: patientData } = await supabase
            .from('patients')
            .select('user_id')
            .eq('user_id', user.id)
            .single();
          if (!patientData) navigate('/completepatientprofile');
        } else if (userRole === 'doctor') {
          const { data: doctorData } = await supabase
            .from('doctors')
            .select('user_id')
            .eq('user_id', user.id)
            .single();
          if (!doctorData) navigate('/completedoctorprofile');
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingUser(false);
    };

    // Check session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      handleSession(session);
    });

    // Cleanup listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

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
    if (!currentUser) {
      return <Navigate to={redirectPath} replace />;
    }
    if (!allowedRoles.includes(currentUser.role)) {
      return <Navigate to={redirectPath} replace />;
    }
    return <>{children}</>;
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout userType={userTypeForNavbarAndLayout} />}>
          {/* Public Routes */}
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="about" element={<AboutUs />} />
          <Route path="emergency" element={<Emergency />} />

          {/* Profile Completion */}
          <Route path="completedoctorprofile" element={<CompleteDoctorProfile />} />
          <Route path="completepatientprofile" element={<CompletePatientProfile />} />

          {/* Doctor Routes */}
          <Route path="doctordashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
          <Route path="addschedule" element={<ProtectedRoute allowedRoles={['doctor']}><AddSchedule /></ProtectedRoute>} />
          <Route path="doctorprofile" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorProfile /></ProtectedRoute>} />
          
          {/* Patient Routes */}
          <Route path="patientdashboard" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
          <Route path="appointments" element={<ProtectedRoute allowedRoles={['patient']}><Appointments /></ProtectedRoute>} />
          <Route path="chatbot" element={<ProtectedRoute allowedRoles={['patient']}><Chatbot /></ProtectedRoute>} />
          <Route path="patientprofile" element={<ProtectedRoute allowedRoles={['patient']}><PatientProfile /></ProtectedRoute>} />
          
          {/* Shared Routes */}
          <Route path="consultation" element={<ProtectedRoute allowedRoles={['doctor', 'patient']}><RoomManager /></ProtectedRoute>} />
          <Route path="messages" element={<ProtectedRoute allowedRoles={['doctor', 'patient']}><Messages /></ProtectedRoute>} />

          {/* Admin Route */}
          <Route path="admindashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Route>

        {/* OAuth Routes */}
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/oauth-register-callback" element={<OAuthRegisterCallback />} />
      </Routes>
    </>
  );
}

export default App;