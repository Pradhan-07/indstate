import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Bot, Phone, ShieldCheck, 
  ExternalLink, ThumbsUp, ThumbsDown, HelpCircle, 
  MessageCircle, Sparkles, CheckCircle
} from 'lucide-react';
import { useChatbot } from '../../context/ChatbotContext';
import { formatIndianPrice } from '../../utils/currencyFormatter';
import { Link } from 'react-router-dom';
import ChatbotOrbAvatar from './ChatbotOrbAvatar';
import { triggerCallNotification } from '../../services/leadNotificationService';

const DEFAULT_QUICK_REPLIES = [
  "Buy Property", 
  "Rent Property", 
  "PG/Co-living", 
  "List My Property", 
  "Talk to Agent"
];

const PROACTIVE_CHIPS = [
  { label: "🏠 Flat / Ghar", query: "Mujhe verified flat ya ghar dekhna hai" },
  { label: "🔑 Rent / PG", query: "Rent par flat ya PG dekhna hai" },
  { label: "🏢 RERA Status", query: "RERA verification aur registered projects check karne hain" },
  { label: "💰 Home Loan", query: "Home loan eligibility aur EMI calculate karni hai" }
];

const PROACTIVE_TOOLTIP_MESSAGES = {
  mixed: [
    "Kya dhoondh rahe hain? Main madad karoon? 🏠",
    "Hey! How can I help you? 👋",
    "Looking for a home? Ask me anything",
    "Koi property dhundh rahe hain? Poochiye!",
    "Koi property dhundh rahe hain? Poochiye! 🔍",
    "Looking for a verified home? Ask me anything 👋",
    "Check RERA status of any project 🏢",
    "Need help with home loan or EMI?",
    "Need help with home loan or EMI? 💰"
  ],
  hinglish: [
    "Kya dhoondh rahe hain? Main madad karoon? 🏠",
    "Hey! How can I help you? 👋",
    "Koi property dhundh rahe hain? Poochiye!",
    "Koi property dhundh rahe hain? Poochiye! 🔍",
    "Ghar dhundh rahe hain? Main help karoon? 🏠",
    "RERA verified flats dekhna chahte hain?",
    "RERA verified flats dekhna chahte hain? 🏢",
    "Namaste! Kaise madad kar sakta hoon? 👋",
    "Home loan ya EMI calculation me help chahiye?",
    "Home loan ya EMI calculation me help chahiye? 💰"
  ],
  en: [
    "What are you looking for? Let me help! 🏠",
    "Hey! How can I help you? 👋",
    "Looking for a home? Ask me anything",
    "Need help finding verified properties? 👋",
    "Check RERA status of any project 🏢",
    "Need help with home loan or EMI?",
    "Need help with home loan or EMI? 💰",
    "Search verified properties across India 🇮🇳"
  ]
};

const STORAGE_DISMISS_COUNT_KEY = 'indstate_chatbot_dismiss_count_v2';

