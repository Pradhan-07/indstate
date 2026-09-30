import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, X, ArrowRight } from 'lucide-react';
import { useProperty } from '../../context/PropertyContext';
import { formatIndianPrice } from '../../utils/currencyFormatter';

export default function CompareFloatingBar() {
  const { compareList, removeFromCompare, clearCompare } = useProperty();

  if (compareList.length === 0) return null;

  return (
    <div className={`compare-drawer ${compareList.length > 0 ? 'open' : ''}`}>
      <div className="container">
        <div className="compare-drawer-inner">
          <div className="compare-drawer-left">
            <div className="compare-drawer-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{
                  background: 'var(--saffron)',
                  color: '#FFFFFF',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Scale size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--primary)', display: 'block', lineHeight: 1.2 }}>
                  Compare ({compareList.length}/4)
                </strong>
                <span className="compare-subtitle-desktop" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Prices, areas & RERA side-by-side
                </span>
              </div>
            </div>

            <div className="compare-drawer-actions">
              <button 
                onClick={clearCompare}
                style={{ fontSize: '12.5px', color: 'var(--text-muted)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Clear
              </button>
              <Link to="/compare" className="btn btn-primary btn-sm" style={{ padding: '6px 14px', fontSize: '12px' }}>
                <span>Compare Now</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="compare-items-row">
            {compareList.map(item => (
              <div key={item.id} className="compare-item-preview">
                <img 
                  src={item.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80'} 
                  alt={item.title} 
                  className="compare-item-img"
                />
                <div style={{ overflow: 'hidden', minWidth: 0 }}>
                  <div className="compare-item-title" title={item.title}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                    {formatIndianPrice(item.price, item.purpose === 'Rent')}
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCompare(item.id)}
                  style={{ color: 'var(--text-muted)', padding: '2px', marginLeft: 'auto' }}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
