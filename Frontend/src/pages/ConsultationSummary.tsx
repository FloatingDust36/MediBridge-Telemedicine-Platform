import React from 'react';
import './ConsultationSummary.css';
import './Home.css';
import logo from '../assets/MediBridge_LogoClear.png';
import { Link } from 'react-router-dom';

const ConsultationSummary: React.FC = () => {
  const recentConsultations = [
    {
      doctor: 'Dr. Emily Santos',
      date: 'June 10, 2025',
      summary: 'Discussed recurring skin rash and recommended topical ointment. Scheduled a follow-up in two weeks.',
      prescription: 'Hydrocortisone cream 1%',
      status: 'Completed',
      followUpDate: 'June 24, 2025'
    },
    {
      doctor: 'Dr. Alex Chen',
      date: 'May 28, 2025',
      summary: 'Patient reported persistent cough. Prescribed antibiotics and advised rest. Follow-up if symptoms worsen.',
      prescription: 'Amoxicillin 500mg',
      status: 'Completed',
      followUpDate: 'N/A'
    },
  ];

  return (
    <div className="consultation-summary-container">
      <nav className="navbar">
        <div className="logo">
          <img src={"path/to/your/logo.png"} alt="MedBridge Logo" className="logo-img" />
          <span className="logo-text">MedBridge</span>
        </div>
        <ul className="nav-links">
          <li>Dashboard</li>
          <li>Appointments</li>
          <li>Messages</li>
          <li><Link to="/home">Logout</Link></li>
        </ul>
      </nav>

      <div className="consultation-summary-content">
        <div className="summary-header">
          <h1>Online Consultation Summary</h1>
          <div className="header-info">
            <span className="current-time">10:50 PM</span>
            <span className="current-date">19 June 2025</span>
          </div>
        </div>

        <div className="recent-consultations-section">
          <h2>Recent Consultations</h2>

          {recentConsultations.length > 0 ? (
            recentConsultations.map((consultation, index) => (
              <div key={index} className="consultation-card panel-box">
                <div className="consultation-header">
                  <h3>Consultation with {consultation.doctor}</h3>
                  <span className={`consultation-status ${consultation.status.toLowerCase()}`}>
                    {consultation.status}
                  </span>
                </div>
                <div className="consultation-details">
                  <p><strong>Date:</strong> {consultation.date}</p>
                  <p><strong>Summary:</strong> {consultation.summary}</p>
                  <p><strong>Prescription:</strong> {consultation.prescription}</p>
                  {consultation.followUpDate !== 'N/A' && (
                    <p><strong>Follow-up:</strong> Scheduled for {consultation.followUpDate}</p>
                  )}
                </div>
                <div className="consultation-actions">
                  <button className="view-details-button">View Full Details</button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-consultations">No recent consultations found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationSummary;