// Frontend/src/components/ChatWindow.tsx

import { useState, useEffect, useRef } from 'react';
import { Paperclip, Send } from 'lucide-react';
import './../pages/ChatbotPage.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

interface Message {
  type: 'bot' | 'user';
  text: string;
}

// This component receives the active session ID as a "prop" from its parent
const ChatWindow = ({ sessionId }: { sessionId: string | null }) => {
  // State for messages, input field, selected image, and loading indicators
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false); // For disabling form while AI responds
  const [isTriageComplete, setIsTriageComplete] = useState(false);

  // Refs for accessing DOM elements
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // This hook fetches the message history whenever the active sessionId changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) {
        setMessages([{ type: 'bot', text: 'Click "New Chat" on the left to begin a conversation.' }]);
        setIsTriageComplete(false); // Reset completion state for new chats
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      try {
        // First, get the core session details
        const detailsResponse = await fetch(`${API_URL}/session/${sessionId}`);
        const detailsData = await detailsResponse.json();
      
        // Set the triage complete status based on existing data
        if (detailsData && detailsData.final_esi_level) {
          setIsTriageComplete(true);
        } else {
          setIsTriageComplete(false);
        }

        // Then, fetch the messages for that session
        const messagesResponse = await fetch(`${API_URL}/session/${sessionId}/messages`);
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.length > 0 ? messagesData : [{ type: 'bot', text: 'Hello again! How can I help you today?' }]);

      } catch (error) {
        console.error("Failed to fetch session data:", error);
        setMessages([{ type: 'bot', text: 'Error connecting to the server.' }]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [sessionId]);

  // This hook auto-scrolls to the bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Main function to handle sending a message (text and/or image)
  const handleSendMessage = async () => {
    if ((input.trim() === '' && !imageFile) || !sessionId || isSending) return;

    setIsSending(true); // Disable form
    const userMessageText = input.trim();
    
    // Optimistically add the user's message to the UI right away
    setMessages((prev) => [...prev, { type: 'user', text: userMessageText }]);
    setInput('');
    setImageFile(null);

    // Use FormData to package the message and optional image file
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('user_message', userMessageText);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await fetch(`${API_URL}/chat/message`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error("API call failed");
      const data = await response.json();
      // ADD THIS: Check if an ESI level was just returned
      if (data.esi_level && !isTriageComplete) {
        setIsTriageComplete(true);
      }
      // Add the AI's real response
      setMessages((prev) => [...prev, { type: 'bot', text: data.response }]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [...prev, { type: 'bot', text: "Sorry, an error occurred. Please try again." }]);
    } finally {
      setIsSending(false); // Re-enable form
    }
  };

  return (
    <div className="chatbot-card">
      <div className="chatbot-header">
        <img src="/images/chatbot-icon.png" alt="Chatbot Icon" className="chatbot-icon" />
        <h3 className="chatbot-title">Villamor AI Health Assistant</h3>
        
        {isTriageComplete && (
          <a 
            href={`${API_URL}/session/${sessionId}/summary/pdf`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="download-pdf-button"
          >
            Download Summary
          </a>
        )}
      </div>

      <div className="chatbot-messages">
        {isLoadingHistory ? (
          <div className="loading-chat">Connecting to assistant...</div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message-bubble ${msg.type}`}>
              {msg.text}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {isTriageComplete && !isLoadingHistory && (
          <div className="triage-complete-indicator">
            Initial assessment is complete. A summary is now available.
          </div>
      )}

      <div className="chatbot-input-area">
        {/* Image Preview Area */}
        {imageFile && (
          <div className="image-preview-container">
            <img src={URL.createObjectURL(imageFile)} alt="Image preview" className="image-preview-thumbnail" />
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
            placeholder="Chat with Villamor..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter' && !isSending) handleSendMessage(); }}
            disabled={!sessionId || isLoadingHistory || isSending}
          />
          <button className="chatbot-send-button" onClick={handleSendMessage} disabled={!sessionId || isLoadingHistory || isSending}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;