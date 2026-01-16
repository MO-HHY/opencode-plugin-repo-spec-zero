import React, { useEffect, useState } from 'react';
import UserList from './components/UserList';

export default function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  return (
    <div>
      <h1>User Management</h1>
      <UserList users={users} />
    </div>
  );
}
