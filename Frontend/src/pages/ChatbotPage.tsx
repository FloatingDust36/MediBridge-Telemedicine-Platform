import { useState } from 'react';
// Remove Link import if no internal links within the content are using it.
// In this case, Link was only used in the removed Navbar, so it can be removed.
// import { Link } from 'react-router-dom';
import './ChatbotPage.css';
// Remove logo import as Navbar is no longer directly in this component
// import logo from '../assets/MediBridge_LogoClear.png';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! What symptoms are you experiencing?' },
  ]);
  const [input, setInput] = useState('');

  const handleSendMessage = () => {
    if (input.trim() !== '') {
      setMessages((prevMessages) => [...prevMessages, { type: 'user', text: input.trim() }]);
      setInput('');

      // Simulate bot response
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
    // This div now represents the main content area of the Chatbot page.
    // It will be rendered inside the <main> tag of your Layout component,
    // which already applies padding-top to clear the fixed Navbar.
    <div className="main-content-area chatbot-page-wrapper"> {/* Renamed for consistency */}
      {/*
        The Navbar and Footer are now rendered by the Layout component in App.tsx.
        Do NOT render them here.
        Removed: <nav className="navbar">...</nav>
      */}

      {/* 🧠 Chatbot UI */}
      <div className="chatbot-card card-base">
        <div className="chatbot-header">
          <img src="/images/chatbot-icon.png" alt="Chatbot Icon" className="chatbot-icon" /> {/* Ensure this path is correct */}
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