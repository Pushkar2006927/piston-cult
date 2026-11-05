import React, { useState } from 'react';
import LandingPage from './landingpage';
import PistonCultAuth from './login';
import Dashboard from './dashboard';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'auth' | 'dashboard'
  const [currentUser, setCurrentUser] = useState(null);

  // EVERY route to the dashboard goes through here.
  // The user is only let in if a users/{uid} document exists in Firestore.
  const handleSuccessfulAuth = async (user) => {
    if (!user) {
      setCurrentUser(null);
      setCurrentView('auth');
      return;
    }

    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setCurrentUser(user);
        setCurrentView('dashboard');
        return;
      }
    } catch (err) {
      console.error('User verification failed:', err);
    }

    // Not in the database (or check failed): sign out and block access
    await signOut(auth).catch(() => {});
    setCurrentUser(null);
    setCurrentView('auth');
    alert('Access Denied: this account is not registered in the Syndicate database. Please register first.');
  };

  const handleLogout = async () => {
    await signOut(auth).catch(() => {});
    setCurrentUser(null);
    setCurrentView('landing');
  };

  if (currentView === 'landing') {
    return (
      <LandingPage
        onNavigateLogin={() => setCurrentView('auth')}
        onNavigateSignUp={() => setCurrentView('auth')}
        onNavigateDashboard={(user) => handleSuccessfulAuth(user)}
      />
    );
  }

  // Safety net: dashboard is never shown without a verified user
  if (currentView === 'dashboard' && currentUser) {
    return <Dashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setCurrentView('landing')}
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-[#0c1017] border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white cursor-pointer"
      >
        ← Back to Home
      </button>
      <PistonCultAuth onLoginSuccess={(user) => handleSuccessfulAuth(user)} />
    </div>
  );
}

export default App;