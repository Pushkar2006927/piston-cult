import React, { useState, useEffect } from 'react';
import { Camera, Upload, Image as ImageIcon, Calendar, MapPin, X, Trash2 } from 'lucide-react';
import './gallery.css';

// Firebase Imports
import { db, auth } from './firebase';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Get currently authenticated user's ID
  const currentUser = auth.currentUser;

  // 1. Fetch live gallery photos from Firestore in real-time
  useEffect(() => {
    const photosQuery = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    
    const unsubscribePhotos = onSnapshot(photosQuery, (snapshot) => {
      const livePhotos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPhotos(livePhotos);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching gallery photos:", error);
      setLoading(false);
    });

    return () => unsubscribePhotos();
  }, []);

  // 2. Fetch live events from Firestore for the dropdown
  useEffect(() => {
    const eventsQuery = query(collection(db, "events"), orderBy("createdAt", "desc"));
    
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const liveEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(liveEvents);
      setLoadingEvents(false);
    }, (error) => {
      console.error("Error fetching events for gallery:", error);
      setLoadingEvents(false);
    });

    return () => unsubscribeEvents();
  }, []);

  // Find currently selected event object to display its fetched location preview
  const selectedEvent = events.find(evt => evt.id === selectedEventId);

  // Handle image selection and convert to permanent Base64 string
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result); // Base64 string data URL
      };
      reader.readAsDataURL(file);
    }
  };

  // 3. Save photo data, Base64 image string, and uploader's userId to Firestore
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!previewUrl || !selectedEvent) return;

    setUploading(true);

    try {
      await addDoc(collection(db, "gallery"), {
        title: selectedEvent.eventTitle,
        location: selectedEvent.location,
        date: selectedEvent.eventDate,
        image: previewUrl,
        userId: currentUser ? currentUser.uid : 'anonymous', // Store uploader's unique UID
        userEmail: currentUser ? currentUser.email : 'Anonymous Driver',
        createdAt: serverTimestamp()
      });

      setSelectedEventId('');
      setPreviewUrl('');
      setShowUploadModal(false);
      setUploading(false);
    } catch (error) {
      console.error("Error saving photo to Firestore:", error);
      alert("Failed to upload photo. Check your connection or file size.");
      setUploading(false);
    }
  };

  // 4. Delete photo from Firestore database (Only if current user is the owner)
  const handleDeletePhoto = async (photoUserId, photoId) => {
    if (currentUser && currentUser.uid !== photoUserId) {
      alert("Unauthorized: You can only delete photos that you uploaded from your own account.");
      return;
    }

    if (window.confirm("Are you sure you want to remove this photo from the gallery archive?")) {
      try {
        await deleteDoc(doc(db, "gallery", photoId));
      } catch (error) {
        console.error("Error deleting photo:", error);
        alert("Failed to delete photo.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn py-6">
      {/* Header & Upload Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0c1017] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500"></div>
        <div>
          <div className="inline-flex p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2">
            <Camera className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">Syndicate Event Gallery</h2>
          <p className="text-xs text-gray-400 mt-1">Explore captured moments from previous runs, track days, and underground meets.</p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-red-600 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer hover:opacity-95 transition-opacity"
        >
          <Upload size={16} />
          <span>Upload Event Photo</span>
        </button>
      </div>

      {/* Photo Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-gray-500 animate-pulse">
          Syncing gallery archive from database...
        </div>
      ) : photos.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#0c1017] border border-white/10 text-center space-y-3">
          <ImageIcon size={48} className="mx-auto text-gray-600" />
          <h3 className="font-bold text-sm text-white">No Archive Photos Yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            The gallery is currently empty. Click the button above to link snapshots to your published meets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((item) => {
            // Check if the logged-in user owns this photo
            const isOwner = currentUser && item.userId === currentUser.uid;

            return (
              <div key={item.id} className="bg-[#0c1017] border border-white/10 rounded-2xl overflow-hidden group shadow-lg relative">
                
                {/* Delete Button (Appears on Hover ONLY for the Owner) */}
                {isOwner && (
                  <button
                    onClick={() => handleDeletePhoto(item.userId, item.id)}
                    className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                    title="Delete your photo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c1017] via-transparent to-transparent opacity-80"></div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-base text-white group-hover:text-amber-400 transition-colors">{item.title}</h3>
                    {item.userEmail && (
                      <span className="text-[10px] text-gray-500 bg-black/40 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                        By: {item.userEmail.split('@')[0]}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span>{item.date}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal with Event Dropdown & Fetched Location */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0c1017] border border-amber-500/30 rounded-2xl p-6 w-full max-w-lg relative shadow-2xl">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-1">Upload Event Snapshot</h3>
            <p className="text-xs text-gray-400 mb-6">Select a published meet from the database to automatically fetch its location.</p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1.5">Select Meet / Event</label>
                <select
                  required
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#07090d] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    {loadingEvents ? 'Loading events...' : '-- Choose Meet from Database --'}
                  </option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id} className="bg-[#0c1017] text-white">
                      {evt.eventTitle} ({evt.eventDate})
                    </option>
                  ))}
                </select>
              </div>

              {/* Automatically Display Fetched Location Preview */}
              {selectedEvent && (
                <div className="p-3.5 rounded-xl bg-[#07090d] border border-amber-500/20 text-xs space-y-1">
                  <span className="block text-[10px] font-bold tracking-widest text-amber-500 uppercase">Fetched Location Preview</span>
                  <p className="flex items-center space-x-2 text-gray-300 font-semibold">
                    <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{selectedEvent.location}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1.5">Select Photo File</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 bg-[#07090d] border border-white/10 rounded-xl text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer"
                />
              </div>

              {previewUrl && (
                <div className="relative h-36 rounded-xl overflow-hidden border border-white/10">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-red-600 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer mt-2 disabled:opacity-50"
              >
                {uploading ? 'Publishing to Database...' : 'Publish to Gallery Archive'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}