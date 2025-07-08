//AboutUs.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Nave from '../assets/pfp/Nave.jpg';
import Pestano from '../assets/pfp/Pestano.jpg';
import Rubio from '../assets/pfp/Rubio.jpg';
import Tindogan from '../assets/pfp/Tindogan.jpg';
import Villamor from '../assets/pfp/Villamor.jpg';

import './AboutUs.css'; // About Us specific CSS

// Define a type for team members for better type safety
interface TeamMember {
  name: string;
  role: string;
  description: string; // NEW: Add description property
  imageUrl: string;
  githubUrl: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Jesnar T. Tindogan',
    role: 'Project Manager',
    description: 'Leads the team with strategic vision and ensures project milestones are met efficiently.', // NEW: Description
    imageUrl: Tindogan,
    githubUrl: 'https://github.com/Jasner13',
  },
  {
    name: 'John Michael B. Villamor',
    role: 'Frontend Developer',
    description: 'Crafts intuitive and responsive user interfaces, focusing on user experience and modern web design.', // NEW: Description
    imageUrl: Villamor,
    githubUrl: 'https://github.com/Villamormike',
  },
  {
    name: 'John Peter D. Pestaño',
    role: 'Backend Developer',
    description: 'Builds robust and scalable server-side logic, ensuring data integrity and efficient API operations.', // NEW: Description
    imageUrl: Pestano,
    githubUrl: 'https://github.com/FloatingDust36',
  },
  {
    name: 'Christopher John G. Rubio',
    role: 'DevOps',
    description: 'Manages deployment pipelines and infrastructure, ensuring seamless integration and continuous delivery.', // NEW: Description
    imageUrl: Rubio,
    githubUrl: 'https://github.com/Seijima08',
  },
  {
    name: 'John Michael A. Nave',
    role: 'Full Stack Developer',
    description: 'Contributes across the entire stack, from database design to frontend implementation, ensuring cohesive development.', // NEW: Description
    imageUrl: Nave,
    githubUrl: 'https://github.com/GoldenSnek',
  },
];

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

  // Function to handle opening GitHub profile
  const handleCardClick = (githubUrl: string) => {
    if (githubUrl) {
      window.open(githubUrl, '_blank', 'noopener,noreferrer');
    }
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
              {teamMembers.map((member, index) => (
                <div
                  key={index} // Using index as key is okay if list is static and not reordered
                  className="team-member-card"
                  onClick={() => handleCardClick(member.githubUrl)} // Make the card clickable
                  title={`Visit ${member.name}'s GitHub`} // Add a tooltip
                >
                  <img src={member.imageUrl} alt={member.name} className="team-member-image" /> {/* Member image */}
                  <span className="member-name">{member.name}</span>
                  <span className="member-role">{member.role}</span>
                  <p className="member-description">{member.description}</p> {/* NEW: Member description */}
                </div>
              ))}
            </div>
          </div>
        </div> {/* End about-content-wrapper */}
      </div> {/* End main-content-and-footer-wrapper */}
    </div> // End about-page-container
  );
};

export default About;