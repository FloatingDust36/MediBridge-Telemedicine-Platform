import React, { useEffect, useState } from 'react';
import './AdminDashboard.css';
import './Home.css';
import admin1 from '../assets/pictures/Admin1.png';
import supabase from '../lib/supabaseClient';

type UserRow = {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
};

const AdminDashboard: React.FC = () => {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalDoctors, setTotalDoctors] = useState<number>(0);
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    const fetchCountsAndUsers = async () => {
      const { count: usersCount, error: userErr } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: doctorCount, error: doctorErr } = await supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true });

      const { count: patientCount, error: patientErr } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('user_id, full_name, email, role');

      if (userErr || doctorErr || patientErr || usersError) {
        console.error('Fetch error:', userErr || doctorErr || patientErr || usersError);
        return;
      }

      setTotalUsers(usersCount ?? 0);
      setTotalDoctors(doctorCount ?? 0);
      setTotalPatients(patientCount ?? 0);
      setUsers(usersData ?? []);
    };

    fetchCountsAndUsers();
  }, []);

  return (
    <div className="admin-panel-container">
      <div className="admin-panel-content">

        <div className="admin-hero-section">
          <div className="admin-hero-text">
            <h1>Welcome, Admin</h1>
            <p>Monitor user activity, manage doctor and patient accounts, and view platform statistics.</p>
          </div>
          <div className="admin-hero-image">
            <img src={admin1} alt="Admin Dashboard" />
          </div>
        </div>

        <div className="summary-cards">
          <div className="card">
            <h3>Total Users</h3>
            <p className="card-value">{totalUsers}</p>
          </div>
          <div className="card">
            <h3>Active Doctors</h3>
            <p className="card-value">{totalDoctors}</p>
          </div>
          <div className="card">
            <h3>Active Patients</h3>
            <p className="card-value">{totalPatients}</p>
          </div>
        </div>

        <div className="manage-users-section panel-box">
          <h2>Manage Users</h2>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Loading users...</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.user_id}>
                      <td>{user.user_id}</td>
                      <td>{user.full_name}</td>
                      <td>{user.role}</td>
                      <td>{user.email}</td>
                      <td>Active</td>
                      <td>
                        <button className="action-button edit-button">Edit</button>
                        <button className="action-button delete-button">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;