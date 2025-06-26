// Home.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import medibridge from '../assets/MediBridge_Home.png';
import './Home.css';

const Home = () => {
  const location = useLocation();

  return (
    // This top-level div acts as the main flex container for the page content and footer
    // Navbar should be outside this if it's truly fixed and global.
    // If Navbar is truly fixed, it should be in App.tsx or your main layout file, NOT here.
    // Assuming Navbar is fixed and floats above everything else.
    <div className="app-layout-container"> {/* New or renamed top-level container */}

      {/* This wrapper holds all scrollable content for the page */}
      <div className="page-content-and-footer-wrapper">
        {/* Main Page Content Wrapper - This div ensures content sits below fixed navbar */}
        <div className="page-content-wrapper"> {/* This holds your dynamic content */}
          {/* Hero Section */}
          <header
            className="hero-section"
            style={{
              backgroundImage: `url(${medibridge})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              minHeight: '400px',
              position: 'relative',
            }}
          >
            <div className="hero-overlay">
              <div className="hero-text">
                <h1><span className="red">Medi</span>Bridge</h1>
                <h2>Connecting Patients with Doctors Anytime, Anywhere</h2>
                <p>
                  MediBridge provides remote consultations, AI-powered symptom checkers,
                  and a secure telehealth platform for underserved communities.
                </p>
              </div>
            </div>
          </header>

          {/* How It Works */}
          <section className="how-it-works">
            <h2>How it Works</h2>
            <div className="steps">
              <div className="step">
                <h3>Step 1</h3>
                <h4>Register</h4>
                <p>Sign up as a patient or doctor.</p>
              </div>
              <div className="step">
                <h3>Step 2</h3>
                <h4>ChatBot</h4>
                <p>Describe symptoms using our AI assistant.</p>
              </div>
              <div className="step">
                <h3>Step 3</h3>
                <h4>Schedule</h4>
                <p>Choose a doctor and time slot.</p>
              </div>
              <div className="step">
                <h3>Step 4</h3>
                <h4>Consult</h4>
                <p>Join your video call from the portal.</p>
              </div>
            </div>
          </section>
        </div> {/* End page-content-wrapper */}
      </div> {/* End page-content-and-footer-wrapper */}
    </div> // End app-layout-container
  );
};

export default Home;