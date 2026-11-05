import React, { useState, Component } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  ShoppingBag,
  Info,
  Mail,
  Camera,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Phone,
  MapPin,
  Flame,
  LogOut
} from "lucide-react";

import HostEvent from "./hostevent";
import Marketplace from "./marketplace";
import ParticipateEvent from "./participateevent"; 
import Gallery from "./gallery";

import "./dashboard.css";

// Firebase Imports for Sign Out
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

// Fallback if a page component crashes while rendering
class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.pageKey !== this.props.pageKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dashboard-placeholder">
          <AlertCircle size={36} />
          <h2>Page temporarily unavailable</h2>
          <p>
            This section could not be displayed. You can return to the
            dashboard or try another section.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom inline components for About Us and Contact Us
function AboutUs() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn py-6">
      <div className="bg-[#0c1017]/90 border border-white/10 rounded-2xl p-8 relative overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500"></div>
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
          <Flame className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-4">About Piston Cult</h2>
        <p className="text-sm text-gray-300 leading-relaxed mb-4">
          Piston Cult is India's premier underground automotive syndicate. We unite elite car builders, track day junkies, and midnight meet organizers onto a single unified digital stronghold. 
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          Whether you are marshaling high-performance builds, securing pit passes for exclusive circuit sessions, or upgrading your machine through our curated aftermarket parts grid, Piston Cult delivers uncompromised speed, passion, and engineering excellence.
        </p>
      </div>
    </div>
  );
}

function ContactUs() {
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn py-6">
      <div className="bg-[#0c1017]/90 border border-white/10 rounded-2xl p-8 relative overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500"></div>
        
        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Syndicate Dispatch</h2>
        <p className="text-xs text-gray-400 mb-6">Connect with command or reach out for event clearances and support.</p>

        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 rounded-xl bg-[#07090d]/80 border border-white/10">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase">Secure Email</span>
              <span className="text-xs font-semibold text-white">support@pistoncult.com</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-xl bg-[#07090d]/80 border border-white/10">
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase">Emergency Hotwire</span>
              <span className="text-xs font-semibold text-white">+91 (22) 4893-CULT</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-xl bg-[#07090d]/80 border border-white/10">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase">Syndicate Headquarters</span>
              <span className="text-xs font-semibold text-white">Bay 404, Underground Garage Precinct, Mumbai, India</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const pageComponents = {
  host: HostEvent,
  join: ParticipateEvent,
  marketplace: Marketplace,
  gallery: Gallery,
  about: AboutUs,
  contact: ContactUs,
};

const navigation = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "join", label: "Join Event", icon: CalendarDays },
  { id: "host", label: "Host Event", icon: PlusCircle },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag },
  { id: "gallery", label: "Event Gallery", icon: Camera },
  { id: "about", label: "About Us", icon: Info },
  { id: "contact", label: "Contact Us", icon: Mail },
];

export default function Dashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("home");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const openPage = (page) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const ActivePage = pageComponents[activePage];

  return (
    <div
      className={`dashboard-layout min-h-screen relative overflow-x-hidden ${
        collapsed ? "sidebar-collapsed" : ""
      } ${mobileOpen ? "mobile-sidebar-open" : ""}`}
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(7, 9, 13, 0.88), rgba(7, 9, 13, 0.96)), url('/dashboard.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className="dashboard-sidebar backdrop-blur-md bg-[#07090d]/90">
        <div className="sidebar-brand">
          <span className="brand-symbol">P</span>
          {!collapsed && <span className="brand-name">PISTONCULT</span>}

          <button
            className="sidebar-close mobile-only"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-navigation">
          {!collapsed && <p className="sidebar-heading">MENU</p>}

          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`sidebar-link ${
                activePage === id ? "active" : ""
              }`}
              onClick={() => openPage(id)}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom space-y-2">
          <button
            className="sidebar-link text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer w-full"
            onClick={handleSignOut}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut size={20} />
            {!collapsed && <span>Sign Out</span>}
          </button>

          <button
            className="sidebar-link collapse-button desktop-only"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </aside>

      <main className="dashboard-main bg-transparent">
        <header className="dashboard-topbar backdrop-blur-md bg-[#07090d]/60 border-b border-white/10">
          <button
            className="mobile-menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <div>
            <p className="topbar-eyebrow">PISTONCULT / COMMUNITY</p>
            <h1>
              {navigation.find((item) => item.id === activePage)?.label ||
                "Dashboard"}
            </h1>
          </div>
        </header>

        <section className="dashboard-content">
          <PageErrorBoundary pageKey={activePage}>
            {activePage === "home" ? (
              <DashboardHome onNavigate={openPage} />
            ) : ActivePage ? (
              <ActivePage />
            ) : (
              <PagePlaceholder
                title="Page not found"
                onHome={() => openPage("home")}
              />
            )}
          </PageErrorBoundary>
        </section>
      </main>
    </div>
  );
}

