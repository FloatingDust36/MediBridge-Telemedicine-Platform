// src/pages/AppointmentsPage.tsx
import React, { useState } from 'react';
import './AppointmentsPage.css'; // Dedicated CSS for this page

const AppointmentsPage = () => {
  const [selectedDoctor, setSelectedDoctor] = useState("Dr. Maria Santos – Pediatrics");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("Mon 9:00–12:00"); // Example state

  const handleBookAppointment = () => {
    alert(`Appointment booked with ${selectedDoctor} for ${selectedTimeSlot}!`);
    // In a real application, you would send this data to a backend.
  };

  // For a real app, these would come from an API
  const doctors = [
    "Dr. Maria Santos – Pediatrics",
    "Dr. Alex Smith – General Medicine",
    "Dr. Sarah Lee – Dermatology",
  ];

  const timeSlots = [
    "Mon 9:00–12:00",
    "Wed 1:00–4:00",
    "Fri 10:00–1:00",
    // Add more time slots as needed
  ];

  const upcomingAppointmentsData = [
    { id: 1, doctor: "Dr. Maria Santos", date: "June 25, 2025", time: "10:30 AM" },
    { id: 2, doctor: "Dr. Kevin Reyes", date: "July 3, 2025", time: "2:00 PM" },
  ];

  return (
    <div className="appointments-page-container">
      {/* Top Info Bar - You might choose to reuse the one from Patientdash.tsx or simplify */}
      {/* For now, let's include the title and timestamp for this page itself */}
      <div className="appointments-top-info-bar">
        <h1 className="appointments-page-title">Appointments Dashboard</h1>
        <span className="appointments-timestamp">
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} · {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="appointments-content-grid">
        {/* Doctor Preference / Booking Card */}
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

        {/* Upcoming Appointments Card */}
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