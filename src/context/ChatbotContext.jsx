import React, { createContext, useContext, useState, useEffect } from 'react';
import { detectLanguage } from '../utils/languageDetector';
import { synthesizeRAGResponse, buildEntryVector } from '../utils/vectorSearchEngine';
import { INITIAL_RAG_KNOWLEDGE_BASE } from '../data/ragKnowledgeBase';
import { useProperty } from './PropertyContext';
import { useAuth } from './AuthContext';
import { triggerCallNotification } from '../services/leadNotificationService';
import { 
  processConversationalMessage, 
  getInitialConversationState, 
  STORAGE_CONV_STATE_KEY,
  STORAGE_USER_PREF_KEY 
} from '../services/aiChatbotService';

const ChatbotContext = createContext();

const STORAGE_CHAT_KEY = 'indstate_chatbot_messages_v2';
const STORAGE_KB_KEY = 'indstate_rag_kb_v3';
const STORAGE_LEADS_KEY = 'indstate_collected_leads_v2';
const STORAGE_UNANSWERED_KEY = 'indstate_unanswered_queries_v2';
const STORAGE_FEEDBACK_KEY = 'indstate_chatbot_feedback_v2';
const STORAGE_INTERACTED_KEY = 'indstate_chatbot_interacted_v2';

export function ChatbotProvider({ children }) {
  const { properties, submitInquiry } = useProperty();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [detectedLang, setDetectedLang] = useState('en'); // 'en' | 'hinglish'

  // Structured multi-turn conversation state
  const [conversationState, setConversationState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_CONV_STATE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return getInitialConversationState();
  });

  // Long-term user property search preferences
  const [userPreferences, setUserPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USER_PREF_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      preferred_city: null,
      preferred_state: null,
      budget_range: null,
      preferred_bhk: null,
      property_type: null,
      purpose: null
    };
  });

  const saveUserPreference = (prefs) => {
    setUserPreferences(prev => {
      const updated = { ...prev, ...prefs };
      try {
        localStorage.setItem(STORAGE_USER_PREF_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const clearUserPreferences = () => {
    const empty = {
      preferred_city: null,
      preferred_state: null,
      budget_range: null,
      preferred_bhk: null,
      property_type: null,
      purpose: null
    };
    setUserPreferences(empty);
    try {
      localStorage.removeItem(STORAGE_USER_PREF_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const clearConversationMemory = () => {
    const fresh = getInitialConversationState();
    setConversationState(fresh);
    try {
      sessionStorage.removeItem(STORAGE_CONV_STATE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // Track if user has interacted with the chatbot in this session
  const [hasInteracted, setHasInteracted] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_INTERACTED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const markInteracted = () => {
    setHasInteracted(true);
    try {
      sessionStorage.setItem(STORAGE_INTERACTED_KEY, 'true');
    } catch (e) {
      console.error(e);
    }
  };

  // Knowledge Base State (Admin editable, pre-vectorized)
  const [knowledgeBase, setKnowledgeBase] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KB_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_RAG_KNOWLEDGE_BASE.length) {
          return parsed.map(item => ({ ...item, _vector: buildEntryVector(item) }));
        }
      }
    } catch (e) {
      console.error("Error loading KB from localStorage", e);
    }
    return INITIAL_RAG_KNOWLEDGE_BASE.map(item => ({
      ...item,
      _vector: buildEntryVector(item)
    }));
  });

  // Chat Messages State (Session persistent)
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: "msg-welcome-1",
        sender: "bot",
        text: "Namaste & Welcome to INDSTATE! 🙏 I am your AI Property Assistant. Whether you speak English or Hinglish ('Pune me 2BHK flat chahiye'), I'll find you 100% RERA-verified homes across India. How can I help today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: ["Buy Property", "Rent Property", "PG/Co-living", "List My Property", "Talk to Agent"]
      }
    ];
  });

  // Captured Leads State
  const [leads, setLeads] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LEADS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Unanswered Questions Log State
  const [unansweredQueries, setUnansweredQueries] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_UNANSWERED_KEY);
      return saved ? JSON.parse(saved) : [
        {
          id: "unans-1",
          query: "Can I install a helicopter pad on my terrace in Patna?",
          language: "en",
          timestamp: new Date(Date.now() - 86400000).toLocaleString(),
          frequency: 2
        }
      ];
    } catch {
      return [];
    }
  });

  // User Feedback State (Thumbs up / down)
  const [feedbackLogs, setFeedbackLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FEEDBACK_KEY);
      return saved ? JSON.parse(saved) : {
        thumbsUp: 14,
        thumbsDown: 1,
        records: []
      };
    } catch {
      return { thumbsUp: 0, thumbsDown: 0, records: [] };
    }
  });

  // Persistence Syncs
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
    } catch (e) {
      console.error(e);
    }
  }, [leads]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_UNANSWERED_KEY, JSON.stringify(unansweredQueries));
    } catch (e) {
      console.error(e);
    }
  }, [unansweredQueries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FEEDBACK_KEY, JSON.stringify(feedbackLogs));
    } catch (e) {
      console.error(e);
    }
  }, [feedbackLogs]);

  useEffect(() => {
    try {
      // Save KB without internal vector cache to avoid bloating JSON
      const cleanKB = knowledgeBase.map(({ _vector, ...rest }) => rest);
      localStorage.setItem(STORAGE_KB_KEY, JSON.stringify(cleanKB));
    } catch (e) {
      console.error(e);
    }
  }, [knowledgeBase]);

  const toggleChat = () => {
    markInteracted();
    setIsOpen(prev => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  };

  // Lead Capture
  const captureLead = (leadData) => {
    const newLead = {
      id: `lead-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
      status: 'New Inquiry',
      ...leadData
    };
    setLeads(prev => [newLead, ...prev]);

    submitInquiry({
      clientName: leadData.name,
      clientPhone: leadData.phone,
      propertyTitle: `${leadData.intent || 'Property Inquiry'} - ${leadData.city || 'India'} (Budget: ${leadData.budget || 'Flexible'})`,
      status: 'Chatbot Lead'
    });

    // Send instant WhatsApp notification to business helpline +91 6207 211 360
    triggerCallNotification({
      source: 'Chatbot: Request Callback Form',
      leadName: leadData.name,
      leadPhone: leadData.phone ? `+91 ${leadData.phone}` : '',
      context: `City: ${leadData.city || 'India'} | Budget: ${leadData.budget || 'Flexible'} | Intent: ${leadData.intent || 'Property Assistance'}`
    });

    return newLead;
  };

  // Log Unanswered Questions
  const logUnansweredQuery = (query, language) => {
    setUnansweredQueries(prev => {
      const existing = prev.find(item => item.query.toLowerCase() === query.toLowerCase());
      if (existing) {
        return prev.map(item =>
          item.id === existing.id 
            ? { ...item, frequency: item.frequency + 1, timestamp: new Date().toLocaleString() } 
            : item
        );
      }
      return [
        {
          id: `unans-${Date.now()}`,
          query,
          language,
          timestamp: new Date().toLocaleString(),
          frequency: 1
        },
        ...prev
      ];
    });
  };

  // Resolve / Remove an unanswered query
  const resolveUnansweredQuery = (id) => {
    setUnansweredQueries(prev => prev.filter(q => q.id !== id));
  };

  // Record Feedback (Thumbs Up / Down)
  const recordFeedback = (messageId, isHelpful, queryText = '', answerText = '') => {
    setFeedbackLogs(prev => ({
      thumbsUp: isHelpful ? prev.thumbsUp + 1 : prev.thumbsUp,
      thumbsDown: !isHelpful ? prev.thumbsDown + 1 : prev.thumbsDown,
      records: [
        {
          id: `fb-${Date.now()}`,
          messageId,
          isHelpful,
          query: queryText,
          answer: answerText,
          timestamp: new Date().toLocaleString()
        },
        ...(prev.records || [])
      ]
    }));

    // Update message state to show feedback given
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, feedback: isHelpful ? 'up' : 'down' } : msg
      )
    );
  };

  // Knowledge Base CRUD for Admin Panel
  const addKnowledgeItem = (newItem) => {
    const itemWithId = {
      id: `kb-${Date.now()}`,
      tags: [],
      keywords: [],
      ...newItem
    };
    const vectorized = { ...itemWithId, _vector: buildEntryVector(itemWithId) };
    setKnowledgeBase(prev => [vectorized, ...prev]);
    return itemWithId;
  };

  const updateKnowledgeItem = (id, updatedFields) => {
    setKnowledgeBase(prev =>
      prev.map(item => {
        if (item.id === id) {
          const merged = { ...item, ...updatedFields };
          return { ...merged, _vector: buildEntryVector(merged) };
        }
        return item;
      })
    );
  };

  const deleteKnowledgeItem = (id) => {
    setKnowledgeBase(prev => prev.filter(item => item.id !== id));
  };

  // Send Message with AI Conversational Engine & RAG Fallback
  const sendMessage = (userInput) => {
    if (!userInput || !userInput.trim()) return;

    markInteracted();
    const lang = detectLanguage(userInput);
    setDetectedLang(lang);

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: userInput.trim(),
      language: lang,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Natural processing & synthesis delay
    setTimeout(() => {
      // 1. Try Human-like Conversational AI Brain (Multi-turn slot filling, property queries, RERA, due diligence)
      const convResult = processConversationalMessage({
        message: userInput,
        conversationHistory: messages,
        conversationState,
        allProperties: properties,
        userProfile: user
      });

      if (convResult) {
        setConversationState(convResult.state);
        try {
          sessionStorage.setItem(STORAGE_CONV_STATE_KEY, JSON.stringify(convResult.state));
        } catch (e) {
          console.error(e);
        }

        // Sync long-term user preferences if authenticated / extracted
        if (convResult.state.location.city || convResult.state.budget_max || convResult.state.bhk) {
          saveUserPreference({
            preferred_city: convResult.state.location.city || userPreferences.preferred_city,
            preferred_state: convResult.state.location.state || userPreferences.preferred_state,
            budget_range: convResult.state.raw_budget_str || userPreferences.budget_range,
            preferred_bhk: convResult.state.bhk || userPreferences.preferred_bhk,
            property_type: convResult.state.property_type || userPreferences.property_type,
            purpose: convResult.state.purpose || userPreferences.purpose
          });
        }

        const botMsg = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: convResult.text,
          type: convResult.type,
          properties: convResult.properties || [],
          quickReplies: convResult.quickReplies || [],
          action: convResult.action || null,
          fallback: false,
          category: convResult.type || 'ai_assistant',
          language: lang,
          queryRef: userInput.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);

        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        }
        return;
      }

      // 2. Fall back to existing RAG Knowledge Base if not handled by conversational brain
      const ragResult = synthesizeRAGResponse({
        userMessage: userInput,
        knowledgeBase,
        properties,
        conversationHistory: messages
      });

      // If fallback, log unanswered query for admin review
      if (ragResult.fallback) {
        logUnansweredQuery(userInput.trim(), lang);
      }

      // If user requested human handoff or a call in the chatbot conversation, notify helpline
      if (ragResult.type === 'human_handoff') {
        triggerCallNotification({
          source: 'Chatbot Conversation: Human Agent / Call Request',
          context: `Visitor asked: "${userInput.trim()}". Triggered live advisor handoff card.`
        });
      }

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: ragResult.text,
        type: ragResult.type,
        properties: ragResult.properties || [],
        quickReplies: ragResult.quickReplies || [],
        action: ragResult.action || null,
        fallback: !!ragResult.fallback,
        category: ragResult.category || null,
        language: lang,
        queryRef: userInput.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    }, 600);
  };

  const resetChat = () => {
    clearConversationMemory();
    const welcome = {
      id: `msg-${Date.now()}`,
      sender: "bot",
      text: "Namaste! Chat and search memory have been refreshed. How can I assist your property journey today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: ["Buy Property", "Rent Property", "PG/Co-living", "List My Property", "Talk to Agent"]
    };
    setMessages([welcome]);
  };

  return (
    <ChatbotContext.Provider
      value={{
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
        conversationState,
        clearConversationMemory,
        userPreferences,
        saveUserPreference,
        clearUserPreferences,
        captureLead,
        leads,
        knowledgeBase,
        addKnowledgeItem,
        updateKnowledgeItem,
        deleteKnowledgeItem,
        unansweredQueries,
        logUnansweredQuery,
        resolveUnansweredQuery,
        feedbackLogs,
        recordFeedback
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
}
