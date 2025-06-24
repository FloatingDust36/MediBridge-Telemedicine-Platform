// src/pages/Home.tsx
import medibridge from '../assets/MediBridge_Home.png';
import logo from '../assets/MediBridge_LogoClear.png'; // adjust the path as needed
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import facebookIcon from '../assets/icons/Facebook.png';
import googleIcon from '../assets/icons/Google.png';
import discordIcon from '../assets/icons/Discord.png';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  // Login State
  const [showLogin, setShowLogin] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false); // Differentiate from register password visibility
  const navigate = useNavigate();

  // Register State
  const [showRegister, setShowRegister] = useState(false);
  const registerRef = useRef<HTMLDivElement>(null);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmRegisterPassword, setConfirmRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false); // Differentiate from login password visibility
  const [role, setRole] = useState<'Doctor' | 'Patient' | ''>('');
  const [passwordStrength, setPasswordStrength] = useState<{ label: string; color: string }>({
    label: '',
    color: '',
  });

  // Toggle functions
  const toggleLogin = () => {
    setShowLogin(prev => !prev);
    setShowRegister(false); // Close register if opening login
  };

  const toggleRegister = () => {
    setShowRegister(prev => !prev);
    setShowLogin(false); // Close login if opening register
  };

  // Login Submit Handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send login credentials to a backend.
    navigate('/patient-dashboard'); // Redirect to PatientDashboard after login
    setShowLogin(false); // Close the popup after submission
  };

  // Register Submit Handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ registerEmail, registerPassword, confirmRegisterPassword, role });
    // In a real application, send this data to a backend.
    setShowRegister(false); // Close the popup after submission for now
    // Potentially redirect or show a success message
  };

  // Password Strength Logic for Register
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length < 6) return { label: 'Too short', color: 'red' };
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    const mediumRegex = /^(?=.*[a-z])(?=.*\d).{6,}$/;

    if (strongRegex.test(pwd)) return { label: 'Strong', color: 'green' };
    if (mediumRegex.test(pwd)) return { label: 'Medium', color: 'orange' };
    return { label: 'Weak', color: 'red' };
  };

  // Click outside listener for both popups
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const targetHTMLElement = event.target as HTMLElement;

      // Logic for Login popup
      if (
        showLogin &&
        loginRef.current &&
        !loginRef.current.contains(targetNode) &&
        !targetHTMLElement.closest('.login-toggle')
      ) {
        setShowLogin(false);
      }

      // Logic for Register popup
      if (
        showRegister &&
        registerRef.current &&
        !registerRef.current.contains(targetNode) &&
        !targetHTMLElement.closest('.register-toggle')
      ) {
        setShowRegister(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLogin, showRegister]);

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
          <li onClick={toggleRegister} className="register-toggle">Register</li>
        </ul>
      </nav>

      {/* Login Popup */}
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
                type={showLoginPassword ? "text" : "password"}
                placeholder="Password"
                required
              />

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  onChange={() => setShowLoginPassword((prev) => !prev)}
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

      {/* Register Popup */}
      <AnimatePresence>
        {showRegister && (
          <motion.div
            className="register-popup"
            ref={registerRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <form className="register-form" onSubmit={handleRegisterSubmit}>
              <h2>Register</h2>

              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={registerPassword}
                  onChange={(e) => {
                    setRegisterPassword(e.target.value);
                    setPasswordStrength(getPasswordStrength(e.target.value));
                  }}
                  required
                />
                {registerPassword && (
                  <>
                    <p style={{ fontSize: '14px', color: passwordStrength.color, marginTop: '4px' }}>
                      Password Strength: {passwordStrength.label}
                    </p>
                    <div style={{
                      height: '6px',
                      width: '100%',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      marginTop: '4px'
                    }}>
                      <div style={{
                        width: passwordStrength.label === 'Strong' ? '100%' : passwordStrength.label === 'Medium' ? '66%' : '33%',
                        height: '100%',
                        backgroundColor: passwordStrength.color,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </>
                )}
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmRegisterPassword}
                  onChange={(e) => setConfirmRegisterPassword(e.target.value)}
                  required
                />
              </div>

              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="showRegisterPasswordCheckbox"
                  onChange={() => setShowRegisterPassword(!showRegisterPassword)}
                />
                <label htmlFor="showRegisterPasswordCheckbox">Show Password</label>
              </div>

              <div className="role-selection">
                <button
                  type="button"
                  className={`role-btn ${role === 'Patient' ? 'active' : ''}`}
                  onClick={() => setRole('Patient')}
                >
                  Patient
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'Doctor' ? 'active' : ''}`}
                  onClick={() => setRole('Doctor')}
                >
                  Doctor
                </button>
              </div>

              <button type="submit" className="register-submit">Register</button>

              <div className="social-icons">
                <img src={facebookIcon} alt="Facebook" className="social-img" />
                <img src={googleIcon} alt="Google" className="social-img" />
                <img src={discordIcon} alt="Discord" className="social-img" />
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