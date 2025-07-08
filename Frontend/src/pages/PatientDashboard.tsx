import supabase from '../lib/supabaseClient';
import React, { useState, useEffect, useCallback } from "react";
import "./PatientDashboard.css";
import logo from '../assets/MediBridge_LogoClear.png';

interface AppointmentItem {
  id: string;
  doctorName: string;
  date: string;
  time: string;
  isToday: boolean;
}

const PatientDashboardSection: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div style={{ color: 'black' }}>Loading patient info...</div>;

  return (
    <div className="card-base patient-dashboard-section">
      <h3 className="patient-dashboard-section-title">📈 Patient Overview</h3>
      <div className="card-content patient-dashboard-section-content">
        <p><strong>Name:</strong> {data.full_name}</p>
        <p><strong>Age:</strong> {
          data.date_of_birth
            ? `${Math.floor((new Date().getTime() - new Date(data.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} years`
            : 'N/A'
        }</p>
        <p><strong>Address:</strong> {data.address}</p>
        <p><strong>Contact:</strong> {data.contact_number}</p>
        <p><strong>Emergency Contact:</strong> {data.emergency_contact}</p>
        <p><strong>Allergies:</strong> {data.allergies || 'None reported'}</p>
      </div>
    </div>
  );
};

const ConsultationAppointmentsSection: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !user) {
        console.error("User not authenticated");
        setLoading(false);
        return;
      }

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          doctor_id,
          doctors (
            user_id,
            users (
              full_name
            )
          )
        `)
        .eq('patient_id', user.id)
        .gte('start_time', now)
        .order('start_time', { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error.message);
        setAppointments([]);
      } else {
        const mapped = data.map((app: any) => {
          const start = new Date(app.start_time);
          const today = new Date();
          const isToday =
            start.getFullYear() === today.getFullYear() &&
            start.getMonth() === today.getMonth() &&
            start.getDate() === today.getDate();

          return {
            id: app.id,
            doctorName: app.doctors?.users?.full_name
              ? `Dr. ${app.doctors.users.full_name}`
              : 'Unknown Doctor',
            date: start.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            time: start.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isToday,
          };
        });

        setAppointments(mapped);
      }

      setLoading(false);
    };

    fetchAppointments();
  }, []);

  return (
    <div className="card-base consultation-section">
      <h3 className="consultation-section-title">🗓️ Consultation Appointments</h3>
      <div className="card-content">
        {loading ? (
          <p>Loading appointments...</p>
        ) : appointments.length > 0 ? (
          <ul className="appointments-list">
            {appointments.map((app) => (
              <li key={app.id} className="appointment-item">
                <strong>{app.doctorName}</strong><br />
                {app.date} – {app.time}
                {app.isToday && (
                  <span className="today-indicator">• Today</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No appointments to display.</p>
        )}
      </div>
    </div>
  );
};

const PatientDashboard: React.FC = () => {
  const [patientData, setPatientData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchPatientData = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      console.error('No user session found');
      setPatientData(null);
      return;
    }

    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('full_name, email, phone_number, date_of_birth, address, role')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user info:', userError.message);
      setPatientData(null);
      return;
    }

    const { data: patientDetails, error: patientError } = await supabase
      .from('patients')
      .select('first_name, last_name, middle_name, contact_number, emergency_contact, allergies')
      .eq('user_id', userId)
      .single();

    if (patientError) {
      console.error('Error fetching patient details:', patientError.message);
      setPatientData({
        user_id: userId,
        full_name: userProfile?.full_name || '',
        email: userProfile?.email || '',
        phone_number: userProfile?.phone_number || '',
        date_of_birth: userProfile?.date_of_birth || '',
        address: userProfile?.address || '',
        role: userProfile?.role || 'patient',
        first_name: '',
        last_name: '',
        middle_name: '',
        contact_number: userProfile?.phone_number || '',
        emergency_contact: '',
        allergies: '',
      });
      return;
    }

    setPatientData({
      user_id: userId,
      full_name: userProfile?.full_name || '',
      email: userProfile?.email || '',
      phone_number: userProfile?.phone_number || '',
      date_of_birth: userProfile?.date_of_birth || '',
      address: userProfile?.address || '',
      role: userProfile?.role || 'patient',
      first_name: patientDetails?.first_name || '',
      last_name: patientDetails?.last_name || '',
      middle_name: patientDetails?.middle_name || '',
      contact_number: patientDetails?.contact_number || userProfile?.phone_number || '',
      emergency_contact: patientDetails?.emergency_contact || '',
      allergies: patientDetails?.allergies || '',
    });
  }, []);

  useEffect(() => {
    fetchPatientData();

    const handleProfileUpdate = () => {
      console.log('Patient profile updated event received. Refetching dashboard data...');
      fetchPatientData();
    };
    window.addEventListener('patientProfileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('patientProfileUpdated', handleProfileUpdate);
    };
  }, [fetchPatientData]);

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
    <div className="main-content-area">
      <div className="top-info-bar">
        <h1 className="page-title">Patient Dashboard</h1>
        <div className="welcome-and-profile">
          <div className="profile-image-container">
            <img src={logo} alt="Patient" className="profile-image" />
          </div>
          <div className="welcome-text-group">
            <span className="medical-profile-label">Medical Profile</span>
            <span className="welcome-message">Welcome, {patientData?.full_name || 'Patient'}</span>
          </div>
        </div>
        <div className="current-timestamp">{`${formattedTime} · ${formattedDate}`}</div>
      </div>

      <section className="dashboard-section card-margin-bottom">
        <PatientDashboardSection data={patientData} />
      </section>

      <section className="consultation-section card-margin-bottom">
        <ConsultationAppointmentsSection />
      </section>
    </div>
  );
};

export default PatientDashboard;
