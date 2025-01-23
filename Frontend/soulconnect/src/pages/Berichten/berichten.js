import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom'; 
import { messages } from './messages'; 
import './berichten.css';
import Header from '../../Components/Header/Header';

function BerichtenPagina() {
  const [messagesData, setMessagesData] = useState([]);

  useEffect(() => {
    setMessagesData(messages); 
  }, []);

  const lastMessages = messagesData.reduce((acc, msg) => {
    if (msg.sender === 'You') {
      return acc; 
    }

    const contactId = msg.receiver === 'You' ? msg.sender : msg.receiver; 

    if (!acc[contactId]) {
      acc[contactId] = msg; 
    } else {
      if (new Date(msg.timestamp) > new Date(acc[contactId].timestamp)) {
        acc[contactId] = msg;
      }
    }
    return acc;
  }, {});

  const lastMessagesArray = Object.values(lastMessages);

  return (
    <>
    <Header />
    <div className="main-container">
      <div className="sidebar">
        <h2>Chats</h2>
        {lastMessagesArray.map((msg) => (
          <Link
            key={msg.id}
            to={`/berichten/${msg.receiver === 'You' ? msg.sender : msg.receiver}`}
            className="chat-link"
          >
            <img
              src={msg.profilePicture}
              alt={`${msg.receiver === 'You' ? msg.sender : msg.receiver}'s profile`}
              className="profile-pic"
            />
            <div className="message-preview">
              <p>
                <strong>{msg.receiver === 'You' ? msg.sender : msg.receiver}</strong>
                <small>{msg.timestamp}</small>
              </p>
              <p>{msg.message}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="content">
        <Outlet /> 
      </div>
    </div>
    </>
  );
}

export default BerichtenPagina;
