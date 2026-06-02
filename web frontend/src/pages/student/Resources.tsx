import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { resourceApi, courseApi } from '../../services/api';
import { ResourcePackage, CourseUnit } from '../../types';

const Resources: React.FC = () => {
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<CourseUnit | null>(null);
  const [resourcePackage, setResourcePackage] = useState<ResourcePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'lecture' | 'code' | 'exercise' | 'review' | 'mindmap'>('lecture');

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const data = await courseApi.getUnits();
      setUnits(data);
      if (data.length > 0) {
        setSelectedUnit(data[0]);
      }
    } catch (err) {
      console.error('获取单元失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedUnit) return;
    setGenerating(true);
    try {
      const data = await resourceApi.generateResources(selectedUnit.id, [
        'lecture',
        'code_examples',
        'exercises',
        'review_cards',
        'mindmap',
      ]);
      setResourcePackage(data);
    } catch (err) {
      console.error('生成资源失败', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📄 资源生成</h1>
        <p className="page-desc">为选定的课程单元生成个性化学习资源</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              选择课程单元
            </label>
            <select
              className="input"
              value={selectedUnit?.id || ''}
              onChange={(e) => {
                const unit = units.find((u) => u.id === Number(e.target.value));
                setSelectedUnit(unit || null);
                setResourcePackage(null);
              }}
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.title}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating || !selectedUnit}
            style={{ whiteSpace: 'nowrap' }}
          >
            {generating ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                生成中...
              </>
            ) : '✨ 生成资源'}
          </button>
        </div>
      </div>

      {resourcePackage && (
        <>
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px' }}>{resourcePackage.title}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              🎯 {resourcePackage.profileReason}
            </p>
            {resourcePackage.safetyStatus === 'passed' && (
              <span className="tag tag-success" style={{ marginTop: '12px' }}>
                ✓ 安全审核通过
              </span>
            )}
          </div>

          <div className="card">
            <div style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '24px',
              paddingBottom: '12px',
            }}>
              {[
                { key: 'lecture', label: '📖 讲义', show: !!resourcePackage.lectureMarkdown },
                { key: 'code', label: '💻 代码示例', show: resourcePackage.codeExamples?.length > 0 },
                { key: 'exercise', label: '📝 练习', show: resourcePackage.exercises?.length > 0 },
                { key: 'review', label: '🎴 复习卡片', show: resourcePackage.reviewCards?.length > 0 },
                { key: 'mindmap', label: '🗺️ 思维导图', show: !!resourcePackage.mindmapMermaid },
              ].filter((t) => t.show).map((tab) => (
                <button
                  key={tab.key}
                  className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab(tab.key as any)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'lecture' && (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {resourcePackage.lectureMarkdown}
                </ReactMarkdown>
              </div>
            )}

            {activeTab === 'code' && (
              <div>
                {resourcePackage.codeExamples.map((example, idx) => (
                  <div key={idx} style={{ marginBottom: '32px' }}>
                    <h4 style={{ marginBottom: '12px' }}>{example.title}</h4>
                    <pre><code>{example.code}</code></pre>
                    <p style={{ color: 'var(--text-secondary)' }}>{example.explanation}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'exercise' && (
              <div>
                {resourcePackage.exercises.map((exercise, idx) => (
                  <div key={idx} style={{ marginBottom: '32px', padding: '20px', background: 'var(--bg-color)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <span className="tag">{exercise.type}</span>
                    </div>
                    <p style={{ fontWeight: '500', marginBottom: '16px' }}>{exercise.question}</p>
                    {exercise.options && (
                      <div style={{ marginBottom: '16px' }}>
                        {exercise.options.map((opt, optIdx) => (
                          <div key={optIdx} style={{ marginBottom: '8px', padding: '10px 14px', background: 'var(--surface-color)', borderRadius: '8px' }}>
                            {String.fromCharCode(65 + optIdx)}. {opt}
                          </div>
                        ))}
                      </div>
                    )}
                    <details>
                      <summary style={{ cursor: 'pointer', fontWeight: '500' }}>查看答案和解析</summary>
                      <div style={{ marginTop: '12px' }}>
                        <p><strong>答案:</strong> {exercise.answer}</p>
                        <p><strong>解析:</strong> {exercise.explanation}</p>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'review' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {resourcePackage.reviewCards.map((card, idx) => (
                  <div key={idx} style={{ padding: '20px', border: '2px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer' }}>
                    <p style={{ fontWeight: '500', marginBottom: '16px' }}>{card.question}</p>
                    <details>
                      <summary style={{ cursor: 'pointer', color: 'var(--primary-color)', fontSize: '14px' }}>显示答案</summary>
                      <p style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                        {card.answer}
                      </p>
                    </details>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'mindmap' && resourcePackage.mindmapMermaid && (
              <div style={{ background: 'var(--bg-color)', padding: '24px', borderRadius: '12px' }}>
                <pre style={{ margin: '0' }}><code>{resourcePackage.mindmapMermaid}</code></pre>
              </div>
            )}
          </div>
        </>
      )}

      {!resourcePackage && !generating && (
        <div className="card" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
          <h3 style={{ marginBottom: '12px' }}>选择课程单元并生成资源</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            讲义、代码示例、练习题、复习卡片等一应俱全
          </p>
        </div>
      )}
    </div>
  );
};

export default Resources;
