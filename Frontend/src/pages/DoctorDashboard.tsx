import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import './DoctorDashboard.css';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  patients: { first_name: string; last_name: string; user_id: string } | null;
}

interface DoctorWithUser {
  first_name: string;
  last_name: string;
  middle_name: string | null;
  specialization: string;
  is_available: boolean;
  users: {
    full_name: string;
  };
}

interface DoctorInfo {
  full_name: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  specialization: string;
  is_available: boolean;
}

const DoctorDashboard: React.FC = () => {
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [consultationsDone, setConsultationsDone] = useState<number>(0);

  const fetchDoctorDashboardData = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (sessionError || !userId) {
      console.error('No logged-in doctor or session error:', sessionError?.message);
      return;
    }

    try {
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select(`
          first_name,
          last_name,
          middle_name,
          specialization,
          is_available,
          users (
            full_name
          )
        `)
        .eq('user_id', userId)
        .single<DoctorWithUser>();

      if (doctorError || !doctorData) {
        setDoctorInfo({
          full_name: 'Dr. Unknown',
          first_name: 'Unknown',
          last_name: '',
          middle_name: null,
          specialization: 'General',
          is_available: false
        });
      } else {
        const parseFullName = (fullName: string) => {
          const nameParts = fullName.trim().split(' ');
          if (nameParts.length === 1) {
            return { first_name: nameParts[0], middle_name: '', last_name: '' };
          } else if (nameParts.length === 2) {
            return { first_name: nameParts[0], middle_name: '', last_name: nameParts[1] };
          } else {
            return {
              first_name: nameParts[0],
              middle_name: nameParts.slice(1, -1).join(' '),
              last_name: nameParts[nameParts.length - 1]
            };
          }
        };

        const parsedNames = parseFullName(doctorData.users.full_name || '');

        setDoctorInfo({
          full_name: doctorData.users.full_name || 'Dr. Unknown',
          first_name: doctorData.first_name || parsedNames.first_name,
          last_name: doctorData.last_name || parsedNames.last_name,
          middle_name: doctorData.middle_name || parsedNames.middle_name || null,
          specialization: doctorData.specialization || 'General',
          is_available: doctorData.is_available || false
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const { data: appts, error: apptError } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          patients (
            user_id,
            first_name,
            last_name
          )
        `)
        .eq('doctor_id', userId)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true });

      if (apptError) {
        console.error('Error fetching appointments:', apptError.message);
        setAppointments([]);
      } else {
        const formattedAppts: Appointment[] = appts.map((appt: any) => ({
          id: appt.id,
          start_time: appt.start_time,
          end_time: appt.end_time,
          patients: appt.patients ? {
            user_id: appt.patients.user_id,
            first_name: appt.patients.first_name,
            last_name: appt.patients.last_name,
          } : null,
        }));
        setAppointments(formattedAppts);
      }

      setConsultationsDone(0); // Placeholder

      const formattedDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      setCurrentDate(formattedDate);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDoctorDashboardData();
  }, []);

  const getDisplayName = () => {
    if (doctorInfo?.first_name && doctorInfo?.last_name) {
      return `${doctorInfo.first_name} ${doctorInfo.last_name}`;
    }
    return doctorInfo?.full_name?.replace(/^Dr\.?\s*/, '') || 'Unknown';
  };

  return (
    <div className="main-content-area doctor-dashboard-wrapper">
      <div className="welcome-section">
        <h1>Welcome, Dr. {getDisplayName()}</h1>
        <p>
          Specialization: {doctorInfo?.specialization || 'General'} |
          Status: {doctorInfo?.is_available ? 'Available' : 'Unavailable'}
        </p>
        <p>Manage your appointments and view your daily schedule.</p>
        <span className="current-date">{currentDate}</span>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards full-width-summary">
        <div className="card">
          <h3>Appointments Today</h3>
          <p className="card-value">{appointments.length}</p>
        </div>
        <div className="card">
          <h3>Consultations Done</h3>
          <p className="card-value">{consultationsDone}</p>
        </div>
      </div>

      {/* Appointments Section */}
      <div className="panel-box full-width-appointments">
        <h2>Today's Appointments</h2>
        {appointments.length > 0 ? (
          appointments.map((appt) => (
            <div className="appointment-item" key={appt.id}>
              <p className="patient-name">
                Patient: {appt.patients?.first_name} {appt.patients?.last_name}
              </p>
              <p className="appointment-time">
                {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                {new Date(appt.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))
        ) : (
          <p>No appointments for today.</p>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
