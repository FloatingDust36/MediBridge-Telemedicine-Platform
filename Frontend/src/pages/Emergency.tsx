import React from 'react';
import './Emergency.css'; // Import the new CSS file
import './Home.css'; // Assuming Home.css contains global styles like navbar
import logo from '../assets/MediBridge_LogoClear.png'; // adjust the path as needed
import { Link } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import facebookIcon from '../assets/icons/facebook.png';
import googleIcon from '../assets/icons/google.png';
import discordIcon from '../assets/icons/discord.png';

const Emergency: React.FC = () => {
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
        // Corrected typo here from handleClickAllSide to handleClickOutside
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);
  return (
    <div className="emergency-container">
      <nav className="navbar">
        <div className="logo">
          <img src={logo} alt="MedBridge Logo" className="logo-img" /> {/* Replace with your logo path */}
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

      <div style={{ height: "60px" }}></div> {/* Spacer to offset fixed navbar */}

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

      <div className="emergency-content">
        <div className="emergency-main-sections">
          {/* Left Section: Map and Info */}
          <div className="emergency-section-left panel-box">
            <p className="hospital-info">info like unsay name sa closest hospital etc.</p>
            <div className="map-container">
              {/* This iframe would embed a Google Map.
                  You'll need a valid Google Maps Embed API key and URL here.
                  The current one is just a placeholder, you'll replace `YOUR_EMBED_API_KEY`
                  and adjust `q` (query) for the desired location.
              */}
              <iframe
                title="Google Maps Location"
                width="100%"
                height="400"
                loading="lazy"
                allowFullScreen
                src="https://www.google.com/maps/embed/v1/place?key=YOUR_EMBED_API_KEY&q=Coloong+Elementary+School+Lapu-Lapu+City"
              ></iframe>
              {/* Error message overlay based on screenshot */}
              <div className="map-error-overlay">
                <p className="error-text">Closest Hospital: None detected nearby.</p>
                <p className="error-text small-text">Google Maps Platform rejected your request. The provided API key is invalid.</p>
              </div>
            </div>
          </div>

          {/* Right Section: Hotlines and Draft */}
          <div className="emergency-section-right">
            <div className="closest-hospital-alert panel-box">
              <p className="alert-message">Closest Hospital: None detected nearby.</p>
              <p className="api-error-message">Google Maps Platform rejected your request. The provided API key is invalid.</p>
            </div>
            <div className="draft-section panel-box">
              <p className="draft-text">Draft</p>
            </div>
            <div className="emergency-hotlines panel-box">
              <h2>Emergency Hotlines</h2>
              <div className="hotline-item">
                <i className="fas fa-phone-alt"></i> {/* Font Awesome icon for phone */}
                <p>Philippine General Hospital</p>
                <span>(02) 8554 8400</span>
              </div>
              <div className="hotline-item">
                <i className="fas fa-phone-alt"></i>
                <p>St. Luke's Medical Center</p>
                <span>(02) 8723 0101</span>
              </div>
              <div className="hotline-item">
                <i className="fas fa-phone-alt"></i>
                <p>Makati Medical Center</p>
                <span>(02) 8888 8999</span>
              </div>
              <div className="hotline-item">
                <i className="fas fa-phone-alt"></i>
                <p>East Avenue Medical Center</p>
                <span>(02) 8925 6501</span>
              </div>
              <div className="hotline-item">
                <i className="fas fa-phone-alt"></i>
                <p>Philippine Red Cross</p>
                <span>143 or (02) 8790 2300</span>
              </div>
              <p className="hotline-disclaimer">This backup list appears if no nearby hospital is found.</p>
            </div>
          </div>
        </div>
      </div>
      <footer className="footer">
        <p>© 2025 MediBridge. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Emergency;