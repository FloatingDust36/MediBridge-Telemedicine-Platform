// Frontend/src/components/Layout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  userType: 'guest' | 'patient' | 'doctor' | 'admin';
}

const Layout: React.FC<LayoutProps> = ({ userType }) => {
  return (
    <div className="app-layout-container">
      <Navbar userType={userType} />
      <main className="app-main-content">
        <Outlet /> {/* Your pages like ChatbotPage render here */}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;