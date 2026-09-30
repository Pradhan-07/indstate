import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, ShieldCheck, Mail, Phone, MapPin, 
  ArrowRight, Award, CheckCircle, Heart
} from 'lucide-react';
import { INDIAN_STATES, UNION_TERRITORIES } from '../../data/indianStatesAndCities';
import IndstateLogo from './IndstateLogo';
import { triggerCallNotification } from '../../services/leadNotificationService';

// Smooth, calm easing curve for financial/real estate trust
const footerEase = [0.16, 1, 0.3, 1];

// 1. Trust Badges Animation Variants
const badgesContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const badgeItemVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.45,
      ease: footerEase
    }
  }
};

const badgeIconVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: footerEase
    }
  }
};

const badgeTextVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: footerEase,
      delay: 0.08 // Text slides in slightly after the icon arrives
    }
  }
};

// 2. Divider Line Animation Variant (draws left to right)
const dividerVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.8,
      ease: footerEase
    }
  }
};

// 3. Footer Columns Animation Variants
const columnsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08
    }
  }
};

const columnItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: footerEase
    }
  }
};

// 4. States & UTs Directory Animation Variants (Fast typewriter-ish cascade)
const directoryHeaderVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: footerEase
    }
  }
};

const statesContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.018, // ~18ms per item, finishes all 28 states in ~0.5s
      delayChildren: 0.06
    }
  }
};

const utContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.06
    }
  }
};

const directoryItemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: 'easeOut'
    }
  }
};

