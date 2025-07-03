import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import './Layout.css'; // 👈 Import the custom CSS

interface LayoutProps {
  userType: 'guest' | 'patient' | 'doctor' | 'admin';
}

const Layout: React.FC<LayoutProps> = ({ userType }) => {
  return (
    <div className="app-layout-container">
      <Navbar userType={userType} />
      <main className="app-main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;