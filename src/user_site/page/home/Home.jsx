import './Home.css';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  BookOpenCheck,
  ChevronDown,
  ClipboardCheck,
  Eye,
  HeartHandshake,
  LogOut,
  MapPinned,
  Menu,
  PhoneCall,
  RadioTower,
  Route,
  ShieldAlert,
  ShieldCheck,
  Siren,
  TriangleAlert,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { userLogout } from '../../../services/Apis';
import { useAuth } from '../../../context/AuthContext';
import SOSButton from './SOSButton';
import UserLiveStream from './UserLiveStream';
import SectionTitle from '../../components/safety/SectionTitle';
import SafetyFeatureCard from '../../components/safety/SafetyFeatureCard';
import SafetyMediaCard from '../../components/safety/SafetyMediaCard';
import SafetyModal from '../../components/safety/SafetyModal';

const impactStats = [
  { label: '24/7', value: 'Emergency Readiness' },
  { label: 'One Tap', value: 'SOS Activation' },
  { label: 'Live', value: 'Response Visibility' },
  { label: 'Rapid', value: 'Help Escalation' },
];

const urgencyStrip = [
  {
    icon: TriangleAlert,
    title: 'If You Feel Unsafe, Act Early',
    detail: 'Do not wait for certainty. Early action lowers risk.',
  },
  {
    icon: PhoneCall,
    title: 'Emergency Support',
    detail: 'Call 112 (Emergency) or 181 (Women Helpline).',
  },
  {
    icon: MapPinned,
    title: 'Share Exact Location',
    detail: 'Use landmarks, nearest shops, and route names.',
  },
  {
    icon: Users,
    title: 'Move Toward Visibility',
    detail: 'Choose populated, lit, and monitored spaces.',
  },
];

const dangerSignals = [
  {
    icon: Eye,
    title: 'Situational Awareness',
    description:
      'Repeated following, unusual waiting behavior, blocked exits, or forced isolation are strong warning signs.',
    badge: 'Alertness',
    metric: 'Observe patterns, exits, and nearby safe points',
  },
  {
    icon: ShieldAlert,
    title: 'Escalation Detection',
    description:
      'Risk often escalates in stages. Boundary violations, intimidation, and route control attempts require immediate action.',
    badge: 'Danger',
    metric: 'Trust instincts over social pressure',
  },
  {
    icon: Siren,
    title: 'Immediate Response',
    description:
      'In emergency moments, speed beats perfection. Trigger SOS first, then communicate short, clear location details.',
    badge: 'Action',
    metric: 'Seconds matter in active threat situations',
  },
];

const mediaStories = [
  {
    image: 'https://images.pexels.com/photos/17139172/pexels-photo-17139172.jpeg?auto=compress&cs=tinysrgb&w=1200',
    tag: 'Public Safety',
    title: 'Safety improves in visible environments',
    description: 'Choose routes with lighting, people flow, and active storefronts whenever possible.',
  },
  {
    image: 'https://images.pexels.com/photos/19411760/pexels-photo-19411760.jpeg?auto=compress&cs=tinysrgb&w=1200',
    tag: 'Preparedness',
    title: 'Prepared women respond faster under stress',
    description: 'Plan emergency actions before travel, not during panic.',
  },
  {
    image: 'https://images.pexels.com/photos/2488525/pexels-photo-2488525.jpeg?auto=compress&cs=tinysrgb&w=1200',
    tag: 'Support Network',
    title: 'Community check-ins reduce isolation risk',
    description: 'Small habits like ETA sharing and arrival confirmation add protection.',
  },
];

const awarenessVideo = {
  src: 'https://assets.mixkit.co/videos/31395/31395-720.mp4',
  poster: 'https://images.pexels.com/photos/14119744/pexels-photo-14119744.jpeg?auto=compress&cs=tinysrgb&w=1200',
  sourceLink:
    'https://mixkit.co/free-stock-video/woman-is-robbed-of-her-cell-phone-by-a-thief-31395/',
};

