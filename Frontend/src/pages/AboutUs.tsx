import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Nave from '../assets/pfp/Nave.jpg';
import Pestano from '../assets/pfp/Pestano.jpg';
import Rubio from '../assets/pfp/Rubio.jpg';
import Tindogan from '../assets/pfp/Tindogan.jpg';
import Villamor from '../assets/pfp/Villamor.jpg';
import GroupPhoto from '../assets/pfp/group.jpg'; // Make sure this file exists!
import GroupPhoto2 from '../assets/pfp/group2.jpg';

import './AboutUs.css';

interface TeamMember {
  name: string;
  role: string;
  description: string;
  imageUrl: string;
  githubUrl: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Jesnar T. Tindogan',
    role: 'Project Manager',
    description: 'Leads the team with strategic vision and ensures project milestones are met efficiently.',
    imageUrl: Tindogan,
    githubUrl: 'https://github.com/Jasner13',
  },
  {
    name: 'John Michael B. Villamor',
    role: 'Frontend Developer',
    description: 'Crafts intuitive and responsive user interfaces, focusing on user experience and modern web design.',
    imageUrl: Villamor,
    githubUrl: 'https://github.com/Villamormike',
  },
  {
    name: 'John Peter D. Pestaño',
    role: 'Backend Developer',
    description: 'Builds robust and scalable server-side logic, ensuring data integrity and efficient API operations.',
    imageUrl: Pestano,
    githubUrl: 'https://github.com/FloatingDust36',
  },
  {
    name: 'Christopher John G. Rubio',
    role: 'DevOps',
    description: 'Manages deployment pipelines and infrastructure, ensuring seamless integration and continuous delivery.',
    imageUrl: Rubio,
    githubUrl: 'https://github.com/Seijima08',
  },
  {
    name: 'John Michael A. Nave',
    role: 'Full Stack Developer',
    description: 'Contributes across the entire stack, from database design to frontend implementation, ensuring cohesive development.',
    imageUrl: Nave,
    githubUrl: 'https://github.com/GoldenSnek',
  },
];

const About = () => {
  const [showLogin, setShowLogin] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const toggleLogin = () => setShowLogin(prev => !prev);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/patientdashboard');
  };

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
    <div className="about-page-container">
      <div className="main-content-and-footer-wrapper">
        <div className="about-content-wrapper">
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
            <p className="section-text">BS Computer Engineering - 3rd Year</p>
            <div className="team-grid">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="team-member-card"
                  onClick={() => handleCardClick(member.githubUrl)}
                  title={`Visit ${member.name}'s GitHub`}
                >
                  <img src={member.imageUrl} alt={member.name} className="team-member-image" />
                  <span className="member-name">{member.name}</span>
                  <span className="member-role">{member.role}</span>
                  <p className="member-description">{member.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="about-section group-photo-section">
  <h2 className="section-title">We are BBCpE - Big Brain Computer Engineers</h2>
  <p className="section-text">Below are team pictures proudly representing our group.</p>

  <div className="group-photo-gallery">
    <img src={GroupPhoto} alt="Group Photo 1" className="group-photo" />
    <img src={GroupPhoto2} alt="Group Photo 2" className="group-photo" />
  </div>
</div>

        </div>
      </div>
    </div>
  );
};

export default About;