export default function FloatingChatbot() {
  const { 
    isOpen, 
    setIsOpen,
    toggleChat, 
    hasInteracted,
    markInteracted,
    messages, 
    sendMessage, 
    isTyping, 
    unreadCount, 
    detectedLang, 
    resetChat,
    captureLead,
    recordFeedback
  } = useChatbot();

  const [input, setInput] = useState('');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    city: 'Mumbai',
    budget: '₹50 Lakh - ₹1 Cr',
    intent: 'Buying Home'
  });
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  // Proactive Tooltip State & Cadence
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipIdx, setTooltipIdx] = useState(-1);

  const messagesEndRef = useRef(null);

  // Clear any old session lockout keys on mount so user's existing tab is unblocked immediately
  useEffect(() => {
    try {
      sessionStorage.removeItem(STORAGE_DISMISS_COUNT_KEY);
      sessionStorage.removeItem('indstate_chatbot_interacted_v2');
    } catch {
      // ignore
    }
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Proactive Tooltip Cadence:
  // 1. Initial trigger: pops up ~2.2s after mount (~4.7s from page open including 2.5s brand intro)
  // 2. Gentle pop animation (scale 0.9 to 1 + fade), visible for 6.0s so user can read & tap chips
  // 3. Cadence: rotates every 7 seconds with next helpful property question while closed
  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false);
      return;
    }

    let showTimer = null;
    let dismissTimer = null;
    let isCancelled = false;

    const scheduleNextPopup = (delayMs) => {
      showTimer = setTimeout(() => {
        if (isCancelled || isOpen) return;

        setTooltipIdx(prev => prev + 1);
        setShowTooltip(true);

        // Auto-dismiss after 6.0 seconds if not clicked
        dismissTimer = setTimeout(() => {
          if (isCancelled) return;
          setShowTooltip(false);

          // If still closed, re-trigger after 7 seconds with next message
          if (!isOpen) {
            scheduleNextPopup(7000);
          }
        }, 6000);
      }, delayMs);
    };

    // First trigger: 2.2 seconds after mount (~4.7-5s total from page load)
    scheduleNextPopup(2200);

    return () => {
      isCancelled = true;
      if (showTimer) clearTimeout(showTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleQuickReply = (text) => {
    sendMessage(text);
  };

  const handleTooltipClick = () => {
    markInteracted();
    setShowTooltip(false);
    setIsOpen(true);
  };

  const handleChipClick = (e, query) => {
    e.stopPropagation();
    markInteracted();
    setShowTooltip(false);
    setIsOpen(true);
    sendMessage(query);
  };

  const handleDismissTooltip = (e) => {
    e.stopPropagation();
    setShowTooltip(false);
  };

  const handleLeadSubmit = (e) => {
    e.preventDefault();
    captureLead(leadForm);
    setLeadSubmitted(true);
    setTimeout(() => {
      setShowLeadModal(false);
      setLeadSubmitted(false);
      sendMessage(
        detectedLang === 'hinglish'
          ? `Dhanyawad! Maine ${leadForm.name} ke liye callback details save kar li hain. RERA advisor aapko 30 minute me call karenge.`
          : `Thank you! I have confirmed your request for ${leadForm.name}. A certified RERA advisor will call you within 30 minutes.`
      );
    }, 1200);
  };

  // Determine active rotating message list based on detected language
  const activeMessageList = detectedLang === 'hinglish' 
    ? PROACTIVE_TOOLTIP_MESSAGES.hinglish 
    : PROACTIVE_TOOLTIP_MESSAGES.mixed;
  const currentTooltipMessage = activeMessageList[tooltipIdx % activeMessageList.length];

  return (
    <>
      {/* Proactive Idle Speech Bubble Tooltip */}
      <AnimatePresence>
        {!isOpen && showTooltip && (
          <motion.div
            className="chatbot-proactive-bubble"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 6 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={handleTooltipClick}
            role="button"
            tabIndex={0}
            aria-label="Chat assistant suggestion"
          >
            <div className="bubble-header">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, boxShadow: '0 0 8px var(--accent)' }} />
              <p className="bubble-text">
                {currentTooltipMessage}
              </p>
              <button 
                type="button" 
                className="bubble-close"
                onClick={handleDismissTooltip}
                aria-label="Dismiss suggestion"
              >
                <X size={13} />
              </button>
            </div>

            <div className="bubble-chips">
              {PROACTIVE_CHIPS.map(chip => (
                <button
                  key={chip.label}
                  type="button"
                  className="bubble-chip"
                  onClick={(e) => handleChipClick(e, chip.query)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating 3D Robot Orb Trigger Button - Single glossy avatar at all times */}
      <button 
        type="button" 
        className="chatbot-floating-btn"
        onClick={toggleChat}
        aria-label={isOpen ? "Close INDSTATE AI Assistant" : "Open INDSTATE AI Assistant"}
      >
        <ChatbotOrbAvatar size={62} unreadCount={isOpen ? 0 : unreadCount} />
      </button>

      {/* Chat Window with Scale & Fade Animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="chat-window"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header with Mini 3D Robot Orb */}
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ChatbotOrbAvatar size={36} unreadCount={0} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '15px' }}>INDSTATE AI</strong>
                    <span className="chat-lang-indicator">
                      {detectedLang === 'hinglish' ? '🇮🇳 Hinglish' : '🌐 English'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                    RAG Knowledge Base & Instant Search
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button 
                  onClick={resetChat} 
                  style={{ color: '#CBD5E1', padding: '6px' }}
                  title="Restart Chat"
                >
                  <Sparkles size={16} />
                </button>
                <button 
                  onClick={toggleChat}
                  style={{ color: '#CBD5E1', padding: '6px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Default Quick-Reply Intents Bar on Open */}
            <div 
              style={{
                padding: '8px 12px',
                background: '#FFFFFF',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
              }}
            >
              {DEFAULT_QUICK_REPLIES.map(qr => (
                <button
                  key={qr}
                  onClick={() => handleQuickReply(qr)}
                  style={{
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-body)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {qr}
                </button>
              ))}
            </div>

            {/* Messages Stream */}
            <div className="chat-messages-container">
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className={`chat-bubble ${msg.sender}`}>
                    <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>

                    {/* Property Card Previews inside Chat (RAG Context) */}
                    {msg.properties && msg.properties.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {msg.properties.map(p => (
                          <div 
                            key={p.id}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)',
                              padding: '8px',
                              display: 'flex',
                              gap: '10px',
                              boxShadow: 'var(--shadow-xs)'
                            }}
                          >
                            <img 
                              src={p.images?.[0]} 
                              alt={p.title} 
                              style={{ width: '64px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                            />
                            <div style={{ flexGrow: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.title}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {p.locality}, {p.city}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                                <strong style={{ fontSize: '13px', color: 'var(--accent)' }}>
                                  {formatIndianPrice(p.price, p.purpose === 'Rent')}
                                </strong>
                                <Link 
                                  to={`/property/${p.id}`}
                                  onClick={toggleChat}
                                  style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                                >
                                  View <ExternalLink size={10} />
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fallback / Human Advisor Handoff Card */}
                    {(msg.fallback || msg.type === 'human_handoff') && (
                      <div 
                        style={{
                          marginTop: '12px',
                          background: 'var(--bg-alt)',
                          border: '1px solid #CBD5E1',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px'
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <HelpCircle size={14} color="var(--accent)" />
                          <span>Connect with Verified RERA Advisor</span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.4 }}>
                          Direct communication with an audited property expert across your selected city.
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <a 
                            href={`https://wa.me/916207211360?text=${encodeURIComponent(`Namaste INDSTATE team, I have a property query: "${msg.queryRef || 'Real estate assistance'}"`)}`}
                            target="_blank" 
                            rel="noreferrer"
                            onClick={() => {
                              triggerCallNotification({
                                source: 'Chatbot: WhatsApp Advisor CTA',
                                context: `User clicked WhatsApp Advisor button for query: "${msg.queryRef || 'Real estate assistance'}"`
                              });
                            }}
                            className="btn btn-sm"
                            style={{ background: 'var(--success)', color: '#FFFFFF', fontSize: '11px', padding: '6px 12px' }}
                          >
                            <MessageCircle size={13} />
                            <span>WhatsApp Advisor</span>
                          </a>
                          <button 
                            type="button"
                            onClick={() => setShowLeadModal(true)}
                            className="btn btn-navy btn-sm"
                            style={{ fontSize: '11px', padding: '6px 12px' }}
                          >
                            <Phone size={12} />
                            <span>Request Callback</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <span 
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        color: msg.sender === 'user' ? '#CBD5E1' : '#94A3B8',
                        marginTop: '4px',
                        textAlign: 'right'
                      }}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Thumbs Up / Down Feedback Loop (Bot answers only) */}
                  {msg.sender === 'bot' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Helpful?</span>
                      <button
                        type="button"
                        onClick={() => recordFeedback(msg.id, true, msg.queryRef, msg.text)}
                        style={{
                          background: msg.feedback === 'up' ? 'var(--rera-green-light)' : 'transparent',
                          border: msg.feedback === 'up' ? '1px solid var(--rera-green)' : 'none',
                          color: msg.feedback === 'up' ? 'var(--rera-green)' : 'var(--text-muted)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                        title="Yes, helpful"
                      >
                        <ThumbsUp size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => recordFeedback(msg.id, false, msg.queryRef, msg.text)}
                        style={{
                          background: msg.feedback === 'down' ? '#FEE2E2' : 'transparent',
                          border: msg.feedback === 'down' ? '1px solid #EF4444' : 'none',
                          color: msg.feedback === 'down' ? '#EF4444' : 'var(--text-muted)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                        title="Not helpful"
                      >
                        <ThumbsDown size={11} />
                      </button>
                      {msg.feedback && (
                        <span style={{ fontSize: '10px', color: 'var(--rera-green)', fontWeight: 600 }}>
                          ✓ Feedback recorded
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quick Reply Chips below bot message */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {msg.quickReplies.map((qr, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickReply(qr)}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid var(--accent)',
                            color: 'var(--accent)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-xs)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator while thinking */}
              {isTyping && (
                <div className="chat-bubble bot" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Retrieving verified knowledge</span>
                  <span style={{ display: 'inline-flex', gap: '3px', marginLeft: '4px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite 0.2s' }} />
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite 0.4s' }} />
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="chat-input-area">
              <input 
                type="text"
                placeholder={detectedLang === 'hinglish' ? "Sawāl likhein (e.g. Pune me 2BHK flat chahiye)..." : "Ask about properties, RERA, loans, rent..."}
                value={input}
                onChange={e => setInput(e.target.value)}
                className="chat-input"
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ borderRadius: 'var(--radius-full)', padding: '10px 14px' }}
                disabled={!input.trim()}
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead Capture Modal inside Chat */}
      {showLeadModal && (
        <div className="modal-overlay" onClick={() => setShowLeadModal(false)}>
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: '28px' }}
          >
            <button 
              onClick={() => setShowLeadModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>

            {leadSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={48} color="var(--rera-green)" style={{ margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '20px', color: 'var(--primary)' }}>Callback Scheduled!</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Our verified property advisor will connect with you within 30 minutes.
                </p>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '6px' }}>
                  Connect with a Property Advisor
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Share your preferred city and budget. A verified advisor will contact you with RERA-checked listings.
                </p>

                <form onSubmit={handleLeadSubmit}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Your Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Ramesh Kulkarni"
                      value={leadForm.name}
                      onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Mobile Number (+91)</label>
                    <input 
                      type="tel" 
                      required
                      maxLength={10}
                      placeholder="98765 43210"
                      value={leadForm.phone}
                      onChange={e => setLeadForm({ ...leadForm, phone: e.target.value.replace(/\D/g, '') })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Preferred City</label>
                    <select
                      value={leadForm.city}
                      onChange={e => setLeadForm({ ...leadForm, city: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', background: '#fff' }}
                    >
                      <option value="Mumbai">Mumbai</option>
                      <option value="Pune">Pune</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Delhi NCR">Delhi NCR</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Goa">Goa</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Budget Range</label>
                    <select
                      value={leadForm.budget}
                      onChange={e => setLeadForm({ ...leadForm, budget: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', background: '#fff' }}
                    >
                      <option value="Under ₹50 Lakh">Under ₹50 Lakh</option>
                      <option value="₹50 Lakh - ₹1 Cr">₹50 Lakh - ₹1 Cr</option>
                      <option value="₹1 Cr - ₹2.5 Cr">₹1 Cr - ₹2.5 Cr</option>
                      <option value="Above ₹2.5 Cr (Luxury)">Above ₹2.5 Cr (Luxury)</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '11px' }}>
                    Submit Callback Request
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
