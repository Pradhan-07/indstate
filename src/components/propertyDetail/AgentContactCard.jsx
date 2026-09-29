import React, { useState } from 'react';
import { 
  Phone, MessageSquare, Calendar, ShieldCheck, 
  Send, User, CheckCircle2, Star 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProperty } from '../../context/PropertyContext';
import { triggerCallNotification } from '../../services/leadNotificationService';

export default function AgentContactCard({ agent, property, onScheduleVisit }) {
  const { submitInquiry } = useProperty();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: `Namaste, I am interested in ${property.title} (ID: ${property.id}). Please share the latest floor plans and pricing.`
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitInquiry({
      propertyId: property.id,
      propertyTitle: property.title,
      clientName: formData.name,
      clientPhone: `+91 ${formData.phone}`,
      clientEmail: formData.email,
      message: formData.message,
      agentId: agent?.id
    });

    // Send instant WhatsApp notification to admin helpline
    triggerCallNotification({
      source: 'Listing Detail: Inquiry Callback Form',
      leadName: formData.name,
      leadPhone: `+91 ${formData.phone}`,
      property: {
        id: property.id,
        title: property.title,
        price: property.price,
        locality: property.locality,
        city: property.city
      },
      context: formData.message
    });

    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 4000);
  };

  const defaultAgent = {
    name: "Rajesh Singhania",
    agency: "Apex India Luxury Realty",
    phone: "+91 98201 54321",
    whatsapp: "919820154321",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    reraAgentId: "A51900002148"
  };

  const ag = agent || defaultAgent;

  return (
    <div 
      style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky',
        top: '96px'
      }}
    >
      {/* Agent Info Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ position: 'relative' }}>
          <img 
            src={ag.avatar} 
            alt={ag.name} 
            style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--saffron)' }}
          />
          <span 
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'var(--rera-green)',
              color: '#fff',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fff'
            }}
          >
            <ShieldCheck size={12} />
          </span>
        </div>

        <div>
          <h4 style={{ fontSize: '16px', color: 'var(--primary)', marginBottom: '2px' }}>
            <Link to={ag.id ? `/agent/${ag.id}` : '#'}>{ag.name}</Link>
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
            {ag.agency}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D97706', fontSize: '12px', fontWeight: 600, marginTop: '2px' }}>
            <Star size={12} fill="#D97706" />
            <span>{ag.rating || 4.9} Verified Advisor</span>
          </div>
        </div>
      </div>

      {/* RERA Agent ID */}
      {ag.reraAgentId && (
        <div 
          style={{
            background: 'var(--rera-green-light)',
            color: 'var(--rera-green)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ShieldCheck size={14} />
          <span>RERA Agent Reg: {ag.reraAgentId}</span>
        </div>
      )}

      {/* Call & WhatsApp Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <a 
          href={`tel:${ag.phone.replace(/\s/g, '')}`}
          onClick={() => {
            triggerCallNotification({
              source: 'Property Detail: Call Agent Button',
              property: {
                id: property.id,
                title: property.title,
                price: property.price,
                locality: property.locality,
                city: property.city
              },
              context: `User clicked Call Agent (${ag.name} - ${ag.phone}) for ${property.title}`
            });
          }}
          className="btn btn-outline"
          style={{ padding: '9px 0', fontSize: '13px' }}
        >
          <Phone size={15} color="var(--primary)" />
          <span>Call Agent</span>
        </a>

        <a 
          href={`https://wa.me/${ag.whatsapp}?text=${encodeURIComponent(`Namaste ${ag.name}, I am interested in ${property.title} (ID: ${property.id}) listed on INDSTATE.`)}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            triggerCallNotification({
              source: 'Property Detail: WhatsApp Button',
              property: {
                id: property.id,
                title: property.title,
                price: property.price,
                locality: property.locality,
                city: property.city
              },
              context: `User clicked WhatsApp button to chat with ${ag.name} regarding ${property.title}`
            });
          }}
          className="btn btn-outline"
          style={{ padding: '9px 0', fontSize: '13px', borderColor: 'var(--success)', color: 'var(--success)' }}
        >
          <MessageSquare size={15} />
          <span>WhatsApp</span>
        </a>
      </div>

      {/* Schedule Visit Button */}
      <button 
        type="button"
        onClick={onScheduleVisit}
        className="btn btn-primary"
        style={{ width: '100%', padding: '12px', marginBottom: '20px' }}
      >
        <Calendar size={16} />
        <span>Schedule a Physical Site Visit</span>
      </button>

      {/* Direct Inquiry Form */}
      <div>
        <h5 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Send Instant Inquiry:
        </h5>

        {formSubmitted ? (
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--rera-green-light)', borderRadius: 'var(--radius-md)' }}>
            <CheckCircle2 size={32} color="var(--rera-green)" style={{ margin: '0 auto 6px auto' }} />
            <strong style={{ color: 'var(--rera-green)', display: 'block' }}>Inquiry Dispatched!</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>The advisor will call you back shortly.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Your Full Name"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none' }}
            />

            <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
              <span style={{ background: 'var(--bg-alt)', padding: '9px 10px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                +91
              </span>
              <input 
                type="tel" 
                maxLength={10}
                placeholder="10-digit mobile number"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                style={{ width: '100%', padding: '9px 12px', border: 'none', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <textarea 
              rows={3}
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', outline: 'none', resize: 'vertical' }}
            />

            <button type="submit" className="btn btn-navy" style={{ width: '100%', padding: '10px', fontSize: '13px' }}>
              <Send size={14} />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
