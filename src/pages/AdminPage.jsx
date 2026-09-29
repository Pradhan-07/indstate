import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle, Trash2, 
  ExternalLink, Search, BarChart3, Users, Building, 
  MessageSquare, ArrowRight, Bot, Sparkles, BookOpen,
  Phone, Bell
} from 'lucide-react';
import { useProperty } from '../context/PropertyContext';
import { useChatbot } from '../context/ChatbotContext';
import { formatIndianPrice } from '../utils/currencyFormatter';
import { Link } from 'react-router-dom';
import ChatbotAdminPanel from '../components/admin/ChatbotAdminPanel';
import LeadNotificationAdminPanel from '../components/admin/LeadNotificationAdminPanel';

export default function AdminPage() {
  const { properties, updateProperty, deleteProperty, inquiries } = useProperty();
  const { leads, unansweredQueries, knowledgeBase, feedbackLogs } = useChatbot();

  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'leads' | 'ai-chatbot'
  const [searchTerm, setSearchTerm] = useState('');

  const reraVerifiedCount = properties.filter(p => p.isReraVerified).length;

  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.reraNumber && p.reraNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleRera = (property) => {
    updateProperty(property.id, {
      isReraVerified: !property.isReraVerified
    });
  };

  return (
    <div style={{ padding: '40px 0 80px 0', background: 'var(--bg-page)' }}>
      <div className="container">
        {/* Admin Header */}
        <div 
          style={{
            background: 'var(--primary)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '30px',
            marginBottom: '32px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={24} color="#A3CEBF" />
              <h1 style={{ fontSize: '26px', color: '#FFFFFF' }}>INDSTATE Admin & Moderation Panel</h1>
            </div>
            <p style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '4px' }}>
              Audit RERA credentials, manage listings, oversee buyer leads, and configure the AI RAG Knowledge Base.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/add-property" className="btn btn-primary btn-sm">
              + Add Property
            </Link>
          </div>
        </div>

        {/* Analytics Highlights */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '18px',
            marginBottom: '32px'
          }}
        >
          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>TOTAL PROPERTIES</span>
            <strong style={{ fontSize: '26px', color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>{properties.length}</strong>
          </div>
          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>RERA AUDITED</span>
            <strong style={{ fontSize: '26px', color: 'var(--rera-green)', fontFamily: 'var(--font-display)' }}>{reraVerifiedCount}</strong>
          </div>
          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>SITE VISIT INQUIRIES</span>
            <strong style={{ fontSize: '26px', color: 'var(--saffron)', fontFamily: 'var(--font-display)' }}>{inquiries.length}</strong>
          </div>
          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>CHATBOT KB ARTICLES</span>
            <strong style={{ fontSize: '26px', color: '#0284C7', fontFamily: 'var(--font-display)' }}>{knowledgeBase?.length || 0}</strong>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('listings')}
            style={{
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'listings' ? '3px solid var(--saffron)' : '3px solid transparent',
              color: activeTab === 'listings' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Property Moderation ({properties.length})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            style={{
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'leads' ? '3px solid var(--saffron)' : '3px solid transparent',
              color: activeTab === 'leads' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Property Inquiries ({inquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('call-alerts')}
            style={{
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: activeTab === 'call-alerts' ? '3px solid var(--saffron)' : '3px solid transparent',
              color: activeTab === 'call-alerts' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <Bell size={16} color="var(--saffron)" />
            <span>WhatsApp Call Alerts (+91 6207 211 360)</span>
          </button>
          <button
            onClick={() => setActiveTab('ai-chatbot')}
            style={{
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: activeTab === 'ai-chatbot' ? '3px solid var(--saffron)' : '3px solid transparent',
              color: activeTab === 'ai-chatbot' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <Bot size={16} />
            <span>AI Chatbot & RAG Knowledge Base</span>
            {unansweredQueries?.length > 0 && (
              <span style={{ background: '#DC2626', color: '#FFFFFF', padding: '1px 7px', borderRadius: '10px', fontSize: '11px' }}>
                {unansweredQueries.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: Property Moderation Table */}
        {activeTab === 'listings' && (
          <div 
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '260px' }}>
                <Search size={16} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="Filter by title, city, or RERA ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-page)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '12px' }}>Property</th>
                    <th style={{ padding: '12px' }}>Location</th>
                    <th style={{ padding: '12px' }}>Price</th>
                    <th style={{ padding: '12px' }}>RERA Status</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <img src={p.images?.[0]} alt={p.title} style={{ width: '50px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                          <div>
                            <strong style={{ color: 'var(--primary)', display: 'block' }}>{p.title}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {p.id} • {p.propertyType}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {p.locality}, {p.city} ({p.state})
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                        {formatIndianPrice(p.price, p.purpose === 'Rent')}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          type="button"
                          onClick={() => toggleRera(p)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            background: p.isReraVerified ? 'var(--rera-green-light)' : '#FEE2E2',
                            color: p.isReraVerified ? 'var(--rera-green)' : '#DC2626'
                          }}
                          title="Click to toggle RERA verification status"
                        >
                          {p.isReraVerified ? '✓ Verified RERA' : '⚠ Unverified'}
                        </button>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link to={`/property/${p.id}`} className="btn btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }}>
                            <ExternalLink size={12} />
                          </Link>
                          <button 
                            onClick={() => {
                              if (confirm(`Delete ${p.title}?`)) {
                                deleteProperty(p.id);
                              }
                            }}
                            style={{ color: '#EF4444', padding: '4px 8px' }}
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Leads & Inquiries */}
        {activeTab === 'leads' && (
          <div 
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '16px' }}>
              Captured Inquiries & Conversational AI Leads
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {inquiries.concat(leads.map(l => ({
                id: l.id,
                propertyTitle: `Lead: ${l.budget} in ${l.city}`,
                clientName: l.name,
                clientPhone: `+91 ${l.phone}`,
                status: 'Chat Lead',
                createdAt: l.createdAt
              }))).map(lead => (
                <div 
                  key={lead.id}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span className="badge badge-featured" style={{ fontSize: '10px' }}>{lead.status}</span>
                    <h4 style={{ fontSize: '15px', color: 'var(--primary)', marginTop: '4px' }}>{lead.propertyTitle}</h4>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Contact: <strong>{lead.clientName}</strong> ({lead.clientPhone})
                    </span>
                  </div>

                  <a 
                    href={`tel:${lead.clientPhone ? lead.clientPhone.replace(/\s/g, '') : ''}`}
                    className="btn btn-primary btn-sm"
                  >
                    Call Client
                  </a>
                </div>
              ))}
            </div>

            {/* Embedded WhatsApp Call Alerts Panel */}
            <LeadNotificationAdminPanel />
          </div>
        )}

        {/* TAB 3: WhatsApp Call Alerts Dedicated Tab */}
        {activeTab === 'call-alerts' && (
          <LeadNotificationAdminPanel />
        )}

        {/* TAB 4: AI Chatbot & RAG Knowledge Base */}
        {activeTab === 'ai-chatbot' && (
          <ChatbotAdminPanel />
        )}
      </div>
    </div>
  );
}
