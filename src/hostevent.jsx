import React, { useState } from 'react';
import { Flame, Calendar, Clock, MapPin, Gauge, PlusCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import './hostevent.css';

// Firebase Database Instance & Firestore Functions
import { db } from './firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function HostEvent() {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [success, setSuccess] = useState(false);

  // Indian meet locations for the dropdown
  const indianLocations = [
    'Bandra-Worli Sea Link Promenade, Mumbai',
    'BKC Underground Parking Lot, Mumbai',
    'Buddh International Circuit, Greater Noida (NCR)',
    'Nandi Hills Foothills, Bengaluru',
    'UB City Outer Plaza, Bengaluru',
    'Aamby Valley Airstrip, Lonavala / Pune',
    'Gachibowli Outer Ring Road, Hyderabad',
    'ECR Coastal Highway, Chennai',
    'Formula 1 Street Track Precinct, Hyderabad'
  ];

  // Async function to save data including time to Firestore
  const handleHostSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await addDoc(collection(db, "events"), {
        eventTitle: eventTitle,
        eventDate: eventDate,
        eventTime: eventTime,
        location: location,
        createdAt: serverTimestamp()
      });

      setSuccess(true);
    } catch (error) {
      console.error("Error adding event to Firestore: ", error);
      alert("Failed to publish meet. Check your connection.");
    }
  };

  return (
    <div 
      className="piston-container text-white overflow-y-auto flex flex-col"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        backgroundImage: `linear-gradient(to bottom, rgba(7, 9, 13, 0.88), rgba(7, 9, 13, 0.96)), url('/Hostevent.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background ambient lighting overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/20 rounded-full blur-[140px]"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <div className="piston-card bg-[#0c1017]/90 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500"></div>

            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
                <PlusCircle className="w-6 h-6 animate-pulse" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">HOST A CAR MEET</h1>
              <p className="text-xs text-gray-400 mt-1">Set the coordinates, marshal the builds, and ignite the syndicate.</p>
            </div>

            {success ? (
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center text-emerald-300">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <h3 className="font-bold text-sm">Meet Published to Grid!</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Time & Location locked: <span className="text-amber-400 font-semibold">{eventTime} at {location}</span>
                </p>
              </div>
            ) : (
              <form onSubmit={handleHostSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1.5">Meet Title / Club Name</label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="e.g. Midnight Underground Meet"
                    className="w-full px-4 py-3 bg-[#07090d]/80 backdrop-blur-md border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* 3-Column Grid for Date, Time, and Location */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1.5">Meet Date</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-4 py-3 bg-[#07090d]/80 backdrop-blur-md border border-white/10 rounded-xl text-xs text-white [color-scheme:dark] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1.5">Meet Time</label>
                    <input
                      type="time"
                      required
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full px-4 py-3 bg-[#07090d]/80 backdrop-blur-md border border-white/10 rounded-xl text-xs text-white [color-scheme:dark] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1.5">Location (India)</label>
                    <div className="relative">
                      <select
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-4 py-3 bg-[#07090d]/80 backdrop-blur-md border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="bg-[#0c1017]">Select Hub</option>
                        {indianLocations.map((loc, index) => (
                          <option key={index} value={loc} className="bg-[#0c1017] text-white">
                            {loc}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                        <MapPin className="w-4 h-4 text-amber-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-red-600 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center space-x-2">
                  <span>Publish Meet Grid</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}