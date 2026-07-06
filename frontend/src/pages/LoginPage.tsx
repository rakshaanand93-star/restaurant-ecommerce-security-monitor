import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { logActivity } from "../lib/activityLogger";
import { verifyLoginSecurity } from "../lib/authSecurity";
import { useAuth } from "../components/AuthContext";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const { currentUser, role } = useAuth();

  useEffect(() => {
    if (currentUser && role) {
      console.log("Navigating to dashboard (auto-restore)");
      const userRole = role.toUpperCase();
      if (userRole === 'ADMIN') navigate('/admin/dashboard');
      else if (userRole === 'MANAGER') navigate('/manager/dashboard');
      else if (userRole === 'EMPLOYEE') navigate('/employee/dashboard');
      else if (userRole === 'CUSTOMER') navigate('/customer/dashboard');
      else navigate('/user-dashboard'); // Fallback
    }
  }, [currentUser, role, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Login button clicked");
      console.log("Attempting Firebase login");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("LOGIN SUCCESS");
      console.log("CURRENT USER UID:", userCredential.user.uid);
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      console.log("USER DOC EXISTS:", userDoc.exists());
      
      if (!userDoc.exists()) {
        await auth.signOut();
        setError("No user profile found in Firestore");
        setIsLoading(false);
        return;
      }

      const userData = userDoc.data();
      console.log("USER DATA:", userData);

      const fetchedRole = userData?.role?.toLowerCase() || "user";
      console.log("ROLE FOUND:", fetchedRole);
      
      // Skip device approval security check for customers
      if (fetchedRole !== 'customer') {
        const securityCheck = await verifyLoginSecurity(userCredential.user.uid, email);
        if (!securityCheck.allowed) {
          await auth.signOut();
          setError(securityCheck.reason || "Login blocked by security policy.");
          setIsLoading(false);
          return;
        }
      }
      
      setSuccess("Logged in successfully! Redirecting...");
      
      try {
        let route = "/user-dashboard";
        if (fetchedRole === 'admin') {
          route = "/admin/dashboard";
        } else if (fetchedRole === 'manager') {
          route = "/manager/dashboard";
        } else if (fetchedRole === 'employee') {
          route = "/employee/dashboard";
        } else if (fetchedRole === 'customer') {
          route = "/customer/dashboard";
        }
        
        console.log("NAVIGATING TO:", route);
        navigate(route);

      } catch (navErr: any) {
        console.error("Navigation failed:", navErr);
      }

    } catch (err: any) {
      await logActivity('unknown', email, 'LOGIN_FAILED', err.message);
      setError(err.message); // Show actual Firebase error
      console.error("Firebase login failed:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Log In</h2>

      {error && <div style={{ color: "red", marginBottom: "15px" }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: "15px" }}>{success}</div>}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="email" style={{ display: "block", marginBottom: "5px" }}>Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" , color:"black"}}
            disabled={isLoading}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="password" style={{ display: "block", marginBottom: "5px" }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "8px", boxSizing: "border-box", color:"black"}}
            disabled={isLoading}
          />
        </div>

        <button type="submit" style={{ width: "100%", padding: "10px", cursor: "pointer" }} disabled={isLoading}>
          {isLoading ? "Logging in..." : "Log In"}
        </button>
      </form>

      {currentUser && (
        <div style={{ position: 'fixed', bottom: 10, right: 10, background: 'black', color: 'lime', padding: '15px', borderRadius: '8px', zIndex: 9999, fontFamily: 'monospace', fontSize: '12px' }}>
          <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid lime', paddingBottom: '5px' }}>Debug Panel</h4>
          <p style={{ margin: '5px 0' }}>UID: {currentUser.uid}</p>
          <p style={{ margin: '5px 0' }}>Email: {currentUser.email}</p>
          <p style={{ margin: '5px 0' }}>Role: {role || 'fetching...'}</p>
          <p style={{ margin: '5px 0' }}>Current Route: {window.location.pathname}</p>
        </div>
      )}
    </div>
  );
};
export default LoginPage;