// Home.tsx
import React, { useState, useEffect } from 'react'; // <--- Added useEffect
import { useLocation, useNavigate } from 'react-router-dom';
import medibridge from '../assets/MediBridge_Home1.png';
import medibridge2 from '../assets/MediBridge_Home2.jpg'; // <--- Add your second image path here
import medibridge3 from '../assets/MediBridge_Home3.jpg'; // <--- Add your third image path here
// Add more image imports if you have more images, e.g., import medibridge4 from '../assets/MediBridge_Home4.png';

import './Home.css';
import supabase from '../lib/supabaseClient';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'doctor' | 'patient' | null>(null);

  // Array of your background images
  const backgroundImages = [
    medibridge,
    medibridge2,
    medibridge3,
    // Add all your image paths to this array
  ];

  // State to keep track of the current image index
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // useEffect to handle the image cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        (prevIndex + 1) % backgroundImages.length // Cycle through indices
      );
    }, 5000); // Change image every 5 seconds (5000 ms)

    // Cleanup the interval when the component unmounts
    return () => clearInterval(interval);
  }, [backgroundImages.length]); // Dependency array

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
    <div className="home-container">
      <div className="page-content-wrapper">
        {/* Hero Section */}
        <header
          className="hero-section"
          style={{
            // Removed backgroundImage here, it's now handled by hero-background-cycler
            backgroundSize: 'cover', // Keep if you still want a fallback linear gradient
            backgroundPosition: 'center', // Keep if you still want a fallback linear gradient
            backgroundRepeat: 'no-repeat', // Keep if you still want a fallback linear gradient
            // minHeight: '400px', // Kept this as it was in your provided code
          }}
        >
          {/* NEW: This div will hold the dynamically changing background image */}
          <div
            className="hero-background-cycler"
            style={{ backgroundImage: `url(${backgroundImages[currentImageIndex]})` }}
          ></div>

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

        {/* What is MediBridge */}
        <section className="description">
          <div className="desc">
            <p>Welcome to MediBridge, your innovative gateway to accessible healthcare, anytime, anywhere. We're a cutting-edge telemedicine platform designed to bridge the gaps in healthcare access, connecting you with certified medical professionals and vital health resources, no matter where you are.</p>
            <h3>How We Help You:</h3>
            <ul>
              <li><strong>AI-Powered Symptom Check:</strong> Start your healthcare journey with our intelligent chatbot. It engages in natural conversation, understands your symptoms, and provides initial guidance.</li>
              <li><strong>Seamless Consultations:</strong> If needed, easily book and conduct secure video consultations with licensed doctors, bringing expert medical advice directly to you.</li>
              <li><strong>Emergency Assistance:</strong> For critical situations, our system can quickly identify nearby hospitals and provide essential information, ensuring timely action.</li>
              <li><strong>Secure & Simple:</strong> We prioritize your privacy with a secure medical report system and ensure an intuitive, easy-to-use experience on any device – smartphone, laptop, or tablet – even with limited internet.</li>
            </ul>
            <p>MediBridge is committed to democratizing healthcare, streamlining your path from symptom assessment to consultation and follow-up, and empowering you to manage your health with confidence. Experience the future of healthcare, built for everyone.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;