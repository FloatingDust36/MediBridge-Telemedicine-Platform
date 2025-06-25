import React, { useState, useEffect } from 'react';
// Remove Link import if no internal links within the content are using it.
// Based on current code, Link is only used in the removed Navbar, so it can be removed.
// import { Link } from 'react-router-dom';
import './AppointmentsPage.css';
// Remove logo import as Navbar is no longer directly in this component
// import logo from '../assets/MediBridge_LogoClear.png';

const AppointmentsPage: React.FC = () => {
  const [selectedDoctor, setSelectedDoctor] = useState("Dr. Maria Santos – Pediatrics");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("Mon 9:00–12:00");
  const [currentTime, setCurrentTime] = useState(new Date());

  const handleBookAppointment = () => {
    alert(`Appointment booked with ${selectedDoctor} for ${selectedTimeSlot}!`); // Consider a custom modal instead of alert
  };

  const doctors = [
    "Dr. Maria Santos – Pediatrics",
    "Dr. Alex Smith – General Medicine",
    "Dr. Sarah Lee – Dermatology",
  ];

  const timeSlots = [
    "Mon 9:00–12:00",
    "Wed 1:00–4:00",
    "Fri 10:00–1:00",
  ];

  const upcomingAppointmentsData = [
    { id: 1, doctor: "Dr. Maria Santos", date: "June 25, 2025", time: "10:30 AM" },
    { id: 2, doctor: "Dr. Kevin Reyes", date: "July 3, 2025", time: "2:00 PM" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  return (
    // The main-content-area is now the top-level element for this component.
    // It will be rendered inside the <main> tag of your Layout component,
    // which already applies padding-top to clear the fixed Navbar.
    <div className="main-content-area appointments-page-wrapper"> {/* Renamed for consistency */}
      {/*
        The Navbar and Footer are now rendered by the Layout component in App.tsx.
        Do NOT render them here.
        Removed: <nav className="navbar">...</nav>
      */}

      {/* Page Title and Timestamp */}
      <div className="appointments-top-info-bar">
        <h1 className="appointments-page-title">Appointments Dashboard</h1>
        <span className="appointments-timestamp">{formattedTime} · {formattedDate}</span>
      </div>

      <div className="appointments-content-grid">
        {/* Booking Card */}
        <div className="card-base doctor-preference-card">
          <h3 className="card-title">️ Doctor Preference</h3>
          <div className="form-group">
            <label htmlFor="doctor-select">Select a Doctor:</label>
            <select
              id="doctor-select"
              className="doctor-select"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              {doctors.map((doctor, index) => (
                <option key={index} value={doctor}>{doctor}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <h4 className="select-time-title">Select an Available Time Slot:</h4>
            <div className="time-slot-grid">
              {timeSlots.map((slot, index) => (
                <button
                  key={index}
                  className={`time-slot-button ${selectedTimeSlot === slot ? 'active' : ''}`}
                  onClick={() => setSelectedTimeSlot(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
            <p className="time-slot-note">Note: Doctor schedules are fixed. Please choose accordingly.</p>
          </div>

          <button className="book-appointment-button" onClick={handleBookAppointment}>
            Book Appointment
          </button>
        </div>

        {/* Upcoming Appointments */}
        <div className="card-base upcoming-appointments-card">
          <h3 className="card-title">Upcoming Appointments</h3>
          <ul className="upcoming-appointments-list">
            {upcomingAppointmentsData.map((app) => (
              <li key={app.id} className="upcoming-appointment-item">
                <span className="appointment-doctor">{app.doctor}</span>
                <span className="appointment-date-time">{app.date} – {app.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;