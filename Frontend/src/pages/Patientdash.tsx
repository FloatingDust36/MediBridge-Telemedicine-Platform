// src/pages/Patientdash.tsx
import React, { useState, useEffect } from "react";
import "./Patientdash.css"; // This import stays for global, header, and layout styles

// Import your section components and their individual CSS files
import ConsultationAppointmentsSection from "./ConsultationAppointmentsSection";
import NotesSection from "./NotesSection";
import { PatientDashboardSection } from "./PatientDashboardSection";
import PrescriptionsSection from "./PrescriptionsSection";
import MedicalHistorySection from "./MedicalHistorySection";
import AppointmentsPage from "./AppointmentsPage";
import MessagesPage from "./MessagesPage";
// NEW IMPORT for Chatbot page
import ChatbotPage from "./ChatbotPage"; // NEW

const Patientdash = () => {
  const [activeView, setActiveView] = useState("Dashboard"); // Default to Dashboard

  const navigationItems = [
    { label: "Dashboard" },
    { label: "Appointments" },
    { label: "Messages" },
    { label: "Chatbot" }, // NEW: Add Chatbot to navigation
  ];

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const optionsDate: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
  const optionsTime: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
  const formattedDate = currentTime.toLocaleDateString('en-US', optionsDate);
  const formattedTime = currentTime.toLocaleTimeString('en-US', optionsTime);

  // Function to render content based on activeView state
  const renderContent = () => {
    switch (activeView) {
      case "Dashboard":
        return (
          <>
            <div className="top-info-bar">
              <h1 className="page-title">Patient Dashboard</h1>
              <div className="welcome-and-profile">
                <div className="profile-image-container">
                  <img
                    src="/images/patient-avatar.png"
                    alt="Patient Profile"
                    className="profile-image"
                  />
                </div>
                <div className="welcome-text-group">
                  <span className="medical-profile-label">Medical Profile</span>
                  <span className="welcome-message">Welcome, Ligma balls</span>
                </div>
              </div>
              <div className="current-timestamp">
                {`${formattedTime} · ${formattedDate}`}
              </div>
            </div>

            <section className="dashboard-section card-margin-bottom">
              <PatientDashboardSection />
            </section>

            <section className="notes-section card-margin-bottom">
              <NotesSection />
            </section>

            <section className="consultation-section card-margin-bottom">
              <ConsultationAppointmentsSection />
            </section>

            <section className="prescriptions-section card-margin-bottom">
              <PrescriptionsSection />
            </section>

            <section className="medical-history-section card-margin-bottom">
              <MedicalHistorySection />
            </section>
          </>
        );
      case "Appointments":
        return <AppointmentsPage />;
      case "Messages":
        return <MessagesPage />;
      case "Chatbot": // NEW: Render ChatbotPage
        return <ChatbotPage />;
      default:
        return null;
    }
  };

  return (
    <div className="patientdash-container">
      <div className="patientdash-wrapper">
        {/* Header */}
        <header className="patientdash-header">
          {/* Logo */}
          <div className="logo-container">
            <img
              src="/images/medibridge-logo.png"
              alt="Medibridge Logo"
              className="header-logo"
            />
          </div>

          {/* Navigation */}
          <nav className="patientdash-nav">
            {navigationItems.map((item, index) => (
              <div
                key={index}
                className={`nav-item ${activeView === item.label ? 'active' : ''}`}
                onClick={() => setActiveView(item.label)}
              >
                {item.label}
              </div>
            ))}
            <button className="logout-button">
              Logout
            </button>
          </nav>
        </header>

        {/* Main Content Area - Renders content based on activeView */}
        <main className="main-content-area">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Patientdash;