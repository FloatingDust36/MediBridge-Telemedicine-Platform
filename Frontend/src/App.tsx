// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import Patientdash from './pages/Patientdash';
import Home from './pages/Home';
import Services from './pages/Services';
import AboutUs from './pages/AboutUs';
import Reviews from './pages/Reviews';
import Register from './pages/Register';
import Emergency from './pages/Emergency'; // Assuming this is a new page you added

import DoctorPanel from './pages/DoctorPanel'; // Assuming this is a new page you added
import AdminPanel from './pages/AdminPanel';   // Assuming this is a new page you added
import OnlineConsultation from './pages/OnlineConsultation'; // Assuming this is a new page you added
import ConsultationSummary from './pages/ConsultationSummary'; // Assuming this is a new page you added

import "./pages/Home.css"; // Keep this if Home.css is specifically for the Home page

function App() {
  return (
    <>
      <Routes>
        {/*
          Merge Conflict Resolution:
          We'll keep the path="/" element={<Patientdash />} from the 'main' branch
          as that's where all the dashboard, appointments, messages, and chatbot logic resides.
          We'll also incorporate the new routes from 'JM-Branch'.
        */}
        <Route path="/" element={<DoctorPanel />} /> {/* This is your primary dashboard, appointments, messages view */}

        {/* Keeping other core marketing/landing pages if you intend to use them */}
        <Route path="/home" element={<Home />} /> {/* If you want a separate /home route for the Home component */}
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/register" element={<Register />} />
        <Route path="/emergency" element={<Emergency />} /> {/* New route from JM-Branch */}

        {/* New panel routes from JM-Branch */}
        <Route path="/doctorpanel" element={<DoctorPanel />} />
        <Route path="/adminpanel" element={<AdminPanel />} />

        {/* New consultation routes from JM-Branch */}
        <Route path="/consultation" element={<OnlineConsultation />} />
        <Route path="/summary" element={<ConsultationSummary />} /> {/* Renamed from /result to /summary for clarity based on component name */}
      </Routes>
    </>
  );
}

export default App;