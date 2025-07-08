import { useState, useEffect, useRef } from 'react';
import { Paperclip, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import PostTriageActions from './PostTriageActions';
import { useChatStore } from '../store/chatStore';
import type { Message } from '../pages/ChatbotPage';
import './../pages/ChatbotPage.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;
const INACTIVITY_TIMEOUT = 120000; // 2 minutes

const WelcomeScreen = () => (
  <div className="welcome-screen">
    <img src="/src/assets/pictures/chatbot-villamor.jpg" alt="MedBot" className="welcome-icon" />
    <h2>MediBridge AI Assistant</h2>
    <p>Your personal health guide. Select a past conversation or click "New Chat" to begin.</p>
  </div>
);

const ChatWindow = ({ 
  onTriageComplete, 
  onMessageSent 
}: { 
  onTriageComplete: (sessionId: string) => void; 
  onMessageSent: () => void; 
}) => {
  const { 
    activeSessionId, 
    messageCache, 
    setMessagesForSession, 
    addMessage, 
    updateMessage 
  } = useChatStore();

  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [finalEsiLevel, setFinalEsiLevel] = useState<number | null>(null);

  const inactivityTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = messageCache[activeSessionId || ''] || [];
  
  useEffect(() => {
    const loadChat = async () => {
      if (!activeSessionId) {
        setFinalEsiLevel(null);
        return;
      }
      
      if (messageCache[activeSessionId]) {
        const response = await fetch(`${API_URL}/session/${activeSessionId}`);
        const data = await response.json();
        setFinalEsiLevel(data?.final_esi_level || null);
        return; 
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/session/${activeSessionId}`);
        const data = await response.json();
        const loadedMessages = data.messages || [];
        setMessagesForSession(activeSessionId, loadedMessages);
        setFinalEsiLevel(data.final_esi_level || null);
      } catch (error) {
        console.error("Failed to fetch session data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadChat();
  }, [activeSessionId, setMessagesForSession, messageCache]);

  useEffect(() => {
    const clearTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };

    if (messages.length > 0 && messages[messages.length - 1].type === 'bot' && !isSending) {
      clearTimer();
      inactivityTimerRef.current = window.setTimeout(() => {
        sendInactivityMessage();
      }, INACTIVITY_TIMEOUT);
    }
    
    return () => clearTimer();
  }, [messages, isSending]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText: string, attachedFile: File | null) => {
    if (!activeSessionId || isSending) return;

    setIsSending(true);

    if (messageText || attachedFile) {
      const userMessage: Message = { type: 'user', text: messageText, imageUrl: attachedFile ? URL.createObjectURL(attachedFile) : undefined, key: `user-${Date.now()}` };
      addMessage(activeSessionId, userMessage);
    }

    const botPlaceholder: Message = { type: 'bot', text: '', key: `bot-${Date.now()}` };
    addMessage(activeSessionId, botPlaceholder);
    
    const formData = new FormData();
    formData.append('session_id', activeSessionId);
    formData.append('user_message', messageText);
    if (attachedFile) formData.append('image', attachedFile);

    try {
      const response = await fetch(`${API_URL}/chat/message`, { method: 'POST', body: formData });
      const data = await response.json();
      
      updateMessage(activeSessionId, botPlaceholder.key!, data.response_text);

      if (data.is_complete) {
        setFinalEsiLevel(data.esi_level);
        onTriageComplete(activeSessionId);
      } else {
        setFinalEsiLevel(null);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      updateMessage(activeSessionId, botPlaceholder.key!, "Sorry, an error occurred.");
    } finally {
      setIsSending(false);
      onMessageSent();
    }
  };

  const handleUserSendMessage = () => {
    if (!input.trim() && !imageFile) return;
    sendMessage(input.trim(), imageFile);
    setInput('');
    setImageFile(null);
  };
  
  const sendInactivityMessage = () => {
    sendMessage("The user has not responded for a while. Send a message to check if they are okay and still there.", null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    setInput(e.target.value);
  };

  const handleSelfCareRequest = () => {
    sendMessage("Based on our conversation, please provide me with some general self-care advice.", null);
  };

  return (
    <div className="chatbot-card">
      <div className="chatbot-header">
        <img src="/src/assets/pictures/chatbot-villamor.jpg" alt="Chatbot Icon" className="chatbot-icon" />
        <h3 className="chatbot-title">AI Health Assistant</h3>
        {finalEsiLevel && activeSessionId && (
          <a href={`${API_URL}/session/${activeSessionId}/summary/pdf`} target="_blank" rel="noopener noreferrer" className="download-pdf-button">
            Download Summary
          </a>
        )}
      </div>

      <div className={`chatbot-messages ${isLoading ? 'loading' : ''}`}>
        {!activeSessionId ? <WelcomeScreen /> :
          messages.map((msg, index) => (
            <div key={msg.key || index} className={`message-row ${msg.type}-row`}>
              {msg.type === 'user' ? (
                <>
                  <div className="message-bubble user">
                    {msg.imageUrl && <img src={msg.imageUrl} alt="User upload" className="message-image" />}
                    {msg.text && <div className="message-text"><ReactMarkdown>{msg.text}</ReactMarkdown></div>}
                  </div>
                  <img 
                    src={"/images/default-patient-avatar.png"} 
                    alt="user avatar" 
                    className="chat-avatar"
                  />
                </>
              ) : (
                <>
                  <img 
                    src={"/images/chatbot-icon.png"} 
                    alt="bot avatar" 
                    className="chat-avatar"
                  />
                  <div className={`message-bubble bot ${!msg.text ? 'typing-indicator' : ''}`}>
                    {msg.imageUrl && <img src={msg.imageUrl} alt="User upload" className="message-image" />}
                    {msg.text ? <div className="message-text"><ReactMarkdown>{msg.text}</ReactMarkdown></div> : <><span></span><span></span><span></span></>}
                  </div>
                </>
              )}
            </div>
          ))
        }
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chatbot-input-area-wrapper">
        {finalEsiLevel && <PostTriageActions esiLevel={finalEsiLevel} onSelfCareRequest={handleSelfCareRequest} />}
        
        <div className="chatbot-input-area">
          {imageFile && (
            <div className="image-preview-container">
              <img src={URL.createObjectURL(imageFile)} alt="Preview" className="image-preview-thumbnail" />
              <button onClick={() => setImageFile(null)} className="image-preview-remove">×</button>
            </div>
          )}
          <div className="input-row">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} accept="image/png, image/jpeg, image/webp" />
            <button className="chatbot-attach-button" onClick={() => fileInputRef.current?.click()} disabled={!activeSessionId || isSending}>
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              className="chatbot-input"
              placeholder={!activeSessionId ? "Click 'New Chat' to begin" : "Describe your symptoms..."}
              value={input}
              onChange={handleInputChange}
              onKeyPress={(e) => { if (e.key === 'Enter') handleUserSendMessage(); }}
              disabled={!activeSessionId || isLoading || isSending}
            />
            <button className="chatbot-send-button" onClick={handleUserSendMessage} disabled={!activeSessionId || isLoading || isSending || (!input.trim() && !imageFile)}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;