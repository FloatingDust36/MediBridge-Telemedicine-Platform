// src/pages/ChatbotPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ChatbotPage.css';
import logo from '../assets/MediBridge_LogoClear.png';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! What symptoms are you experiencing?' },
  ]);
  const [input, setInput] = useState('');

  const handleSendMessage = () => {
    if (input.trim() !== '') {
      setMessages((prevMessages) => [...prevMessages, { type: 'user', text: input.trim() }]);
      setInput('');

      setTimeout(() => {
        if (input.toLowerCase().includes('fever') || input.toLowerCase().includes('cough')) {
          setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: 'Got it. Are you experiencing any of these?' }]);
        } else {
          setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: "Thank you for sharing. Please describe your symptoms in more detail." }]);
        }
      }, 500);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessages((prevMessages) => [...prevMessages, { type: 'user', text: suggestion }]);
    setTimeout(() => {
      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: `You mentioned "${suggestion}". Please tell me more about it.` }]);
    }, 500);
  };

  return (
    <div className="chatbot-page-container">
      {/* ✅ Consistent Navbar */}
      <nav className="navbar">
        <div className="logo">
          <img src={logo} alt="MediBridge Logo" className="logo-img" />
          <span className="logo-text">MediBridge</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/dashboard" className="nav-item-new">Dashboard</Link></li>
          <li><Link to="/appointments" className="nav-item-new">Appointments</Link></li>
          <li><Link to="/messages" className="nav-item-new">Messages</Link></li>
          <li><Link to="/chatbot" className="nav-item-new">Chatbot</Link></li>
          <li><Link to="/" className="nav-item-new">Logout</Link></li>
        </ul>
      </nav>

      {/* 🧠 Chatbot UI */}
      <div className="chatbot-card card-base">
        <div className="chatbot-header">
          <img src="/images/chatbot-icon.png" alt="Chatbot Icon" className="chatbot-icon" />
          <h3 className="chatbot-title">Symptom Checker</h3>
          <p className="chatbot-tagline">I'm MedBot. I'll help assess your symptoms.</p>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message-bubble ${msg.type}`}>
              {msg.text}
            </div>
          ))}
          {messages.some(msg => msg.text === 'Got it. Are you experiencing any of these?') && (
            <div className="symptom-suggestions">
              <button className="suggestion-button" onClick={() => handleSuggestionClick('Headache')}>Headache</button>
              <button className="suggestion-button" onClick={() => handleSuggestionClick('Sore Throat')}>Sore Throat</button>
              <button className="suggestion-button" onClick={() => handleSuggestionClick('Fatigue')}>Fatigue</button>
            </div>
          )}
        </div>

        <div className="chatbot-input-area">
          <input
            type="text"
            className="chatbot-input"
            placeholder="Type your symptoms..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <button className="chatbot-send-button" onClick={handleSendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;