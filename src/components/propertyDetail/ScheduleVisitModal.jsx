import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle2, User, Phone } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useProperty } from '../../context/PropertyContext';
import { triggerCallNotification } from '../../services/leadNotificationService';

export default function ScheduleVisitModal({ property, isOpen, onClose }) {
  const { submitInquiry } = useProperty();

  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('11:00 AM - 01:00 PM');
  const [visitType, setVisitType] = useState('In-Person Site Visit');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [attendees, setAttendees] = useState('2');
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen || !property) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    submitInquiry({
      propertyId: property.id,
      propertyTitle: property.title,
      clientName: name,
      clientPhone: `+91 ${phone}`,
      preferredDate: date,
      timeSlot: timeSlot,
      visitType: visitType,
      attendees: attendees,
      status: 'Visit Scheduled'
    });

    // Send instant WhatsApp notification to admin helpline
    triggerCallNotification({
      source: 'Schedule Site Visit / Callback Form',
      leadName: name,
      leadPhone: `+91 ${phone}`,
      property: {
        id: property.id,
        title: property.title,
        price: property.price,
        locality: property.locality,
        city: property.city
      },
      requestedDateTime: `${date} at ${timeSlot} (${visitType})`,
      context: `Scheduled ${visitType} for ${attendees} attendee(s). Property: ${property.title}`
    });

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });

    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      onClose();
    }, 2800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '520px', padding: '32px' }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '18px', right: '18px', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        {confirmed ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle2 size={56} color="var(--rera-green)" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '24px', color: 'var(--primary)', marginBottom: '8px' }}>
              Site Visit Confirmed!
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.6 }}>
              Namaste <strong>{name}</strong>! Your {visitType.toLowerCase()} for <strong>{property.title}</strong> is booked for:
            </p>
            <div style={{ background: 'var(--bg-alt)', padding: '12px', borderRadius: '8px', margin: '16px 0', fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
              📅 {date} at {timeSlot}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Our escorted property advisor will meet you at the project reception. Confirmation SMS sent to +91 {phone}.
            </span>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Calendar size={22} color="var(--saffron)" />
              <h3 style={{ fontSize: '22px', color: 'var(--primary)' }}>Schedule Property Visit</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Complimentary escorted site visit with verified project documentation review.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Visit Type Toggle */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Visit Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {['In-Person Site Visit', 'Live Video Walkthrough'].map(vt => (
                    <button
                      key={vt}
                      type="button"
                      onClick={() => setVisitType(vt)}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: visitType === vt ? '1.5px solid var(--saffron)' : '1px solid var(--border-color)',
                        background: visitType === vt ? 'var(--saffron-light)' : '#fff',
                        color: visitType === vt ? 'var(--saffron)' : 'var(--text-main)'
                      }}
                    >
                      {vt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time Slot */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Select Date
                  </label>
                  <input 
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Time Slot
                  </label>
                  <select 
                    value={timeSlot}
                    onChange={e => setTimeSlot(e.target.value)}
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none', background: '#fff' }}
                  >
                    <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                    <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                    <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                    <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Your Full Name
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Indian Mobile Number (+91)
                </label>
                <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                  <span style={{ background: 'var(--bg-alt)', padding: '9px 12px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    +91
                  </span>
                  <input 
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', padding: '9px 12px', border: 'none', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14px' }}>
                  Confirm Site Visit Appointment
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
