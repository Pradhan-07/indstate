import React, { useState } from 'react';
import { Maximize2, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function GallerySection({ images = [], title }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Main Image with Fullscreen Button */}
      <div 
        style={{
          position: 'relative',
          height: 'clamp(240px, 48vw, 480px)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          background: 'var(--primary)'
        }}
        onClick={() => setLightboxOpen(true)}
      >
        <img 
          src={images[activeIdx]} 
          alt={title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxOpen(true);
          }}
          style={{
            position: 'absolute',
            bottom: 'clamp(10px, 3vw, 20px)',
            right: 'clamp(10px, 3vw, 20px)',
            background: 'rgba(15, 37, 68, 0.82)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            color: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <Maximize2 size={15} />
          <span>Photos ({images.length})</span>
        </button>
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div 
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '12px',
            overflowX: 'auto',
            paddingBottom: '4px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none'
          }}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              style={{
                width: 'clamp(68px, 14vw, 100px)',
                height: 'clamp(50px, 10vw, 75px)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: activeIdx === idx ? '2.5px solid var(--saffron)' : '1px solid var(--border-color)',
                opacity: activeIdx === idx ? 1 : 0.7,
                transition: 'var(--transition)',
                flexShrink: 0
              }}
            >
              <img src={img} alt={`${title} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setLightboxOpen(false)}
          style={{ background: 'rgba(7, 21, 41, 0.95)', zIndex: 2000 }}
        >
          <div 
            style={{ position: 'relative', width: '90vw', maxWidth: '1100px', height: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setLightboxOpen(false)}
              style={{
                position: 'absolute',
                top: '-45px',
                right: '0',
                color: '#fff',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <X size={24} /> Close
            </button>

            <img 
              src={images[activeIdx]} 
              alt={title} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />

            <button 
              onClick={() => setActiveIdx((activeIdx - 1 + images.length) % images.length)}
              style={{
                position: 'absolute',
                top: '50%',
                left: '-20px',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronLeft size={24} />
            </button>

            <button 
              onClick={() => setActiveIdx((activeIdx + 1) % images.length)}
              style={{
                position: 'absolute',
                top: '50%',
                right: '-20px',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronRight size={24} />
            </button>

            <div 
              style={{
                position: 'absolute',
                bottom: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              {activeIdx + 1} / {images.length} — {title}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
