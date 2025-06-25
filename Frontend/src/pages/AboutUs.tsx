import { AnimatePresence, motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import './AboutUs.css'; // About Us specific CSS

const About = () => {
  const [showLogin, setShowLogin] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const toggleLogin = () => {
    setShowLogin(prev => !prev);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/patientdashboard');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        loginRef.current &&
        !loginRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.login-toggle')
      ) {
        setShowLogin(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="about-page-container"> {/* Consistent naming: about-page-container */}

      {/* This is the main flex container that holds all scrollable content and the footer */}
      <div className="main-content-and-footer-wrapper">
        {/* Main Page Content Wrapper - This div ensures content sits below fixed navbar */}
        <div className="about-content-wrapper"> {/* This holds your dynamic content */}
          <h1 className="page-title">About Us Page</h1>

          <div className="about-section">
            <h2 className="section-title">Our Mission</h2>
            <p className="section-text">
              At MediBridge, we are dedicated to bridging the gap between patients and healthcare providers—especially in
              underserved and remote communities. Our telemedicine platform empowers people to access quality healthcare anytime,
              anywhere, with the help of trusted medical professionals.
            </p>
          </div>

          <div className="about-section">
            <h2 className="section-title">Who We Are</h2>
            <p className="section-text">
              We are a passionate team of software developers, health practitioners, and tech innovators working together to build
              reliable and secure telehealth solutions. MediBridge was built with the belief that technology can save lives and that
              everyone deserves access to medical care.
            </p>
          </div>

          <div className="about-section">
            <h2 className="section-title">Meet the Team</h2>
            <div className="team-grid">
              <div className="team-member-card">
                <span className="member-name">[Member 1 Name]</span>
                <span className="member-role">Project Manager</span>
              </div>
              <div className="team-member-card">
                <span className="member-name">[Member 2 Name]</span>
                <span className="member-role">Frontend Developer</span>
              </div>
              <div className="team-member-card">
                <span className="member-name">[Member 3 Name]</span>
                <span className="member-role">Backend Developer</span>
              </div>
              <div className="team-member-card">
                <span className="member-name">[Member 4 Name]</span>
                <span className="member-role">DevOps</span>
              </div>
              <div className="team-member-card">
                <span className="member-name">[Member 5 Name]</span>
                <span className="member-role">Full Stack Developer</span>
              </div>
            </div>
          </div>
        </div> {/* End about-content-wrapper */}
      </div> {/* End main-content-and-footer-wrapper */}
    </div> // End about-page-container
  );
};

export default About;