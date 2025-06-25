import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AppointmentsPage.css';
import logo from '../assets/MediBridge_LogoClear.png';

const AppointmentsPage: React.FC = () => {
  const [selectedDoctor, setSelectedDoctor] = useState("Dr. Maria Santos – Pediatrics");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("Mon 9:00–12:00");
  const [currentTime, setCurrentTime] = useState(new Date());

  const handleBookAppointment = () => {
    alert(`Appointment booked with ${selectedDoctor} for ${selectedTimeSlot}!`);
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
    <div className="appointments-page-container">
      <div className="appointments-inner-wrapper">
      {/* ✅ Consistent navbar */}
      <nav className="navbar">
        <div className="logo">
          <img src={logo} alt="MediBridge Logo" className="logo-img" />
          <span className="logo-text">MediBridge</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/patientdashboard" className="nav-item-new">Dashboard</Link></li>
          <li><Link to="/appointments" className="nav-item-new">Appointments</Link></li>
          <li><Link to="/messages" className="nav-item-new">Messages</Link></li>
          <li><Link to="/chatbot" className="nav-item-new">Chatbot</Link></li>
          <li><Link to="/" className="nav-item-new">Logout</Link></li>
        </ul>
      </nav>

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
    </div>
  );
};

export default AppointmentsPage;
