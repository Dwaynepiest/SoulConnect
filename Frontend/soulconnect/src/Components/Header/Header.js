import React from 'react';
import './Header.css';
import logo from '../../Fotos/28607339435.png'; 

const Header = () => {
    return (
        <header className="header">
            <img src={logo} alt="Soulconnect logo" className="header-logo" href="/home"/>
            <header>Soulconnect</header>
            <nav className="header-nav">
                <a href="/">Home</a>
                <a href="/dashboard">Dashboard</a>
                <a href="/berichten">Berichten</a>
                <input type="text" placeholder="Search" className="header-search" />
                <div className="header-profile">
                    <span>Gebruiker</span>
                    <img src="" alt="Profiel" className="header-profile-img" />
                </div>
            </nav>
        </header>
    );
};

export default Header;
