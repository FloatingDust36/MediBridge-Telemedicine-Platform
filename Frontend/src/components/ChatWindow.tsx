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

  // Refs for accessing DOM elements
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // This hook fetches the message history whenever the active sessionId changes
  useEffect(() => {
    const fetchHistory = async () => {
      // If there's no active session, show a welcome message.
      if (!sessionId) {
        setMessages([{ type: 'bot', text: 'Click "New Chat" on the left to begin a conversation.' }]);
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      try {
        const response = await fetch(`${API_URL}/session/${sessionId}/messages`);
        if (response.ok) {
          const historyMessages = await response.json();
          setMessages(historyMessages);
        } else {
          setMessages([{ type: 'bot', text: 'Could not load chat history for this session.' }]);
        }
      } catch (error) {
        console.error("Failed to fetch session history:", error);
        setMessages([{ type: 'bot', text: 'Error connecting to the server.' }]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [sessionId]); // This logic re-runs every time the user clicks a different session

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
        <p className="chatbot-tagline">Powered by Gemini</p>
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