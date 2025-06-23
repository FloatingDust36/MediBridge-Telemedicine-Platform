// src/pages/PatientDashboardSection.tsx
import React from 'react';
import './PatientDashboardSection.css'; // Import its own CSS

export function PatientDashboardSection() {
  const patientInfo = {
    name: "John Doe",
    age: 45,
    gender: "Male",
    lastVisit: "June 20, 2025",
    nextAppointment: "July 5, 2025",
  };

  return (
    <div className="card-base patient-dashboard-section"> {/* Uses card-base from Patientdash.css */}
      <h3 className="patient-dashboard-section-title">
        📈 Patient Overview
      </h3>
      <div className="card-content patient-dashboard-section-content">
        <p><strong>Name:</strong> {patientInfo.name}</p>
        <p><strong>Age:</strong> {patientInfo.age}</p>
        <p><strong>Gender:</strong> {patientInfo.gender}</p>
        <p><strong>Last Visit:</strong> {patientInfo.lastVisit}</p>
        <p><strong>Next Appointment:</strong> {patientInfo.nextAppointment}</p>
      </div>
    </div>
  );
}