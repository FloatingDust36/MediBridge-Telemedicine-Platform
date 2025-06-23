import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import logo from '../assets/MediBridge_LogoClear.png';
import facebookIcon from '../assets/icons/facebook.png';
import googleIcon from '../assets/icons/google.png';
import discordIcon from '../assets/icons/discord.png';

// Import the new CSS file for Services
import './Services.css'; // <--- ADD THIS LINE

// Import images for the service blocks
import Service1 from '../assets/pictures/Service1.jpg'; // Assuming you have this image
import Service2 from '../assets/pictures/Service2.jpg'; // Assuming you have this image
import Service3 from '../assets/pictures/Service3.jpg'; // Assuming you have this image
import Service4 from '../assets/pictures/Service4.jpg'; // Assuming you have this image


const Services = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

  const toggleLogin = () => setShowLogin(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(event.target as Node)) {
        setShowLogin(false);
      }
    };
    if (showLogin) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="logo">
          <img src={logo} alt="MediBridge Logo" className="logo-img" />
          <span className="logo-text">MediBridge</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/Emergency">EMERGENCY</Link></li>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/reviews">Reviews</Link></li>
          <li onClick={toggleLogin} className="login-toggle">Login</li>
          <li><Link to="/register">Register</Link></li>
        </ul>
      </nav>

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
            <form className="login-form">
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
                  onChange={() => setShowPassword(prev => !prev)}
                />
                Show password
              </label>
              <button type="submit">Submit</button>
              <div className="social-icons">
                <img src={facebookIcon} alt="Facebook" className="social-img" />
                <img src={googleIcon} alt="Google" className="social-img" />
                <img src={discordIcon} alt="Instagram" className="social-img" />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content for Services page */}
      <div className="services-content-wrapper"> {/* New wrapper for content */}
        <div className="services-grid">
          <div className="service-block">
            <div className="service-image-container">
              <img src={Service1} alt="Secure video consultations" className="service-image" /> {/* need pa ilisan ang img src */}
              <div className="service-text">Secure video consultations between patients and licensed doctors</div>
            </div>
          </div>

          <div className="service-block">
            <div className="service-image-container">
              <img src={Service2} alt="Symptom checker powered by AI" className="service-image" />
              <div className="service-text">Symptom checker powered by AI</div>
            </div>
          </div>

          <div className="service-block">
            <div className="service-image-container">
              <img src={Service3} alt="Appointment booking and medical history tracking" className="service-image" />
              <div className="service-text">Appointment booking and medical history tracking</div>
            </div>
          </div>

          <div className="service-block">
            <div className="service-image-container">
              <img src={Service4} alt="Role-based portals for doctors, patients, and admins" className="service-image" />
              <div className="service-text">Role-based portals for doctors, patients, and admins</div>
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

export default Services;