function DashboardHome({ onNavigate }) {
  return (
    <div className="dashboard-home space-y-6">
      <div className="dashboard-welcome bg-[#0c1017]/90 backdrop-blur-md border border-white/10">
        <div>
          <p className="welcome-eyebrow">YOUR GARAGE. YOUR COMMUNITY.</p>
          <h2>Welcome to PistonCult</h2>
          <p>
            Discover car meets, host your own events, and connect with
            automotive enthusiasts.
          </p>
        </div>
      </div>

      <div className="dashboard-action-grid">
        <button
          className="dashboard-action-card bg-[#0c1017]/90 backdrop-blur-md border border-white/10 hover:border-amber-500/50 cursor-pointer"
          onClick={() => onNavigate("join")}
        >
          <CalendarDays size={28} />
          <h3>Join an Event</h3>
          <p>Explore automotive meets and find your next gathering.</p>
          <span>Explore events →</span>
        </button>

        <button
          className="dashboard-action-card bg-[#0c1017]/90 backdrop-blur-md border border-white/10 hover:border-amber-500/50 cursor-pointer"
          onClick={() => onNavigate("host")}
        >
          <PlusCircle size={28} />
          <h3>Host an Event</h3>
          <p>Create a meet and bring your local car community together.</p>
          <span>Create event →</span>
        </button>

        <button
          className="dashboard-action-card bg-[#0c1017]/90 backdrop-blur-md border border-white/10 hover:border-amber-500/50 cursor-pointer"
          onClick={() => onNavigate("marketplace")}
        >
          <ShoppingBag size={28} />
          <h3>Marketplace</h3>
          <p>Explore automotive accessories and marketplace listings.</p>
          <span>Browse marketplace →</span>
        </button>

        <button
          className="dashboard-action-card bg-[#0c1017]/90 backdrop-blur-md border border-white/10 hover:border-amber-500/50 cursor-pointer"
          onClick={() => onNavigate("gallery")}
        >
          <Camera size={28} />
          <h3>Event Gallery</h3>
          <p>View archives and upload snapshots from previous meets.</p>
          <span>Open gallery →</span>
        </button>

        <button
          className="dashboard-action-card bg-[#0c1017]/90 backdrop-blur-md border border-white/10 hover:border-amber-500/50 cursor-pointer"
          onClick={() => onNavigate("about")}
        >
          <Info size={28} />
          <h3>About Us</h3>
          <p>Learn more about Piston Cult and our automotive syndicate mission.</p>
          <span>Read story →</span>
        </button>

        <button
          className="dashboard-action-card bg-[#0c1017]/90 backdrop-blur-md border border-white/10 hover:border-amber-500/50 cursor-pointer"
          onClick={() => onNavigate("contact")}
        >
          <Mail size={28} />
          <h3>Contact Us</h3>
          <p>Connect with syndicate command or reach out for support.</p>
          <span>Get in touch →</span>
        </button>
      </div>
    </div>
  );
}

function PagePlaceholder({ title, onHome }) {
  return (
    <div className="dashboard-placeholder bg-[#0c1017]/90 backdrop-blur-md border border-white/10">
      <AlertCircle size={36} />
      <h2>{title}</h2>
      <p>This section is not available yet.</p>
      <button className="placeholder-home-button" onClick={onHome}>
        Return to Dashboard
      </button>
    </div>
  );
}