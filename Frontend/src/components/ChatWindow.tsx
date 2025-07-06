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
  key?: string;
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
    <div className="message-row bot-row">
        <img src="/images/chatbot-icon.png" alt="bot avatar" className="chat-avatar" />
        <div className="message-bubble bot typing-indicator">
            <span></span><span></span><span></span>
        </div>
    </div>
);


const ChatWindow = ({ sessionId, onTriageComplete, onMessageSent }: { sessionId: string | null; onTriageComplete: (sessionId: string) => void; onMessageSent: (sessionId: string) => void; }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTriageComplete, setIsTriageComplete] = useState(false);
  const [finalEsiLevel, setFinalEsiLevel] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const loadChat = async () => {
      if (!sessionId) {
        setMessages([]);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

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
    
    onMessageSent(sessionId);

    const botMessageKey = `bot-${Date.now()}`;
    setMessages((prev) => [...prev, { type: 'bot', text: '', key: botMessageKey }]);

    try {
      const response = await fetch(`${API_URL}/chat/stream-message`, { method: 'POST', body: formData });
      if (!response.ok || !response.body) throw new Error("API call failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let finalDataPacket = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        let chunk = decoder.decode(value);
        const jsonMarker = '{"type":"triage_complete"';
        if (chunk.includes(jsonMarker)) {
            const parts = chunk.split(jsonMarker);
            chunk = parts[0];
            finalDataPacket = jsonMarker + parts[1];
        }
        if (chunk) {
            setMessages((prev) => prev.map((msg) => 
                msg.key === botMessageKey ? { ...msg, text: msg.text + chunk } : msg
            ));
        }
      }

      if (finalDataPacket) {
        try {
            const jsonData = JSON.parse(finalDataPacket);
            if (jsonData.type === 'triage_complete') {
                setIsTriageComplete(true);
                setFinalEsiLevel(jsonData.esi_level);
                if (sessionId) onTriageComplete(sessionId);
            }
        } catch (e) { console.error("Failed to parse final data packet:", e); }
      }
    } catch (error) {
      console.error("Failed to stream message:", error);
      setMessages((prev) => [...prev.filter(m => m.key !== botMessageKey), { type: 'bot', text: "Sorry, an error occurred. Please try again." }]);
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
        {!sessionId ? <WelcomeScreen /> : isLoading ? <div className="loading-chat">Loading conversation...</div> :
          <>
            {messages.map((msg, index) => (
              <div key={msg.key || index} className={`message-row ${msg.type}-row`}>
                <img 
                  src={msg.type === 'bot' ? "/images/chatbot-icon.png" : "/images/default-patient-avatar.png"} 
                  alt={`${msg.type} avatar`} 
                  className="chat-avatar"
                />
                <div className={`message-bubble ${msg.type}`}>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="User upload" className="message-image" />
                  )}
                  {msg.text && <div className="message-text">{msg.text}</div>}
                </div>
              </div>
            ))}
            {isSending && <TypingIndicator />}
          </>
        }
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chatbot-input-area-wrapper">
        {isTriageComplete && finalEsiLevel && <PostTriageActions esiLevel={finalEsiLevel} />}
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
              type="text" className="chatbot-input"
              placeholder={!sessionId ? "Click 'New Chat' to begin" : "Describe your symptoms..."}
              value={input} onChange={(e) => setInput(e.target.value)}
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