const playbookSteps = [
  {
    phase: 'Phase 1',
    title: 'Recognize',
    text: 'Identify abnormal behavior early: shadowing, route-blocking, verbal pressure, or repeated surveillance.',
  },
  {
    phase: 'Phase 2',
    title: 'Reposition',
    text: 'Move immediately to visible public space, near families, shop counters, or transport security points.',
  },
  {
    phase: 'Phase 3',
    title: 'Respond',
    text: 'Trigger SOS, call helplines, and communicate exact location with landmarks and travel direction.',
  },
  {
    phase: 'Phase 4',
    title: 'Report',
    text: 'Document incident details while memory is fresh and report through trusted official channels.',
  },
];

const serviceCards = [
  {
    icon: Siren,
    title: 'One-Tap SOS Dispatch',
    description: 'Send emergency alert + live location in a structured response flow.',
    metric: 'Fast escalation pipeline',
  },
  {
    icon: RadioTower,
    title: 'Live Monitoring Support',
    description: 'Authorized response viewers can request live context for better decisions.',
    metric: 'Context-driven intervention',
  },
  {
    icon: Route,
    title: 'Safer Route Guidance',
    description: 'Plan movement using safer path priorities and visibility factors.',
    metric: 'Preventive risk reduction',
  },
  {
    icon: Users,
    title: 'Trusted Contact Readiness',
    description: 'Emergency contacts and profile context improve response quality.',
    metric: 'Network-supported safety',
  },
];

const preparednessCards = [
  {
    icon: ClipboardCheck,
    title: 'Emergency Profile',
    description:
      'Update medical details and emergency contacts for faster support when communication becomes difficult.',
    cta: 'Review Profile',
    to: '/profile',
  },
  {
    icon: BellRing,
    title: 'Daily Safety Checklist',
    description:
      'Create a repeatable routine for travel timing, battery readiness, and emergency communication.',
    cta: 'Open Checklist',
    action: 'plan',
  },
  {
    icon: MapPinned,
    title: 'Route Planning',
    description: 'Compare route options and avoid isolated pathways before you leave.',
    cta: 'Open Safe Route',
    to: '/safe-route',
  },
];

const rightsAndLiteracy = [
  {
    icon: ShieldCheck,
    title: 'Your safety concerns are valid',
    text: 'No woman needs to “prove enough danger” before acting to protect herself. Early reporting is responsible.',
  },
  {
    icon: BookOpenCheck,
    title: 'Documentation strengthens support',
    text: 'Save timestamps, location details, screenshots, and witness context whenever safe to do so.',
  },
  {
    icon: HeartHandshake,
    title: 'Community response matters',
    text: 'Bystander support and trusted networks can interrupt risk cycles before severe harm occurs.',
  },
];

const faqCards = [
  {
    q: 'When should I trigger SOS?',
    a: 'Trigger SOS the moment you perceive credible risk. Early activation is better than delayed certainty.',
  },
  {
    q: 'What if location permissions are off?',
    a: 'Enable location immediately and move to visibility. If unavailable, call helplines and share landmarks manually.',
  },
  {
    q: 'How can families support women safety?',
    a: 'Use non-judgmental check-ins, shared route awareness, and emergency contact discipline.',
  },
  {
    q: 'Is this useful for daily commute only?',
    a: 'No. It supports campus movement, work shifts, travel, and any context where personal risk can escalate.',
  },
];

const awarenessChecklist = [
  'Someone repeatedly follows your route changes.',
  'A person blocks your movement or exit path.',
  'You are pressured into isolated transport or spaces.',
  'Digital stalking or threatening calls/messages begin.',
  'You feel unsafe despite no obvious evidence yet.',
];

