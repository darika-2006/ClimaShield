import React, { useState } from 'react';
import { Bot, X, Send, Phone, Cpu } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function EmergencyChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: language === 'ta'
        ? 'வணக்கம்! நான் TN மீனாட்சி AI. பேரிடர் ஆபத்து மேலாண்மை மற்றும் அவசர உதவிக்கு என்னைக் கேட்கலாம்.'
        : 'Greetings! I am TN Meenatchi AI, your TNSDMA Emergency Response & Safety Advisor. Ask me about shelters, flood rules, or emergency hotlines.',
      model: 'tnsdma-core',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState(['Nearest Shelters', 'Flood Safety Protocol', 'Emergency Hotlines']);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/v1/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language,
        }),
      });
      const data = await response.json();

      if (data.success && data.data) {
        const botReply = {
          sender: 'bot',
          text: data.data.reply,
          model: data.data.model || 'gemini-1.5-flash',
          groundingTelemetry: data.data.groundingTelemetry,
          emergencyNumbers: data.data.emergencyNumbers,
          shelters: data.data.shelters,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botReply]);
        if (data.data.suggestedActions) {
          setSuggestedActions(data.data.suggestedActions);
        }
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Network connection issue. For urgent emergencies, directly dial State Control Room at **1070** or District Control Room at **1077**.',
          model: 'rule-engine-fallback',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #00bfa6, #2a9d8f)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50px',
            boxShadow: '0 6px 20px rgba(42, 157, 143, 0.35)',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '14px',
            transition: 'all 0.2s ease',
          }}
        >
          <Bot size={20} color="#ffffff" />
          <span>{t('meenatchiAi')}</span>
        </button>
      ) : (
        <div
          style={{
            width: '380px',
            height: '520px',
            background: '#f8fffe',
            border: '1px solid #b8e6d5',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(42, 157, 143, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #2a9d8f, #457b9d)',
              color: '#ffffff',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>{t('meenatchiAi')}</div>
                <div style={{ fontSize: '11px', color: '#d4f1f4' }}>{t('meenatchiSubtitle')}</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px', opacity: 0.9 }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Hotline Strip */}
          <div
            style={{
              background: '#e8f4f8',
              borderBottom: '1px solid #b8e6d5',
              padding: '8px 12px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              fontSize: '11px',
            }}
          >
            <a href="tel:1070" style={{ textDecoration: 'none', background: '#fff0f0', border: '1px solid #f08080', color: '#e76f51', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
              <Phone size={12} /> State: 1070
            </a>
            <a href="tel:1077" style={{ textDecoration: 'none', background: '#fffdf0', border: '1px solid #ffd97d', color: '#f4a261', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
              <Phone size={12} /> District: 1077
            </a>
            <a href="tel:108" style={{ textDecoration: 'none', background: '#f0fbfd', border: '1px solid #a8dadc', color: '#457b9d', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
              <Phone size={12} /> Medical: 108
            </a>
          </div>

          {/* Messages Body */}
          <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f0f7f4' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, #2a9d8f, #00bfa6)' : '#ffffff',
                  color: msg.sender === 'user' ? '#ffffff' : '#2c3e50',
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  border: msg.sender === 'bot' ? '1px solid #b8e6d5' : 'none',
                  boxShadow: '0 2px 8px rgba(42, 157, 143, 0.08)',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-line',
                }}
              >
                <div>{msg.text}</div>
                {msg.sender === 'bot' && msg.model && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #f0f7f4', fontSize: '9px', color: '#6b8e9f' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Cpu size={10} color="#2a9d8f" /> {msg.model}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                )}
                {msg.sender === 'user' && (
                  <div style={{ fontSize: '10px', color: '#e8f4f8', marginTop: '4px', textAlign: 'right' }}>
                    {msg.timestamp}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#ffffff', border: '1px solid #b8e6d5', padding: '8px 14px', borderRadius: '12px', fontSize: '12px', color: '#6b8e9f' }}>
                Executing AI inference...
              </div>
            )}
          </div>

          {/* Suggested Actions Strip */}
          <div style={{ padding: '8px 12px', background: '#ffffff', borderTop: '1px solid #b8e6d5', display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {suggestedActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(action)}
                style={{
                  background: '#e8f4f8',
                  border: '1px solid #a8dadc',
                  borderRadius: '14px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  color: '#2a9d8f',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: '600',
                }}
              >
                {action}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ padding: '12px', background: '#ffffff', borderTop: '1px solid #b8e6d5', display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              placeholder={t('typeMessage')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, padding: '8px 14px', border: '1px solid #a8dadc', borderRadius: '20px', fontSize: '13px', outline: 'none', background: '#f8fffe', color: '#2c3e50' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #00bfa6, #2a9d8f)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(42, 157, 143, 0.3)',
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
