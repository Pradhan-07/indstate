import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Star, Phone, MessageSquare, ArrowRight } from 'lucide-react';
import { INITIAL_AGENTS } from '../../data/initialAgents';
import ScrollReveal from '../common/ScrollReveal';
import { triggerCallNotification } from '../../services/leadNotificationService';

export default function AgentShowcase() {
  const [hoveredId, setHoveredId] = useState(null);
  const topAgents = INITIAL_AGENTS.slice(0, 4);
  const crevixEase = [0.16, 1, 0.3, 1];

  return (
    <section style={{ padding: '80px 0', background: 'var(--bg-page)' }}>
      <div className="container">
        <ScrollReveal y={24} duration={0.65}>
          <div className="section-header">
            <span className="section-tag">
              <ShieldCheck size={13} />
              Verified Advisors
            </span>
            <h2 className="section-title">Meet Our Certified Real Estate Agents</h2>
            <p className="section-subtitle">
              Every advisor on INDSTATE holds an active State RERA registration and adheres to strict code of ethical conduct.
            </p>
          </div>
        </ScrollReveal>

        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}
        >
          {topAgents.map((agent, idx) => {
            const isHovered = hoveredId === agent.id;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, ease: crevixEase, delay: idx * 0.08 }}
              >
                <div 
                  onMouseEnter={() => setHoveredId(agent.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 'var(--radius-lg)',
                    border: isHovered ? '1px solid var(--saffron)' : '1px solid var(--border-color)',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: isHovered ? '0 14px 30px rgba(15, 23, 42, 0.1)' : 'var(--shadow-xs)',
                    transition: 'box-shadow 180ms ease, border-color 180ms ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%'
                  }}
                >
                  {/* Avatar with Verified Badge */}
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <img 
                      src={agent.avatar} 
                      alt={agent.name} 
                      style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid var(--saffron)',
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                    <span 
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        background: 'var(--rera-green)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '26px',
                        height: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #fff'
                      }}
                      title="RERA Certified Agent"
                    >
                      <ShieldCheck size={15} />
                    </span>
                  </div>

                  <h4 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '4px' }}>
                    <Link to={`/agent/${agent.id}`} style={{ color: isHovered ? 'var(--saffron)' : 'inherit', transition: 'color 0.2s ease' }}>
                      {agent.name}
                    </Link>
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    {agent.title} • {agent.agency}
                  </span>

                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D97706', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
                    <Star size={15} fill="#D97706" />
                    <span>{agent.rating} ({agent.reviewCount} Reviews)</span>
                  </div>

                  {/* RERA ID */}
                  <div 
                    style={{
                      background: 'var(--rera-green-light)',
                      color: 'var(--rera-green)',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      marginBottom: '18px'
                    }}
                  >
                    {agent.reraAgentId.split(' ')[0]}
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '18px', flexGrow: 1 }}>
                    Specializes in: {agent.operatingAreas.slice(0, 3).join(', ')} ({agent.city})
                  </p>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <a 
                      href={`tel:${agent.phone.replace(/\s/g, '')}`}
                      onClick={() => {
                        triggerCallNotification({
                          source: 'Agent Showcase: Call Button',
                          context: `User clicked Call button for Agent: ${agent.name} (${agent.phone}, ${agent.city})`
                        });
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, padding: '8px 0' }}
                      title="Direct Phone Call"
                    >
                      <Phone size={14} />
                      <span>Call</span>
                    </a>
                    <a 
                      href={`https://wa.me/${agent.whatsapp}?text=${encodeURIComponent(`Namaste ${agent.name}, I found your profile on INDSTATE and wish to discuss properties in ${agent.city}.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        triggerCallNotification({
                          source: 'Agent Showcase: WhatsApp Chat Button',
                          context: `User clicked WhatsApp chat button for Agent: ${agent.name} (${agent.city})`
                        });
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, padding: '8px 0' }}
                      title="Chat on WhatsApp"
                    >
                      <MessageSquare size={14} />
                      <span>Chat</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <ScrollReveal y={18} duration={0.6} delay={0.2}>
          <div style={{ textAlign: 'center' }}>
            <Link to="/agents" className="btn btn-outline btn-lg" style={{ maxWidth: '100%', whiteSpace: 'normal', textAlign: 'center' }}>
              <span>View All Verified Indian Real Estate Agents</span>
              <ArrowRight size={18} style={{ flexShrink: 0 }} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
