import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../lib/supabaseClient'; // Adjust path if needed
import logo from '../assets/MediBridge_LogoClear.png'; // Adjust path relative to Navbar.tsx
import facebookIcon from '../assets/icons/Facebook.png'; // Adjust path
import googleIcon from '../assets/icons/Google.png';     // Adjust path
import discordIcon from '../assets/icons/Discord.png';   // Adjust path

import './Navbar.css'; // Import Navbar specific CSS


// Define the possible user types
type UserType = 'guest' | 'patient' | 'doctor' | 'admin';

// Define props for the Navbar component
interface NavbarProps {
  userType: UserType; // This prop determines which navigation links and actions are shown
}

const Navbar: React.FC<NavbarProps> = ({ userType }) => {
  const [showLogin, setShowLogin] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const registerRef = useRef<HTMLDivElement>(null);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmRegisterPassword, setConfirmRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false); // Renamed for clarity vs. strength
  const [role, setRole] = useState<'Doctor' | 'Patient' | ''>(''); // Role selected in register popup
  const [passwordStrength, setPasswordStrength] = useState<{ label: string; color: string }>({
    label: '',
    color: '',
  });

  const navigate = useNavigate();
  const location = useLocation(); // To determine active link highlighting

  // Toggle functions for login/register popups
  const toggleLogin = () => {
    setShowLogin(prev => !prev);
    setShowRegister(false); // Close register if opening login
  };

  const toggleRegister = () => {
    setShowRegister(prev => !prev);
    setShowLogin(false); // Close login if opening register
  };

  // Handle Login form submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const form = e.target as HTMLFormElement;
  const email = (form[0] as HTMLInputElement).value;
  const password = (form[1] as HTMLInputElement).value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert('Login failed: ' + error.message);
  } else {
    alert('Login successful!');
    setShowLogin(false);

    // Get the user's role
    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.user_metadata?.user_role;

    if (role === 'doctor') {
      navigate('/doctordashboard');
    } else if (role === 'patient') {
      navigate('/patientdashboard');
    } else if (role === 'admin') {
      navigate('/admindashboard');
    } else {
      navigate('/');
    }
  }
};

  // Handle Google Registration with Role
