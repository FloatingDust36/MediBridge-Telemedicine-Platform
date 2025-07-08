import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../lib/supabaseClient';
import logo from '../assets/MediBridge_LogoClear.png';
import facebookIcon from '../assets/icons/Facebook.png';
import googleIcon from '../assets/icons/Google.png';
import discordIcon from '../assets/icons/Discord.png';
import './Navbar.css';

// Define the possible user types
type UserType = 'guest' | 'patient' | 'doctor' | 'admin';

// Define props for the Navbar component
interface NavbarProps {
  userType: UserType;
  onUserTypeChange?: (userType: UserType) => void; // Add callback for user type changes
}

const Navbar: React.FC<NavbarProps> = ({ userType, onUserTypeChange }) => {
  const [showLogin, setShowLogin] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [showRegister, setShowRegister] = useState(false);
  const registerRef = useRef<HTMLDivElement>(null);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmRegisterPassword, setConfirmRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [role, setRole] = useState<'Doctor' | 'Patient' | ''>('');
  const [passwordStrength, setPasswordStrength] = useState<{ label: string; color: string }>({
    label: '',
    color: '',
  });

  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Check for existing session on component mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        return;
      }

      if (session?.user) {
        // Get user data from your users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (userData && !userError) {
          setCurrentUser(userData);
          // Update user type based on database role
          if (onUserTypeChange) {
            onUserTypeChange(userData.role as UserType);
          }
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  // Toggle functions for login/register popups
  const toggleLogin = () => {
    setShowLogin(prev => !prev);
    setShowRegister(false);
    // Clear form when opening
    if (!showLogin) {
      setLoginEmail('');
      setLoginPassword('');
    }
  };

  const toggleRegister = () => {
    setShowRegister(prev => !prev);
    setShowLogin(false);
    // Clear form when opening
    if (!showRegister) {
      setRegisterEmail('');
      setRegisterPassword('');
      setConfirmRegisterPassword('');
      setRole('');
      setPasswordStrength({ label: '', color: '' });
    }
  };

  // Handle Login form submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (loginError) {
        alert('Login failed: ' + loginError.message);
        return;
      }

      // Check if user exists in your users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', loginData.user.id)
        .single();

      if (checkError || !existingUser) {
        // User not in your database - sign them out
        await supabase.auth.signOut();
        alert('Login failed: This account is not registered in MediBridge.');
        return;
      }

      // Success - update state and navigate
      setCurrentUser(existingUser);
      setShowLogin(false);
      setLoginEmail('');
      setLoginPassword('');
      
      // Update user type
      if (onUserTypeChange) {
        onUserTypeChange(existingUser.role as UserType);
      }

      // Navigate based on role
      switch (existingUser.role) {
        case 'doctor':
          navigate('/doctordashboard');
          break;
        case 'patient':
          navigate('/patientdashboard');
          break;
        case 'admin':
          navigate('/admindashboard');
          break;
        default:
          navigate('/');
      }

      alert('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      alert('An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Registration with Role
  const handleGoogleRegister = async () => {
    if (!role) {
      alert('Please select a role (Doctor or Patient) before continuing.');
      return;
    }

    localStorage.setItem('selectedRole', role.toLowerCase());
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: `${window.location.origin}/oauth-register-callback`,
          queryParams: {
            role: role.toLowerCase()
          }
        },
      });

      if (error) {
        console.error('OAuth Error:', error.message);
        alert('Google registration failed: ' + error.message);
      }
    } catch (error) {
      console.error('Google registration error:', error);
      alert('An unexpected error occurred during Google registration.');
    }
  };

  // Handle Google OAuth login
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/oauth-callback`,
        },
      });

      if (error) {
        console.error('Google Login Error:', error.message);
        alert('Google login failed: ' + error.message);
      }
    } catch (error) {
      console.error('Google login error:', error);
      alert('An unexpected error occurred during Google login.');
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert('Logout failed: ' + error.message);
      } else {
        setCurrentUser(null);
        if (onUserTypeChange) {
          onUserTypeChange('guest');
        }
        navigate('/');
        alert('Logged out successfully!');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('An unexpected error occurred during logout.');
    }
  };

  // Handle Register form submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (registerPassword !== confirmRegisterPassword) {
        alert('Passwords do not match!');
        return;
      }

      if (!role) {
        alert('Please select a role (Patient or Doctor).');
        return;
      }

      // Check if email already exists in your users table
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('email')
        .eq('email', registerEmail)
        .single();

      if (existingUser) {
        alert('This email is already registered in MediBridge.');
        return;
      }

      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: {
            user_role: role.toLowerCase(),
          },
        },
      });

      if (error) {
        alert('Registration failed: ' + error.message);
        return;
      }

      if (data.user?.identities?.length === 0) {
        alert('User with this email already exists. Please check your email to verify.');
      } else {
        alert('Registration successful! Please check your email to verify your account.');
      }

      // Clear form and close popup
      setShowRegister(false);
      setRegisterEmail('');
      setRegisterPassword('');
      setConfirmRegisterPassword('');
      setRole('');
      setPasswordStrength({ label: '', color: '' });

    } catch (error) {
      console.error('Registration error:', error);
      alert('An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
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

      if (
        showLogin &&
        loginRef.current &&
        !loginRef.current.contains(targetNode) &&
        !targetHTMLElement.closest('.login-toggle')
      ) {
        setShowLogin(false);
      }

      if (
        showRegister &&
        registerRef.current &&
        !registerRef.current.contains(targetNode) &&
        !targetHTMLElement.closest('.register-toggle')
      ) {
        setShowRegister(false);
      }
    };

    if (showLogin || showRegister) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLogin, showRegister]);

  // Function to determine if a nav item is active for highlighting
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Define navigation items based on user type
  const getNavigationItems = (type: UserType) => {
    switch (type) {
      case 'guest':
        return [
          { label: "EMERGENCY", path: "/emergency" },
          { label: "Home", path: "/" },
          { label: "Services", path: "/services" },
          { label: "About Us", path: "/about" },
          //{ label: "Reviews", path: "/reviews" },
        ];
      case 'doctor':
        return [
          { label: "EMERGENCY", path: "/emergency" },
          { label: "Dashboard", path: "/doctordashboard" },
          { label: "Consultation", path: "/consultation" },
          { label: "Messages", path: "/messages" },
          { label: "Add Schedule", path: "/addschedule" },
          { label: "Doctor Profile", path: "/doctorprofile" },
        ];
      case 'patient':
        return [
          { label: "EMERGENCY", path: "/emergency" },
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
        return [];
    }
  };

  const navigationItems = getNavigationItems(userType);

  return (
    <nav className={`navbar ${userType}-navbar`}>
      <div className="logo">
        <img src={logo} alt="MediBridge Logo" className="logo-img" />
        <span className="logo-text">MediBridge</span>
      </div>
      <ul className="nav-links">
        {navigationItems.map((item, index) => (
          <li key={index} className={isActive(item.path) ? 'active' : ''}>
            <Link to={item.path}>{item.label}</Link>
          </li>
        ))}

        {userType === 'guest' ? (
          <>
            <li onClick={toggleLogin} className={`login-toggle ${showLogin ? 'active-popup' : ''}`}>
              Login
            </li>
            <li onClick={toggleRegister} className={`register-toggle ${showRegister ? 'active-popup' : ''}`}>
              Register
            </li>
          </>
        ) : (
          <>
            <li onClick={handleLogout} className="logout-button">
              Logout
            </li>
          </>
        )}
      </ul>

      {/* Login Popup */}
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
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="Enter email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showLoginPassword}
                  onChange={() => setShowLoginPassword(!showLoginPassword)}
                />
                Show password
              </label>
              <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Submit'}
              </button>
              <div className="social-icons">
                <img 
                  src={googleIcon} 
                  alt="Google Login" 
                  className="social-img" 
                  onClick={handleGoogleLogin}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Register Popup */}
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
                {registerPassword && (
                  <div className="password-strength-info">
                    <p style={{ fontSize: '14px', color: passwordStrength.color, marginTop: '4px', marginBottom: '4px' }}>
                      Password Strength: {passwordStrength.label}
                    </p>
                    <div style={{
                      height: '6px',
                      width: '100%',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      marginBottom: '4px'
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
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showRegisterPassword}
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
              <button type="submit" className="register-submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
              <div className="social-icons">
                <img 
                  src={googleIcon} 
                  alt="Google" 
                  className="social-img" 
                  onClick={handleGoogleRegister} 
                  style={{ cursor: 'pointer' }} 
                />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;