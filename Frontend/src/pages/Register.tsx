import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

import logo from '../assets/MediBridge_LogoClear.png';
import facebookIcon from '../assets/icons/Facebook.png';
import googleIcon from '../assets/icons/Google.png';
import discordIcon from '../assets/icons/Discord.png';

import './register.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'Doctor' | 'Patient' | ''>('');
  const [passwordStrength, setPasswordStrength] = useState<{ label: string; color: string }>({
    label: '',
    color: '',
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, password, confirmPassword, role });
  };

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length < 6) return { label: 'Too short', color: 'red' };
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    const mediumRegex = /^(?=.*[a-z])(?=.*\d).{6,}$/;

    if (strongRegex.test(pwd)) return { label: 'Strong', color: 'green' };
    if (mediumRegex.test(pwd)) return { label: 'Medium', color: 'orange' };
    return { label: 'Weak', color: 'red' };
  };

  return (
    <div className="register-page-wrapper">
      <div className="register-container">
        {/* Navbar */}
        <nav className="navbar">
          <div className="logo">
            <img src={logo} alt="MediBridge Logo" className="logo-img" />
            <span className="logo-text">MediBridge</span>
          </div>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/reviews">Reviews</Link></li>
            <li><Link to="/register">Register</Link></li>
          </ul>
        </nav>

        {/* Register Form */}
        <AnimatePresence>
          <motion.div
            className="register-form-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            <form className="register-form" onSubmit={handleRegister}>
              <h2>Register</h2>

              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordStrength(getPasswordStrength(e.target.value));
                  }}
                  required
                />
                {password && (
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="showPassword"
                  onChange={() => setShowPassword(!showPassword)}
                />
                <label htmlFor="showPassword">Show Password</label>
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
                <img src={facebookIcon} alt="Facebook" />
                <img src={googleIcon} alt="Google" />
                <img src={discordIcon} alt="Discord" />
              </div>
            </form>
          </motion.div>
        </AnimatePresence>

        <footer className="footer">
          <p>© 2025 MediBridge. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Register;
