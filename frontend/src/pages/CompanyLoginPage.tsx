import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; // Make sure to install lucide-react
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logActivity } from '../lib/activityLogger';
import { verifyLoginSecurity } from '../lib/authSecurity';

// Placeholder components for logos - Replace with actual assets
const ZomatoLogo = () => (
  <h1 className="text-white text-8xl font-extrabold">
    zomato
  </h1>
);

const AmazonLogo = () => (
  <h1 className="text-black text-8xl font-extrabold">
    amazon
  </h1>
);

const CompanyLoginPage: React.FC = () => {
  const navigate = useNavigate();
  // Zomato Form State
  const [zomatoEmail, setZomatoEmail] = useState('');
  const [zomatoPassword, setZomatoPassword] = useState('');
  const [showZomatoPassword, setShowZomatoPassword] = useState(false);

  // Amazon Form State
  const [amazonEmail, setAmazonEmail] = useState('');
  const [amazonPassword, setAmazonPassword] = useState('');
  const [showAmazonPassword, setShowAmazonPassword] = useState(false);

  const [loadingCompany, setLoadingCompany] = useState<'zomato' | 'amazon' | null>(null);
  const [loginError, setLoginError] = useState<{ company: string, message: string } | null>(null);

  const handleLogin = async (
    email: string,
    password: string,
    company: 'zomato' | 'amazon'
  ) => {
    setLoadingCompany(company);
    setLoginError(null);

    console.log("=== DEBUG LOGIN FLOW ===");
    console.log("Email entered by the user:", email);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Firebase signInWithEmailAndPassword result: SUCCESS", user.uid);

      // Fetch MongoDB user to verify company
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      let mongoUser = null;
      try {
        const mongoRes = await fetch(`${backendUrl}/api/users/by-email/${encodeURIComponent(email)}`);
        if (mongoRes.ok) {
          mongoUser = await mongoRes.json();
        }
      } catch (backendErr) {
        console.warn("Backend unavailable to verify company in MongoDB (will continue):", backendErr);
      }

      console.log("MongoDB user document found for " + email + ":", mongoUser);

      const mongoCompany = (mongoUser?.company || 'unknown').toLowerCase();
      console.log("Company:", mongoCompany);
      console.log("Role:", mongoUser?.role);
      console.log("Warehouse ID:", mongoUser?.warehouseId || mongoUser?._id);

      // Ensure they don't cross companies (unless they are admin@secureguard.com which might be global)
      if (mongoCompany !== 'unknown' && email.toLowerCase() !== 'admin@secureguard.com') {
        if (mongoCompany !== company) {
          console.log("Validation failure: Company mismatch. Expected", company, "but got", mongoCompany);
          await auth.signOut();
          const niceCompany = mongoCompany === 'amazon' ? 'Amazon' : 'Zomato';
          setLoginError({ company, message: `This account belongs to ${niceCompany}. Please use the ${niceCompany} login.` });
          setLoadingCompany(null);
          return;
        }
      }

      // Clear previous cached state to ensure clean session
      localStorage.removeItem('company');
      localStorage.removeItem('user');
      sessionStorage.clear();

      // Store authenticated user information locally
      const activeCompany = mongoCompany !== 'unknown' ? mongoCompany : company;
      localStorage.setItem('company', activeCompany);
      localStorage.setItem('user', JSON.stringify({ email: user.email, uid: user.uid }));

      // Fetch role from Firestore, or create document if missing
      const isSystemAdmin = email.toLowerCase() === 'admin@secureguard.com';
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const lowerEmail = email.toLowerCase();
          const role = lowerEmail.includes('admin') ? 'admin' : (mongoUser?.role || 'user');
          await setDoc(userDocRef, {
            uid: user.uid,
            email: email,
            role: role,
            createdAt: new Date().toISOString()
          });
        }
      } catch (fsErr) {
        console.warn("Firestore user sync warning:", fsErr);
      }

      const securityCheck = await verifyLoginSecurity(user.uid, email);
      console.log("ROLE RECEIVED:", securityCheck.role);

      if (!securityCheck.allowed) {
        console.log("Validation failure: Login blocked by security policy.", securityCheck.reason);
        await auth.signOut();
        setLoginError({ company, message: securityCheck.reason || "Login blocked by security policy." });
        setLoadingCompany(null);
        return;
      }

      const resolvedRole = isSystemAdmin ? 'admin' : (securityCheck.role || 'user');

      if (resolvedRole === 'admin' || resolvedRole === 'warehouse' || resolvedRole === 'employee' || resolvedRole === 'restaurant') {
        const destination = `/${activeCompany}/dashboard`;
        console.log("Redirecting to:", destination);
        navigate(destination);
      } else if (resolvedRole === 'customer') {
        console.log(`[LOGIN] Redirecting to: /customer/dashboard`);
        navigate('/customer/dashboard');
      } else {
        console.log(`[LOGIN] Redirecting to: /user-dashboard`);
        navigate('/user-dashboard');
      }
    } catch (error: any) {
      console.log("Firebase signInWithEmailAndPassword result: FAILED");
      console.log("Exact Firebase error code (if any):", error.code);
      console.error(error);
      await logActivity('unknown', email, 'LOGIN_FAILED', error.message);
      let errorMessage = "An error occurred during login.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "User not found. Please check your email.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Wrong password. Please try again.";
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid credentials. Please check your email and password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      }
      setLoginError({ company, message: errorMessage });
    } finally {
      setLoadingCompany(null);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-row font-sans antialiased">
      {/* ========================================
        LEFT SIDE (ZOMATO) - Visual Fidelity Check
        ========================================
        1. Full height red gradient background.
        2. Scaled-down logo (h-[28px]).
        3. Compact typography.
        4. Constrained form width (~380px).
        5. Pure white, solid input backgrounds.
        6. Smaller border radius (rounded-lg).
        7. Shorter, wider login button.
      */}
      <div className="w-1/2 min-h-screen bg-gradient-to-b from-[#E03C42] to-[#BD1F25] flex flex-col justify-center items-center px-10 text-white">
        <div className="w-full max-w-[380px] -mt-16"> {/* Moved slightly upwards with -mt */}
          
          <div className="mb-10 text-center"> {/* Professional, improved spacing */}
            <ZomatoLogo />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Welcome Back! 👋</h1>
            <p className="text-[15px] opacity-90">
              Login to your Zomato account
            </p>
          </div>
          <form className="space-y-5">
            <div className="space-y-2">
              <label className="text-[13px] font-medium tracking-tight">Email address</label>
              <input
                type="email"
                value={zomatoEmail}
                onChange={(e) => setZomatoEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg text-gray-950 bg-white border border-gray-100 placeholder-gray-400 focus:outline-none focus:border-[#E03C42] focus:ring-1 focus:ring-[#E03C42] text-[15px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-medium tracking-tight">Password</label>
              <div className="relative">
                <input
                  type={showZomatoPassword ? 'text' : 'password'}
                  value={zomatoPassword}
                  onChange={(e) => setZomatoPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 rounded-lg text-gray-950 bg-white border border-gray-100 placeholder-gray-400 focus:outline-none focus:border-[#E03C42] focus:ring-1 focus:ring-[#E03C42] text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => setShowZomatoPassword(!showZomatoPassword)}
                  className="absolute inset-y-0 right-0 p-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showZomatoPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[14px] pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-4.5 w-4.5 text-[#E03C42] rounded border-gray-100 focus:ring-[#E03C42] cursor-pointer"
                />
                Remember me
              </label>
              <a href="#" className="font-medium hover:underline">
                Forgot Password?
              </a>
            </div>

            {loginError?.company === 'zomato' && (
              <p className="text-white bg-red-900 bg-opacity-50 p-2 rounded-lg text-[13px] text-center mt-2 border border-red-800">
                {loginError.message}
              </p>
            )}

            <button
              type="button"
              disabled={loadingCompany === 'zomato'}
              onClick={() =>
                handleLogin(
                  zomatoEmail,
                  zomatoPassword,
                  'zomato'
                )
              }
              className={`w-full mt-7 py-3 px-6 rounded-xl bg-white text-[#E03C42] font-bold text-[17px] transition active:scale-[0.98] ${loadingCompany === 'zomato' ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              {loadingCompany === 'zomato' ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>

      {/* ========================================
        RIGHT SIDE (AMAZON) - Visual Fidelity Check
        ========================================
        1. Full height yellow/orange gradient.
        2. Scaled-down logo (h-[28px]).
        3. Compact typography.
        4. Constrained form width (~380px).
        5. Pure white, solid input backgrounds.
        6. Smaller border radius (rounded-lg).
        7. Shorter, wider login button.
      */}
      <div className="w-1/2 min-h-screen bg-gradient-to-b from-[#F29F33] to-[#F1731F] flex flex-col justify-center items-center px-10 text-gray-950">
        <div className="w-full max-w-[380px] -mt-16"> {/* Moved slightly upwards with -mt */}
          
          <div className="mb-10 text-center"> {/* Professional, improved spacing */}
            <AmazonLogo />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Welcome Back! 👋</h1>
            <p className="text-[15px] text-gray-800">
              Login to your Amazon account
            </p>
          </div>
          <form className="space-y-5">
            <div className="space-y-2">
              <label className="text-[13px] font-medium tracking-tight">Email address</label>
              <input
                type="email"
                value={amazonEmail}
                onChange={(e) => setAmazonEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#F29F33] focus:ring-1 focus:ring-[#F29F33] text-[15px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-medium tracking-tight">Password</label>
              <div className="relative">
                <input
                  type={showAmazonPassword ? 'text' : 'password'}
                  value={amazonPassword}
                  onChange={(e) => setAmazonPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-white border border-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#F29F33] focus:ring-1 focus:ring-[#F29F33] text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => setShowAmazonPassword(!showAmazonPassword)}
                  className="absolute inset-y-0 right-0 p-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showAmazonPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[14px] pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-4.5 w-4.5 text-[#F1731F] rounded border-gray-200 focus:ring-[#F1731F] cursor-pointer"
                />
                Remember me
              </label>
              <a href="#" className="font-medium text-blue-700 hover:underline">
                Forgot Password?
              </a>
            </div>

            {loginError?.company === 'amazon' && (
              <p className="text-red-800 bg-red-100 p-2 rounded-lg text-[13px] text-center mt-2 border border-red-200">
                {loginError.message}
              </p>
            )}

            <button
              type="button"
              disabled={loadingCompany === 'amazon'}
              onClick={() =>
                handleLogin(
                  amazonEmail,
                  amazonPassword,
                  'amazon'
                )
              }
              className={`w-full mt-7 py-3 px-6 rounded-xl bg-white text-[#F1731F] font-bold text-[17px] border border-white transition active:scale-[0.98] ${loadingCompany === 'amazon' ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-100'}`}
            >
              {loadingCompany === 'amazon' ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyLoginPage;