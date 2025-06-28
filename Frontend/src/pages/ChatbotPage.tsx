// Frontend/src/pages/ChatbotPage.tsx

import { useState, useEffect, useRef } from 'react';
import './ChatbotPage.css';
import { Paperclip, Send } from 'lucide-react'; // Assuming you might use an icon library

// Define the structure of a message object for TypeScript
interface Message {
  type: 'bot' | 'user';
  text: string;
}

// Get the backend API address from environment variables
// IMPORTANT: Ensure you have a .env file in your Frontend folder with:
// VITE_API_BASE_URL=http://127.0.0.1:8000
const API_URL = import.meta.env.VITE_API_BASE_URL;

const ChatbotPage = () => {
  // --- STATE MANAGEMENT ---
  // We add new state variables to manage the session and file uploads
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true); // To show a loading state initially
  
  // For testing, we'll use a fixed user_id. In a real app, this would come from a login system.
  const userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  
  // Create a reference to the hidden file input element
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Create a reference to the messages container for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- API CALLS ---

  // This `useEffect` hook runs ONCE when the page loads.
  // Its job is to start a new chat session with the backend.
  // Replace the old useEffect with this new one in ChatbotPage.tsx

useEffect(() => {
  const initializeChat = async () => {
    setIsLoading(true);
    let currentSessionId = localStorage.getItem('chatSessionId');

    if (currentSessionId) {
      // A session ID exists, let's fetch its history
      try {
        const response = await fetch(`${API_URL}/session/${currentSessionId}/messages`);
        if (response.ok) {
          const historyMessages = await response.json();
          setMessages(historyMessages);
          setSessionId(currentSessionId);
        } else {
          // The session ID might be old or invalid, so start a new one
          currentSessionId = null; 
        }
      } catch (error) {
        console.error("Failed to fetch session history:", error);
        currentSessionId = null; // Couldn't connect, start a new session
      }
    }

    // If there's no session ID (or the old one was invalid), create a new session
    if (!currentSessionId) {
      try {
        const response = await fetch(`${API_URL}/chat/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });
        const data = await response.json();
        if (data.session_id) {
          localStorage.setItem('chatSessionId', data.session_id);
          setSessionId(data.session_id);
          setMessages([{ type: 'bot', text: 'Hello! I am MedBot. How can I help you assess your symptoms today?' }]);
        }
      } catch (error) {
        console.error("Failed to start a new session:", error);
        setMessages([{ type: 'bot', text: 'Sorry, I am unable to connect to the server right now. Please try again later.' }]);
      }
    }
    setIsLoading(false);
  };

  initializeChat();
}, []); // This still runs only once on initial load

  // This function is now completely rewritten to call our backend.
  const handleSendMessage = async () => {
    if (input.trim() === '' && !imageFile) return; // Don't send empty messages

    const userMessageText = input.trim();
    
    // Optimistically add the user's message to the UI
    setMessages((prevMessages) => [...prevMessages, { type: 'user', text: userMessageText }]);
    setInput('');
    setImageFile(null); // Clear the selected file

    if (!sessionId) {
      console.error("No session ID available to send message.");
      return;
    }

    // Use FormData because we are sending a file
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('user_message', userMessageText);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      // Make the actual API call to the backend
      const response = await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        body: formData, // FormData sets the correct headers automatically
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add the REAL bot response to the UI
      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: data.response }]);

    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: "I'm sorry, an error occurred. Please try again." }]);
    }
  };
  
  // This useEffect hook will automatically scroll to the bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- JSX (UI RENDERING) ---
  return (
    <div className="main-content-area chatbot-page-wrapper">
      <div className="chatbot-card card-base">
        <div className="chatbot-header">
          <img src="/images/chatbot-icon.png" alt="Chatbot Icon" className="chatbot-icon" />
          <h3 className="chatbot-title">Symptom Checker</h3>
          <p className="chatbot-tagline">I'm MedBot. I'll help assess your symptoms.</p>
        </div>

        <div className="chatbot-messages">
          {isLoading && <div>Connecting to assistant...</div>}
          {messages.map((msg, index) => (
            <div key={index} className={`message-bubble ${msg.type}`}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* This empty div is the target for our auto-scroll */}
        </div>

        <div className="chatbot-input-area">
          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
            accept="image/png, image/jpeg"
          />
          {/* Attachment button */}
          <button className="chatbot-attach-button" onClick={() => fileInputRef.current?.click()}>
             <Paperclip size={20} />
          </button>

          <input
            type="text"
            className="chatbot-input"
            placeholder={imageFile ? `Image selected: ${imageFile.name}` : "Type your symptoms..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            disabled={!sessionId} // Disable input until session is ready
          />
          <button className="chatbot-send-button" onClick={handleSendMessage} disabled={!sessionId}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;