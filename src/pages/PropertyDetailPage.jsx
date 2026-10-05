import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProperty } from '../context/PropertyContext';
import GallerySection from '../components/propertyDetail/GallerySection';
import PropertyHeader from '../components/propertyDetail/PropertyHeader';
import PropertyOverview from '../components/propertyDetail/PropertyOverview';
import FloorPlans from '../components/propertyDetail/FloorPlans';
import EMICalculatorWidget from '../components/propertyDetail/EMICalculatorWidget';
import AmenitiesGrid from '../components/propertyDetail/AmenitiesGrid';
import NearbyPlaces from '../components/propertyDetail/NearbyPlaces';
import AgentContactCard from '../components/propertyDetail/AgentContactCard';
import ScheduleVisitModal from '../components/propertyDetail/ScheduleVisitModal';
import PropertyCard from '../components/common/PropertyCard';
import { ShieldCheck, ArrowLeft, Building2 } from 'lucide-react';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { properties, getPropertyById } = useProperty();
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [property, setProperty] = useState(() => properties.find(p => String(p.id) === String(id)));
  const [isDetailLoading, setIsDetailLoading] = useState(!property);

  // Scroll to top on id change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const loadDetail = async () => {
      const match = properties.find(p => String(p.id) === String(id));
      if (match) {
        setProperty(match);
        setIsDetailLoading(false);
        return;
      }
      setIsDetailLoading(true);
      try {
        const fetched = await getPropertyById(id);
        if (isMounted) {
          setProperty(fetched || properties[0]);
        }
      } catch (err) {
        console.warn('Error loading property detail:', err);
      } finally {
        if (isMounted) setIsDetailLoading(false);
      }
    };
    loadDetail();
    return () => { isMounted = false; };
  }, [id, properties, getPropertyById]);

  if (isDetailLoading) {
    return (
      <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid var(--border-color)', borderTopColor: 'var(--saffron)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px auto' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading verified property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Property Not Found</h2>
        <p>The requested listing does not exist or has been archived.</p>
        <Link to="/properties" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Listings
        </Link>
      </div>
    );
  }

  // Similar properties in same city or same BHK
  const similar = properties
    .filter(p => p.id !== property.id && (p.city === property.city || p.bhk === property.bhk))
    .slice(0, 3);

  return (
    <div style={{ padding: '30px 0 80px 0', background: 'var(--bg-page)' }}>
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          <Link to="/properties" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--saffron)' }}>
            <ArrowLeft size={14} /> Back to Search
          </Link>
          <span>/</span>
          <span>{property.state}</span>
          <span>/</span>
          <span>{property.city}</span>
          <span>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{property.locality}</span>
        </div>

        {/* Gallery */}
        <GallerySection images={property.images} title={property.title} />

        {/* Property Header */}
        <PropertyHeader property={property} />

        {/* 2-Column Main Content & Sticky Contact Card */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: '36px',
            alignItems: 'start'
          }}
          className="property-detail-layout"
        >
          {/* Left Column: Details, Plans, EMI, Amenities, Connectivity */}
          <div>
            <PropertyOverview property={property} />
            <FloorPlans floorPlans={property.floorPlans} property={property} />
            <EMICalculatorWidget property={property} />
            <AmenitiesGrid amenities={property.amenities} />
            <NearbyPlaces nearby={property.nearby} />
          </div>

          {/* Right Column: Agent Card & Visit Booking */}
          <div>
            <AgentContactCard 
              agent={property.agent} 
              property={property} 
              onScheduleVisit={() => setScheduleModalOpen(true)}
            />

            {/* RERA Legal Assurance Callout */}
            <div 
              style={{
                background: 'var(--rera-green-light)',
                border: '1.5px solid var(--rera-green-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                marginTop: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ShieldCheck size={20} color="var(--rera-green)" />
                <h4 style={{ fontSize: '15px', color: 'var(--rera-green)', fontWeight: 700 }}>
                  INDSTATE RERA Buyer Assurance
                </h4>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.5 }}>
                Registration Number: <strong>{property.reraNumber}</strong>.<br />
                Sanctioned layout and escrow status verified per Real Estate (Regulation and Development) Act, 2016.
              </p>
              <Link to="/rera-disclaimer" style={{ fontSize: '12px', color: 'var(--rera-green)', fontWeight: 700, textDecoration: 'underline', marginTop: '6px', display: 'inline-block' }}>
                View State RERA Guidelines →
              </Link>
            </div>
          </div>
        </div>

        {/* Similar Properties Section */}
        {similar.length > 0 && (
          <div style={{ marginTop: '70px', paddingTop: '40px', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '24px', color: 'var(--primary)', marginBottom: '20px' }}>
              Similar Properties in {property.city} & Nearby
            </h3>
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '24px'
              }}
            >
              {similar.map(simProp => (
                <PropertyCard key={simProp.id} property={simProp} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Visit Modal */}
      <ScheduleVisitModal 
        property={property}
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />

      <style>{`
        @media (max-width: 960px) {
          .property-detail-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