const Home = () => {
  const navigate = useNavigate();
  const { user, admin, isUser, isAdmin, isLoading, logout } = useAuth();
  const isUserLoggedIn = isUser && !!user;
  const isAdminLoggedIn = isAdmin && !!admin;
  const userId = user?._id || '';
  const userName = user?.fullName || user?.name || user?.username || 'Safety User';
  const userInitial = userName.charAt(0).toUpperCase();
  const avatarUrl = user?.avatar ? `${import.meta.env.VITE_WS_URL}${user.avatar}` : null;
  const adminName = admin?.officerName || admin?.fullName || admin?.username || 'Admin';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);

  useEffect(() => {
    const shouldLockScroll = isMenuOpen || isSafetyModalOpen;

    document.documentElement.classList.toggle('ws-scroll-lock', shouldLockScroll);
    document.body.classList.toggle('ws-scroll-lock', shouldLockScroll);

    return () => {
      document.documentElement.classList.remove('ws-scroll-lock');
      document.body.classList.remove('ws-scroll-lock');
    };
  }, [isMenuOpen, isSafetyModalOpen]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }
    const handleWindowClick = () => setIsProfileMenuOpen(false);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [isProfileMenuOpen]);

  useEffect(() => {
    const revealNodes = Array.from(document.querySelectorAll('.ws-reveal'));
    if (!revealNodes.length) {
      return undefined;
    }

    if (!('IntersectionObserver' in window)) {
      revealNodes.forEach((node) => node.classList.add('ws-in'));
      return undefined;
    }

    const shouldRevealNow = (node) => {
      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      return rect.top <= viewportHeight * 0.9 && rect.bottom >= viewportHeight * 0.05;
    };

    const observer = new IntersectionObserver(
      (entries, activeObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.intersectionRatio > 0.08) {
            entry.target.classList.add('ws-in');
            activeObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: [0, 0.08, 0.16],
        rootMargin: '0px 0px -8% 0px',
      }
    );

    const observeRevealNode = (node) => {
      if (!(node instanceof HTMLElement) || node.classList.contains('ws-in')) {
        return;
      }

      if (shouldRevealNow(node)) {
        node.classList.add('ws-in');
        return;
      }

      observer.observe(node);
    };

    revealNodes.forEach((node) => observeRevealNode(node));

    const refreshReveals = () => {
      document.querySelectorAll('.ws-reveal:not(.ws-in)').forEach((node) => {
        observeRevealNode(node);
      });
    };

    const mutationObserver = new MutationObserver((mutationList) => {
      mutationList.forEach((mutation) => {
        mutation.addedNodes.forEach((addedNode) => {
          if (!(addedNode instanceof HTMLElement)) {
            return;
          }

          if (addedNode.classList.contains('ws-reveal')) {
            observeRevealNode(addedNode);
          }

          addedNode.querySelectorAll('.ws-reveal').forEach((nestedNode) => {
            observeRevealNode(nestedNode);
          });
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', refreshReveals);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', refreshReveals);
    };
  }, []);

  const closeMobileMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    try {
      const config = {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      };
      const res = await userLogout(config);
      if (res?.status === 200) {
        logout();
        toast.success(`${res?.data?.message || 'Logged out successfully'}!`);
        navigate('/login');
        return;
      }
      toast.error(res?.data?.message || 'Logout failed');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Logout failed. Please try again.');
    }
  };

  const openSafetyPlanModal = () => {
    closeMobileMenu();
    setIsSafetyModalOpen(true);
  };

  return (
    <main className="ws-home">
      {isUserLoggedIn && userId ? <UserLiveStream userId={userId} /> : null}
      <SOSButton />

      <div className="ws-theme-bg ws-theme-bg-top"></div>
      <div className="ws-theme-bg ws-theme-bg-bottom"></div>

      <header className="ws-nav-wrap">
        <nav className="ws-nav shell">
          <Link to="/" className="ws-brand" onClick={closeMobileMenu}>
            <span className="ws-brand-dot"></span>
            SafeStree
          </Link>

          <button
            type="button"
            className="ws-mobile-menu-btn"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className={`ws-nav-content ${isMenuOpen ? 'open' : ''}`}>
            <a href="#danger-signals" onClick={closeMobileMenu}>
              Danger Signals
            </a>
            <a href="#awareness-media" onClick={closeMobileMenu}>
              Awareness Media
            </a>
            <a href="#playbook" onClick={closeMobileMenu}>
              Safety Playbook
            </a>
            <a href="#services" onClick={closeMobileMenu}>
              Services
            </a>
            <a href="#resources" onClick={closeMobileMenu}>
              Resources
            </a>
            <a href="#contact" onClick={closeMobileMenu}>
              Contact
            </a>

            <div className="ws-nav-actions">
              {isLoading ? <span className="ws-auth-loading">Checking session...</span> : null}

              {!isLoading && !isUserLoggedIn && !isAdminLoggedIn ? (
                <>
                  <Link to="/login" className="ws-link-btn" onClick={closeMobileMenu}>
                    Login
                  </Link>
                  <Link to="/signup" className="ws-primary-btn small" onClick={closeMobileMenu}>
                    Create Account
                  </Link>
                  <Link to="/admin/login" className="ws-admin-link" onClick={closeMobileMenu}>
                    Admin
                  </Link>
                </>
              ) : null}

              {!isLoading && isAdminLoggedIn ? (
                <>
                  <span className="ws-auth-loading">Responder: {adminName}</span>
                  <Link to="/admin/home" className="ws-secondary-btn small" onClick={closeMobileMenu}>
                    Admin Panel
                  </Link>
                </>
              ) : null}

              {!isLoading && isUserLoggedIn ? (
                <div className="ws-profile-wrap" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="ws-profile-trigger"
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    aria-label="Open user menu"
                  >
                    <span className="ws-avatar">
                      {avatarUrl ? <img src={avatarUrl} alt="Profile avatar" /> : <span>{userInitial}</span>}
                    </span>
                    <span className="ws-profile-name">{userName}</span>
                    <ChevronDown size={14} />
                  </button>

                  {isProfileMenuOpen ? (
                    <div className="ws-profile-menu">
                      <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)}>
                        <UserRound size={14} /> My Profile
                      </Link>
                      <Link to="/safe-route" onClick={() => setIsProfileMenuOpen(false)}>
                        <Route size={14} /> Safe Route
                      </Link>
                      <button type="button" onClick={handleLogout}>
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </nav>
      </header>

      <section className="ws-hero shell ws-reveal reveal-fade">
        <div className="ws-hero-copy ws-reveal reveal-left" style={{ '--reveal-delay': '30ms' }}>
          <p className="ws-eyebrow">Women Safety Emergency Platform</p>
          <h1>Modern protection for women facing real-world risk, harassment, and unsafe mobility.</h1>
          <p className="ws-hero-subtitle">
            SafeStree blends emergency technology with practical safety education. It is built for moments where
            decisions must be quick, clear, and actionable. From detection to response, every feature is designed to
            reduce delay and increase protection.
          </p>

          <div className="ws-danger-ribbon">
            <TriangleAlert size={16} />
            <span>If you feel unsafe, act immediately. Early action saves lives.</span>
          </div>

          <div className="ws-hero-actions">
            <button type="button" className="ws-primary-btn" onClick={openSafetyPlanModal}>
              Build 60-Second Safety Plan <ArrowRight size={16} />
            </button>
            <Link className="ws-secondary-btn" to="/safe-route">
              Plan Safe Route
            </Link>
          </div>

          <div className="ws-stat-grid">
            {impactStats.map((stat) => (
              <div key={stat.value} className="ws-stat-card">
                <strong>{stat.label}</strong>
                <span>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="ws-hero-media ws-reveal reveal-right" style={{ '--reveal-delay': '140ms' }}>
          <img
            src="https://images.pexels.com/photos/14119744/pexels-photo-14119744.jpeg?auto=compress&cs=tinysrgb&w=1800"
            alt="Women safety emergency awareness visual"
          />
          <div className="ws-hero-media-overlay">
            <h3>Safety demands awareness, preparedness, and fast response.</h3>
            <p>Recognize warning signs. Share location. Trigger SOS. Call 112/181.</p>
            <div className="ws-media-tags">
              <span>Awareness</span>
              <span>Preparedness</span>
              <span>Response</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="ws-urgency-strip shell">
        {urgencyStrip.map((item, index) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="ws-reveal reveal-up" style={{ '--reveal-delay': `${index * 80}ms` }}>
              <Icon size={18} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section id="danger-signals" className="ws-section shell ws-reveal reveal-fade">
        <SectionTitle
          eyebrow="Danger Awareness"
          title="Identify risk before it becomes an emergency"
          description="Incidents often escalate through warning phases. Educated awareness helps women take control early and seek help faster."
        />
        <div className="ws-card-grid four">
          {dangerSignals.map((item, index) => (
            <SafetyFeatureCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              badge={item.badge}
              metric={item.metric}
              className="ws-reveal reveal-up"
              style={{ '--reveal-delay': `${index * 90}ms` }}
            />
          ))}
          <SafetyFeatureCard
            icon={HeartHandshake}
            title="Confidence Under Pressure"
            description="Prepared response habits reduce panic and improve clarity in high-stress situations."
            badge="Mindset"
            metric="Prepared routines improve decision quality"
            className="ws-reveal reveal-up"
            style={{ '--reveal-delay': '300ms' }}
          />
        </div>
      </section>

      <section id="awareness-media" className="ws-section ws-band ws-reveal reveal-fade">
        <div className="shell">
          <SectionTitle
            eyebrow="Educational Media"
            title="Awareness content for practical women safety behavior"
            description="Use this section as an ongoing learning resource for hazard recognition, public safety decisions, and emergency communication."
          />

          <div className="ws-awareness-layout">
            <div className="ws-video-frame ws-reveal reveal-left" style={{ '--reveal-delay': '50ms' }}>
              <video controls preload="metadata" poster={awarenessVideo.poster}>
                <source src={awarenessVideo.src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <p>
                Free-source video: <a href={awarenessVideo.sourceLink}>Mixkit</a> | Free-source images: Pexels
              </p>
            </div>

            <aside className="ws-education-panel ws-reveal reveal-right" style={{ '--reveal-delay': '150ms' }}>
              <h3>Never ignore these warning signs</h3>
              <ul>
                {awarenessChecklist.map((point) => (
                  <li key={point}>
                    <ShieldAlert size={15} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section className="ws-section shell ws-reveal reveal-fade">
        <SectionTitle
          eyebrow="Visual Safety Stories"
          title="Real-life safety patterns women encounter every day"
          description="These visuals reinforce practical strategies: visibility, preparation, and support networks."
        />

        <div className="ws-media-grid">
          {mediaStories.map((card, index) => (
            <SafetyMediaCard
              key={card.title}
              image={card.image}
              title={card.title}
              description={card.description}
              tag={card.tag}
              className="ws-reveal reveal-up"
              style={{ '--reveal-delay': `${index * 100}ms` }}
            />
          ))}
        </div>
      </section>

      <section id="playbook" className="ws-section ws-band ws-band-alt ws-reveal reveal-fade">
        <div className="shell">
          <SectionTitle
            eyebrow="Safety Playbook"
            title="Use this four-phase response model in danger situations"
            description="Practice these actions regularly so response becomes instinctive when pressure rises."
          />
          <div className="ws-playbook-grid">
            {playbookSteps.map((item, index) => (
              <article key={item.title} className="ws-reveal reveal-up" style={{ '--reveal-delay': `${index * 90}ms` }}>
                <span>{item.phase}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="ws-section shell ws-reveal reveal-fade">
        <SectionTitle
          eyebrow="Core Services"
          title="Technology-enabled safety, designed for real emergencies"
          description="SafeStree combines prevention and rapid intervention in one flow so users can react quickly and intelligently."
        />
        <div className="ws-card-grid four">
          {serviceCards.map((item, index) => (
            <SafetyFeatureCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              metric={item.metric}
              className="ws-reveal reveal-up"
              style={{ '--reveal-delay': `${index * 90}ms` }}
            />
          ))}
        </div>
      </section>

      <section id="safety-hub" className="ws-section shell ws-reveal reveal-fade">
        <SectionTitle
          eyebrow="Safety Hub"
          title="Build habits that increase safety before risk appears"
          description="Preparedness is not panic. It is consistent routine, informed planning, and clear emergency pathways."
        />
        <div className="ws-card-grid three">
          {preparednessCards.map((item, index) => {
            const ctaHandler = item.action === 'plan' ? openSafetyPlanModal : undefined;
            return (
              <SafetyFeatureCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                cta={
                  item.to ? (
                    <Link to={item.to} className="ws-inline-link">
                      {item.cta} <ArrowRight size={14} />
                    </Link>
                  ) : (
                    item.cta
                  )
                }
                onCtaClick={ctaHandler}
                className="ws-reveal reveal-up"
                style={{ '--reveal-delay': `${index * 90}ms` }}
              />
            );
          })}
        </div>
      </section>

      <section className="ws-section ws-band ws-reveal reveal-fade">
        <div className="shell ws-literacy-layout">
          <div className="ws-reveal reveal-left" style={{ '--reveal-delay': '50ms' }}>
            <SectionTitle
              eyebrow="Rights & Literacy"
              title="Women safety requires legal awareness, evidence discipline, and social support"
              description="Emergency response becomes stronger when women and communities understand rights, documentation, and escalation pathways."
            />
            <div className="ws-rights-grid">
              {rightsAndLiteracy.map((item, index) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="ws-reveal reveal-up" style={{ '--reveal-delay': `${index * 90}ms` }}>
                    <Icon size={18} />
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="ws-fast-guide ws-reveal reveal-right" style={{ '--reveal-delay': '150ms' }}>
            <h3>Rapid communication template</h3>
            <p>
              In panic, short structured language works better than long explanation. Use this order while calling for
              help:
            </p>
            <ol>
              <li>My name and immediate danger status.</li>
              <li>Exact location with nearest landmark.</li>
              <li>Direction of movement (if relocating).</li>
              <li>What support is needed right now.</li>
            </ol>
          </aside>
        </div>
      </section>

      <section id="resources" className="ws-section shell ws-reveal reveal-fade">
        <SectionTitle
          eyebrow="Resource Desk"
          title="Frequently asked safety questions"
          description="Quick clarity for common emergency decisions and support scenarios."
        />
        <div className="ws-faq-grid">
          {faqCards.map((card, index) => (
            <article key={card.q} className="ws-reveal reveal-up" style={{ '--reveal-delay': `${index * 80}ms` }}>
              <h3>{card.q}</h3>
              <p>{card.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="ws-help shell ws-reveal reveal-fade">
        <div>
          <p className="ws-eyebrow">Emergency Contacts</p>
          <h2>When danger is immediate, prioritize SOS and official channels first.</h2>
          <p>
            SafeStree supports your emergency decisions, but official helplines and local authorities remain critical.
            Move toward public visibility and communicate clear location details.
          </p>
        </div>
        <div className="ws-help-cards">
          <div>
            <span>National Emergency</span>
            <strong>112</strong>
          </div>
          <div>
            <span>Women Helpline</span>
            <strong>181</strong>
          </div>
          <div>
            <span>Learning Mode</span>
            <strong>
              <BookOpenCheck size={16} /> Safety Awareness
            </strong>
          </div>
        </div>
      </section>

      <footer className="ws-footer ws-reveal reveal-fade">
        <div className="shell">
          <p>SafeStree - Women Safety First</p>
          <p>Educate, prepare, and respond fast to reduce risk and protect lives.</p>
        </div>
      </footer>

      <SafetyModal
        open={isSafetyModalOpen}
        title="My 60-second Safety Checklist"
        subtitle="Use this before commute, classes, work shifts, or late travel."
        onClose={() => setIsSafetyModalOpen(false)}
        footer={
          <>
            <Link className="ws-secondary-btn" to="/profile" onClick={() => setIsSafetyModalOpen(false)}>
              Update Profile
            </Link>
            <button type="button" className="ws-primary-btn small" onClick={() => setIsSafetyModalOpen(false)}>
              Done
            </button>
          </>
        }
      >
        <ul className="ws-checklist">
          <li>Enable location permissions before travel starts.</li>
          <li>Keep at least one emergency contact active and reachable.</li>
          <li>Share route + ETA during high-risk timing.</li>
          <li>Keep battery, data, and emergency numbers accessible.</li>
          <li>If unsafe signs appear, trigger SOS early and move to visibility.</li>
        </ul>
      </SafetyModal>
    </main>
  );
};

export default Home;
