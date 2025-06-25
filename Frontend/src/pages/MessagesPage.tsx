import React from 'react';
// Remove Link import if no internal links within the content are using it.
// Based on current code, Link is only used in the removed Navbar, so it can be removed.
// import { Link } from 'react-router-dom';
import './MessagesPage.css';
// Remove logo import as Navbar is no longer directly in this component
// import logo from '../assets/MediBridge_LogoClear.png';

const MessagesPage: React.FC = () => {
  const messages = [
    { id: 1, sender: "Dr. Alex Smith", subject: "Regarding your lab results", snippet: "Your recent lab results are back...", time: "10:30 AM" },
    { id: 2, sender: "Admin Support", subject: "Upcoming system maintenance", snippet: "We will be performing scheduled maintenance...", time: "Yesterday" },
    { id: 3, sender: "Dr. Sarah Lee", subject: "Follow-up question", snippet: "Just had a quick question about your medication...", time: "2 days ago" },
  ];

  return (
    // This div now represents the main content area of the Messages page.
    // It will be rendered inside the <main> tag of your Layout component,
    // which already applies padding-top to clear the fixed Navbar.
    <div className="main-content-area messages-page-wrapper"> {/* Renamed for consistency */}
      {/*
        The Navbar and Footer are now rendered by the Layout component in App.tsx.
        Do NOT render them here.
        Removed: <nav className="navbar">...</nav>
      */}

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