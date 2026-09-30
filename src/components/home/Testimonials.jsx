import React, { useState, useEffect, useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollReveal from '../common/ScrollReveal';

export default function Testimonials() {
  const reviews = [
    {
      id: 1,
      name: "Siddharth & Ananya Roy",
      role: "Homebuyers in Whitefield, Bengaluru",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      rating: 5,
      city: "Bengaluru, Karnataka",
      comment: "We relocated from Singapore to Bengaluru and were terrified of super built-up scams. INDSTATE's explicit RERA carpet area breakdown gave us 100% confidence. Our agent Pooja arranged virtual walkthroughs and clear title verification."
    },
    {
      id: 2,
      name: "Col. Sanjeev Bakshi (Retd.)",
      role: "Villa Owner in Dehradun & Buyer in Pune",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      rating: 5,
      city: "Pune, Maharashtra",
      comment: "The Hinglish AI assistant was surprisingly intelligent! I typed 'Pune me Hinjawadi ke paas 2BHK flat chahiye' and within 2 seconds it curated genuine RERA projects and connected me to Aditya. Zero hassle."
    },
    {
      id: 3,
      name: "Rohit & Natasha Khandelwal",
      role: "Luxury Penthouse Buyers in Worli, Mumbai",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      rating: 5,
      city: "Mumbai, Maharashtra",
      comment: "The side-by-side property comparison tool saved us weeks of spreadsheets. We compared Lodha World View with another sea-facing tower on price/sqft, carpet area, and stamp duty before final registration."
    },
    {
      id: 4,
      name: "Dr. Kavitha Sundaram",
      role: "NRI Investor, Gachibowli High-Street",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
      rating: 5,
      city: "Hyderabad, Telangana",
      comment: "Purchasing commercial office space from Dubai seemed daunting until I used INDSTATE. The rental yield calculator, RERA verification certificate, and escrow status were right there on the listing page."
    },
    {
      id: 5,
      name: "Vikram & Shweta Bhatia",
      role: "3 BHK Homeowners in Sector 150, Noida",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
      rating: 5,
      city: "Noida, Delhi NCR",
      comment: "We saved ₹2.8 Lakhs in brokerage fees using the Direct Owner filter. Scheduled an escorted physical inspection on Sunday, met the builder directly, and secured a bank loan through HDFC with zero hassle."
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const crevixEase = [0.16, 1, 0.3, 1];

  // Auto-advance automatically every 5 seconds without requiring any user action
  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [reviews.length]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  // Smooth horizontal slide transition (850ms, zero jitter, zero scaling)
  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { duration: 0.85, ease: crevixEase },
        opacity: { duration: 0.6, ease: 'easeOut' }
      }
    },
    exit: (dir) => ({
      x: dir < 0 ? 60 : -60,
      opacity: 0,
      transition: {
        x: { duration: 0.85, ease: crevixEase },
        opacity: { duration: 0.5, ease: 'easeIn' }
      }
    })
  };

  const currentReview = reviews[currentIndex];

  return (
    <section style={{ padding: '80px 0', background: '#FFFFFF', overflow: 'hidden' }}>
      <div className="container">
        <ScrollReveal y={24} duration={0.65}>
          <div className="section-header">
            <span className="section-tag">
              <Quote size={13} />
              Buyer Stories
            </span>
            <h2 className="section-title">Loved by 50,000+ Indian Families</h2>
            <p className="section-subtitle">
              Hear from genuine homebuyers, NRI investors, and tenants who found their dream addresses through INDSTATE.
            </p>
          </div>
        </ScrollReveal>

        {/* Carousel Container */}
        <div style={{ maxWidth: '840px', margin: '0 auto', position: 'relative' }}>
          {/* Main Slide Card Container with Stable Height */}
          <div style={{ position: 'relative', minHeight: '300px', display: 'flex', alignItems: 'center' }}>
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{
                  width: '100%',
                  background: 'var(--bg-page)',
                  padding: 'clamp(20px, 4.5vw, 44px)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
                  position: 'relative'
                }}
              >
                {/* Top Rating & Quote Icon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '4px', color: '#D97706' }}>
                    {[...Array(currentReview.rating)].map((_, i) => (
                      <Star key={i} size={18} fill="#D97706" />
                    ))}
                  </div>
                  <div style={{ color: 'var(--saffron)', opacity: 0.35 }}>
                    <Quote size={28} />
                  </div>
                </div>

                {/* Review Text */}
                <p style={{ 
                  fontStyle: 'italic', 
                  fontSize: 'clamp(14px, 2.5vw, 17px)', 
                  lineHeight: 1.65, 
                  color: 'var(--primary)', 
                  marginBottom: '22px',
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 500
                }}>
                  "{currentReview.comment}"
                </p>

                {/* Author Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img 
                    src={currentReview.avatar} 
                    alt={currentReview.name} 
                    style={{ 
                      width: '54px', 
                      height: '54px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '2px solid var(--saffron)'
                    }}
                  />
                  <div>
                    <h4 style={{ fontSize: '16px', color: 'var(--primary)', fontWeight: 700 }}>
                      {currentReview.name}
                    </h4>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {currentReview.role} • <strong style={{ color: 'var(--rera-green)', fontWeight: 600 }}>{currentReview.city}</strong>
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls: Arrows and Dots */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', padding: '0 8px' }}>
            {/* Dots */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {reviews.map((rev, idx) => (
                <button
                  key={rev.id}
                  type="button"
                  onClick={() => {
                    setDirection(idx >= currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  style={{
                    width: idx === currentIndex ? '28px' : '9px',
                    height: '9px',
                    borderRadius: 'var(--radius-full)',
                    background: idx === currentIndex ? 'var(--saffron)' : '#CBD5E1',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Arrows */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handlePrev}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-xs)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--saffron)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(181, 100, 43, 0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={handleNext}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-xs)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--saffron)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(181, 100, 43, 0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
                aria-label="Next testimonial"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
