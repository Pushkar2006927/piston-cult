import React, { useState, useEffect } from 'react';
import { Flame, Calendar, Clock, MapPin, Gauge, Car, User, CheckCircle2, ArrowRight, ArrowLeft, History, QrCode, Download } from 'lucide-react';
import './participateevent.css';

// Firebase Imports
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ParticipateEvent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation State: null means showing grid, object means showing the second page registration form
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Registration Form State
  const [driverName, setDriverName] = useState('');
  const [carModel, setCarModel] = useState('');
  const [mods, setMods] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState('');

  // 1. FETCH LIVE EVENTS FROM FIRESTORE
  useEffect(() => {
    const eventsQuery = query(collection(db, "events"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const liveEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(liveEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching live events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper function to normalize dates to midnight for accurate day-to-day comparison
  const normalizeDate = (dateInput) => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Helper function to calculate registration status based on event Date & Time
  const getEventStatus = (eventDate, eventTime) => {
    if (!eventDate || !eventTime) return { isOpen: true, statusText: 'Registration Open' };

    const now = new Date();
    const eventDateTime = new Date(`${eventDate}T${eventTime}:00`);
    const registrationDeadline = new Date(eventDateTime.getTime() - (60 * 60 * 1000)); // 1 hour before

    if (now > eventDateTime) {
      return { isOpen: false, statusText: 'Event Concluded', badgeColor: 'text-gray-500 bg-gray-500/10 border-gray-500/30' };
    } else if (now >= registrationDeadline) {
      return { isOpen: false, statusText: 'Registration Closed (1hr prior)', badgeColor: 'text-red-400 bg-red-500/10 border-red-500/30' };
    } else {
      return { isOpen: true, statusText: 'Registration Open', badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    }
  };

  // Robust Categorization using timestamp normalization
  const todayNormalized = normalizeDate(new Date());

  const activeEvents = events.filter(evt => {
    const evtNormalized = normalizeDate(evt.eventDate);
    return evtNormalized && evtNormalized.getTime() === todayNormalized?.getTime();
  });

  const upcomingEvents = events.filter(evt => {
    const evtNormalized = normalizeDate(evt.eventDate);
    return evtNormalized && evtNormalized.getTime() > todayNormalized?.getTime();
  });

  const previousEvents = events.filter(evt => {
    const evtNormalized = normalizeDate(evt.eventDate);
    return evtNormalized && evtNormalized.getTime() < todayNormalized?.getTime();
  });

  // 2. SUBMIT BUILD REGISTRATION TO FIRESTORE "participants" COLLECTION
  const handleParticipateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const status = getEventStatus(selectedEvent.eventDate, selectedEvent.eventTime);
    if (!status.isOpen) {
      alert("Registration for this meet has closed.");
      return;
    }

    setSubmitting(true);

    try {
      const docRef = await addDoc(collection(db, "participants"), {
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.eventTitle,
        eventDate: selectedEvent.eventDate,
        eventTime: selectedEvent.eventTime || 'N/A',
        location: selectedEvent.location,
        driverName: driverName,
        carModel: carModel,
        mods: mods,
        createdAt: serverTimestamp()
      });

      setRegistrationId(docRef.id);
      setSubmitted(true);
      setSubmitting(false);
    } catch (error) {
      console.error("Error registering build:", error);
      alert("Failed to secure pit pass. Check your connection.");
      setSubmitting(false);
    }
  };

  // Generate QR Code URL using free QR Server API
  const qrCodeData = encodeURIComponent(
    `PISTON CULT PIT PASS\nID: ${registrationId}\nEvent: ${selectedEvent?.eventTitle}\nDriver: ${driverName}\nCar: ${carModel}\nDate: ${selectedEvent?.eventDate}`
  );
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrCodeData}&color=000000&bgcolor=ffffff`;

  return (
    <div 
      className="piston-container text-white overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        backgroundImage: `linear-gradient(to bottom, rgba(7, 9, 13, 0.88), rgba(7, 9, 13, 0.96)), url('/Participateevent.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background Lighting Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/15 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-12 py-12 px-6">

        {/* CONDITIONAL VIEW: IF NO EVENT IS SELECTED, SHOW THE GRID */}
        {!selectedEvent ? (
          <>
            {/* Header Section */}
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Car className="w-7 h-7 animate-pulse" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">
                PARTICIPATE IN THE GRID
              </h1>
              <p className="text-xs md:text-sm text-gray-400 max-w-lg mx-auto">
                Select an active or upcoming underground meet to view schedule details and register your machine.
              </p>
            </div>

            {loading ? (
              <div className="text-center py-16 text-xs text-gray-500 animate-pulse">
                Loading live grid from satellite...
              </div>
            ) : events.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0c1017]/90 backdrop-blur-md border border-white/10 text-center text-xs text-gray-400">
                No car meets published yet. Host an event first to populate the grid!
              </div>
            ) : (
              <div className="space-y-12">
                
                {/* SECTION 1: ACTIVE MEETS (TODAY) */}
                <div className="space-y-4">
                  <h2 className="text-sm font-bold tracking-widest text-emerald-400 uppercase flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>ACTIVE MEETS TODAY ({activeEvents.length})</span>
                  </h2>

                  {activeEvents.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No active meets happening today.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeEvents.map((evt) => {
                        const status = getEventStatus(evt.eventDate, evt.eventTime);
                        return (
                          <div
                            key={evt.id}
                            onClick={() => setSelectedEvent(evt)}
                            className="p-5 rounded-2xl bg-[#0c1017]/90 backdrop-blur-md border border-emerald-500/30 hover:border-emerald-500 transition-all cursor-pointer relative overflow-hidden group shadow-lg"
                          >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
                            
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-black text-base text-white group-hover:text-emerald-400 transition-colors">{evt.eventTitle}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${status.badgeColor}`}>
                                {status.statusText}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs text-gray-400 mb-4">
                              <p className="flex items-center space-x-2">
                                <Calendar className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                <span>{evt.eventDate} (Today)</span>
                              </p>
                              {evt.eventTime && (
                                <p className="flex items-center space-x-2">
                                  <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                  <span>{evt.eventTime} IST</span>
                                </p>
                              )}
                              <p className="flex items-center space-x-2">
                                <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                <span className="truncate">{evt.location}</span>
                              </p>
                            </div>

                            <div className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                              <span>{status.isOpen ? 'Register Build' : 'View Meet Details'}</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SECTION 2: UPCOMING MEETS */}
                <div className="space-y-4">
                  <h2 className="text-sm font-bold tracking-widest text-amber-500 uppercase flex items-center space-x-2">
                    <Flame className="w-4 h-4" />
                    <span>UPCOMING MEETS ({upcomingEvents.length})</span>
                  </h2>

                  {upcomingEvents.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No upcoming future meets scheduled.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {upcomingEvents.map((evt) => (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className="p-5 rounded-2xl bg-[#0c1017]/90 backdrop-blur-md border border-white/10 hover:border-amber-500/50 transition-all cursor-pointer relative overflow-hidden group shadow-lg"
                        >
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-red-600"></div>
                          
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-black text-base text-white group-hover:text-amber-400 transition-colors">{evt.eventTitle}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border text-amber-400 bg-amber-500/10 border-amber-500/30">
                              Upcoming
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-gray-400 mb-4">
                            <p className="flex items-center space-x-2">
                              <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              <span>{evt.eventDate}</span>
                            </p>
                            {evt.eventTime && (
                              <p className="flex items-center space-x-2">
                                <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <span>{evt.eventTime} IST</span>
                              </p>
                            )}
                            <p className="flex items-center space-x-2">
                              <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                              <span className="truncate">{evt.location}</span>
                            </p>
                          </div>

                          <div className="text-[11px] font-bold text-amber-400 flex items-center space-x-1">
                            <span>Register Build</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION 3: PREVIOUS / CONCLUDED MEETS (READ-ONLY) */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase flex items-center space-x-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <span>PREVIOUS MEETS ARCHIVE ({previousEvents.length})</span>
                  </h2>

                  {previousEvents.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No previous events recorded.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {previousEvents.map((evt) => (
                        <div
                          key={evt.id}
                          className="p-5 rounded-2xl bg-[#0c1017]/50 backdrop-blur-md border border-white/5 opacity-60 relative overflow-hidden shadow-md cursor-not-allowed"
                        >
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-600"></div>
                          
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-black text-base text-gray-300">{evt.eventTitle}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border text-gray-400 bg-gray-500/10 border-gray-500/30">
                              Concluded
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-gray-500 mb-2">
                            <p className="flex items-center space-x-2">
                              <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                              <span>{evt.eventDate}</span>
                            </p>
                            {evt.eventTime && (
                              <p className="flex items-center space-x-2">
                                <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                <span>{evt.eventTime} IST</span>
                              </p>
                            )}
                            <p className="flex items-center space-x-2">
                              <MapPin className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                              <span className="truncate">{evt.location}</span>
                            </p>
                          </div>

                          <div className="text-[10px] font-bold text-gray-500 italic">
                            Registration Closed
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </>
        ) : (
          /* CONDITIONAL VIEW: SECOND PAGE (REGISTRATION FORM FOR SELECTED EVENT) */
          <div className="max-w-xl mx-auto space-y-6 pb-16">
            
            {/* Back Button */}
            <button
              onClick={() => { setSelectedEvent(null); setSubmitted(false); }}
              className="inline-flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer bg-[#0c1017]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10"
            >
              <ArrowLeft className="w-4 h-4 text-amber-500" />
              <span>Back to Event Grid</span>
            </button>

            {/* Event Summary Banner */}
            <div className="bg-[#0c1017]/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-red-600"></div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500">Selected Meet</span>
              <h2 className="text-xl font-black text-white mt-1 mb-3">{selectedEvent.eventTitle}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
                <p className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>{selectedEvent.eventDate}</span>
                </p>
                {selectedEvent.eventTime && (
                  <p className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{selectedEvent.eventTime} IST</span>
                  </p>
                )}
                <p className="flex items-center space-x-2 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>{selectedEvent.location}</span>
                </p>
              </div>
            </div>

            {/* Build Registration Form Card / Closed Banner */}
            <div className="bg-[#0c1017]/90 backdrop-blur-md border border-white/10 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500"></div>

              <h2 className="text-lg font-black tracking-wider uppercase text-white mb-6 flex items-center space-x-2">
                <Gauge className="w-5 h-5 text-amber-500" />
                <span>SECURE YOUR PIT PASS</span>
              </h2>

              {!getEventStatus(selectedEvent.eventDate, selectedEvent.eventTime).isOpen ? (
                <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-center text-red-300 space-y-3">
                  <h3 className="font-bold text-sm">Registration Closed</h3>
                  <p className="text-xs text-gray-300">
                    Registration for this meet closes strictly 1 hour prior to the event start time ({selectedEvent.eventTime}). Entries are locked.
                  </p>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Return to Event Grid
                  </button>
                </div>
              ) : submitted ? (
                <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
                  <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-400" />
                  <h3 className="font-bold text-sm text-emerald-300">Pit Pass Confirmed!</h3>
                  <p className="text-xs text-gray-300">
                    Your machine <span className="text-amber-400 font-semibold">{carModel}</span> is officially registered for <span className="text-white font-semibold">{selectedEvent.eventTitle}</span>.
                  </p>

                  {/* QR CODE DISPLAY BOX */}
                  <div className="bg-white p-4 rounded-xl inline-block shadow-lg mx-auto my-2">
                    <img src={qrCodeUrl} alt="Event Entry QR Code" className="w-36 h-36 mx-auto object-contain" />
                    <span className="block text-[10px] font-mono text-black font-bold mt-1 tracking-widest">ID: {registrationId.slice(0, 8).toUpperCase()}</span>
                  </div>

                  <p className="text-[11px] text-gray-400">
                    Present this entry QR code at the checkpoint gate upon arrival, or share it using the buttons below.
                  </p>

                  {/* Share on WhatsApp & Send via Email Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `🏁 *PISTON CULT PIT PASS CONFIRMED* 🏁\n\nEvent: ${selectedEvent.eventTitle}\nDriver: ${driverName}\nCar: ${carModel}\nDate: ${selectedEvent.eventDate}\nPass ID: ${registrationId}\n\nView/Download QR Code: ${qrCodeUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center space-x-2 transition-colors"
                    >
                      <span>Share on WhatsApp</span>
                    </a>

                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Your Pit Pass for ${selectedEvent.eventTitle}`)}&body=${encodeURIComponent(
                        `Hello ${driverName},\n\nYour pit pass for Piston Cult has been successfully confirmed!\n\nEvent: ${selectedEvent.eventTitle}\nDate: ${selectedEvent.eventDate} at ${selectedEvent.eventTime || 'N/A'}\nLocation: ${selectedEvent.location}\nCar: ${carModel}\nPass ID: ${registrationId}\n\nDirect QR Code Link: ${qrCodeUrl}\n\nSee you on the grid!`
                      )}`}
                      className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center space-x-2 transition-colors"
                    >
                      <span>Send via Email</span>
                    </a>

                    <div className="flex gap-2 pt-1">
                      <a
                        href={qrCodeUrl}
                        download={`PistonCult-PitPass-${registrationId}.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Download size={14} />
                        <span>Download QR</span>
                      </a>
                      <button
                        onClick={() => { setSelectedEvent(null); setSubmitted(false); }}
                        className="flex-1 py-2.5 bg-[#07090d] hover:bg-black text-gray-300 text-xs font-bold rounded-xl border border-white/10 transition-colors cursor-pointer"
                      >
                        Return to Grid
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleParticipateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1.5">
                      Driver Handle / Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="e.g. Alex Mercer"
                        className="w-full pl-10 pr-4 py-3 bg-[#07090d] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1.5">
                      Car Make & Model
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <Car className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={carModel}
                        onChange={(e) => setCarModel(e.target.value)}
                        placeholder="e.g. Nissan GT-R R34 V-Spec"
                        className="w-full pl-10 pr-4 py-3 bg-[#07090d] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1.5">
                      Key Mods / Build Spec
                    </label>
                    <textarea
                      value={mods}
                      onChange={(e) => setMods(e.target.value)}
                      placeholder="e.g. Stage 2 ECU, Borla Exhaust, KW V3 Coilovers..."
                      rows={3}
                      className="w-full px-4 py-3 bg-[#07090d] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-red-600 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>{submitting ? 'Transmitting Pass...' : 'Confirm Pit Pass'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}