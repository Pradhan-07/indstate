import React, { useState, useEffect } from 'react';
import { 
  Bell, Phone, MessageSquare, Send, CheckCircle2, 
  AlertCircle, ExternalLink, Settings, RefreshCw, Copy, Check, Info, ShieldCheck
} from 'lucide-react';
import { 
  ADMIN_HELPLINE_PHONE, 
  ADMIN_HELPLINE_RAW, 
  ADMIN_FALLBACK_EMAIL,
  getNotificationHistory, 
  getNotificationConfig, 
  saveNotificationConfig, 
  sendTestLeadNotification 
} from '../../services/leadNotificationService';

export default function LeadNotificationAdminPanel() {
  const [notifications, setNotifications] = useState([]);
  const [config, setConfig] = useState(getNotificationConfig());
  const [showConfig, setShowConfig] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load history
  const reloadNotifications = () => {
    setNotifications(getNotificationHistory());
  };

  useEffect(() => {
    reloadNotifications();

    // Listen for real-time dispatch events from across the app
    const handleNewNotification = () => {
      reloadNotifications();
    };

    window.addEventListener('indstate-lead-notification', handleNewNotification);
    return () => {
      window.removeEventListener('indstate-lead-notification', handleNewNotification);
    };
  }, []);

  const handleTestNotification = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await sendTestLeadNotification();
      setTestResult({
        success: true,
        message: `Notification created and dispatched to ${ADMIN_HELPLINE_PHONE}!`
      });
      reloadNotifications();
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Error executing test notification'
      });
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const handleConfigSave = (e) => {
    e.preventDefault();
    saveNotificationConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Overview Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ background: 'var(--success)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block' }}></span>
              ACTIVE SYSTEM
            </span>
            <h3 style={{ fontSize: '18px', color: '#FFFFFF', margin: 0 }}>
              Automated WhatsApp Call & Lead Alerts
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
            Every call button, WhatsApp contact click, callback form submission, or chatbot agent request instantly dispatches a notification to your team at <strong>{ADMIN_HELPLINE_PHONE}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleTestNotification}
            disabled={testing}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
          >
            {testing ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
            <span>{testing ? 'Dispatching...' : '🧪 Send Test Lead Alert'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#475569', color: '#CBD5E1', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Settings size={14} />
            <span>{showConfig ? 'Hide Config' : 'WABA Config'}</span>
          </button>
        </div>
      </div>

      {/* Test Result Toast */}
      {testResult && (
        <div 
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            background: testResult.success ? 'var(--rera-green-light)' : '#FEE2E2',
            border: `1px solid ${testResult.success ? 'var(--rera-green)' : '#EF4444'}`,
            color: testResult.success ? 'var(--rera-green)' : '#DC2626',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Configuration Drawer */}
      {showConfig && (
        <div 
          style={{
            background: '#F8FAFC',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '16px', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--rera-green)" />
              WhatsApp Business Platform (WABA) & API Integration
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Recipient Helpline: <strong>{ADMIN_HELPLINE_PHONE}</strong>
            </span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.5 }}>
            Configure your official Meta Cloud API credentials or Webhook provider (e.g. Gupshup, Twilio, Make, Zapier). If credentials are left blank, all leads are reliably preserved in this Dashboard and formatted with direct 1-click WhatsApp dispatches.
          </p>

          <form onSubmit={handleConfigSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Helpline WhatsApp Recipient (Admin Number)
              </label>
              <input 
                type="text"
                value={config.adminPhone}
                onChange={e => setConfig({ ...config, adminPhone: e.target.value.replace(/\D/g, '') })}
                placeholder="916207211360"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Standard: 916207211360 (+91 6207 211 360)</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Fallback Support Email
              </label>
              <input 
                type="email"
                value={config.fallbackEmail}
                onChange={e => setConfig({ ...config, fallbackEmail: e.target.value })}
                placeholder="ind.state.build@gmail.com"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Receives fallback copy if external API is unreachable</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Meta Cloud API Token (Bearer Token)
              </label>
              <input 
                type="password"
                value={config.cloudApiToken}
                onChange={e => setConfig({ ...config, cloudApiToken: e.target.value })}
                placeholder="EAAB..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Meta Cloud API Phone Number ID
              </label>
              <input 
                type="text"
                value={config.cloudApiPhoneNumberId}
                onChange={e => setConfig({ ...config, cloudApiPhoneNumberId: e.target.value })}
                placeholder="10492837492..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Lead Webhook Endpoint (Twilio / Gupshup / Make / Zapier / Custom Backend)
              </label>
              <input 
                type="url"
                value={config.webhookUrl}
                onChange={e => setConfig({ ...config, webhookUrl: e.target.value })}
                placeholder="https://your-webhook-endpoint.com/api/indstate-lead"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Optional webhook endpoint triggered with JSON payload on every call action event.
              </span>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button type="submit" className="btn btn-navy btn-sm" style={{ padding: '8px 16px' }}>
                Save Configuration
              </button>
              {savedSuccess && (
                <span style={{ fontSize: '12px', color: 'var(--rera-green)', fontWeight: 600 }}>
                  ✓ Settings saved successfully!
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Notifications Log Table */}
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '24px',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h4 style={{ fontSize: '17px', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} color="var(--saffron)" />
              Real-Time Call Request Alerts Log ({notifications.length})
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Monitoring triggers across Property Cards, Listing Details, Chatbot Handoffs, and Contact Forms
            </span>
          </div>

          <button
            type="button"
            onClick={reloadNotifications}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <RefreshCw size={13} />
            <span>Refresh Log</span>
          </button>
        </div>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--bg-page)', borderRadius: '8px' }}>
            <Phone size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
            <h5 style={{ fontSize: '15px', color: 'var(--primary)', marginBottom: '4px' }}>No Call Requests Recorded Yet</h5>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 14px auto' }}>
              Click any Call or WhatsApp button on a property card, request a callback, or click below to trigger a test alert.
            </p>
            <button
              type="button"
              onClick={handleTestNotification}
              className="btn btn-primary btn-sm"
            >
              Dispatch Sample Test Alert
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map(item => {
              const directWhatsAppUrl = item.leadPhone && item.leadPhone !== 'N/A'
                ? `https://wa.me/${item.leadPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Namaste ${item.leadName}, this is INDSTATE customer desk following up on your request.`)}`
                : null;

              const adminWhatsAppUrl = `https://wa.me/${ADMIN_HELPLINE_RAW}?text=${encodeURIComponent(item.messageText)}`;

              return (
                <div 
                  key={item.id}
                  style={{
                    padding: '18px',
                    borderRadius: '8px',
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span 
                          style={{
                            background: item.status.includes('DELIVERED') ? 'var(--rera-green-light)' : '#E0F2FE',
                            color: item.status.includes('DELIVERED') ? 'var(--rera-green)' : '#0369A1',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <CheckCircle2 size={12} />
                          {item.status.includes('DELIVERED') ? 'API Delivered' : 'Logged & Ready'}
                        </span>

                        <span style={{ background: '#F1F5F9', color: '#475569', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          {item.source}
                        </span>

                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ⏰ {item.timestamp}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '15px', color: 'var(--primary)', marginTop: '6px', marginBottom: '2px' }}>
                        {item.propertyTitle || 'General Web Inquiry'}
                      </h4>

                      <div style={{ fontSize: '13px', color: 'var(--text-body)' }}>
                        Lead: <strong>{item.leadName}</strong> • Phone: <strong style={{ color: 'var(--primary)' }}>{item.leadPhone}</strong>
                      </div>
                    </div>

                    {/* Quick Follow-up Actions */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {item.leadPhone && item.leadPhone !== 'N/A' && (
                        <a 
                          href={`tel:${item.leadPhone.replace(/\s/g, '')}`}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          title="Call Lead directly"
                        >
                          <Phone size={13} color="var(--primary)" />
                          <span>Call Lead</span>
                        </a>
                      )}

                      {directWhatsAppUrl && (
                        <a 
                          href={directWhatsAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm"
                          style={{ background: 'var(--success)', color: '#fff', padding: '5px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Chat with lead on WhatsApp"
                        >
                          <MessageSquare size={13} />
                          <span>WA Lead</span>
                        </a>
                      )}

                      <a 
                        href={adminWhatsAppUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-navy btn-sm"
                        style={{ padding: '5px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title={`Open pre-filled WhatsApp alert for admin (${ADMIN_HELPLINE_PHONE})`}
                      >
                        <Send size={12} />
                        <span>Send to Helpline WA</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.messageText, item.id)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '5px 8px', fontSize: '12px' }}
                        title="Copy formatted notification text"
                      >
                        {copiedId === item.id ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Message Preview Box */}
                  <div 
                    style={{
                      background: '#FFFFFF',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-light)',
                      fontSize: '12px',
                      color: '#334155',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      maxHeight: '130px',
                      overflowY: 'auto'
                    }}
                  >
                    {item.messageText}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
