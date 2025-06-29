// Frontend/src/components/ChatWindow.tsx

import { useState, useEffect, useRef } from 'react';
import { Paperclip, Send } from 'lucide-react';
import './../pages/ChatbotPage.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

interface Message {
  type: 'bot' | 'user';
  text: string;
}

// A dedicated component for the welcome screen for better organization
const WelcomeScreen = () => (
  <div className="welcome-screen">
    <img src="/src/assets/pictures/chatbot-icon.png" alt="MedBot" className="welcome-icon" />
    <h2>MediBridge AI Assistant</h2>
    <p>Your personal health guide. Select a past conversation or click "New Chat" to begin.</p>
  </div>
);

const ChatWindow = ({ sessionId }: { sessionId: string | null }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTriageComplete, setIsTriageComplete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // This hook is now much simpler. It only runs when a valid sessionId is passed.
  useEffect(() => {
    const loadChat = async () => {
      if (!sessionId) {
        setMessages([]); // Clear messages if no session is active
        return;
      }

      setIsLoading(true);
      setIsTriageComplete(false);
      try {
        const response = await fetch(`${API_URL}/session/${sessionId}`);
        if (!response.ok) throw new Error("Session not found or server error.");
        
        const data = await response.json();
        setMessages(data.messages || []);
        if (data.final_esi_level) {
          setIsTriageComplete(true);
        }
      } catch (error) {
        console.error("Failed to fetch session data:", error);
        setMessages([{ type: 'bot', text: 'Error: Could not load this conversation.' }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async () => {
    if ((input.trim() === '' && !imageFile) || !sessionId || isSending) return;

    setIsSending(true);
    const userMessageText = input.trim();
    setMessages((prev) => [...prev, { type: 'user', text: userMessageText }]);
    setInput('');
    setImageFile(null);

    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('user_message', userMessageText);
    if (imageFile) formData.append('image', imageFile);

    try {
      const response = await fetch(`${API_URL}/chat/message`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error("API call failed");
      
      const data = await response.json();
      setMessages((prev) => [...prev, { type: 'bot', text: data.response }]);
      if (data.esi_level && !isTriageComplete) {
        setIsTriageComplete(true);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [...prev.slice(0, -1), { type: 'bot', text: "Sorry, an error occurred. Please try again." }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chatbot-card">
      <div className="chatbot-header">
        <img src="/src/assets/pictures/chatbot-icon.png" alt="Chatbot Icon" className="chatbot-icon" />
        <h3 className="chatbot-title">AI Health Assistant</h3>
        {isTriageComplete && sessionId && (
          <a href={`${API_URL}/session/${sessionId}/summary/pdf`} target="_blank" rel="noopener noreferrer" className="download-pdf-button">
            Download Summary
          </a>
        )}
      </div>

      <div className={`chatbot-messages ${isLoading ? 'loading' : ''}`}>
        {!sessionId ? (
          <WelcomeScreen />
        ) : isLoading ? (
          <div className="loading-chat">Loading conversation...</div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div key={index} className={`message-bubble ${msg.type}`}>
                {msg.text}
              </div>
            ))}
            {isSending && (
              <div className="message-bubble bot typing-indicator">
                <span></span><span></span><span></span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input-area">
        {imageFile && (
          <div className="image-preview-container">
            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="image-preview-thumbnail" />
            <button onClick={() => setImageFile(null)} className="image-preview-remove">×</button>
          </div>
        )}
        <div className="input-row">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} accept="image/png, image/jpeg" />
          <button className="chatbot-attach-button" onClick={() => fileInputRef.current?.click()} disabled={!sessionId || isSending}>
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            className="chatbot-input"
            placeholder={!sessionId ? "Click 'New Chat' to begin" : "Describe your symptoms..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter' && !isSending) handleSendMessage(); }}
            disabled={!sessionId || isLoading || isSending}
          />
          <button className="chatbot-send-button" onClick={handleSendMessage} disabled={!sessionId || isLoading || isSending}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;