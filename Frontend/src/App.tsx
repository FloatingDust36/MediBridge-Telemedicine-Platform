// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Services from './pages/Services';
import AboutUs from './pages/AboutUs';
import Reviews from './pages/Reviews';
import Emergency from './pages/Emergency';

import CompletePatientProfile from './pages/CompletePatientProfile';
import CompleteDoctorProfile from './pages/CompleteDoctorProfile'; // IMPORT THIS LINE

import DoctorDashboard from './pages/DoctorDashboard'; // Assuming this is a new page you added
import OnlineConsultation from './pages/OnlineConsultation'; // Assuming this is a new page you added
import ConsultationSummary from './pages/ConsultationSummary'; // Assuming this is a new page you added

import PatientDashboard from './pages/PatientDashboard';
import Appointments from "./pages/AppointmentsPage";
import Messages from "./pages/MessagesPage";
import Chatbot from "./pages/ChatbotPage";

import AdminDashboard from './pages/AdminDashboard';   // Assuming this is a new page you added

import "./pages/Home.css"; // Keep this if Home.css is specifically for the Home page

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/patientdash" element={<Patientdash />} />

        {/* New route for Doctor Profile */}
        <Route path="/complete-doctor-profile" element={<CompleteDoctorProfile />} /> {/* ADD THIS LINE */}

        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/reviews" element={<Reviews />} />

        <Route path="/register" element={<Register />} />
        <Route path="/emergency" element={<Emergency />} />

        <Route path="/doctordashboard" element={<DoctorDashboard />} />
        <Route path="/consultation" element={<OnlineConsultation />} />
        <Route path="/summary" element={<ConsultationSummary />} />

        <Route path="/patientdashboard" element={<PatientDashboard />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/chatbot" element={<Chatbot />} />

        <Route path="/admindashboard" element={<AdminDashboard />} />

      </Routes>
    </>
  );
}

export default App;