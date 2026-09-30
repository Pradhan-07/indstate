import React from 'react';
import { 
  ShieldCheck, MapPin, Heart, Scale, Share2, 
  IndianRupee, Download, CheckCircle2 
} from 'lucide-react';
import { formatIndianPrice, formatIndianNumber, formatFullINR } from '../../utils/currencyFormatter';
import { useProperty } from '../../context/PropertyContext';

export default function PropertyHeader({ property }) {
  const { isFavorite, toggleFavorite, isInCompare, addToCompare } = useProperty();

  if (!property) return null;

  const isFav = isFavorite(property.id);
  const inComp = isInCompare(property.id);
  const isRent = property.purpose === 'Rent' || property.purpose === 'PG-Co-living';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Check out ${property.title} on INDSTATE:`,
        url: window.location.href
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Property link copied to clipboard!");
    }
  };

  return (
    <div style={{ marginBottom: '28px' }}>
      {/* Badges & Actions Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          {property.featured && (
            <span className="badge badge-featured">Featured</span>
          )}
          <span className={`badge ${isRent ? 'badge-status-rent' : 'badge-status'}`}>
            {property.purpose === 'Buy' ? 'For Sale' : property.purpose}
          </span>
          {property.isReraVerified && (
            <span className="badge badge-rera">
              <ShieldCheck size={14} />
              <span>RERA ID: {property.reraNumber}</span>
            </span>
          )}
          <span style={{ fontSize: '12px', background: 'var(--bg-alt)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
            Property ID: <strong>{property.id}</strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button"
            onClick={() => toggleFavorite(property.id)}
            className={`btn btn-outline btn-sm ${isFav ? 'btn-primary' : ''}`}
            title="Add to Favorites"
          >
            <Heart size={15} fill={isFav ? "#FFFFFF" : "none"} />
            <span>{isFav ? 'Saved' : 'Save'}</span>
          </button>

          <button 
            type="button"
            onClick={() => addToCompare(property)}
            className={`btn btn-outline btn-sm ${inComp ? 'btn-primary' : ''}`}
            title="Compare Side-by-side"
          >
            <Scale size={15} />
            <span>{inComp ? 'In Compare' : 'Compare'}</span>
          </button>

          <button 
            type="button"
            onClick={handleShare}
            className="btn btn-outline btn-sm"
            title="Share Property"
          >
            <Share2 size={15} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Title & Price Header Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
        <div style={{ maxWidth: '780px', flex: '1 1 300px' }}>
          <h1 style={{ fontSize: 'clamp(22px, 4.5vw, 32px)', color: 'var(--primary)', marginBottom: '8px', lineHeight: 1.25 }}>
            {property.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14.5px' }}>
            <MapPin size={16} color="var(--saffron)" />
            <span>{property.address}</span>
          </div>
        </div>

        {/* Price & Charges Block */}
        <div className="property-header-price-box" style={{ background: 'var(--bg-alt)', padding: '16px 22px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>
            {isRent ? 'MONTHLY RENT' : 'PRICE (INR ₹)'}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, color: 'var(--primary)' }}>
            {formatIndianPrice(property.price, isRent)}
          </div>
          {property.pricePerSqFt && (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              ₹{formatIndianNumber(property.pricePerSqFt)} / sq.ft. (Carpet)
            </div>
          )}
          {property.maintenanceCharges > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Maintenance: ₹{formatIndianNumber(property.maintenanceCharges)}/mo
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
