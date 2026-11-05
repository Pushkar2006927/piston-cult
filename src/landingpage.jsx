import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Gauge,
  Calendar,
  Users,
  Shield,
  ArrowRight,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MapPin,
  ShoppingBag,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';
import './landingpage.css';

export default function LandingPage({ onNavigateLogin, onNavigateSignUp, onNavigateDashboard }) {
  // Navigation State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Video State
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef(null);

  // Interactive Tachometer & Web Audio Engine Sound
  const [rpm, setRpm] = useState(900); // Idle 900 RPM
  const [isRevving, setIsRevving] = useState(false);
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);
  const revIntervalRef = useRef(null);

  // Video Toggle Handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsVideoMuted(videoRef.current.muted);
    }
  };

  // Web Audio Synthesizer for Engine Rev Sound (100% zero external audio files)
  const startEngineAudio = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, ctx.currentTime); // Low rumble

      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  };

  const stopEngineAudio = () => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch (e) {}
      oscRef.current = null;
    }
  };

  const handleRevStart = () => {
    setIsRevving(true);
    startEngineAudio();

    if (revIntervalRef.current) clearInterval(revIntervalRef.current);
    revIntervalRef.current = setInterval(() => {
      setRpm((prev) => {
        const next = Math.min(8800, prev + 240);
        if (oscRef.current && audioCtxRef.current) {
          const freq = 65 + (next / 8800) * 220;
          oscRef.current.frequency.setTargetAtTime(freq, audioCtxRef.current.currentTime, 0.05);
        }
        return next;
      });
    }, 40);
  };

  const handleRevEnd = () => {
    setIsRevving(false);
    if (revIntervalRef.current) clearInterval(revIntervalRef.current);

    revIntervalRef.current = setInterval(() => {
      setRpm((prev) => {
        if (prev <= 950) {
          clearInterval(revIntervalRef.current);
          stopEngineAudio();
          return 900;
        }
        const next = Math.max(900, prev - 380);
        if (oscRef.current && audioCtxRef.current) {
          const freq = 65 + (next / 8800) * 220;
          oscRef.current.frequency.setTargetAtTime(freq, audioCtxRef.current.currentTime, 0.05);
        }
        return next;
      });
    }, 40);
  };

  useEffect(() => {
    return () => {
      if (revIntervalRef.current) clearInterval(revIntervalRef.current);
      stopEngineAudio();
    };
  }, []);

  // Login / Sign Up now hand off to YOUR existing login & signup screens
  const goLogin = () => {
    setMobileMenuOpen(false);
    if (onNavigateLogin) onNavigateLogin();
  };

  const goSignUp = () => {
    setMobileMenuOpen(false);
    if (onNavigateSignUp) onNavigateSignUp();
  };

  const scrollToAbout = () => {
    setMobileMenuOpen(false);
    const elem = document.getElementById('about-section');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-root">
      {/* Dynamic Background Noise & Ambient Embers */}
      <div className="landing-ambient-orbs" aria-hidden="true">
        <div className="ambient-orb orb-amber"></div>
        <div className="ambient-orb orb-red"></div>
        <div className="ambient-orb orb-purple"></div>
        <div className="piston-grid-pattern"></div>
      </div>

      {/* Floating Spark Embers */}
      <div className="embers-container" aria-hidden="true">
        {[...Array(14)].map((_, i) => (
          <span key={i} className={`ember ember-${i + 1}`} />
        ))}
      </div>

      {/* =========================================================
          TOP NAVIGATION BAR
          ========================================================= */}
      <header className="landing-nav-header">
        <div className="landing-nav-inner">
          {/* Brand Logo */}
          <a href="#hero" className="landing-brand">
            <div className="landing-brand-badge">
              <Flame className="w-5 h-5 text-black fill-black" />
            </div>
            <div className="landing-brand-text">
              <span className="brand-title">PISTON CULT</span>
              <span className="brand-subtitle">AUTOMOTIVE SYNDICATE</span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="landing-nav-links">
            <a href="./hostevent" className="nav-link">Meets</a>
            <a href="./participateevent" className="nav-link">ParticipateEvent</a>
            <a href="./marketplace" className="nav-link">Marketplace</a>
            <button type="button" onClick={scrollToAbout} className="nav-link-btn">
              About Us
            </button>
          </nav>

          {/* Desktop Action Buttons (Login & Sign Up) */}
          <div className="landing-nav-actions">
            <button
              type="button"
              className="btn-login"
              onClick={goLogin}
            >
              Login
            </button>
            <button
              type="button"
              className="btn-signup"
              onClick={goSignUp}
            >
              <span>Sign Up</span>
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className="mobile-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="mobile-drawer animate-slideDown">
            <a href="#meets" onClick={() => setMobileMenuOpen(false)}>Meets & Runs</a>
            <a href="#garage" onClick={() => setMobileMenuOpen(false)}>Garage Simulator</a>
            <a href="#marketplace" onClick={() => setMobileMenuOpen(false)}>Tuner Marketplace</a>
            <button type="button" onClick={scrollToAbout}>About Us</button>
            <div className="mobile-drawer-buttons">
              <button
                type="button"
                className="btn-login w-full py-2.5 text-center"
                onClick={goLogin}
              >
                Login
              </button>
              <button
                type="button"
                className="btn-signup w-full py-2.5 text-center"
                onClick={goSignUp}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================
          HERO SECTION WITH VIDEO BACKGROUND & ACTION CTA
          ========================================================= */}
      <section id="hero" className="landing-hero">
        {/* Background Video with Gradient Fallback */}
        <div className="hero-video-container">
          <video
            ref={videoRef}
            className="hero-video"
            autoPlay
            loop
            muted={isVideoMuted}
            playsInline
            poster="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80"
          >
            {/* High-speed automotive royalty-free video loop */}
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-sports-car-driving-on-a-road-at-night-42828-large.mp4"
              type="video/mp4"
            />
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-car-driving-through-a-city-at-night-42826-large.mp4"
              type="video/mp4"
            />
          </video>
          {/* Video Darkening Gradients */}
          <div className="hero-video-overlay"></div>
        </div>

        {/* Video Player Floating Controls */}
        <div className="video-controls-floating">
          <button
            type="button"
            onClick={togglePlay}
            className="video-ctrl-btn"
            title={isVideoPlaying ? 'Pause video' : 'Play video'}
          >
            {isVideoPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="video-ctrl-btn"
            title={isVideoMuted ? 'Unmute video' : 'Mute video'}
          >
            {isVideoMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>

        {/* Hero Content */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            <span className="badge-text">SEASON 2026 STAGING OPEN</span>
          </div>

          <h1 className="hero-title">
            DRIVEN BY PASSION <br />
            <span className="hero-title-highlight">DEFINED BY PERFORMANCE</span>
          </h1>

          <p className="hero-tagline">
            The elite underworld for car collectors, weekend track drivers, and garage builders
            Coordinate underground night cruises, secure circuit track passes, and trade certified aftermarket aero
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="btn-primary-glow"
              onClick={goSignUp}
            >
              <span>REGISTER YOUR BUILD</span>
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className="btn-secondary-outline"
              onClick={() => (onNavigateDashboard ? onNavigateDashboard() : scrollToAbout())}
            >
              <span>EXPLORE DASHBOARD</span>
              <ExternalLink size={16} />
            </button>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="hero-stats-grid">
            <div className="hero-stat-card">
              <span className="stat-number">14,200+</span>
              <span className="stat-label">Syndicate Drivers</span>
            </div>
            <div className="hero-stat-card">
              <span className="stat-number">380+</span>
              <span className="stat-label">Sanctioned Meets</span>
            </div>
            <div className="hero-stat-card">
              <span className="stat-number">9,000</span>
              <span className="stat-label">Max Redline RPM</span>
            </div>
            <div className="hero-stat-card">
              <span className="stat-number">₹4.8 Cr+</span>
              <span className="stat-label">Parts Traded</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          INTERACTIVE GARAGE SIMULATOR (TACHOMETER & ENGINE REV)
          ========================================================= */}
      <section id="garage" className="landing-section garage-section">
        <div className="section-header">
          <p className="section-eyebrow">INTERACTIVE TELEMETRY</p>
          <h2 className="section-title">TEST YOUR IGNITION</h2>
          <p className="section-description">
            Press and hold the throttle below to spool the turbocharger, spin the tachometer needle,
            and hear the exhaust note live in your browser.
          </p>
        </div>

        <div className="tachometer-console">
          {/* RPM Dial */}
          <div className="tacho-dial">
            <div className="tacho-center-pin"></div>
            <div
              className="tacho-needle"
              style={{
                transform: `rotate(${-120 + (rpm / 9000) * 240}deg)`
              }}
            ></div>

            {/* Shift Lights Bar */}
            <div className="shift-lights-bar">
              <span className={`shift-dot ${rpm > 3500 ? 'active-green' : ''}`}></span>
              <span className={`shift-dot ${rpm > 5000 ? 'active-green' : ''}`}></span>
              <span className={`shift-dot ${rpm > 6500 ? 'active-amber' : ''}`}></span>
              <span className={`shift-dot ${rpm > 7800 ? 'active-red' : ''}`}></span>
              <span className={`shift-dot ${rpm > 8400 ? 'active-red flashing' : ''}`}></span>
            </div>

            {/* Dial Labels */}
            <div className="tacho-labels">
              <span>0</span>
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span className="redline-text">8</span>
              <span className="redline-text">9</span>
            </div>

            {/* Digital Readout */}
            <div className="tacho-readout">
              <div className="readout-val">{(rpm).toLocaleString()}</div>
              <div className="readout-unit">RPM x 1000</div>
            </div>
          </div>

          {/* Rev Controller Pedal / Button */}
          <div className="tacho-controls">
            <div className="tacho-specs">
              <div className="spec-item">
                <span className="spec-label">STATUS</span>
                <span className={`spec-value ${isRevving ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isRevving ? 'WIDE OPEN THROTTLE' : 'IDLE STAGED'}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">BOOST PRESSURE</span>
                <span className="spec-value">{isRevving ? ((rpm / 9000) * 2.4).toFixed(1) + ' BAR' : '0.1 BAR'}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">EXHAUST TEMP</span>
                <span className="spec-value">{Math.round(480 + (rpm / 9000) * 360)} °C</span>
              </div>
            </div>

            <button
              type="button"
              className={`rev-pedal-button ${isRevving ? 'revving-active' : ''}`}
              onMouseDown={handleRevStart}
              onMouseUp={handleRevEnd}
              onTouchStart={handleRevStart}
              onTouchEnd={handleRevEnd}
              onMouseLeave={handleRevEnd}
            >
              <Gauge className="w-6 h-6 mr-2" />
              <span>{isRevving ? 'HOLDING FULL THROTTLE...' : 'PRESS & HOLD TO REV ENGINE'}</span>
            </button>
            <p className="rev-pedal-hint">Works on touchscreens or with mouse click</p>
          </div>
        </div>
      </section>

      {/* =========================================================
          MEETS & RUNS SHOWCASE (PHOTO GALLERY)
          ========================================================= */}
      <section id="meets" className="landing-section meets-section">
        <div className="section-header">
          <p className="section-eyebrow">UPCOMING RUNS</p>
          <h2 className="section-title">THE STREETS & CIRCUITS ARE WAITING</h2>
          <p className="section-description">
            From midnight high-speed coastal sprints to sanctioned international track days,
            gain pit access to the most exclusive automotive gatherings.
          </p>
        </div>

        <div className="meets-cards-grid">
          {/* Card 1 */}
          <div className="meet-card group">
            <div className="meet-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80"
                alt="Midnight Sea Link Cruise"
                className="meet-image"
              />
              <span className="meet-tag">STREET CRUISE</span>
            </div>
            <div className="meet-body">
              <div className="meet-meta">
                <span className="meet-date">
                  <Calendar size={13} /> Nov 05, 2026
                </span>
                <span className="meet-spots">4 Pit Passes Left</span>
              </div>
              <h3 className="meet-name">Midnight Sea Link Cruise</h3>
              <p className="meet-loc">
                <MapPin size={13} /> Bandra-Worli Sea Link Promenade, Mumbai
              </p>
              <div className="meet-footer">
                <span className="meet-car-type">Euro & JDM Imports</span>
                <button
                  type="button"
                  className="meet-action-btn"
                  onClick={goSignUp}
                >
                  Join Grid →
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="meet-card group">
            <div className="meet-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80"
                alt="BIC Track Day Staging"
                className="meet-image"
              />
              <span className="meet-tag tag-track">CIRCUIT STAGING</span>
            </div>
            <div className="meet-body">
              <div className="meet-meta">
                <span className="meet-date">
                  <Calendar size={13} /> Nov 12, 2026
                </span>
                <span className="meet-spots">12 Pit Passes Left</span>
              </div>
              <h3 className="meet-name">BIC Track Day Staging</h3>
              <p className="meet-loc">
                <MapPin size={13} /> Buddh International Circuit, Greater Noida
              </p>
              <div className="meet-footer">
                <span className="meet-car-type">Supercars & Track Prepped</span>
                <button
                  type="button"
                  className="meet-action-btn"
                  onClick={goSignUp}
                >
                  Join Grid →
                </button>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="meet-card group">
            <div className="meet-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80"
                alt="Nandi Hills Sunrise Run"
                className="meet-image"
              />
              <span className="meet-tag">MOUNTAIN PASS</span>
            </div>
            <div className="meet-body">
              <div className="meet-meta">
                <span className="meet-date">
                  <Calendar size={13} /> Nov 18, 2026
                </span>
                <span className="meet-spots">8 Pit Passes Left</span>
              </div>
              <h3 className="meet-name">Nandi Hills Sunrise Run</h3>
              <p className="meet-loc">
                <MapPin size={13} /> Nandi Hills Foothills, Bengaluru
              </p>
              <div className="meet-footer">
                <span className="meet-car-type">RWD & AWD Performance</span>
                <button
                  type="button"
                  className="meet-action-btn"
                  onClick={goSignUp}
                >
                  Join Grid →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HIGH-PERFORMANCE TUNER MARKETPLACE TEASER
          ========================================================= */}
      <section id="marketplace" className="landing-section marketplace-section">
        <div className="section-header">
          <p className="section-eyebrow">AUTHENTIC HARDWARE</p>
          <h2 className="section-title">CULT SPEED SHOP</h2>
          <p className="section-description">
            Directly source verified dry carbon wings, forged mono-block wheels, and custom valvetronic exhausts.
          </p>
        </div>

        <div className="parts-grid">
          <div className="part-card">
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80"
              alt="Forged Alloy Wheels"
              className="part-img"
            />
            <div className="part-info">
              <span className="part-cat">EXTERIOR</span>
              <h4 className="part-title">Forged Alloy Wheels (Staggered)</h4>
              <div className="part-price-row">
                <span className="part-price">₹24,999</span>
                <span className="part-badge">BESTSELLER</span>
              </div>
            </div>
          </div>

          <div className="part-card">
            <img
              src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80"
              alt="Carbon Fiber Wing"
              className="part-img"
            />
            <div className="part-info">
              <span className="part-cat">AERO</span>
              <h4 className="part-title">Dry Carbon Rear GT Spoiler</h4>
              <div className="part-price-row">
                <span className="part-price">₹8,999</span>
                <span className="part-badge">TRENDING</span>
              </div>
            </div>
          </div>

          <div className="part-card">
            <img
              src="https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=600&q=80"
              alt="Sport Steering Wheel"
              className="part-img"
            />
            <div className="part-info">
              <span className="part-cat">COCKPIT</span>
              <h4 className="part-title">Alcantara Sport Steering Wheel</h4>
              <div className="part-price-row">
                <span className="part-price">₹7,499</span>
                <span className="part-badge">POPULAR</span>
              </div>
            </div>
          </div>

          <div className="part-card">
            <img
              src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80"
              alt="Brembo Discs"
              className="part-img"
            />
            <div className="part-info">
              <span className="part-cat">BRAKING</span>
              <h4 className="part-title">Slotted Performance Rotors</h4>
              <div className="part-price-row">
                <span className="part-price">₹5,999</span>
                <span className="part-badge">SALE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ABOUT US SECTION (SYNDICATE STORY & PILLARS)
          ========================================================= */}
      <section id="about-section" className="landing-section about-section">
        <div className="about-container">
          <div className="about-grid">
            <div className="about-text-col">
              <div className="inline-flex items-center space-x-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-3">
                <Flame size={16} />
                <span>ABOUT PISTON CULT</span>
              </div>
              <h2 className="about-main-title">
                WE DIDN’T BUILD A PLATFORM. <br />
                <span>WE FORGED A BROTHERHOOD.</span>
              </h2>
              <p className="about-para">
                Piston Cult was born in underground industrial parking lots and late-night highway service bays.
                We grew tired of fragmented WhatsApp groups, untracked parts trading, and chaotic car meets.
              </p>
              <p className="about-para">
                Today, Piston Cult serves as the premier decentralized automotive community in the nation — connecting
                enthusiasts, seasoned circuit drivers, and master mechanics under one uncompromising standard:
                <em> absolute reverence for machine culture.</em>
              </p>

              <div className="about-features-list">
                <div className="about-feature-item">
                  <div className="feature-icon-box">
                    <Shield size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h4 className="feature-heading">Curated & Safe Staging</h4>
                    <p className="feature-subtext">Every sanctioned run is verified with dedicated checkpoint marshals and strict safety etiquette.</p>
                  </div>
                </div>

                <div className="about-feature-item">
                  <div className="feature-icon-box">
                    <Users size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h4 className="feature-heading">Verified Driver Garages</h4>
                    <p className="feature-subtext">Build profiles with verified dyno charts, mod histories, and meet badges.</p>
                  </div>
                </div>

                <div className="about-feature-item">
                  <div className="feature-icon-box">
                    <ShoppingBag size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h4 className="feature-heading">Escrow-Backed Marketplace</h4>
                    <p className="feature-subtext">Trade performance aftermarket parts safely with built-in condition verification.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* About Visual Showcase Card */}
            <div className="about-visual-col">
              <div className="about-visual-card">
                <img
                  src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=80"
                  alt="Car garage"
                  className="about-hero-img"
                />
                <div className="about-glass-badge">
                  <div className="badge-stat">100%</div>
                  <div className="badge-stat-label">Petrolhead Owned & Operated</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CALL TO ACTION FOOTER BANNER
          ========================================================= */}
      <section className="cta-banner">
        <div className="cta-content">
          <h2 className="cta-heading">READY TO FIRE UP YOUR ENGINE?</h2>
          <p className="cta-sub">
            Join thousands of passionate automotive owners. Register your vehicle or login to access upcoming meets.
          </p>
          <div className="cta-buttons">
            <button
              type="button"
              className="btn-signup text-sm px-8 py-3.5"
              onClick={goSignUp}
            >
              CREATE FREE DRIVER ACCOUNT
            </button>
            <button
              type="button"
              className="btn-login text-sm px-8 py-3.5"
              onClick={goLogin}
            >
              MEMBER LOGIN
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
          ========================================================= */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
                <Flame className="w-4 h-4 text-black fill-black" />
              </div>
              <span className="font-black tracking-wider text-white">PISTON CULT</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              The premier automotive syndicate. Driven by passion, defined by performance.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h5>NAVIGATION</h5>
              <button type="button" onClick={goLogin}>Driver Login</button>
              <button type="button" onClick={goSignUp}>Sign Up</button>
              <button type="button" onClick={scrollToAbout}>About Us</button>
            </div>
            <div className="footer-col">
              <h5>COMMUNITY</h5>
              <a href="#meets">Meets Calendar</a>
              <a href="#marketplace">Marketplace</a>
              <a href="#garage">Garage Telemetry</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} PISTON CULT AUTOMOTIVE SYNDICATE. ALL RIGHTS RESERVED.</span>
          <span>BUILT FOR ENTHUSIASTS, BY ENTHUSIASTS.</span>
        </div>
      </footer>
    </div>
  );
}