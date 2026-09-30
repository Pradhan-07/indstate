import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import ScrollReveal from '../common/ScrollReveal';

export function PropertyCard({ type, innerRef, cardWidth = 380, cardHeight = 295 }) {
  return (
    <div
      ref={innerRef}
      style={{
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        borderRadius: '20px',
        position: 'relative',
        overflow: 'hidden',
        background: '#0F172A',
        flexShrink: 0,
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.05)',
        border: '1.5px solid rgba(255, 255, 255, 0.20)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        userSelect: 'none',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      <Link
        to={type.url}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          position: 'relative',
          textDecoration: 'none',
        }}
      >
        {/* Full-bleed property image */}
        <img
          src={type.image}
          alt={type.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />

        {/* Subtle bottom gradient overlay for category label readability */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '36px 20px 20px',
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.35) 55%, transparent 100%)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <span
            style={{
              color: '#FFFFFF',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '17px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
            }}
          >
            {type.name}
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function PropertyTypes() {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const cardsRef = useRef([]);
  const containerWidthRef = useRef(1200);
  const scrollPosRef = useRef(0);
  const isPausedRef = useRef(false);
  const animFrameRef = useRef(null);

  const types = [
    {
      id: "apartments",
      name: "Apartments & Flats",
      url: "/properties?type=Apartment",
      image: "/categories/apartments.jpg"
    },
    {
      id: "villas",
      name: "Luxury Independent Villas",
      url: "/properties?type=Independent+Villa",
      image: "/categories/villas.jpg"
    },
    {
      id: "penthouses",
      name: "Sky Penthouses",
      url: "/properties?type=Penthouse",
      image: "/categories/penthouses.jpg"
    },
    {
      id: "builder-floors",
      name: "Builder Floors",
      url: "/properties?type=Builder+Floor",
      image: "/categories/builder_floors.jpg"
    },
    {
      id: "commercial",
      name: "Commercial Offices",
      url: "/properties?type=Commercial+Office",
      image: "/categories/commercial.jpg"
    },
    {
      id: "farm-plots",
      name: "Residential & Farm Plots",
      url: "/properties?type=Residential+Plot",
      image: "/categories/farm_plots.jpg"
    },
    {
      id: "pg-coliving",
      name: "PG & Co-Living Suites",
      url: "/properties?type=PG+/+Shared+Living",
      image: "/categories/pg_coliving.jpg"
    }
  ];

  const [dim, setDim] = useState(() => {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      if (w <= 480) return { width: Math.min(275, Math.floor(w * 0.72)), height: 215, gap: 14, paddingLeft: 20 };
      if (w <= 768) return { width: 290, height: 230, gap: 18, paddingLeft: 30 };
      if (w <= 1024) return { width: 330, height: 260, gap: 22, paddingLeft: 40 };
    }
    return { width: 380, height: 295, gap: 28, paddingLeft: 60 };
  });

  const CARD_WIDTH = dim.width;
  const CARD_GAP = dim.gap;
  const CARD_HEIGHT = dim.height;
  const PADDING_LEFT = dim.paddingLeft;
  const SINGLE_SET_WIDTH = types.length * (CARD_WIDTH + CARD_GAP);

  const carouselItems = [
    ...types.map(t => ({ ...t, setKey: 's1' })),
    ...types.map(t => ({ ...t, setKey: 's2' })),
    ...types.map(t => ({ ...t, setKey: 's3' })),
    ...types.map(t => ({ ...t, setKey: 's4' }))
  ];

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w <= 480) {
        setDim({ width: Math.min(275, Math.floor(w * 0.72)), height: 215, gap: 14, paddingLeft: 20 });
      } else if (w <= 768) {
        setDim({ width: 290, height: 230, gap: 18, paddingLeft: 30 });
      } else if (w <= 1024) {
        setDim({ width: 330, height: 260, gap: 22, paddingLeft: 40 });
      } else {
        setDim({ width: 380, height: 295, gap: 28, paddingLeft: 60 });
      }
      if (containerRef.current) {
        containerWidthRef.current = containerRef.current.clientWidth;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    const SPEED_PPS = 55;

    const updateMarquee = (currentTime) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Only advance position if cursor is not hovering on the carousel
      if (!isPausedRef.current) {
        if (dt > 0 && dt < 0.1) {
          scrollPosRef.current += SPEED_PPS * dt;
          if (scrollPosRef.current >= SINGLE_SET_WIDTH) {
            scrollPosRef.current -= SINGLE_SET_WIDTH;
          }
        }
      }

      // 1. Move track
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(-${scrollPosRef.current}px, 0, 0)`;
      }

      // 2. Subtle 3D tilt curve calculation (based on math, no layout reflows)
      const containerW = containerWidthRef.current || 1200;
      const screenCenter = containerW / 2;

      cardsRef.current.forEach((cardEl, idx) => {
        if (!cardEl) return;
        const cardCenterScreen = PADDING_LEFT + idx * (CARD_WIDTH + CARD_GAP) + CARD_WIDTH / 2 - scrollPosRef.current;

        // Skip cards outside the visible screen buffer
        if (cardCenterScreen < -CARD_WIDTH || cardCenterScreen > containerW + CARD_WIDTH) {
          return;
        }

        const u = (cardCenterScreen - screenCenter) / (containerW * 0.55);
        const clampedU = Math.max(-1.3, Math.min(1.3, u));

        // Subtle tilt angle: -9.5deg to +9.5deg
        const rotY = -clampedU * 9.5;
        // Subtle scale: 0.95 to 1.0
        const scale = 1.0 - Math.abs(clampedU) * 0.045;
        const zIndex = Math.round(100 - Math.abs(clampedU) * 30);

        cardEl.style.transform = `perspective(1200px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        cardEl.style.zIndex = zIndex;
      });

      animFrameRef.current = requestAnimationFrame(updateMarquee);
    };

    animFrameRef.current = requestAnimationFrame(updateMarquee);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [SINGLE_SET_WIDTH, PADDING_LEFT, CARD_WIDTH, CARD_GAP]);

  const handleManualScroll = (direction) => {
    const delta = (CARD_WIDTH + CARD_GAP) * direction;
    let newPos = scrollPosRef.current + delta;
    if (newPos < 0) newPos += SINGLE_SET_WIDTH;
    if (newPos >= SINGLE_SET_WIDTH) newPos -= SINGLE_SET_WIDTH;
    scrollPosRef.current = newPos;
  };

  return (
    <section style={{ padding: '80px 0 110px', background: 'var(--bg-page)', overflow: 'hidden', contain: 'paint' }}>
      <div className="container" style={{ position: 'relative' }}>
        <ScrollReveal y={24} duration={0.65}>
          <div className="section-header" style={{ marginBottom: '36px' }}>
            <span className="section-tag">
              <Building2 size={13} />
              Categories
            </span>
            <h2 className="section-title">Discover By Property Type</h2>
            <p className="section-subtitle">
              Find the right format of residential and commercial real estate tailored to your lifestyle and budget.
            </p>
          </div>
        </ScrollReveal>

        <div 
          className="property-types-nav-btns"
          style={{
            position: 'absolute',
            right: '20px',
            top: '20px',
            display: 'flex',
            gap: '10px',
            zIndex: 10
          }}
        >
          <button
            onClick={() => handleManualScroll(-1)}
            aria-label="Previous Category"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '1px solid rgba(15, 23, 42, 0.1)',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--primary)',
              transition: 'background 0.2s ease, color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--saffron)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.color = 'var(--primary)';
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => handleManualScroll(1)}
            aria-label="Next Category"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '1px solid rgba(15, 23, 42, 0.1)',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--primary)',
              transition: 'background 0.2s ease, color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--saffron)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.color = 'var(--primary)';
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        onMouseEnter={() => { isPausedRef.current = true; }}
        onMouseLeave={() => { isPausedRef.current = false; }}
        style={{
          width: '100%',
          overflow: 'hidden',
          contain: 'paint',
          perspective: '1400px',
          perspectiveOrigin: 'center center',
          padding: '24px 0 44px',
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            gap: `${CARD_GAP}px`,
            width: 'max-content',
            paddingLeft: `${PADDING_LEFT}px`,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          {carouselItems.map((t, idx) => (
            <PropertyCard
              key={`${t.setKey}-${t.id}`}
              type={t}
              innerRef={(el) => (cardsRef.current[idx] = el)}
              cardWidth={CARD_WIDTH}
              cardHeight={CARD_HEIGHT}
            />
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .property-types-nav-btns {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
