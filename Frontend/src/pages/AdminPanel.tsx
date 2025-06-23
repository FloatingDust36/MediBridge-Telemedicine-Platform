import React from 'react';
import './AdminPanel.css'; // Import the new CSS file
import './Home.css'; // Assuming Home.css contains global styles like navbar
import logo from '../assets/MediBridge_LogoClear.png'; // adjust the path as needed
import admin1 from '../assets/pictures/Admin1.png'; // adjust the path as needed
import { Link } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  return (
    <div className="admin-panel-container">
      <nav className="navbar">
        <div className="logo">
          <img src={logo} alt="MedBridge Logo" className="logo-img" /> {/* Replace with your logo path */}
          <span className="logo-text">MedBridge</span>
        </div>
        <ul className="nav-links">
          <li>Messages</li>
          <li><Link to="/home">Logout</Link></li>
        </ul>
      </nav>

      <div className="admin-panel-content">
        {/* Hero Section - Adapted for Admin Panel */}
        <div className="admin-hero-section">
          <div className="admin-hero-text">
            <h1>Welcome, Admin</h1>
            <p>Monitor user activity, manage doctor and patient accounts, and view platform statistics.</p>
          </div>
          <div className="admin-hero-image">
            {/* You'll need to add an actual image here, matching the one in the screenshot */}
            <img src={admin1} alt="Admin Dashboard" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="card">
            <h3>Total Users</h3>
            <p className="card-value">1,248</p>
          </div>
          <div className="card">
            <h3>Active Doctors</h3>
            <p className="card-value">132</p>
          </div>
          <div className="card">
            <h3>Active Patients</h3>
            <p className="card-value">1,116</p>
          </div>
        </div>

        {/* Main Content - Manage Users Table */}
        <div className="manage-users-section panel-box">
          <h2>Manage Users</h2>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>001</td>
                  <td>Dr. Kevin Reyes</td>
                  <td>Doctor</td>
                  <td>kevin.reyes@medbridge.com</td>
                  <td>Active</td>
                  <td>
                    <button className="action-button edit-button">Edit</button>
                    <button className="action-button delete-button">Delete</button>
                  </td>
                </tr>
                <tr>
                  <td>002</td>
                  <td>Maria Lopez</td>
                  <td>Patient</td>
                  <td>maria.lopez@gmail.com</td>
                  <td>Inactive</td>
                  <td>
                    <button className="action-button edit-button">Edit</button>
                    <button className="action-button delete-button">Delete</button>
                  </td>
                </tr>
                {/* Add more user rows dynamically */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;