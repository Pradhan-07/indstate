import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, CheckCircle2, Percent, Calculator, 
  Car, Compass, Award, ArrowRight, ChevronLeft, ChevronRight,
  BadgeCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring } from 'framer-motion';
import ScrollReveal from '../common/ScrollReveal';
import MagneticButton from '../common/MagneticButton';
import './WhyIndstate.css';

const pillarsData = [
  {
    id: 1,
    stepNum: "01",
    stepTag: "01 — RERA AUDIT",
    icon: <ShieldCheck size={20} />,
    title: "100% RERA Verified Projects",
    desc: "Every listed project displays its authentic State RERA registration ID with audited completion timelines.",
    image: "/images/why-indstate/card-01-rera.jpg",
    badge: "Govt. RERA Certified",
    stat: "100% Audited Timelines",
    color: "#1F5F4A",
    bg: "rgba(31, 95, 74, 0.1)"
  },
  {
    id: 2,
    stepNum: "02",
    stepTag: "02 — DIRECT OPTION",
    icon: <Percent size={20} />,
    title: "Zero Brokerage Direct Option",
    desc: "Connect directly with genuine property owners and Grade-A builders with zero middleman commissions.",
    image: "/images/why-indstate/card-02-brokerage.jpg",
    badge: "0% Brokerage Direct",
    stat: "Direct Owner Connect",
    color: "#B5642B",
    bg: "rgba(181, 100, 43, 0.1)"
  },
  {
    id: 3,
    stepNum: "03",
    stepTag: "03 — CARPET STANDARD",
    icon: <CheckCircle2 size={20} />,
    title: "RERA Carpet Area Standard",
    desc: "Say goodbye to 40% super built-up loading. Pay only for the actual usable square feet inside your home.",
    image: "/images/why-indstate/card-03-carpet.jpg",
    badge: "100% Usable Sq. Ft.",
    stat: "Zero Loading Inflation",
    color: "#1F5F4A",
    bg: "rgba(31, 95, 74, 0.1)"
  },
  {
    id: 4,
    stepNum: "04",
    stepTag: "04 — HOME FINANCING",
    icon: <Calculator size={20} />,
    title: "Home Loans at 8.40% p.a.",
    desc: "Direct tie-ups with SBI, HDFC Bank, and ICICI Bank for instant online sanctions and minimal paperwork.",
    image: "/images/why-indstate/card-04-loans.jpg",
    badge: "SBI • HDFC • ICICI",
    stat: "8.40% p.a. Lowest",
    color: "#2563EB",
    bg: "rgba(37, 99, 235, 0.1)"
  },
  {
    id: 5,
    stepNum: "05",
    stepTag: "05 — ESCORTED VISITS",
    icon: <Car size={20} />,
    title: "Free Escorted Site Visits",
    desc: "Our local property advisors escort you and your family for physical property inspections safely.",
    image: "/images/why-indstate/card-05-sitevisit.jpg",
    badge: "Free Family Escort",
    stat: "Safety First Protocol",
    color: "#0F1B3D",
    bg: "rgba(15, 27, 61, 0.1)"
  },
  {
    id: 6,
    stepNum: "06",
    stepTag: "06 — VASTU COMPLIANCE",
    icon: <Compass size={20} />,
    title: "Vastu Shastra Compliance",
    desc: "Every listing specifies directional entries (East, North-East) verified by certified Vastu consultants.",
    image: "/images/why-indstate/card-06-vastu.jpg",
    badge: "East / NE Verified",
    stat: "Certified Consultant",
    color: "#B5642B",
    bg: "rgba(181, 100, 43, 0.1)"
  }
];

