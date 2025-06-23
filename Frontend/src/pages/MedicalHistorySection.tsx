// src/pages/MedicalHistorySection.tsx
import React from 'react';
import './MedicalHistorySection.css'; // Import its own CSS

const MedicalHistorySection = () => {
  const medicalHistoryData = [
    { date: "April 10, 2025", doctor: "Dr. Reyes", diagnosis: "Diagnosed with flu. Prescribed medication and rest." },
    { date: "March 5, 2025", doctor: "Dr. Cruz", diagnosis: "Routine check-up. All vitals normal." },
    // Add more medical history entries as needed
  ];

  return (
    <div className="card-base medical-history-section"> {/* Uses card-base from Patientdash.css */}
      <h3 className="medical-history-title">
        🩺 Medical History
      </h3>
      <div className="card-content">
        <ul className="medical-history-list">
          {medicalHistoryData.map((entry, index) => (
            <li key={index} className="medical-history-item">
              <strong>{entry.date} – {entry.doctor}</strong><br/>
              {entry.diagnosis}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MedicalHistorySection;