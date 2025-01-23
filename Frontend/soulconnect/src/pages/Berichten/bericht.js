import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { messages as initialMessages } from './messages'; 
import './berichten.css';
import Header from '../../Components/Header/Header';

function ChatPage() {
  const { messageId } = useParams(); 
  const [messages, setMessages] = useState(initialMessages); 
  const [newMessage, setNewMessage] = useState(''); 

  const contactMessages = messages.filter(
    (msg) =>
      (msg.sender === messageId && msg.receiver === 'You') ||
      (msg.receiver === messageId && msg.sender === 'You')
  );

  const sortedMessages = contactMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const nieuwBericht = {
      id: messages.length + 1, 
      sender: 'You',
      receiver: messageId,
      message: newMessage,
      timestamp: new Date().toISOString(), 
      profilePicture: '/path-to-your-profile-picture.jpg', 
    };

    setMessages((prevMessages) => [...prevMessages, nieuwBericht]);
    setNewMessage('');
  };

  return (
    <>
    <Header/> 
    <div>
      <h2 className="chat-header">Chat with {messageId}</h2>
      <div className="messages-container">
        {sortedMessages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.sender === 'You' ? 'sent' : 'received'}`}
          >
            <img
              src={msg.profilePicture}
              alt={`${msg.sender}'s profile`}
              className={`profile-pic ${msg.sender === 'You' ? 'sent' : 'received'}`}
            />
            <div className={`message-box ${msg.sender === 'You' ? 'sent' : 'received'}`}>
              <p>{msg.message}</p>
              <small>{msg.timestamp}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message"
          className="message-input"
        />
        <button onClick={handleSendMessage} className="send-button">
          Versturen
        </button>
      </div>
    </div>
    </>
  );
}

export default ChatPage;
