// src/pages/ConsultationAppointmentsSection.tsx
import React from 'react';
import './ConsultationAppointmentsSection.css'; // Import its own CSS

const ConsultationAppointmentsSection = () => {
  const upcomingAppointments = [
    { id: 1, date: "July 5, 2025", time: "10:00 AM", doctor: "Dr. Alex Smith", type: "Video Call" },
    { id: 2, date: "July 12, 2025", time: "02:30 PM", doctor: "Dr. Sarah Lee", type: "In-person" },
  ];

  const pastAppointments = [
    { id: 3, date: "June 20, 2025", time: "11:00 AM", doctor: "Dr. Jane Doe", type: "Video Call" },
    { id: 4, date: "May 15, 2025", time: "09:00 AM", doctor: "Dr. John Brown", type: "Video Call" },
  ];

  return (
    <div className="card-base consultation-section"> {/* Uses card-base from Patientdash.css */}
      <h3 className="consultation-section-title">
        🗓️ Consultation Appointments
      </h3>
      <div className="card-content">
        <h4>Upcoming Appointments:</h4>
        {upcomingAppointments.length > 0 ? (
          <ul className="consultation-list">
            {upcomingAppointments.map(app => (
              <li key={app.id}>
                <strong>{app.date} at {app.time}</strong> with {app.doctor} ({app.type})
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming appointments.</p>
        )}

        <h4>Past Appointments:</h4>
        {pastAppointments.length > 0 ? (
          <ul className="consultation-list">
            {pastAppointments.map(app => (
              <li key={app.id}>
                <strong>{app.date} at {app.time}</strong> with {app.doctor} ({app.type})
              </li>
            ))}
          </ul>
        ) : (
          <p>No past appointments.</p>
        )}
      </div>
    </div>
  );
};

export default ConsultationAppointmentsSection;