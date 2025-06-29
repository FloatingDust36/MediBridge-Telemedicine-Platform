import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar' // Adjust path if necessary
import Footer from './Footer' // Assuming you have a Footer component

interface LayoutProps {
  userType: 'guest' | 'patient' | 'doctor' | 'admin';
}

const Layout: React.FC<LayoutProps> = ({ userType }) => {
  return (
    <>
      <Navbar userType={userType} />
      <main style={{/* paddingTop: '60px' */}}> {/* Adjust padding to account for fixed navbar height */}
        <Outlet /> {/* This is where your nested routes will render */}
      </main>
      <Footer />
    </>
  )
}

export default Layout;