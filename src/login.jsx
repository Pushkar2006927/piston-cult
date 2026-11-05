import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  Gauge,
  Flame,
  Calendar,
  Eye,
  EyeOff,
  Globe
} from 'lucide-react';
import './login.css';

// Firebase Imports
import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  updateProfile,
  deleteUser,
  signOut
} from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Login({ onLoginSuccess }) {
  const [isSignIn, setIsSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const NOT_REGISTERED_MSG =
    'Access Denied: This account is not registered in the Syndicate database. Please register first.';

  // Strict email format validation (rejects typos like @gmail.co)
  const isValidEmail = (emailStr) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailStr);
  };

  const friendlyAuthError = (error) => {
    console.error("Detailed Auth/Firestore Error:", error);
    if (error.code === 'permission-denied') {
      return 'Firestore Permission Denied: Check your database security rules in the Firebase Console.';
    }
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-email':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was cancelled.';
      default:
        return error.message;
    }
  };

  const finishLogin = (user, text) => {
    setStatusMessage({ type: 'success', text });
    setTimeout(() => {
      if (onLoginSuccess) onLoginSuccess(user);
    }, 800);
  };

  // Submit Handler with Database-First Verification
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    if (!isValidEmail(email)) {
      setStatusMessage({
        type: 'error',
        text: 'Invalid email format. Please enter a valid email address (e.g., ending in .com or .in).'
      });
      setLoading(false);
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    try {
      if (isSignIn) {
        // 1. STRICT CHECK: Query Firestore database FIRST by email before touching Auth
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', cleanEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setStatusMessage({ type: 'error', text: NOT_REGISTERED_MSG });
          setLoading(false);
          return;
        }

        // 2. Authenticate password with Firebase Auth only if found in Firestore
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        finishLogin(user, `Ignition successful! Welcome back, ${user.displayName || user.email}`);
      } else {
        // Register: check if email already exists in Firestore first
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', cleanEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setStatusMessage({ type: 'error', text: 'This email is already registered in the database. Please sign in instead.' });
          setLoading(false);
          return;
        }

        // Create Auth account, then the database record
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        try {
          await updateProfile(user, { displayName: fullName });
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            fullName: fullName,
            email: cleanEmail,
            dob: dob,
            createdAt: serverTimestamp()
          });
        } catch (dbError) {
          // Don't leave an Auth account without a database record
          await deleteUser(user).catch(() => {});
          throw dbError;
        }

        finishLogin(user, 'Pit pass generated! Profile created in database.');
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: friendlyAuthError(error) });
      setLoading(false);
    }
  };

  // Google Popup Sign-In with Database Verification
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    setStatusMessage(null);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const cleanEmail = user.email.toLowerCase().trim();
      const isNewAuthUser = getAdditionalUserInfo(result)?.isNewUser;

      // Check if email exists in database
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        finishLogin(user, `Welcome back, ${user.displayName || user.email}! Authenticated via Google.`);
        return;
      }

      // Not in database yet
      if (!isSignIn) {
        // On the REGISTER tab: create their database record now
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          fullName: user.displayName || fullName || '',
          email: cleanEmail,
          dob: dob || '',
          createdAt: serverTimestamp()
        });
        finishLogin(user, 'Pit pass generated via Google! Profile created in database.');
        return;
      }

      // On the SIGN IN tab: reject, and remove the Auth account Google just created if it was new
      if (isNewAuthUser) {
        await deleteUser(user).catch(() => {});
      }
      await signOut(auth);
      setStatusMessage({ type: 'error', text: NOT_REGISTERED_MSG });
      setLoading(false);
    } catch (error) {
      setStatusMessage({ type: 'error', text: friendlyAuthError(error) });
      setLoading(false);
    }
  };

  return (
    <div className="piston-container">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-red-600/15 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-[130px]"></div>
        <div className="absolute inset-0 piston-grid"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-[#07090d]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 text-black fill-black" />
            </div>
            <div>
              <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-gray-200 to-amber-400 bg-clip-text text-transparent">
                PISTON CULT
              </span>
              <span className="block text-[10px] tracking-widest text-amber-500 font-bold uppercase">
                Automotive Syndicate
              </span>
            </div>
          </div>

          {/* <div className="hidden md:flex items-center space-x-6 text-xs tracking-wider text-gray-400 font-medium">
            <span className="flex items-center space-x-1.5 hover:text-amber-400 transition-colors">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>EVENT CALENDAR</span>
            </span>
          </div> */}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-[#0c1017]/90 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500"></div>

            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3 shadow-inner">
                <Gauge className="w-6 h-6 animate-pulse" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                {isSignIn ? 'ACCESS THE GRID' : 'JOIN THE CULT'}
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                {isSignIn
                  ? 'Enter your credentials to manage your garage & meet passes.'
                  : 'Register your build and secure access to exclusive underground meets.'}
              </p>
            </div>

            {/* Toggle Switch Tabs */}
            <div className="grid grid-cols-2 p-1 bg-[#07090d] rounded-xl border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => { setIsSignIn(true); setStatusMessage(null); }}
                className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isSignIn
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => { setIsSignIn(false); setStatusMessage(null); }}
                className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  !isSignIn
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                REGISTER
              </button>
            </div>

            {/* Status Feedback Message */}
            {statusMessage && (
              <div className={`mb-6 p-3.5 rounded-xl border text-xs flex items-center space-x-2.5 animate-fadeIn ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isSignIn && (
                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full pl-10 pr-4 py-3 bg-[#07090d] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1.5">
                  Syndicate Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="driver@pistoncult.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#07090d] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1.5">
                  Password / Passkey
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-[#07090d] border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isSignIn && (
                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1.5">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#07090d] border border-white/10 rounded-xl text-xs text-white [color-scheme:dark] focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 group cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Processing Ignition...' : (isSignIn ? 'Fire Up Engines' : 'Secure Pit Pass')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Quick Staging Section */}
            <div className="mt-6">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                  Quick Staging Via
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full mt-3 py-3 px-4 bg-white text-black hover:bg-gray-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
              >
                <Globe className="w-4 h-4 text-black" />
                <span>Continue with Google</span>
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center border-t border-white/5 bg-[#07090d]">
        <p className="text-[11px] text-gray-500 tracking-wider">
          © {new Date().getFullYear()} PISTON CULT AUTOMOTIVE SYNDICATE. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}