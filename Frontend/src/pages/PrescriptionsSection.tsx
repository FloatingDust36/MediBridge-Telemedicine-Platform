// src/pages/PrescriptionsSection.tsx
import React from 'react';
import './PrescriptionsSection.css'; // Import its own CSS

const PrescriptionsSection = () => {
  const prescriptionData = [
    "Amlodipine 5mg 💊 1x daily (morning)",
    "Losartan 50mg 💊 1x daily (evening)",
    "Metformin 500mg 💊 2x daily (with meals)",
    "Insulin Glargine 10 units 💉 1x daily (bedtime)",
    "Vitamin D3 1000 IU 💊 1x daily",
  ];

  return (
    <div className="card-base prescriptions-section"> {/* Uses card-base from Patientdash.css */}
      <h3 className="prescriptions-title">
        💊 Prescriptions
      </h3>
      <div className="card-content">
        <ul className="prescriptions-list">
          {prescriptionData.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PrescriptionsSection;