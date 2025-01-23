import React from 'react';
import dummyData from './Dashboarddummy';
import './Dashboard.css';
import Header from '../../Components/Header/Header';

function Dashboard() {
  return (
    <>
    <div>
        <Header /> 
        </div>
    <div className="Dashboard">
        
      <h1>Welkom terug</h1>

      <section className="liked-section">
        <h2>Mensen die jou hebben geliked:</h2>
        <div className="cards">
          {dummyData.liked.map((person, index) => (
            <div key={index} className="card">
              <div className="avatar"></div>
              <h3>{person.name}</h3>
              <p>{person.gender}</p>
              <p>{person.oneliner}</p>
              <button>&hearts;</button>
            </div>
          ))}
        </div>
      </section>

      <section className="potential-section">
        <h2>Mensen die je misschien wel leuk vindt</h2>
        <div className="cards">
          {dummyData.potentialMatches.map((person, index) => (
            <div key={index} className="card">
              <div className="avatar"></div>
              <h3>{person.name}</h3>
              <p>{person.gender}</p>
              <p>{person.oneliner}</p>
              <button>&hearts;</button>
            </div>
          ))}
        </div>
        <a href="/matches" className="see-more">Zoek Meer &gt;</a>
      </section>
    </div>
    </>
  );
}

export default Dashboard;