export default function WhyIndstate() {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const viewportRef = useRef(null);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Measure track scrollable width dynamically
  const updateMeasurements = useCallback(() => {
    if (typeof window === 'undefined') return;
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);

    if (trackRef.current && !mobile) {
      const trackWidth = trackRef.current.scrollWidth;
      const windowWidth = window.innerWidth;
      // Total horizontal distance to translate so the final card lands comfortably
      const dist = Math.max(0, trackWidth - windowWidth + 140);
      setScrollDistance(dist);
    }
  }, []);

  useEffect(() => {
    updateMeasurements();
    window.addEventListener('resize', updateMeasurements);
    return () => window.removeEventListener('resize', updateMeasurements);
  }, [updateMeasurements]);

  // Scroll tracking across the tall pinned container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smooth spring physics for horizontal glide
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 32,
    restDelta: 0.001
  });

  // Calculate translateX based on scroll
  const x = useTransform(smoothProgress, [0, 1], [0, -scrollDistance]);

  // Calculate timeline progress line fill width (0% to 100%)
  const progressPercent = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  // Track active index based on scroll position on desktop
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (isMobile) return;
    const rawIdx = Math.round(latest * (pillarsData.length - 1));
    const clamped = Math.max(0, Math.min(pillarsData.length - 1, rawIdx));
    setActiveIndex(clamped);
  });

  // Handle horizontal swipe on mobile
  const handleMobileScroll = (e) => {
    if (!isMobile) return;
    const scrollLeft = e.target.scrollLeft;
    const cardStep = 270 + 24; // Card width + gap
    const idx = Math.round(scrollLeft / cardStep);
    setActiveIndex(Math.max(0, Math.min(pillarsData.length - 1, idx)));
  };

  // Navigate to specific card
  const scrollToCard = (index) => {
    if (isMobile && viewportRef.current) {
      const cardStep = 270 + 24;
      viewportRef.current.scrollTo({
        left: index * cardStep,
        behavior: 'smooth'
      });
      setActiveIndex(index);
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || window.pageYOffset;
    const containerTop = rect.top + scrollTop;
    const containerHeight = containerRef.current.offsetHeight;
    const scrollableSection = containerHeight - window.innerHeight;

    if (scrollableSection <= 0) return;

    const targetFraction = index / (pillarsData.length - 1);
    const targetY = containerTop + targetFraction * scrollableSection;

    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      scrollToCard(activeIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < pillarsData.length - 1) {
      scrollToCard(activeIndex + 1);
    }
  };

  return (
    <div className="why-indstate-wrapper">
      {/* Tall Scroll Track for Desktop Vertical-to-Horizontal Driving */}
      <section ref={containerRef} className="why-indstate-scroll-track" id="why-indstate-section">
        {/* Sticky Pinned Viewport Container */}
        <div className="why-indstate-sticky">
          
          {/* Header Bar matching Framer reference and INDSTATE branding */}
          <header className="why-indstate-header">
            <div className="why-indstate-header-left">
              <span className="why-indstate-tag">
                <Award size={13} />
                Why INDSTATE
              </span>
              <h2 className="why-indstate-title">
                India's Most Trusted Property Marketplace
              </h2>
            </div>

            <div className="why-indstate-header-right">
              <p className="why-indstate-subtitle">
                Built from the ground up to bring unprecedented transparency, accountability, and speed to Indian real estate.
              </p>

              <div className="why-indstate-controls-bar">
                {/* Arrow Navigation Buttons */}
                <div className="why-indstate-nav-buttons">
                  <button 
                    onClick={handlePrev}
                    disabled={activeIndex === 0}
                    className="why-indstate-nav-btn"
                    aria-label="Previous Feature"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={activeIndex === pillarsData.length - 1}
                    className="why-indstate-nav-btn"
                    aria-label="Next Feature"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Horizontal Track Viewport */}
          <div 
            ref={viewportRef}
            className="why-indstate-track-viewport"
            onScroll={handleMobileScroll}
          >
            <motion.div 
              ref={trackRef} 
              className="why-indstate-track-motion"
              style={{ x: isMobile ? 0 : x }}
            >
              {/* Continuous Timeline Rail & Progress Fill Line */}
              <div className="why-indstate-timeline-rail">
                <motion.div 
                  className="why-indstate-timeline-progress"
                  style={{ width: isMobile ? `${((activeIndex + 1) / pillarsData.length) * 100}%` : progressPercent }}
                />
              </div>

              {/* 6 Feature Card Columns */}
              {pillarsData.map((item, idx) => {
                const isActive = activeIndex === idx;
                const isPassed = activeIndex > idx;

                return (
                  <div 
                    key={item.id}
                    className={`why-indstate-column ${isActive ? 'is-active' : ''} ${isPassed ? 'is-passed' : ''}`}
                  >
                    {/* Top Timing / Step Tag */}
                    <div className="why-indstate-step-label">
                      <span>{item.stepTag}</span>
                    </div>

                    {/* Timeline Node / Circle on the Rail */}
                    <div className="why-indstate-node-wrapper">
                      <button 
                        onClick={() => scrollToCard(idx)}
                        className="why-indstate-node-btn"
                        aria-label={`Jump to ${item.title}`}
                      >
                        <span className="why-indstate-node-inner" />
                      </button>
                    </div>

                    {/* Card Content Header & Description */}
                    <div className="why-indstate-content-wrap">
                      <div className="why-indstate-card-header">
                        <div 
                          className="why-indstate-icon-box"
                          style={{ background: item.bg, color: item.color }}
                        >
                          {item.icon}
                        </div>
                        <h3 className="why-indstate-card-title">
                          {item.title}
                        </h3>
                      </div>
                      <p className="why-indstate-card-desc">
                        {item.desc}
                      </p>
                    </div>

                    {/* Feature Property Image Card */}
                    <div 
                      className="why-indstate-image-card"
                      onClick={() => scrollToCard(idx)}
                    >
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="why-indstate-img"
                        loading={idx <= 2 ? "eager" : "lazy"}
                      />

                      {/* Floating Verification Badge Pill */}
                      <div className="why-indstate-pill-badge">
                        <span className="why-indstate-pill-dot" />
                        <span>{item.badge}</span>
                      </div>

                      {/* Polish Gradient & Key Metric */}
                      <div className="why-indstate-image-gradient" />
                      <div className="why-indstate-image-stat">
                        <span>{item.stat}</span>
                        <BadgeCheck size={16} color="#34D399" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          <div style={{ height: '10px' }} />
        </div>
      </section>

      {/* Preserved Builder & Owner CTA Banner */}
      <div style={{ padding: '0 0 80px 0', background: '#FFFFFF' }}>
        <div className="container">
          <ScrollReveal y={20} duration={0.65}>
            <div 
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #162E51 100%)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                padding: '40px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div style={{ maxWidth: '640px' }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '26px', marginBottom: '8px' }}>
                  Are you a Property Owner or Builder in India?
                </h3>
                <p style={{ color: '#CBD5E1', fontSize: '14px', lineHeight: 1.6 }}>
                  List your flat, villa, or commercial space on INDSTATE today for FREE. Reach over 2.5 million verified Indian and NRI buyers every month.
                </p>
              </div>
              <MagneticButton>
                <Link to="/add-property" className="btn btn-primary btn-lg">
                  <span>List Property For Free</span>
                  <span className="icon-nudge"><ArrowRight size={18} /></span>
                </Link>
              </MagneticButton>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
