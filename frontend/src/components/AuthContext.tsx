import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  role: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  role: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.isDisabled || data.isDeleted) {
              await auth.signOut();
              setCurrentUser(null);
              setRole(null);
              setLoading(false);
              return;
            }
            setRole(data.role || 'user');
          } else {
            setRole('user');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole('user');
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  console.log("AUTHCONTEXT USER:", currentUser?.uid);
  console.log("AUTHCONTEXT EMAIL:", currentUser?.email);
  console.log("AUTHCONTEXT ROLE:", role);
  console.log("AUTHCONTEXT LOADING:", loading);

  const logout = async () => {
    try {
      await auth.signOut();
      console.log("User logged out");
      
      localStorage.clear();
      console.log("Local storage cleared");
      
      sessionStorage.clear();
      console.log("Session storage cleared");
      
      setCurrentUser(null);
      setRole(null);
      
      console.log("Redirecting to login");
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, role, loading, logout }}>
      {/* Remove the !loading blocking here so routes can mount and check loading state explicitly */}
      {children}
    </AuthContext.Provider>
  );
};
