import React, { useState } from 'react';
// Remove logo import as Navbar is no longer directly in this component
// import logo from '../assets/MediBridge_LogoClear.png';
import './DoctorDashboard.css'; // Import the new CSS file
// Remove Home.css import as global styles are handled elsewhere and navbar is a component
// import './Home.css';
// Remove Link import as it was only used for the Navbar links that are now global
// import { Link } from 'react-router-dom';


const DoctorDashboard: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<string>('Juan Dela Cruz');
  const [consultationNotes, setConsultationNotes] = useState<string>('');

  const handleSaveNotes = () => {
    console.log(`Saving notes for ${selectedPatient}: ${consultationNotes}`);
    // Here you would typically send this data to a backend
    alert('Consultation notes saved!'); // Consider a custom modal for better UX
    setConsultationNotes(''); // Clear notes after saving
  };

  return (
    // This div now represents the main content area of the Doctor Dashboard page.
    // It will be rendered inside the <main> tag of your Layout component,
    // which already applies padding-top to clear the fixed Navbar.
    <div className="main-content-area doctor-dashboard-wrapper"> {/* This is your page's root container */}
      {/*
        The Navbar and Footer are now rendered by the Layout component in App.tsx.
        Do NOT render them here.
        Removed: <nav className="navbar">...</nav>
      */}

      <div className="welcome-section">
        <h1>Welcome, Dr. [Nigga]</h1>
        <p>Manage your appointments, view patient records, and conduct consultations.</p>
        <span className="current-date">Thursday, 28 May 2025</span> {/* Consider dynamic date */}
      </div>

      <div className="summary-cards">
        <div className="card">
          <h3>Appointments Today</h3>
          <p className="card-value">9</p>
        </div>
        <div className="card">
          <h3>Consultations Done</h3>
          <p className="card-value">3</p>
        </div>
        <div className="card">
          <h3>Pending Messages</h3>
          <p className="card-value">4</p>
        </div>
      </div>

      <div className="main-sections">
        <div className="section-left">
          <div className="today-appointments panel-box">
            <h2>Today's Appointments</h2>
            <div className="appointment-item">
              <p className="patient-name">Patient: Juan Dela Cruz</p>
              <p className="appointment-time">June 18, 2025 - 10:00 AM</p>
            </div>
            <div className="appointment-item">
              <p className="patient-name">Patient: Maria Lopez</p>
              <p className="appointment-time">June 18, 2025 - 1:30 PM</p>
            </div>
            {/* More appointments can be mapped here */}
          </div>

          <div className="add-consultation-notes panel-box">
            <h2>Add Consultation Notes</h2>
            <div className="form-group">
              <label htmlFor="select-patient">Select Patient</label>
              <select
                id="select-patient"
                className="input-field"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
              >
                <option value="Juan Dela Cruz">Juan Dela Cruz</option>
                <option value="Maria Lopez">Maria Lopez</option>
                {/* Add more patients dynamically */}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="consultation-details">Consultation Notes</label>
              <textarea
                id="consultation-details"
                className="input-field textarea-field"
                placeholder="Enter consultation details..."
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
              ></textarea>
            </div>
            <button className="save-notes-button" onClick={handleSaveNotes}>
              Save Notes
            </button>
          </div>
        </div>

        <div className="section-right">
          <div className="search-patient-records panel-box">
            <h2>Search Patient Records</h2>
            <input
              type="text"
              placeholder="Enter patient name or ID"
              className="input-field"
            />
            <button className="search-button">Search</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;