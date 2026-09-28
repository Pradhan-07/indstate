import React, { useState } from 'react';
import { 
  Bot, BookOpen, HelpCircle, ThumbsUp, ThumbsDown, 
  Plus, Edit3, Trash2, CheckCircle, Search, Filter, 
  Phone, MessageSquare, ArrowUpRight, X, Sparkles, 
  Clock, AlertCircle, RefreshCw, Send, Check, Download, FileSpreadsheet
} from 'lucide-react';
import { useChatbot } from '../../context/ChatbotContext';
import { KNOWLEDGE_BASE_CATEGORIES } from '../../data/ragKnowledgeBase';

const KB_CATEGORIES = KNOWLEDGE_BASE_CATEGORIES;

export default function ChatbotAdminPanel() {
  const {
    knowledgeBase,
    addKnowledgeItem,
    updateKnowledgeItem,
    deleteKnowledgeItem,
    unansweredQueries,
    resolveUnansweredQuery,
    feedbackLogs,
    leads
  } = useChatbot();

  const [activeSubTab, setActiveSubTab] = useState('kb'); // 'kb' | 'unanswered' | 'leads' | 'feedback'
  const [kbCategoryFilter, setKbCategoryFilter] = useState('All');
  const [kbFlagFilter, setKbFlagFilter] = useState('All');
  const [kbSearchTerm, setKbSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalFormData, setModalFormData] = useState({
    category: 'General',
    questionEn: '',
    questionHi: '',
    answerEn: '',
    answerHi: '',
    keywords: '',
    tags: '',
    flags: []
  });
  const [sourceUnansweredId, setSourceUnansweredId] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Calculate Satisfaction %
  const totalVotes = (feedbackLogs?.thumbsUp || 0) + (feedbackLogs?.thumbsDown || 0);
  const satisfactionRate = totalVotes > 0 
    ? Math.round(((feedbackLogs?.thumbsUp || 0) / totalVotes) * 100) 
    : 100;

  // Filter KB Items
  const filteredKB = (knowledgeBase || []).filter(item => {
    const matchesCategory = kbCategoryFilter === 'All' || item.category === kbCategoryFilter;
    const matchesFlag = kbFlagFilter === 'All' || 
      (kbFlagFilter === 'none' ? (!item.flags || item.flags.length === 0) : (item.flags && item.flags.includes(kbFlagFilter)));
    const term = kbSearchTerm.toLowerCase();
    const matchesSearch = !term ||
      (item.id && item.id.toLowerCase().includes(term)) ||
      (item.num && String(item.num).includes(term)) ||
      (item.questionEn && item.questionEn.toLowerCase().includes(term)) ||
      (item.questionHi && item.questionHi.toLowerCase().includes(term)) ||
      (item.answerEn && item.answerEn.toLowerCase().includes(term)) ||
      (item.answerHi && item.answerHi.toLowerCase().includes(term)) ||
      (item.keywords && item.keywords.some(k => k.toLowerCase().includes(term)));
    return matchesCategory && matchesFlag && matchesSearch;
  });

  const totalPages = Math.ceil(filteredKB.length / itemsPerPage) || 1;
  const paginatedKB = filteredKB.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle Export to JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(knowledgeBase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "indstate_chatbot_kb_200.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Exported Knowledge Base (200 Q&A items) as JSON!');
  };

  // Handle Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Number', 'Category', 'Flags', 'Question_EN', 'Question_Hinglish', 'Answer_Hinglish', 'Answer_EN', 'Tags', 'Keywords'];
    const rows = (knowledgeBase || []).map(item => [
      item.id,
      item.num || '',
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${(item.flags || []).join(', ')}"`,
      `"${(item.questionEn || '').replace(/"/g, '""')}"`,
      `"${(item.questionHi || '').replace(/"/g, '""')}"`,
      `"${(item.answerHi || '').replace(/"/g, '""')}"`,
      `"${(item.answerEn || '').replace(/"/g, '""')}"`,
      `"${(item.tags || []).join(', ')}"`,
      `"${(item.keywords || []).join(', ')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "indstate_chatbot_kb_200.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    showNotification('Exported Knowledge Base (200 Q&A items) as CSV!');
  };

  const showNotification = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 3500);
  };

  const handleOpenAddModal = (prefillData = null, unansId = null) => {
    if (prefillData) {
      setEditingItem(null);
      setSourceUnansweredId(unansId);
      setModalFormData({
        category: prefillData.category || 'General',
        questionEn: prefillData.language === 'en' ? prefillData.query : '',
        questionHi: prefillData.language === 'hinglish' ? prefillData.query : '',
        answerEn: '',
        answerHi: '',
        keywords: prefillData.query.split(' ').slice(0, 4).join(', '),
        tags: 'faq, user-query',
        flags: []
      });
    } else {
      setEditingItem(null);
      setSourceUnansweredId(null);
      setModalFormData({
        category: 'General',
        questionEn: '',
        questionHi: '',
        answerEn: '',
        answerHi: '',
        keywords: '',
        tags: '',
        flags: []
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setSourceUnansweredId(null);
    setModalFormData({
      category: item.category || 'General',
      questionEn: item.questionEn || '',
      questionHi: item.questionHi || '',
      answerEn: item.answerEn || '',
      answerHi: item.answerHi || '',
      keywords: Array.isArray(item.keywords) ? item.keywords.join(', ') : '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      flags: item.flags || []
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!modalFormData.questionEn && !modalFormData.questionHi) {
      alert('Please provide at least an English or Hinglish question.');
      return;
    }
    if (!modalFormData.answerEn && !modalFormData.answerHi) {
      alert('Please provide at least an English or Hinglish answer.');
      return;
    }

    const keywordsArray = modalFormData.keywords
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const tagsArray = modalFormData.tags
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      category: modalFormData.category,
      flags: modalFormData.flags || [],
      questionEn: modalFormData.questionEn || modalFormData.questionHi,
      questionHi: modalFormData.questionHi || modalFormData.questionEn,
      answerEn: modalFormData.answerEn || modalFormData.answerHi,
      answerHi: modalFormData.answerHi || modalFormData.answerEn,
      keywords: keywordsArray,
      tags: tagsArray
    };

    if (editingItem) {
      updateKnowledgeItem(editingItem.id, payload);
      showNotification('Knowledge item successfully updated!');
    } else {
      addKnowledgeItem(payload);
      if (sourceUnansweredId) {
        resolveUnansweredQuery(sourceUnansweredId);
      }
      showNotification('New Q&A entry added to AI Knowledge Base!');
    }

    setIsModalOpen(false);
  };

  const handleDeleteKB = (item) => {
    if (confirm(`Delete Q&A "${item.questionEn || item.questionHi}" from AI Knowledge Base?`)) {
      deleteKnowledgeItem(item.id);
      showNotification('Q&A item deleted.');
    }
  };

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '24px', boxShadow: 'var(--shadow-xs)' }}>
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div 
          style={{
            background: 'var(--primary)',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <CheckCircle size={18} color="#A3CEBF" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Top AI Stat Summary Cards */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div style={{ background: 'var(--bg-page)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              KB Articles
            </span>
            <BookOpen size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
            {knowledgeBase?.length || 0}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Covering {KB_CATEGORIES.length} core property domains
          </span>
        </div>

        <div style={{ background: 'var(--bg-page)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Satisfaction Rate
            </span>
            <ThumbsUp size={18} color="var(--rera-green)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--rera-green)', fontFamily: 'var(--font-display)' }}>
              {satisfactionRate}%
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({feedbackLogs?.thumbsUp || 0} 👍 / {feedbackLogs?.thumbsDown || 0} 👎)
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Across all conversational sessions
          </span>
        </div>

        <div style={{ background: 'var(--bg-page)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Unanswered Queries
            </span>
            <AlertCircle size={18} color={unansweredQueries?.length > 0 ? '#DC2626' : 'var(--text-muted)'} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: unansweredQueries?.length > 0 ? '#DC2626' : 'var(--primary)', fontFamily: 'var(--font-display)' }}>
            {unansweredQueries?.length || 0}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Fallback queries awaiting answers
          </span>
        </div>

        <div style={{ background: 'var(--bg-page)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Captured Chat Leads
            </span>
            <Bot size={18} color="#0284C7" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0284C7', fontFamily: 'var(--font-display)' }}>
            {leads?.length || 0}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Pre-qualified buyer & tenant leads
          </span>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('kb')}
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'kb' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeSubTab === 'kb' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <BookOpen size={16} />
          <span>Knowledge Base Q&A ({knowledgeBase?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('unanswered')}
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'unanswered' ? '3px solid var(--saffron)' : '3px solid transparent',
            color: activeSubTab === 'unanswered' ? 'var(--saffron)' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <HelpCircle size={16} />
          <span>Unanswered Queries</span>
          {unansweredQueries?.length > 0 && (
            <span style={{ background: '#DC2626', color: '#FFFFFF', padding: '1px 7px', borderRadius: '10px', fontSize: '11px' }}>
              {unansweredQueries.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('leads')}
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'leads' ? '3px solid #0284C7' : '3px solid transparent',
            color: activeSubTab === 'leads' ? '#0284C7' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <MessageSquare size={16} />
          <span>Captured Leads ({leads?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('feedback')}
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'feedback' ? '3px solid var(--rera-green)' : '3px solid transparent',
            color: activeSubTab === 'feedback' ? 'var(--rera-green)' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <ThumbsUp size={16} />
          <span>Feedback & Analytics</span>
        </button>
      </div>

      {/* SUB-TAB 1: Knowledge Base Q&A Manager */}
      {activeSubTab === 'kb' && (
        <div>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: '1 1 400px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  placeholder="Search 200 doubts by Q#, keyword..."
                  value={kbSearchTerm}
                  onChange={(e) => { setKbSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Category Filter */}
              <select
                value={kbCategoryFilter}
                onChange={(e) => { setKbCategoryFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                  background: '#FFFFFF',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All {KB_CATEGORIES.length} Categories</option>
                {KB_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Flag Filter */}
              <select
                value={kbFlagFilter}
                onChange={(e) => { setKbFlagFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                  background: '#FFFFFF',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Flags</option>
                <option value="L">⚖️ (L) Legal</option>
                <option value="T">📊 (T) Tax</option>
                <option value="F">💰 (F) Finance</option>
                <option value="P">🏢 (P) Platform</option>
                <option value="none">No Flag</option>
              </select>
            </div>

            {/* Actions: Export JSON, Export CSV, Add Q&A */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={handleExportJSON}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: '#FFFFFF',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Download 200 Q&A items as JSON file"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>

              <button
                onClick={handleExportCSV}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: '#FFFFFF',
                  color: 'var(--rera-green)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Download 200 Q&A items as CSV spreadsheet"
              >
                <FileSpreadsheet size={14} />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => handleOpenAddModal()}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
              >
                <Plus size={16} />
                <span>Add Q&A</span>
              </button>
            </div>
          </div>

          {/* Q&A List Header & Count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>
              Showing <strong>{filteredKB.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</strong> - <strong>{Math.min(currentPage * itemsPerPage, filteredKB.length)}</strong> of <strong>{filteredKB.length}</strong> matching questions (Total 200 in Knowledge Base)
            </span>
            {totalPages > 1 && (
              <span>Page {currentPage} of {totalPages}</span>
            )}
          </div>

          {/* Q&A List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {paginatedKB.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-page)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                <BookOpen size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <p style={{ fontSize: '14px', fontWeight: 600 }}>No Q&A items matched your search criteria.</p>
                <button 
                  onClick={() => { setKbSearchTerm(''); setKbCategoryFilter('All'); setKbFlagFilter('All'); setCurrentPage(1); }}
                  style={{ marginTop: '10px', fontSize: '13px', color: 'var(--primary)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              paginatedKB.map((item) => (
                <div 
                  key={item.id}
                  style={{
                    padding: '18px 20px',
                    background: '#FAFAFA',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        {item.num && (
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 7px', borderRadius: '4px', background: '#0F172A', color: '#FFFFFF' }}>
                            #{item.num}
                          </span>
                        )}
                        <span 
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'var(--primary-light)',
                            color: 'var(--primary)'
                          }}
                        >
                          {item.category}
                        </span>
                        
                        {/* Flags Badges */}
                        {item.flags && item.flags.includes('L') && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: '#FEE2E2', color: '#B91C1C' }} title="Legal (L) - Confirm with a lawyer">
                            ⚖️ Legal (L)
                          </span>
                        )}
                        {item.flags && item.flags.includes('T') && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: '#FEF3C7', color: '#B45309' }} title="Tax (T) - Confirm with a CA">
                            📊 Tax (T)
                          </span>
                        )}
                        {item.flags && item.flags.includes('F') && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: '#DBEAFE', color: '#1D4ED8' }} title="Finance (F) - Confirm with bank">
                            💰 Finance (F)
                          </span>
                        )}
                        {item.flags && item.flags.includes('P') && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: '#DCFCE7', color: '#15803D' }} title="Platform (P) - INDSTATE verification">
                            🏢 Platform (P)
                          </span>
                        )}

                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {item.id}</span>
                      </div>
                      <h4 style={{ fontSize: '15px', color: 'var(--primary)', fontWeight: 700, margin: '0 0 4px 0' }}>
                        🇬🇧 {item.questionEn}
                      </h4>
                      {item.questionHi && (
                        <h5 style={{ fontSize: '13px', color: 'var(--saffron)', fontWeight: 600, margin: '0' }}>
                          🇮🇳 {item.questionHi}
                        </h5>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: '#FFFFFF',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                        title="Edit Q&A Entry"
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteKB(item)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #FEE2E2',
                          background: '#FEF2F2',
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '12px'
                        }}
                        title="Delete Q&A Entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Answers Display */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        ENGLISH ANSWER (RAG SYNTHESIS)
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {item.answerEn}
                      </p>
                    </div>
                    {item.answerHi && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          HINGLISH ANSWER (HINDI SCRIPT IN ENGLISH)
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                          {item.answerHi}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tags and Keywords */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Keywords:</span>
                    {(item.keywords || []).slice(0, 7).map((kw, i) => (
                      <span key={i} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#F1F5F9', color: 'var(--text-secondary)' }}>
                        #{kw}
                      </span>
                    ))}
                    {(item.keywords || []).length > 7 && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        +{item.keywords.length - 7} more
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                  color: currentPage === 1 ? '#94A3B8' : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                .map((page, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const hasGap = prevPage && page - prevPage > 1;
                  return (
                    <React.Fragment key={page}>
                      {hasGap && <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '6px',
                          border: currentPage === page ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          background: currentPage === page ? 'var(--primary)' : '#FFFFFF',
                          color: currentPage === page ? '#FFFFFF' : 'var(--text-primary)',
                          fontSize: '13px',
                          fontWeight: currentPage === page ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: currentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                  color: currentPage === totalPages ? '#94A3B8' : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: Unanswered Queries Log */}
      {activeSubTab === 'unanswered' && (
        <div>
          <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', color: 'var(--primary)', fontWeight: 700, margin: 0 }}>
                Unanswered Queries & Fallback Escalations
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Questions typed by users where semantic vector confidence fell below threshold. Add verified answers directly to the Knowledge Base.
              </p>
            </div>
          </div>

          {(!unansweredQueries || unansweredQueries.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-page)', borderRadius: '12px' }}>
              <CheckCircle size={36} color="var(--rera-green)" style={{ margin: '0 auto 12px auto' }} />
              <h4 style={{ fontSize: '15px', color: 'var(--primary)' }}>All Queries Resolved!</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                No active fallback questions pending review. The AI is answering inquiries accurately.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-page)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '12px' }}>User Question</th>
                    <th style={{ padding: '12px' }}>Language</th>
                    <th style={{ padding: '12px' }}>Frequency</th>
                    <th style={{ padding: '12px' }}>Date Logged</th>
                    <th style={{ padding: '12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unansweredQueries.map((uq) => (
                    <tr key={uq.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--primary)', maxWidth: '320px' }}>
                        "{uq.query}"
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span 
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: uq.language === 'hinglish' ? '#FEF3C7' : '#E0F2FE',
                            color: uq.language === 'hinglish' ? '#D97706' : '#0284C7'
                          }}
                        >
                          {uq.language === 'hinglish' ? '🇮🇳 Hinglish' : '🌐 English'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>
                        <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                          {uq.frequency || 1}x asked
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {uq.timestamp}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenAddModal(uq, uq.id)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Add verified answer to KB"
                          >
                            <Plus size={13} />
                            <span>Add to KB</span>
                          </button>
                          <button
                            onClick={() => {
                              resolveUnansweredQuery(uq.id);
                              showNotification('Query dismissed.');
                            }}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: '#FFFFFF',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="Dismiss without adding"
                          >
                            Dismiss
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: Captured Chat Leads */}
      {activeSubTab === 'leads' && (
        <div>
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--primary)', fontWeight: 700, margin: 0 }}>
              AI Pre-Qualified Buyer & Tenant Leads
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Leads captured directly during conversation flows with city, phone (+91), and budget parameters.
            </p>
          </div>

          {(!leads || leads.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-page)', borderRadius: '12px' }}>
              <Bot size={36} color="var(--primary)" style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <h4 style={{ fontSize: '15px', color: 'var(--primary)' }}>No Chat Leads Captured Yet</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                When users interact with the floating chatbot and request a callback or site visit, their contact details will appear here.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-page)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '12px' }}>Client Name</th>
                    <th style={{ padding: '12px' }}>Phone Number</th>
                    <th style={{ padding: '12px' }}>City & Budget</th>
                    <th style={{ padding: '12px' }}>Requirement</th>
                    <th style={{ padding: '12px' }}>Captured At</th>
                    <th style={{ padding: '12px' }}>Direct Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                        {lead.name || 'Anonymous User'}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        +91 {lead.phone}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div><strong>{lead.city || 'Any City'}</strong></div>
                        <span style={{ fontSize: '11px', color: 'var(--saffron)', fontWeight: 600 }}>{lead.budget || 'Flexible Budget'}</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {lead.intent || 'Property Site Visit / Advisory'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {lead.createdAt}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a
                            href={`tel:${lead.phone}`}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Phone size={12} />
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/91${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${lead.name}, regarding your property query on INDSTATE:`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: '#25D366',
                              color: '#FFFFFF',
                              fontSize: '12px',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: Feedback & Quality Analytics */}
      {activeSubTab === 'feedback' && (
        <div>
          <div style={{ marginBottom: '22px' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--primary)', fontWeight: 700, margin: 0 }}>
              User Feedback & Satisfaction Analytics
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Real-time sentiment logged via thumbs up / down feedback buttons under AI responses.
            </p>
          </div>

          {/* Visual Rating Bar */}
          <div style={{ background: 'var(--bg-page)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                Helpfulness Sentiment Ratio: {satisfactionRate}% Positive
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Total Ratings: {totalVotes}
              </span>
            </div>

            <div style={{ height: '10px', width: '100%', background: '#FEE2E2', borderRadius: '10px', overflow: 'hidden', display: 'flex' }}>
              <div 
                style={{
                  width: `${satisfactionRate}%`,
                  background: 'var(--rera-green)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
              <span style={{ color: 'var(--rera-green)', fontWeight: 600 }}>
                👍 {feedbackLogs?.thumbsUp || 0} Helpful Responses
              </span>
              <span style={{ color: '#DC2626', fontWeight: 600 }}>
                👎 {feedbackLogs?.thumbsDown || 0} Needs Improvement
              </span>
            </div>
          </div>

          {/* Feedback Log Records */}
          <h4 style={{ fontSize: '14px', color: 'var(--primary)', marginBottom: '12px', fontWeight: 700 }}>
            Recent Rated Interactions
          </h4>

          {(!feedbackLogs?.records || feedbackLogs.records.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '30px', background: 'var(--bg-page)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No detailed rated interactions recorded yet. As users interact with thumbs up/down, records appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {feedbackLogs.records.slice(0, 10).map((record) => (
                <div 
                  key={record.id}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: record.isHelpful ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${record.isHelpful ? '#BBF7D0' : '#FECACA'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px' }}>{record.isHelpful ? '👍' : '👎'}</span>
                      <strong style={{ fontSize: '13px', color: record.isHelpful ? '#166534' : '#991B1B' }}>
                        {record.isHelpful ? 'Helpful Response' : 'Unhelpful / Missing Info'}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• {record.timestamp}</span>
                    </div>
                    {record.query && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <strong>User asked:</strong> "{record.query}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT Q&A MODAL */}
      {isModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div 
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
              padding: '28px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', color: 'var(--primary)', fontWeight: 700, margin: 0 }}>
                  {editingItem ? 'Edit Knowledge Base Entry' : 'Add Knowledge Base Entry'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Provide natural questions and answers in English & Hinglish for optimal RAG semantic retrieval.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Category */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Knowledge Category
                </label>
                <select
                  value={modalFormData.category}
                  onChange={(e) => setModalFormData({ ...modalFormData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    background: '#FFFFFF',
                    outline: 'none'
                  }}
                >
                  {KB_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Professional Advisory Flags */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Professional Advisory Flags (Triggers bot disclaimer note)
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'L', label: '⚖️ (L) Legal', color: '#B91C1C', bg: '#FEE2E2' },
                    { key: 'T', label: '📊 (T) Tax', color: '#B45309', bg: '#FEF3C7' },
                    { key: 'F', label: '💰 (F) Finance', color: '#1D4ED8', bg: '#DBEAFE' },
                    { key: 'P', label: '🏢 (P) Platform', color: '#15803D', bg: '#DCFCE7' }
                  ].map(f => {
                    const isChecked = modalFormData.flags?.includes(f.key);
                    return (
                      <label 
                        key={f.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: isChecked ? f.bg : '#F8FAFC',
                          border: isChecked ? `1px solid ${f.color}` : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: isChecked ? 700 : 500,
                          color: isChecked ? f.color : 'var(--text-secondary)'
                        }}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = modalFormData.flags || [];
                            if (e.target.checked) {
                              setModalFormData({ ...modalFormData, flags: [...current, f.key] });
                            } else {
                              setModalFormData({ ...modalFormData, flags: current.filter(x => x !== f.key) });
                            }
                          }}
                          style={{ accentColor: f.color }}
                        />
                        <span>{f.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dual Questions (English & Hinglish) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    🇬🇧 English Question Pattern
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. What is the process for e-registration?"
                    value={modalFormData.questionEn}
                    onChange={(e) => setModalFormData({ ...modalFormData, questionEn: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    🇮🇳 Hinglish Question Pattern
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. E-registration ka kya process hota hai?"
                    value={modalFormData.questionHi}
                    onChange={(e) => setModalFormData({ ...modalFormData, questionHi: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Dual Answers (English & Hinglish) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  🇬🇧 English Answer (Full details, steps, fees)
                </label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Provide authoritative, concise answer with steps..."
                  value={modalFormData.answerEn}
                  onChange={(e) => setModalFormData({ ...modalFormData, answerEn: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  🇮🇳 Hinglish Answer (Conversational Hindi in Roman script)
                </label>
                <textarea 
                  rows={3}
                  placeholder="Hinglish me answer likhein jo natural lage..."
                  value={modalFormData.answerHi}
                  onChange={(e) => setModalFormData({ ...modalFormData, answerHi: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Keywords & Tags */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Semantic Keywords (Comma separated)
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. stamp duty, registration, fees, maharashtra"
                    value={modalFormData.keywords}
                    onChange={(e) => setModalFormData({ ...modalFormData, keywords: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Tags (Comma separated)
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. legal, verification, rera"
                    value={modalFormData.tags}
                    onChange={(e) => setModalFormData({ ...modalFormData, tags: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: '#FFFFFF',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '9px 20px', fontSize: '13px' }}
                >
                  {editingItem ? 'Save Changes' : 'Add to Knowledge Base'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
