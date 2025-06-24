import medibridge from '../assets/MediBridge_Home.png';
import logo from '../assets/MediBridge_LogoClear.png'; // adjust the path as needed
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import facebookIcon from '../assets/icons/Facebook.png';
import googleIcon from '../assets/icons/Google.png';
import discordIcon from '../assets/icons/Discord.png';
import { Link, useNavigate } from 'react-router-dom'; // 🧭 Added useNavigate

const Home = () => {
  const [showLogin, setShowLogin] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // 🧭 Hook for redirection

  const toggleLogin = () => {
    setShowLogin(prev => !prev);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/admindashboard'); // 🧭 Redirect to PatientPanel after login
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
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <img src={logo} alt="MediBridge Logo" className="logo-img" />
          <span className="logo-text">MediBridge</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/emergency">EMERGENCY</Link></li>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/about">About Us</Link></li>
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

      {/* Hero Section */}
      <header
        className="hero-section"
        style={{
          backgroundImage: `url(${medibridge})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '10vh',
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

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 MediBridge. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
