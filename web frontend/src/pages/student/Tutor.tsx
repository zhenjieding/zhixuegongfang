import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { tutorApi, courseApi } from '../../services/api';
import { CourseUnit, TutorResponse } from '../../types';

const Tutor: React.FC = () => {
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<CourseUnit | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; content: string; citations?: any[]; suggestions?: string[] }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`session_${Date.now()}`);

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUnits = async () => {
    try {
      const data = await courseApi.getUnits();
      setUnits(data);
    } catch (err) {
      console.error('获取单元失败', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response: TutorResponse = await tutorApi.chat(
        userMessage,
        selectedUnit?.id,
        sessionId.current
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: response.reply,
          citations: response.citations,
          suggestions: response.suggestions,
        },
      ]);
    } catch (err) {
      console.error('发送消息失败', err);
      setMessages((prev) => [
        ...prev,
        { role: 'agent', content: '抱歉，出现了一些问题，请稍后再试。' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">💬 智能答疑</h1>
        <p className="page-desc">有问题？随时问AI助教</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>关联课程单元:</span>
          <select
            className="input"
            style={{ maxWidth: '300px' }}
            value={selectedUnit?.id || ''}
            onChange={(e) => {
              const unit = units.find((u) => u.id === Number(e.target.value));
              setSelectedUnit(unit || null);
            }}
          >
            <option value="">全部课程</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.title}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            (可选，选择后回答会更精准)
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: '0', height: 'calc(100vh - 300px)', display: 'flex', flexDirection: 'column' }}>
        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🤖</div>
              <h3 style={{ marginBottom: '12px' }}>你好！我是你的AI助教</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                有任何关于Python学习的问题，都可以问我哦！
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {[
                  'Python变量有哪些类型？',
                  '如何理解for循环？',
                  '函数和方法有什么区别？',
                  '怎么调试代码错误？',
                ].map((q) => (
                  <button
                    key={q}
                    className="btn btn-secondary"
                    style={{ fontSize: '13px' }}
                    onClick={() => {
                      setInput(q);
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px' }}>📚 引用来源:</p>
                    {msg.citations.map((cite, cIdx) => (
                      <div key={cIdx} style={{ fontSize: '12px', opacity: 0.8 }}>
                        • {cite.title} ({cite.source_ref})
                      </div>
                    ))}
                  </div>
                )}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>💡 你可能还想问:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {msg.suggestions.map((s, sIdx) => (
                        <button
                          key={sIdx}
                          className="btn btn-secondary"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                          onClick={() => setInput(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="chat-message agent">
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ animation: '1.4s infinite bounce', animationDelay: '0s' }}>●</span>
                <span style={{ animation: '1.4s infinite bounce', animationDelay: '0.2s' }}>●</span>
                <span style={{ animation: '1.4s infinite bounce', animationDelay: '0.4s' }}>●</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入你的问题... (Enter发送)"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutor;
