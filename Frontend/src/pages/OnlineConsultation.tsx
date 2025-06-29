import React, { useState } from 'react';
import './OnlineConsultation.css'; // Import the new CSS file
import './Home.css'; // Assuming Home.css contains global styles like navbar
import logo from '../assets/MediBridge_LogoClear.png'; // adjust the path as needed
import { Link } from 'react-router-dom';

const OnlineConsultation: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<
    { sender: string; text: string; isUser: boolean }[]
  >([
    {
      sender: 'Dr. JM. Nave',
      text: 'Hello Jane, I see you\'ve been experiencing frequent headaches. How often do they occur?',
      isUser: false,
    },
    {
      sender: 'Jane',
      text: 'Almost every other day for the past two weeks.',
      isUser: true,
    },
    {
      sender: 'Dr. JM. Nave',
      text: 'Do they usually come with nausea or vision problems?',
      isUser: false,
    },
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      setChatMessages([...chatMessages, { sender: 'You', text: message, isUser: true }]);
      setMessage('');
      // In a real app, you'd send this message via a websocket or API
    }
  };

  return (
    <div className="online-consultation-container">

      <div className="online-consultation-content">
        {/* Main Video Call Area */}
        <div className="video-call-area">
          <div className="video-placeholder-top">
            {/* Placeholder for local video stream */}
            <p>placeholder</p>
            <div className="video-stream-box your-video"></div>
          </div>
          <div className="video-placeholder-bottom">
            {/* Placeholder for remote video stream */}
            <div className="video-stream-box patient-video"></div>
            <p>placeholder</p>
          </div>
          {/* Controls for video call (mute, end call, etc.) could go here */}
        </div>

        {/* Right Sidebar */}
        <div className="consultation-sidebar">
          <div className="sidebar-header panel-box-header">
            <p className="details-text">Details</p>
            <p className="name-info">name doctor / name patient</p>
          </div>

          <div className="patient-info panel-box">
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> Jane Doe</p>
            <p><strong>Age:</strong> 32</p>
            <p><strong>Allergies:</strong> Penicillin</p>
          </div>

          <div className="doctor-info panel-box">
            <h3>Doctor Information</h3>
            <p><strong>Name:</strong> Dr. JM Nave</p>
            <p><strong>Age:</strong> 25</p>
            <p><strong>Specialty:</strong> BBC</p>
            <p><strong>Previous Diagnosis:</strong> Mild migraine (2023)</p>
          </div>

          <div className="chat-box panel-box">
            <div className="chat-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.isUser ? 'user-message' : 'other-message'}`}>
                  <span className="sender-name">{msg.sender}:</span> {msg.text}
                </div>
              ))}
              {/* This is a placeholder as the screenshot has "Chat box here" text */}
              {chatMessages.length === 0 && <p className="chat-placeholder">Chat box here</p>}
            </div>
            <div className="chat-input-area">
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineConsultation;