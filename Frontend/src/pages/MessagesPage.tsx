import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import './MessagesPage.css';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_content: string;
  image_url?: string;
  timestamp: string;
}

const MessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [receiverEmail, setReceiverEmail] = useState('');
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      const currentUserId = session?.user?.id;
      if (!currentUserId || sessionError) {
        console.error('User not logged in');
        return;
      }

      setUserId(currentUserId);

      const { data, error } = await supabase
        .from('session_messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error.message);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();
  }, []);

  const handleSendMessage = async () => {
  if (!receiverEmail || !messageContent || !userId) {
    alert('Please fill in all fields');
    return;
  }

  // Look up receiver's user_id from email
  const { data: receiverUsers, error: userLookupError } = await supabase
  .from('users')
  .select('user_id')
  .eq('email', receiverEmail.toLowerCase())

if (userLookupError) {
  console.error('User lookup error:', userLookupError.message);
  alert('Failed to look up user.');
  return;
}

if (!receiverUsers || receiverUsers.length === 0) {
  alert('Receiver email not found.');
  return;
}

const receiverId = receiverUsers[0].user_id;


  // Insert message
  const { error: insertError } = await supabase.from('session_messages').insert([
    {
      sender_id: userId,
      receiver_id: receiverId,
      message_content: messageContent,
    },
  ]);

  if (insertError) {
    console.error('Error sending message:', insertError.message);
    alert('Failed to send message');
  } else {
    setMessageContent('');
    setReceiverEmail('');
    setShowCompose(false);

    // Refresh messages
    const { data: refreshedMessages, error } = await supabase
      .from('session_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('timestamp', { ascending: false });

    if (!error) setMessages(refreshedMessages || []);
  }
};


  return (
    <div className="main-content-area messages-page-wrapper">
      <div className="messages-top-info-bar">
        <h1 className="messages-page-title">Messages</h1>
        <p className="messages-description">
          View and manage your communications with medical staff.
        </p>
      </div>

      <div className="card-base messages-inbox-card">
        <h3 className="card-title">Inbox</h3>
        {messages.length === 0 ? (
          <p>No messages found.</p>
        ) : (
          <ul className="messages-list">
            {messages.map((msg) => (
              <li key={msg.id} className="message-item">
                <div className="message-header">
                  <span className="message-sender">
                    {msg.sender_id === userId ? 'You' : msg.sender_id}
                  </span>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                </div>
                <h4 className="message-subject">
                  {msg.message_content.slice(0, 30)}...
                </h4>
                <p className="message-snippet">{msg.message_content}</p>
              </li>
            ))}
          </ul>
        )}

        <button className="new-message-button" onClick={() => setShowCompose(!showCompose)}>
          {showCompose ? 'Cancel' : 'Compose New Message'}
        </button>

        {showCompose && (
          <div className="compose-form">
            <input
              type="email"
              placeholder="Receiver Email"
              className="input-field"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
            />
            <textarea
              placeholder="Your message..."
              className="input-field"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
            />
            <button className="send-button" onClick={handleSendMessage}>Send</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
