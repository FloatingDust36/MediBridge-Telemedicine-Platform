// Frontend/src/components/ChatWindow.tsx

import { useState, useEffect, useRef } from 'react';
import { Paperclip, Send } from 'lucide-react';
import PostTriageActions from './PostTriageActions'; // Import the new component
import './../pages/ChatbotPage.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// This interface now includes the optional imageUrl for displaying images in chat
interface Message {
  type: 'bot' | 'user';
  text: string;
  imageUrl?: string;
}

// A dedicated component for the welcome screen for better organization
const WelcomeScreen = () => (
  <div className="welcome-screen">
    <img src="/images/chatbot-icon.png" alt="MedBot" className="welcome-icon" />
    <h2>MediBridge AI Assistant</h2>
    <p>Your personal health guide. Select a past conversation or click "New Chat" to begin.</p>
  </div>
);

const ChatWindow = ({ sessionId }: { sessionId: string | null }) => {
  // State management for the chat window's functionality
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTriageComplete, setIsTriageComplete] = useState(false);
  const [finalEsiLevel, setFinalEsiLevel] = useState<number | null>(null);

  // Refs for DOM elements
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // This hook loads the chat history when a session is selected
  useEffect(() => {
    const loadChat = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return; // Do nothing if no session is selected, the Welcome Screen will show
      }

      setIsLoading(true);
      setIsTriageComplete(false); // Reset state for the new session
      setFinalEsiLevel(null);
      
      try {
        const response = await fetch(`${API_URL}/session/${sessionId}`);
        if (!response.ok) throw new Error("Session not found or server error.");
        
        const data = await response.json();
        setMessages(data.messages || []); // Set the message history
        
        // If the loaded session was already completed, update the UI state
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

  // This hook auto-scrolls to the bottom on new messages
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
    if (fileToSend) formData.append('image', fileToSend);

    try {
      const response = await fetch(`${API_URL}/chat/stream-message`, { method: 'POST', body: formData });
      if (!response.ok || !response.body) throw new Error("API call failed");

      // Prepare to read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Add a new, empty bot message to the state that we will populate
      setMessages((prev) => [...prev, { type: 'bot', text: '' }]);

      // Read the stream chunk by chunk
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        // Check if the chunk is our special final JSON object
        try {
          const jsonData = JSON.parse(chunk);
          if (jsonData.type === 'triage_complete') {
            setIsTriageComplete(true);
            setFinalEsiLevel(jsonData.esi_level);
          }
        } catch (e) {
          // If it's not JSON, it's a normal text chunk.
          // Append the new text to the last message in the array.
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            lastMessage.text += chunk;
            return [...prev.slice(0, -1), lastMessage];
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
        <img src="/images/chatbot-icon.png" alt="Chatbot Icon" className="chatbot-icon" />
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
            {isSending && (
              <div className="message-bubble bot typing-indicator">
                <span></span><span></span><span></span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* This is the container for the bottom part of the chat */}
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