const handleGoogleRegister = async () => {
  if (!role) {
    alert('Please select a role (Doctor or Patient) before continuing.');
    return;
  }

  // Save role to localStorage so /oauth-callback can access it
  localStorage.setItem('selectedRole', role.toLowerCase()); // 'doctor' or 'patient'

  const redirectTo = `${window.location.origin}/oauth-callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error('OAuth Error:', error.message);
    alert('Google registration failed.');
  }
};


  // Handle Google OAuth login
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/oauth-callback`, // Redirects back to your app after Google login
      },
    });

    if (error) {
      console.error('Google Login Error:', error.message);
      alert('Google login failed: ' + error.message); // Consider a custom modal
    }
    // Supabase will handle the redirect and session setting after successful OAuth
  };

  // Handle user logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('Logout failed: ' + error.message); // Consider a custom modal
    } else {
      alert('Logged out successfully!'); // Consider a custom modal
      navigate('/'); // Redirect to home/guest page after logout
      // The App.tsx auth listener will detect the logout and update userType
    }
  };

  // Handle Register form submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerPassword !== confirmRegisterPassword) {
      alert('Passwords do not match!'); // Consider a custom modal
      return;
    }
    if (!role) {
      alert('Please select a role (Patient or Doctor).'); // Consider a custom modal
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: registerEmail,
      password: registerPassword,
      options: {
        data: {
          user_role: role.toLowerCase(), // Store role in user_metadata
        },
      },
    });

    if (error) {
      alert('Registration failed: ' + error.message); // Consider a custom modal
    } else {
      if (data.user?.identities?.length === 0) {
          // User already exists, email confirmation needed
          alert('User with this email already exists. Please check your email to verify.'); // Consider custom modal
      } else {
          // New user signed up, email confirmation likely sent
          alert('Registration successful! Please check your email to verify your account.'); // Consider custom modal
      }
      setShowRegister(false); // Close the popup after submission
      // Clear form fields
      setRegisterEmail('');
      setRegisterPassword('');
      setConfirmRegisterPassword('');
      setRole('');
      setPasswordStrength({ label: '', color: '' });
    }
  };

  // Password strength logic
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { label: '', color: '' };
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
        !targetHTMLElement.closest('.login-toggle') // Exclude clicking the login toggle button
      ) {
        setShowLogin(false);
      }

      // Logic for Register popup
      if (
        showRegister &&
        registerRef.current &&
        !registerRef.current.contains(targetNode) &&
        !targetHTMLElement.closest('.register-toggle') // Exclude clicking the register toggle button
      ) {
        setShowRegister(false);
      }
    };

    // Add/remove listener based on whether any popup is open
    if (showLogin || showRegister) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLogin, showRegister]); // Re-run effect when popup visibility changes


  // Function to determine if a nav item is active for highlighting
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Define navigation items based on user type (These are your provided lists)
  const getNavigationItems = (type: UserType) => {
    switch (type) {
      case 'guest':
        return [
          { label: "EMERGENCY", path: "/emergency" },
          { label: "Home", path: "/" },
          { label: "Services", path: "/services" },
          { label: "About Us", path: "/about" },
          { label: "Reviews", path: "/reviews" },
        ];
      case 'doctor':
        return [
          { label: "Dashboard", path: "/doctordashboard" },
          { label: "Consultation", path: "/consultation" },
          { label: "Messages", path: "/messages" },
          { label: "Add Schedule", path: "/addschedule" },
          { label: "Doctor Profile",path: "/doctorprofile" },
        ];
      case 'patient':
        return [
          { label: "Dashboard", path: "/patientdashboard" },
          { label: "Consultation", path: "/consultation" },
          { label: "Messages", path: "/messages" },
          { label: "Appointments", path: "/appointments" },
          { label: "Chatbot", path: "/chatbot" },
          { label: "Patient Profile", path: "/patientprofile" },
        ];
      case 'admin':
        return [
          { label: "Dashboard", path: "/admindashboard" },
        ];
      default:
        return []; // Should not happen if UserType is strictly typed
    }
  };

  const navigationItems = getNavigationItems(userType);

  return (
    <nav className={`navbar ${userType}-navbar`}> {/* Add userType-specific class for styling */}
      <div className="logo">
        <img src={logo} alt="MediBridge Logo" className="logo-img" />
        <span className="logo-text">MediBridge</span>
      </div>
      <ul className="nav-links">
        {/* Render dynamic navigation links based on user type */}
        {navigationItems.map((item, index) => (
          <li key={index} className={isActive(item.path) ? 'active' : ''}>
            <Link to={item.path}>{item.label}</Link>
          </li>
        ))}

        {/* Conditional Login/Register or Logout buttons */}
        {userType === 'guest' ? (
          <>
            <li onClick={toggleLogin} className={`login-toggle ${showLogin ? 'active-popup' : ''}`}>Login</li>
            <li onClick={toggleRegister} className={`register-toggle ${showRegister ? 'active-popup' : ''}`}>Register</li>
          </>
        ) : (
          <li onClick={handleLogout} className="logout-button">Logout</li>
        )}
      </ul>

      {/* Login Popup - Only render if userType is 'guest' AND showLogin is true */}
      <AnimatePresence>
        {showLogin && userType === 'guest' && (
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
              <div className="input-group"> {/* Added input-group for consistency */}
                <label>Email Address</label> {/* Added label for consistency */}
                <input type="email" placeholder="Enter email" required /> {/* Changed placeholder */}
              </div>
              <div className="input-group"> {/* Added input-group for consistency */}
                <label>Password</label> {/* Added label for consistency */}
                <input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Enter password"
                  required
                />
              </div>
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
                <img src={googleIcon} alt="Google Login" className="social-img" onClick={handleGoogleLogin} />
                <img src={discordIcon} alt="Discord Login" className="social-img" />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Register Popup - Only render if userType is 'guest' AND showRegister is true */}
      <AnimatePresence>
        {showRegister && userType === 'guest' && (
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
                {/* Password Strength Indicator - moved inside input-group to be grouped with its input */}
                {registerPassword && (
                  <div className="password-strength-info"> {/* New wrapper div */}
                    <p style={{ fontSize: '14px', color: passwordStrength.color, marginTop: '4px', marginBottom: '4px' }}> {/* Added margin-bottom */}
                      Password Strength: {passwordStrength.label}
                    </p>
                    <div style={{
                      height: '6px',
                      width: '100%',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      marginBottom: '4px' // Added margin-bottom
                    }}>
                      <div style={{
                        width: passwordStrength.label === 'Strong' ? '100%' : passwordStrength.label === 'Medium' ? '66%' : '33%',
                        height: '100%',
                        backgroundColor: passwordStrength.color,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>
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
              {/* FIXED: "Show Password" checkbox now matches login form structure */}
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  onChange={() => setShowRegisterPassword(!showRegisterPassword)}
                />
                Show password
              </label>
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
                <img src={googleIcon} alt="Google" className="social-img" onClick={handleGoogleRegister} style={{ cursor: 'pointer' }} />
                <img src={discordIcon} alt="Discord" className="social-img" />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;