export default function Footer() {
  return (
    <footer data-cursor-section="footer" style={{ background: 'var(--primary-dark)', color: '#94A3B8', paddingTop: '70px' }}>
      <div className="container">
        {/* 1. TOP FEATURE HIGHLIGHTS BAR (TRUST BADGES) */}
        <motion.div 
          className="footer-badges-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            paddingBottom: '50px'
          }}
          variants={badgesContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Badge 1: 100% RERA Verified */}
          <motion.div 
            className="footer-badge-card" 
            variants={badgeItemVariants}
            style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}
          >
            <motion.div 
              className="footer-badge-icon badge-icon-green"
              variants={badgeIconVariants}
              style={{ background: 'rgba(31, 95, 74, 0.25)', color: '#A3CEBF' }}
            >
              <ShieldCheck size={28} />
            </motion.div>
            <motion.div variants={badgeTextVariants}>
              <h4 style={{ color: '#FFFFFF', fontSize: '16px', marginBottom: '4px' }}>100% RERA Verified</h4>
              <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#94A3B8', margin: 0 }}>
                Every project verified with State RERA registration numbers before listing.
              </p>
            </motion.div>
          </motion.div>

          {/* Badge 2: Zero Brokerage Direct */}
          <motion.div 
            className="footer-badge-card" 
            variants={badgeItemVariants}
            style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}
          >
            <motion.div 
              className="footer-badge-icon badge-icon-orange"
              variants={badgeIconVariants}
              style={{ background: 'rgba(181, 100, 43, 0.25)', color: '#E6BA9A' }}
            >
              <Award size={28} />
            </motion.div>
            <motion.div variants={badgeTextVariants}>
              <h4 style={{ color: '#FFFFFF', fontSize: '16px', marginBottom: '4px' }}>Zero Brokerage Direct</h4>
              <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#94A3B8', margin: 0 }}>
                Connect directly with genuine property owners & builders across India.
              </p>
            </motion.div>
          </motion.div>

          {/* Badge 3: Transparent Carpet Area */}
          <motion.div 
            className="footer-badge-card" 
            variants={badgeItemVariants}
            style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}
          >
            <motion.div 
              className="footer-badge-icon badge-icon-blue"
              variants={badgeIconVariants}
              style={{ background: 'rgba(31, 95, 74, 0.25)', color: '#A3CEBF' }}
            >
              <CheckCircle size={28} />
            </motion.div>
            <motion.div variants={badgeTextVariants}>
              <h4 style={{ color: '#FFFFFF', fontSize: '16px', marginBottom: '4px' }}>Transparent Carpet Area</h4>
              <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#94A3B8', margin: 0 }}>
                Clear demarcation of usable carpet area vs super built-up area under Indian law.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Animated Divider 1 */}
        <motion.div 
          className="footer-divider-line"
          variants={dividerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        />

        {/* 2. MAIN 3-COLUMN FOOTER LINKS */}
        <motion.div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '40px',
            padding: '50px 0'
          }}
          variants={columnsContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {/* Column 1: Brand Info & Contact */}
          <motion.div variants={columnItemVariants}>
            <div style={{ marginBottom: '16px' }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <IndstateLogo height={44} isDark={true} />
              </Link>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '18px', color: '#94A3B8' }}>
              India's premier RERA-certified real estate platform connecting home buyers, tenants, and investors with verified properties across all 28 States and 8 Union Territories.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} color="var(--saffron)" />
                BKC Corporate Park, Bandra East, Mumbai 400051
              </span>
              <a 
                href="https://wa.me/916207211360"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  triggerCallNotification({
                    source: 'Footer: Helpline WhatsApp Link',
                    context: 'Visitor clicked Helpline No. in footer'
                  });
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CBD5E1', textDecoration: 'none' }}
                className="footer-interactive-link"
              >
                <Phone size={15} color="var(--saffron)" />
                Helpline No.: +91 6207 211 360
              </a>
              <a 
                href="mailto:ind.state.build@gmail.com"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CBD5E1', textDecoration: 'none' }}
                className="footer-interactive-link"
              >
                <Mail size={15} color="var(--saffron)" />
                ind.state.build@gmail.com
              </a>
            </div>
          </motion.div>

          {/* Column 2: Explore Properties */}
          <motion.div variants={columnItemVariants}>
            <h4 style={{ color: '#FFFFFF', fontSize: '16px', marginBottom: '18px', fontFamily: 'var(--font-display)' }}>
              Explore Properties
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', padding: 0, margin: 0 }}>
              <li><Link to="/properties?purpose=Buy" className="footer-interactive-link">Flats & Apartments for Sale</Link></li>
              <li><Link to="/properties?purpose=Rent" className="footer-interactive-link">Rental Homes & Penthouses</Link></li>
              <li><Link to="/properties?purpose=PG-Co-living" className="footer-interactive-link">PG & Techie Co-Living</Link></li>
              <li><Link to="/properties?purpose=Commercial" className="footer-interactive-link">Commercial Office & Retail</Link></li>
              <li><Link to="/properties?purpose=Plots" className="footer-interactive-link">Residential Land & Plots</Link></li>
              <li>
                <Link to="/properties?reraOnly=true" className="footer-interactive-link" style={{ color: 'var(--success-border)', fontWeight: 600 }}>
                  RERA Approved Projects
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Column 3: Tools & Legal */}
          <motion.div variants={columnItemVariants}>
            <h4 style={{ color: '#FFFFFF', fontSize: '16px', marginBottom: '18px', fontFamily: 'var(--font-display)' }}>
              Tools & Legal
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', padding: 0, margin: 0 }}>
              <li><Link to="/calculator" className="footer-interactive-link">Indian Home Loan EMI Calculator</Link></li>
              <li><Link to="/compare" className="footer-interactive-link">Compare Properties Side-by-Side</Link></li>
              <li><Link to="/agents" className="footer-interactive-link">Find Certified RERA Agents</Link></li>
              <li><Link to="/blog" className="footer-interactive-link">Indian Real Estate News & Insights</Link></li>
              <li><Link to="/rera-disclaimer" className="footer-interactive-link">RERA Disclaimer & State Portals</Link></li>
              <li><Link to="/about" className="footer-interactive-link">About INDSTATE</Link></li>
              <li><Link to="/contact" className="footer-interactive-link">Contact Our City Hubs</Link></li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Animated Divider 2 */}
        <motion.div 
          className="footer-divider-line"
          variants={dividerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        />

        {/* 3. ALL 28 STATES & 8 UNION TERRITORIES DIRECTORY */}
        <div style={{ padding: '36px 0' }}>
          {/* States Heading */}
          <motion.h5 
            variants={directoryHeaderVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            style={{ color: '#E2E8F0', fontSize: '13px', marginBottom: '14px', fontFamily: 'var(--font-display)', letterSpacing: '0.6px', fontWeight: 700 }}
          >
            ALL 28 INDIAN STATES DIRECTORY:
          </motion.h5>

          {/* States Fast Cascading Grid */}
          <motion.div 
            className="footer-states-grid"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: '12px' }}
            variants={statesContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {INDIAN_STATES.map(s => (
              <motion.div key={s.code} variants={directoryItemVariants}>
                <Link 
                  to={`/properties?state=${encodeURIComponent(s.name)}`}
                  className="footer-state-link"
                >
                  {s.name}
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* UTs Heading */}
          <motion.h5 
            variants={directoryHeaderVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            style={{ color: '#E2E8F0', fontSize: '13px', marginTop: '24px', marginBottom: '14px', fontFamily: 'var(--font-display)', letterSpacing: '0.6px', fontWeight: 700 }}
          >
            UNION TERRITORIES:
          </motion.h5>

          {/* UTs Fast Cascading Grid */}
          <motion.div 
            className="footer-ut-grid"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: '12px' }}
            variants={utContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {UNION_TERRITORIES.map(u => (
              <motion.div key={u.code} variants={directoryItemVariants}>
                <Link 
                  to={`/properties?state=${encodeURIComponent(u.name)}`}
                  className="footer-state-link"
                >
                  {u.name}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Animated Divider 3 */}
        <motion.div 
          className="footer-divider-line"
          variants={dividerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        />

        {/* 4. BOTTOM LEGAL & RERA STATUTORY ROW */}
        <motion.div 
          style={{ padding: '24px 0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', fontSize: '12px' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          viewport={{ once: true }}
        >
          <div style={{ color: '#94A3B8' }}>
            © {new Date().getFullYear()} INDSTATE Technologies India Pvt. Ltd. All rights reserved. Made with <Heart size={12} style={{ display: 'inline', color: '#EF4444' }} /> in India.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center' }}>
            <Link to="/rera-disclaimer" className="footer-interactive-link" style={{ fontSize: '12px' }}>RERA Statutory Disclaimer</Link>
            <Link to="/privacy" className="footer-interactive-link" style={{ fontSize: '12px' }}>Privacy Policy</Link>
            <Link to="/terms" className="footer-interactive-link" style={{ fontSize: '12px' }}>Terms & Conditions</Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
