import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, ChevronLeft, ChevronRight, MapPin, Bed, Bath, 
  Ruler, ShieldCheck, Heart, ArrowRight, Phone 
} from 'lucide-react';
import { useProperty } from '../../context/PropertyContext';
import { formatIndianPrice, formatIndianNumber } from '../../utils/currencyFormatter';

export default function QuickPreviewModal() {
  const { quickPreviewProperty, setQuickPreviewProperty, isFavorite, toggleFavorite } = useProperty();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  if (!quickPreviewProperty) return null;

  const prop = quickPreviewProperty;
  const isFav = isFavorite(prop.id);
  const images = prop.images || [];

  const nextImg = () => {
    if (images.length > 0) {
      setCurrentImgIndex((currentImgIndex + 1) % images.length);
    }
  };

  const prevImg = () => {
    if (images.length > 0) {
      setCurrentImgIndex((currentImgIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setQuickPreviewProperty(null)}>
      <div 
        className="modal-content quick-preview-modal-box" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '820px', padding: 0, overflow: 'hidden', position: 'relative' }}
      >
        {/* Close Button */}
        <button 
          onClick={() => setQuickPreviewProperty(null)}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(15, 37, 68, 0.75)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            color: '#FFFFFF',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
          aria-label="Close Preview"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
          {/* Left: Image Slider */}
          <div style={{ position: 'relative', height: 'clamp(220px, 40vw, 360px)', background: '#000' }}>
            <img 
              src={images[currentImgIndex] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'} 
              alt={prop.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImg}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '12px',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={nextImg}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '12px',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ChevronRight size={18} />
                </button>
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '12px'
                  }}
                >
                  {currentImgIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Right: Quick Details */}
          <div style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-featured">
                {prop.purpose === 'Buy' ? 'For Sale' : prop.purpose}
              </span>
              {prop.isReraVerified && (
                <span className="badge badge-rera">
                  <ShieldCheck size={12} />
                  <span>RERA Verified</span>
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>{prop.title}</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              <MapPin size={15} color="var(--saffron)" />
              <span>{prop.address || `${prop.locality}, ${prop.city}, ${prop.state}`}</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                {formatIndianPrice(prop.price, prop.purpose === 'Rent')}
              </span>
              {prop.pricePerSqFt && (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                  (₹{formatIndianNumber(prop.pricePerSqFt)} / sq.ft.)
                </span>
              )}
            </div>

            {/* Indian Real Estate Key Specs */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                background: 'var(--bg-alt)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                fontSize: '13px'
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>CONFIG</span>
                <strong>{prop.bhk} BHK Apartment</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>RERA CARPET AREA</span>
                <strong style={{ color: 'var(--rera-green)' }}>{formatIndianNumber(prop.carpetArea)} sq.ft.</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>POSSESSION</span>
                <strong>{prop.possessionStatus}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>VASTU FACING</span>
                <strong>{prop.facing || 'East Facing'}</strong>
              </div>
            </div>

            {prop.reraNumber && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                🛡️ <strong>RERA ID:</strong> {prop.reraNumber}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
              <button 
                onClick={() => toggleFavorite(prop.id)}
                className={`btn btn-outline ${isFav ? 'btn-primary' : ''}`}
                style={{ padding: '10px 14px' }}
                title="Save Property"
              >
                <Heart size={18} fill={isFav ? "#fff" : "none"} />
              </button>

              <Link 
                to={`/property/${prop.id}`} 
                onClick={() => setQuickPreviewProperty(null)}
                className="btn btn-primary"
                style={{ flexGrow: 1 }}
              >
                <span>View Full Details & Floor Plans</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 640px) {
            .quick-preview-modal-box {
              max-height: 90dvh !important;
              overflow-y: auto !important;
              -webkit-overflow-scrolling: touch !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
