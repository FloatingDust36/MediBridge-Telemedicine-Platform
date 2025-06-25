import React from 'react';
import { Link } from 'react-router-dom';
import './MessagesPage.css';
import logo from '../assets/MediBridge_LogoClear.png';

const MessagesPage: React.FC = () => {
  const messages = [
    { id: 1, sender: "Dr. Alex Smith", subject: "Regarding your lab results", snippet: "Your recent lab results are back...", time: "10:30 AM" },
    { id: 2, sender: "Admin Support", subject: "Upcoming system maintenance", snippet: "We will be performing scheduled maintenance...", time: "Yesterday" },
    { id: 3, sender: "Dr. Sarah Lee", subject: "Follow-up question", snippet: "Just had a quick question about your medication...", time: "2 days ago" },
  ];

  return (
    <div className="messages-page-container">
      {/* ✅ Consistent Navbar */}
      <nav className="navbar">
        <div className="logo">
          <img src={logo} alt="MediBridge Logo" className="logo-img" />
          <span className="logo-text">MediBridge</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/patientdashboard" className="nav-item-new">Dashboard</Link></li>
          <li><Link to="/appointments" className="nav-item-new">Appointments</Link></li>
          <li><Link to="/messages" className="nav-item-new">Messages</Link></li>
          <li><Link to="/chatbot" className="nav-item-new">Chatbot</Link></li>
          <li><Link to="/" className="nav-item-new">Logout</Link></li>
        </ul>
      </nav>

      {/* Title and Description */}
      <div className="messages-top-info-bar">
        <h1 className="messages-page-title">Messages</h1>
        <p className="messages-description">View and manage your communications with medical staff.</p>
      </div>

      {/* Messages Card */}
      <div className="card-base messages-inbox-card">
        <h3 className="card-title">Inbox</h3>
        <ul className="messages-list">
          {messages.map((message) => (
            <li key={message.id} className="message-item">
              <div className="message-header">
                <span className="message-sender">{message.sender}</span>
                <span className="message-time">{message.time}</span>
              </div>
              <h4 className="message-subject">{message.subject}</h4>
              <p className="message-snippet">{message.snippet}</p>
            </li>
          ))}
        </ul>
        <button className="new-message-button">Compose New Message</button>
      </div>
    </div>
  );
};

export default MessagesPage;