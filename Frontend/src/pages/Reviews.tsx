import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import logo from '../assets/MediBridge_LogoClear.png';
import facebookIcon from '../assets/icons/facebook.png';
import googleIcon from '../assets/icons/google.png';
import discordIcon from '../assets/icons/discord.png';

// Import the new CSS file for Reviews
import './Reviews.css';

const Reviews = () => {
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

  // Helper for rendering stars based on a rating
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < rating) {
        stars.push(<span key={i} className="star filled">&#9733;</span>); // Filled star
      } else {
        stars.push(<span key={i} className="star">&#9734;</span>); // Empty star
      }
    }
    return <div className="rating-stars">{stars}</div>;
  };

  return (
    <div className="home-container">
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

      {/* Main content for Reviews page */}
      <div className="reviews-content-wrapper">
        <h1 className="reviews-page-title">Website Reviews</h1>

        <div className="review-note">
          <span className="note-label">Note:</span> You must
          {/* Changed Link to a span with an onClick handler */}
          <span className="note-link" onClick={toggleLogin} style={{ cursor: 'pointer' }}> login </span>
          to leave a review. Below are public reviews from our users.
        </div>

        <h2 className="what-users-saying">What Users Are Saying</h2>

        <div className="review-card">
          <div className="reviewer-info">
            <span className="reviewer-name">Juan Dela Cruz</span>
            {renderStars(4)}
          </div>
          <p className="review-text">
            The MediBridge website made it super easy to consult with a doctor even from my province. Great service!
          </p>
        </div>

        <div className="review-card">
          <div className="reviewer-info">
            <span className="reviewer-name">Maria Santos</span>
            {renderStars(3)}
          </div>
          <p className="review-text">
            Very helpful during the pandemic! The emergency map and hotline features are life-saving.
          </p>
        </div>

        <div className="review-card">
          <div className="reviewer-info">
            <span className="reviewer-name">Carlos Mendoza</span>
            {renderStars(2)}
          </div>
          <p className="review-text">
            Decent platform, but I wish there were more doctors available during off-hours.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 MediBridge. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Reviews;