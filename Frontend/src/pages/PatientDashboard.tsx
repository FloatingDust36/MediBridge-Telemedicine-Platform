// src/pages/PatientDashboard.tsx
import { Link } from "react-router-dom"; // Add this line if not already present
import React, { useState, useEffect } from "react";
import "./PatientDashboard.css"; // This import stays for global, header, and layout styles
import logo from '../assets/MediBridge_LogoClear.png'; // adjust the path as needed

// PatientDashboardSection Component (now defined locally)
const PatientDashboardSection: React.FC = () => {
    const patientInfo = {
        name: "John Doe",
        age: 45,
        gender: "Male",
        lastVisit: "June 20, 2025",
        nextAppointment: "July 5, 2025",
    };

    return (
        <div className="card-base patient-dashboard-section">
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
};

// NotesSection Component (now defined locally)
const NotesSection: React.FC = () => {
    const [patientNotes, setPatientNotes] = useState([
        "The patient wants to get off manual chart",
        "Treatment should continue with glucose plan",
        "Allergy: sensitive to penicillin",
    ]);
    const [newNote, setNewNote] = useState("");

    const handleAddNote = () => {
        if (newNote.trim() !== "") {
            setPatientNotes([...patientNotes, newNote.trim()]);
            setNewNote("");
        }
    };

    return (
        <div className="card-base notes-section">
            <h3 className="notes-title">
                📝 Patient Notes
            </h3>
            <div className="card-content">
                <ul className="notes-list">
                    {patientNotes.map((note, index) => (
                        <li key={index}>{note}</li>
                    ))}
                </ul>
                <textarea
                    className="add-note-textarea"
                    placeholder="Add a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                ></textarea>
                <button
                    className="add-note-button"
                    onClick={handleAddNote}
                >
                    Add Note
                </button>
            </div>
        </div>
    );
};

// ConsultationAppointmentsSection Component (now defined locally)
const ConsultationAppointmentsSection: React.FC = () => {
    const upcomingAppointments = [
        { id: 1, date: "July 5, 2025", time: "10:00 AM", doctor: "Dr. Alex Smith", type: "Video Call" },
        { id: 2, date: "July 12, 2025", time: "02:30 PM", doctor: "Dr. Sarah Lee", type: "In-person" },
    ];

    const pastAppointments = [
        { id: 3, date: "June 20, 2025", time: "11:00 AM", doctor: "Dr. Jane Doe", type: "Video Call" },
        { id: 4, date: "May 15, 2025", time: "09:00 AM", doctor: "Dr. John Brown", type: "Video Call" },
    ];

    return (
        <div className="card-base consultation-section">
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

// PrescriptionsSection Component (now defined locally)
const PrescriptionsSection: React.FC = () => {
    const prescriptionData = [
        "Amlodipine 5mg 💊 1x daily (morning)",
        "Losartan 50mg 💊 1x daily (evening)",
        "Metformin 500mg 💊 2x daily (with meals)",
        "Insulin Glargine 10 units 💉 1x daily (bedtime)",
        "Vitamin D3 1000 IU 💊 1x daily",
    ];

    return (
        <div className="card-base prescriptions-section">
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

// MedicalHistorySection Component (now defined locally)
const MedicalHistorySection: React.FC = () => {
    const medicalHistoryData = [
        { date: "April 10, 2025", doctor: "Dr. Reyes", diagnosis: "Diagnosed with flu. Prescribed medication and rest." },
        { date: "March 5, 2025", doctor: "Dr. Cruz", diagnosis: "Routine check-up. All vitals normal." },
    ];

    return (
        <div className="card-base medical-history-section">
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


// Import the separate page components (as requested)
import AppointmentsPage from "./AppointmentsPage";
import MessagesPage from "./MessagesPage";
import ChatbotPage from "./ChatbotPage";


const PatientDashboard = () => {
    const [activeView, setActiveView] = useState("Dashboard");

    const navigationItems = [
        { label: "Dashboard" },
        { label: "Appointments" },
        { label: "Messages" },
        { label: "Chatbot" },
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
            case "Chatbot":
                return <ChatbotPage />;
            default:
                return null;
        }
    };

    return (
        <div className="patientdash-container">
            {/* Navbar Structure */}
            <nav className="navbar">
                <div className="logo">
                    <img src={logo} alt="MediBridge Logo" className="logo-img" />
                    <span className="logo-text">MediBridge</span>
                </div>
                <ul className="nav-links">
                    {navigationItems.map((item, index) => (
                        <li
                            key={index}
                            className={`nav-item-new ${activeView === item.label ? 'active' : ''}`}
                            onClick={() => setActiveView(item.label)}
                        >
                            {item.label}
                        </li>
                    ))}
                    {/* Changed Logout from button to span for consistent styling */}
                    <li className="nav-item-new">
                        <Link to="/">Logout</Link>
                    </li>
                </ul>
            </nav>

            {/* Main Content Area */}
            <main className="main-content-area">
                {renderContent()}
            </main>
        </div>
    );
};

export default PatientDashboard;