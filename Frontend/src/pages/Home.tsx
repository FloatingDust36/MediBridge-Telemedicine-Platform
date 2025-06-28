// Home.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import medibridge from '../assets/MediBridge_Home.png';
import './Home.css';
import supabase from '../lib/supabaseClient';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ This must be inside the component
  const [selectedRole, setSelectedRole] = useState<'doctor' | 'patient' | null>(null);

const handleGoogleRegister = async () => {
  if (!selectedRole) {
    alert('Please select a role (Doctor or Patient) before continuing.');
    return;
  }

  localStorage.setItem('selectedRole', selectedRole);
  const redirectTo = `${window.location.origin}/oauth-callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  if (error) {
    console.error('OAuth Error:', error.message);
    alert('Google sign-in failed.');
  }
};




  return (
    
    <div className="app-layout-container">
      <div className="page-content-and-footer-wrapper">
        <div className="page-content-wrapper">
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
        </div>
      </div>
    </div>
  );

  
};

export default Home;
