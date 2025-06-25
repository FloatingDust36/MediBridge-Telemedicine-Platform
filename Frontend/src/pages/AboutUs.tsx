import { AnimatePresence, motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import logo from '../assets/MediBridge_LogoClear.png';
import facebookIcon from '../assets/icons/facebook.png';
import googleIcon from '../assets/icons/google.png';
import discordIcon from '../assets/icons/discord.png';
import { Link, useNavigate } from 'react-router-dom'; // 🧭 Added useNavigate

// Import the new CSS file for About Us
import './AboutUs.css'; // <--- ADD THIS LINE

const About = () => { // Renamed from Services to About for clarity
  const [showLogin, setShowLogin] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // 🧭 Hook for redirection

  const toggleLogin = () => {
    setShowLogin(prev => !prev);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/patientdashboard'); // 🧭 Redirect to PatientPanel after login
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
    <div className="home-container"> {/* Assuming you keep home-container for general page styling */}
      <nav className="navbar">
        <div className="logo">
          <img src={logo} alt="MediBridge Logo" className="logo-img" />
          <span className="logo-text">MediBridge</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/emergency">EMERGENCY</Link></li>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/about">About Us</Link></li> {/* Ensure this link is active for this page */}
          <li><Link to="/reviews">Reviews</Link></li>
          <li onClick={toggleLogin} className="login-toggle">Login</li>
          <li><Link to="/register">Register</Link></li>
        </ul>
      </nav>

      {/* Login */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            className="login-popup"
            ref={loginRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <form className="login-form" onSubmit={handleLoginSubmit}>
              <h3>Login</h3>
              <input type="text" placeholder="Username" required />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
              />

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  onChange={() => setShowPassword((prev) => !prev)}
                />
                Show password
              </label>

              <button type="submit">Submit</button>

              <div className="social-icons">
                <img src={facebookIcon} alt="Facebook Login" className="social-img" />
                <img src={googleIcon} alt="Google Login" className="social-img" />
                <img src={discordIcon} alt="Discord Login" className="social-img" />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content for About Us page */}
      <div className="about-content-wrapper"> {/* New wrapper for About content */}
        <h1 className="page-title">About Us Page</h1> {/* Title as seen in the image */}

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
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 MediBridge. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default About;