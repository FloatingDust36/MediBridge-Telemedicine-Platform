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
  sender?: {
    full_name: string;
    role?: string;
    email?: string; 
  } | null;
  receiver?: {
    full_name: string;
    role?: string;
    email?: string; 
  } | null;
}


const MessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [receiverEmail, setReceiverEmail] = useState('');
  const [messageContent, setMessageContent] = useState('');

  const loadMessages = async (userId: string) => {
  const { data, error } = await supabase
    .from('session_messages')
    .select(`
    *,
     sender:users!session_messages_sender_id_fkey(full_name, role, email),
     receiver:users!session_messages_receiver_id_fkey(full_name, role, email)
    `)

    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('timestamp', { ascending: false });

  if (!error) setMessages(data || []);
  else console.error('Error loading messages:', error.message);
  console.log('Messages loaded:', data);
};



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
      await loadMessages(currentUserId);
      console.log("Loading messages for:", currentUserId);
      
    };

    fetchMessages();
  }, []);

  const toggleMessageSelection = (id: string) => {
    setSelectedMessages((prev) =>
      prev.includes(id) ? prev.filter((msgId) => msgId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
  if (!userId) return;

  const channel = supabase
    .channel('realtime-messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'session_messages' },
      async (payload) => {
        const newMsg = payload.new;
        if (
          newMsg.sender_id === userId ||
          newMsg.receiver_id === userId
        ) {
          await loadMessages(userId);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);


  const handleDeleteMessage = async (id: string) => {
    const { error } = await supabase.from('session_messages').delete().eq('id', id);

    if (error) {
      console.error('Delete error:', error.message);
      alert('Failed to delete message.');
    } else {
      if (!userId) return;
await loadMessages(userId);
      setSelectedMessages((prev) => prev.filter((mid) => mid !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMessages.length === 0) return;

    const { error } = await supabase
      .from('session_messages')
      .delete()
      .in('id', selectedMessages);

    if (error) {
      console.error('Bulk delete error:', error.message);
      alert('Failed to delete selected messages.');
    } else {
      if (!userId) return;
await loadMessages(userId);
      setSelectedMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!receiverEmail || !messageContent || !userId) {
      alert('Please fill in all fields');
      return;
    }

    const { data: receiverUsers, error: userLookupError } = await supabase
    .from('users')
    .select('user_id')
    .eq('email', receiverEmail.trim().toLowerCase());

    console.log("Receiver resolved to ID:", receiverUsers?.[0]?.user_id);


    if (userLookupError) {
      console.error('User lookup error:', userLookupError.message);
      alert('Failed to look up user.');
      return;
    }

    if (!receiverUsers || receiverUsers.length === 0 || !receiverUsers[0].user_id) {
      alert('Receiver email not found.');
      return;
    }

    const receiverId = receiverUsers[0].user_id;

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

      const { data: refreshedMessages, error } = await supabase
      .from('session_messages')
      .select(`
        *,
        sender:users!session_messages_sender_id_fkey(full_name, role, email),
        receiver:users!session_messages_receiver_id_fkey(full_name, role, email)
      `)
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
          <p style={{ color: 'black' }}>No messages found.</p>
        ) : (
          <>
            <input
              type="checkbox"
              checked={selectedMessages.length === messages.length && messages.length > 0}
              onChange={() => {
                if (selectedMessages.length === messages.length) {
                  setSelectedMessages([]);
                } else {
                  setSelectedMessages(messages.map((msg) => msg.id));
                }
              }}
              style={{ marginBottom: '10px' }}
            />
            <label style={{ marginLeft: '8px' }}>Select All</label>
            <ul className="messages-list">
              {messages.map((msg) => {
                const senderName = msg.sender?.full_name || 'Unknown Sender';
                const receiverName = msg.receiver?.full_name || 'Unknown Receiver';
                const displayName = `From: ${senderName} → To: ${receiverName}`;

                const senderClass =
                  msg.sender_id === userId
                    ? 'you'
                    : msg.sender?.role === 'Doctor'
                    ? 'doctor'
                    : 'patient';

                return (
                  <li key={msg.id} className="message-item">
                    <input
                      type="checkbox"
                      checked={selectedMessages.includes(msg.id)}
                      onChange={() => toggleMessageSelection(msg.id)}
                      style={{ marginRight: '10px' }}
                    />
                    <div className="message-header">
                      <span className={`message-sender ${senderClass}`}>{displayName}</span>
                    </div>
                    <h4 className="message-subject">
                      {msg.message_content.slice(0, 30)}...
                    </h4>
                    <p className="message-snippet">{msg.message_content}</p>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteMessage(msg.id)}
                    >
                      Delete
                    </button>
                    <button
                     className="reply-button"
                    onClick={() => {
                    if (msg.sender?.email) {
                    setReceiverEmail(msg.sender.email);
                    setShowCompose(true);
                    setMessageContent(`RE: ${msg.message_content}\n\n`);
                    } else {
                    alert('Sender email not found. Cannot reply.');
                    }
                    }}
                    >
                    Reply
                  </button>
                  </li>
                );
              })}
            </ul>

            {selectedMessages.length > 0 && (
              <button
                className="bulk-delete-button"
                onClick={handleBulkDelete}
                style={{ marginTop: '12px' }}
              >
                Delete Selected ({selectedMessages.length})
              </button>
            )}
          </>
        )}

        <button
          className="new-message-button"
          onClick={() => setShowCompose(!showCompose)}
        >
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
            <button className="send-button" onClick={handleSendMessage}>
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
