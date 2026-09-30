import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';
import { POPULAR_INDIAN_CITIES } from '../../data/indianStatesAndCities';
import ScrollReveal from '../common/ScrollReveal';
import TextReveal from '../common/TextReveal';
import TiltCard from '../common/TiltCard';

export default function PopularCities() {
  const crevixEase = [0.16, 1, 0.3, 1];

  return (
    <section style={{ padding: '80px 0', background: '#FFFFFF' }}>
      <div className="container">
        <ScrollReveal y={24} duration={0.65}>
          <div className="section-header">
            <span className="section-tag">
              <MapPin size={13} />
              Metropolitan Hubs
            </span>
            <TextReveal 
              text="Explore Neighborhoods & Top Metropolitan Hubs" 
              className="section-title" 
              tag="h2" 
            />
            <p className="section-subtitle">
              Find certified homes in India's fastest-growing employment hubs and cultural centers.
            </p>
          </div>
        </ScrollReveal>

        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            gap: 'clamp(14px, 3vw, 24px)'
          }}
        >
          {POPULAR_INDIAN_CITIES.map((city, idx) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: crevixEase, delay: idx * 0.08 }}
            >
              <TiltCard maxTilt={2.8}>
                <Link 
                  to={`/properties?city=${encodeURIComponent(city.name)}&state=${encodeURIComponent(city.state)}`}
                  style={{
                    position: 'relative',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    aspectRatio: '3 / 4',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: 'clamp(16px, 3vw, 24px)',
                    color: '#FFFFFF'
                  }}
                >
                  {/* Background City Image with Zoom on Hover */}
                  <img 
                    src={city.image} 
                    alt={city.name} 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 0,
                      transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  />
                  
                  {/* Dark Gradient Overlay */}
                  <div 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(15, 37, 68, 0.15) 0%, rgba(15, 37, 68, 0.85) 70%, rgba(7, 21, 41, 0.95) 100%)',
                      zIndex: 1
                    }} 
                  />

                  {/* Top Badge */}
                  <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 2 }}>
                    <span 
                      style={{
                        background: 'rgba(255, 255, 255, 0.22)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid rgba(255, 255, 255, 0.35)'
                      }}
                    >
                      {city.tag}
                    </span>
                  </div>

                  {/* Bottom Content */}
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <h3 style={{ fontSize: '24px', color: '#FFFFFF', marginBottom: '4px' }}>
                      {city.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#CBD5E1', marginBottom: '10px' }}>
                      {city.state} • Starts from <strong>{city.startingPrice}</strong>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                      {city.popularAreas.map(area => (
                        <span 
                          key={area}
                          style={{
                            background: 'rgba(255, 255, 255, 0.18)',
                            fontSize: '10px',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          {area}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 600, color: '#E6BA9A' }}>
                      <span>{city.listingCount} Properties</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        View <span className="icon-nudge"><ArrowRight size={14} /></span>
                      </span>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
