// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import Patientdash from './pages/Patientdash';
import Home from './pages/Home';
import Services from './pages/Services';
import AboutUs from './pages/AboutUs';
import Reviews from './pages/Reviews';
import Emergency from './pages/Emergency';

import CompletePatientProfile from './pages/CompletePatientProfile';
import CompleteDoctorProfile from './pages/CompleteDoctorProfile'; // IMPORT THIS LINE
import DoctorPanel from './pages/DoctorPanel';
import AdminPanel from './pages/AdminPanel';
import OnlineConsultation from './pages/OnlineConsultation';
import ConsultationSummary from './pages/ConsultationSummary';

import "./pages/Home.css";


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
        <Route path="/emergency" element={<Emergency />} />

        <Route path="/doctorpanel" element={<DoctorPanel />} />
        <Route path="/adminpanel" element={<AdminPanel />} />

        <Route path="/consultation" element={<OnlineConsultation />} />
        <Route path="/summary" element={<ConsultationSummary />} />
      </Routes>
    </>
  );
}

export default App;