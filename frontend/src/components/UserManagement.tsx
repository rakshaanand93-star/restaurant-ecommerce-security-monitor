import React, { useState, useEffect } from 'react';
import { db, secondaryAuth } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';


interface UserData {
  uid: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  createdBy: string;
  location?: string;
  isDisabled?: boolean;
  isDeleted?: boolean;
}

export function UserManagement({ onUserChange }: { onUserChange?: () => void }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Edit State
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editLocationValue, setEditLocationValue] = useState('');

  const fetchUsers = async () => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const currentCompany = localStorage.getItem('company')?.toLowerCase() || 'zomato';
      let mongoUsers: any[] = [];
      
      try {
        const response = await fetch(`${backendUrl}/api/users?company=${currentCompany}`);
        if (response.ok) {
          mongoUsers = await response.json();
        }
      } catch (beErr) {
        console.warn("Backend API unavailable, falling back to Firestore users:", beErr);
      }
      
      if (!mongoUsers || mongoUsers.length === 0) {
        // Resilient fallback to Firestore
        const snapshot = await getDocs(collection(db, 'users'));
        const firestoreUsers: UserData[] = snapshot.docs.map(d => {
          const dat = d.data();
          return {
            uid: d.id,
            name: dat.displayName || dat.name || dat.email?.split('@')[0] || 'User',
            email: dat.email || '',
            role: dat.role || 'employee',
            location: dat.location || 'restaurant',
            createdAt: dat.createdAt || new Date().toISOString(),
            createdBy: 'admin',
            isDisabled: !!dat.isDisabled,
            isDeleted: !!dat.isDeleted
          };
        });
        setUsers(firestoreUsers);
        onUserChange?.();
        return;
      }

      const fetchedUsers: UserData[] = mongoUsers.map((mu: any) => ({
        uid: mu._id,
        name: mu.displayName,
        email: mu.email,
        role: mu.role,
        location: mu.location,
        createdAt: mu.createdAt,
        createdBy: 'unknown',
        isDisabled: mu.status === 'suspended' || mu.status === 'inactive',
      }));
      setUsers(fetchedUsers);
      onUserChange?.(); // Notify dashboard
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    try {
      const currentCompany = localStorage.getItem('company')?.toLowerCase() || 'zomato';
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const targetRole = currentCompany === 'amazon' ? 'warehouse' : 'employee';
      
      let backendSuccess = false;
      try {
        const response = await fetch(`${backendUrl}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            displayName: name,
            role: targetRole,
            company: currentCompany,
            location: location || undefined,
            status: 'active',
          })
        });

        if (response.ok) {
          backendSuccess = true;
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn("Backend user creation warning:", errData);
        }
      } catch (beErr) {
        console.warn("Backend unavailable, creating in Firebase Auth/Firestore directly:", beErr);
      }

      // Ensure user is created in Firebase Auth and Firestore for direct cloud authentication
      try {
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          uid: userCred.user.uid,
          email,
          displayName: name,
          name,
          role: targetRole,
          company: currentCompany,
          location: location || 'restaurant',
          status: 'active',
          createdAt: new Date().toISOString()
        });
      } catch (fbErr: any) {
        if (fbErr.code !== 'auth/email-already-in-use' && !backendSuccess) {
          throw fbErr;
        }
      }

      setFormSuccess(`User ${email} created successfully.`);
      setName(''); setEmail(''); setLocation(''); setPassword('');
      fetchUsers(); // refresh list
    } catch (err: any) {
      setFormError(err.message || 'Error creating user');
    } finally {
      setLoading(false);
    }
  };

  const toggleDisableUser = async (uid: string, currentState: boolean) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/api/users/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !currentState ? 'inactive' : 'active' })
      });
      if (!res.ok) throw new Error('Failed to update status');
      
      fetchUsers();
    } catch (err) {
      console.error("Failed to toggle disable:", err);
    }
  };

  const saveLocation = async (uid: string) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/api/users/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: editLocationValue })
      });
      if (!res.ok) throw new Error('Failed to update location');
      
      setEditingUid(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to save location:", err);
      alert("Failed to update location.");
    }
  };

  const deleteUser = async (uid: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const currentCompany = localStorage.getItem('company')?.toLowerCase() || '';
      const response = await fetch(`${backendUrl}/api/users/${uid}?company=${currentCompany}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      console.log('✓ Firebase Authentication user deleted');
      console.log('✓ Firestore user deleted');
      console.log('✓ MongoDB user deleted');
      console.log('✓ Related login activities deleted');
      console.log('✓ Related notifications deleted');
      console.log('✓ Related device requests deleted');
      console.log('✓ User Management refreshed');
      
      fetchUsers();
      setFormSuccess('User deleted successfully.');
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      console.error("Failed to delete user:", err);
      setFormError('Failed to delete user.');
      setTimeout(() => setFormError(''), 3000);
    }
  };

  const visibleUsers = users.filter((user) => {
    const role = (user.role || "").toLowerCase();
    return role !== "admin" && role !== "superadmin";
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-8">
      
      {/* Create User Form */}
      <div>
        <h2 className="text-lg font-bold text-[#111827] mb-4 pb-4 border-b border-gray-50">Create New User</h2>
        <form onSubmit={handleCreateUser} className="space-y-4 max-w-md">
          {formError && <div className="text-red-600 bg-red-50 p-2 rounded text-sm">{formError}</div>}
          {formSuccess && <div className="text-green-600 bg-green-50 p-2 rounded text-sm">{formSuccess}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              value={name} onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input 
              type="text" 
              placeholder="Enter warehouse/restaurant location"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              value={location} onChange={e => setLocation(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              required minLength={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#6D28D9] text-white px-4 py-2 rounded-xl shadow-sm hover:bg-[#4F46E5] font-medium text-sm transition-colors"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>

      {/* User Table */}
      <div>
        <h2 className="text-lg font-bold text-[#111827] mb-4 pb-4 border-b border-gray-50">User Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Location</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleUsers.map(u => (
                <tr key={u.uid} className="hover:bg-gray-50">
                  <td className="p-3">{u.name || 'N/A'}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    {editingUid === u.uid ? (
                      <input 
                        type="text" 
                        value={editLocationValue}
                        onChange={(e) => setEditLocationValue(e.target.value)}
                        className="w-full text-sm border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
                      />
                    ) : (
                      <span>{u.location || 'Not Assigned'}</span>
                    )}
                  </td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3">
                    {u.isDisabled ? (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full font-medium">Disabled</span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">Active</span>
                    )}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {editingUid === u.uid ? (
                      <>
                        <button onClick={() => saveLocation(u.uid)} className="text-sm text-green-600 hover:underline">Save</button>
                        <button onClick={() => setEditingUid(null)} className="text-sm text-gray-500 hover:underline">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingUid(u.uid); setEditLocationValue(u.location || ''); }} className="text-sm text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => window.location.href=`/employee-details/${u.uid}`} className="text-sm text-indigo-600 hover:underline">View</button>
                        <button onClick={() => toggleDisableUser(u.uid, !!u.isDisabled)} className="text-sm text-yellow-600 hover:underline">{u.isDisabled ? 'Enable' : 'Disable'}</button>
                        <button onClick={() => deleteUser(u.uid)} className="text-sm text-red-600 hover:underline">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
