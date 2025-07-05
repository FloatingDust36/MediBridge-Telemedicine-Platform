// Frontend/src/components/ChatWindow.tsx

import { useState, useEffect, useRef } from 'react';
import { Paperclip, Send } from 'lucide-react';
import PostTriageActions from './PostTriageActions';
import './../pages/ChatbotPage.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// This interface now includes the optional imageUrl for displaying images in chat
interface Message {
  type: 'bot' | 'user';
  text: string;
  imageUrl?: string;
}

// A dedicated component for the Welcome Screen for better organization
const WelcomeScreen = () => (
  <div className="welcome-screen">
    <img src="/src/assets/pictures/chatbot-villamor.jpg" alt="MedBot" className="welcome-icon" />
    <h2>MediBridge AI Assistant</h2>
    <p>Your personal health guide. Select a past conversation or click "New Chat" to begin.</p>
  </div>
);

// A dedicated component for the typing indicator
const TypingIndicator = () => (
    <div className="message-bubble bot typing-indicator">
        <span></span><span></span><span></span>
    </div>
);

const ChatWindow = ({ sessionId, onTriageComplete }: { sessionId: string | null; onTriageComplete: (sessionId: string) => void; }) => {
  // State management for the chat window's functionality
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTriageComplete, setIsTriageComplete] = useState(false);
  const [finalEsiLevel, setFinalEsiLevel] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // This hook now makes a single, efficient call to load the entire chat state
  useEffect(() => {
    const loadChat = async () => {
      if (!sessionId) {
        setMessages([]); // Clear messages when no session is active
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsTriageComplete(false);
      setFinalEsiLevel(null);
      
      try {
        const response = await fetch(`${API_URL}/session/${sessionId}`);
        if (!response.ok) throw new Error("Session not found or server error.");
        
        const data = await response.json();
        setMessages(data.messages || []);
        
        if (data.final_esi_level) {
          setIsTriageComplete(true);
          setFinalEsiLevel(data.final_esi_level);
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

  // This hook auto-scrolls to the bottom when new messages are added or the bot is typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Main function for sending a message
  const handleSendMessage = async () => {
    if ((input.trim() === '' && !imageFile) || !sessionId || isSending) return;

    setIsSending(true);
    const userMessageText = input.trim();
    const tempImageUrl = imageFile ? URL.createObjectURL(imageFile) : undefined;
    
    setMessages((prev) => [...prev, { type: 'user', text: userMessageText, imageUrl: tempImageUrl }]);
    
    const fileToSend = imageFile;
    setInput('');
    setImageFile(null);

    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('user_message', userMessageText);
    if (fileToSend) {
      formData.append('image', fileToSend);
    }

    try {
      const response = await fetch(`${API_URL}/chat/stream-message`, { method: 'POST', body: formData });
      if (!response.ok || !response.body) throw new Error("API call failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Add a new, empty bot message to the state that we will populate
      setMessages((prev) => [...prev, { type: 'bot', text: '' }]);

      // Read the stream chunk by chunk
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        let chunk = decoder.decode(value);
        
        // --- NEW, ROBUST PARSING LOGIC ---
        const jsonMarker = '{"type":"triage_complete"';
        
        if (chunk.includes(jsonMarker)) {
            const parts = chunk.split(jsonMarker);
            const textPart = parts[0];
            const jsonPart = jsonMarker + parts[1];

            // 1. Append the last piece of text before the JSON packet
            if (textPart) {
                setMessages((prev) => {
                    const lastMessage = prev[prev.length - 1];
                    const updatedMessage = { ...lastMessage, text: lastMessage.text + textPart };
                    return [...prev.slice(0, -1), updatedMessage];
                });
            }

            // 2. Process the JSON data
            try {
                const jsonData = JSON.parse(jsonPart);
                if (jsonData.type === 'triage_complete') {
                    setIsTriageComplete(true);
                    setFinalEsiLevel(jsonData.esi_level);
                    if (sessionId) onTriageComplete(sessionId);
                }
            } catch (e) {
                console.error("Failed to parse final data packet:", e);
            }
        } else {
            // This is just a normal text chunk, append it
            setMessages((prev) => {
                const lastMessage = prev[prev.length - 1];
                const updatedMessage = { ...lastMessage, text: lastMessage.text + chunk };
                return [...prev.slice(0, -1), updatedMessage];
            });
        }
      }
    } catch (error) {
      console.error("Failed to stream message:", error);
      setMessages((prev) => [...prev, { type: 'bot', text: "Sorry, an error occurred." }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chatbot-card">
      <div className="chatbot-header">
        <img src="/src/assets/pictures/chatbot-villamor.jpg" alt="Chatbot Icon" className="chatbot-icon" />
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
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="User upload" className="message-image" />
                )}
                {msg.text && <div className="message-text">{msg.text}</div>}
              </div>
            ))}
            {isSending && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chatbot-input-area-wrapper">
        {isTriageComplete && finalEsiLevel && (
            <PostTriageActions esiLevel={finalEsiLevel} />
        )}
        <div className="chatbot-input-area">
          {imageFile && (
            <div className="image-preview-container">
              <img src={URL.createObjectURL(imageFile)} alt="Preview" className="image-preview-thumbnail" />
              <button onClick={() => setImageFile(null)} className="image-preview-remove">×</button>
            </div>
          )}
          <div className="input-row">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} accept="image/png, image/jpeg, image/webp" />
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
    </div>
  );
};

export default ChatWindow;