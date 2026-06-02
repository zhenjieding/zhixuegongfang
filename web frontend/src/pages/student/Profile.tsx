import React, { useState, useEffect } from 'react';
import { profileApi } from '../../services/api';
import { ProfileAnalysis, StudentProfile } from '../../types';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [freeText, setFreeText] = useState('');

  const questions = [
    { key: 'major', label: '你的专业/职业是什么？', type: 'text', placeholder: '例如：计算机科学、软件工程等' },
    { key: 'goal', label: '学习Python的目标是什么？', type: 'select', options: ['兴趣爱好', '课程学习', '求职就业', '工作需要', '数据分析', '人工智能'] },
    { key: 'base_level', label: '编程基础如何？', type: 'select', options: ['零基础', '了解一点', '有一定基础', '熟练掌握'] },
    { key: 'time', label: '每周可投入学习时间？', type: 'select', options: ['少于5小时', '5-10小时', '10-20小时', '20小时以上'] },
    { key: 'weak_area', label: '你觉得自己哪方面比较薄弱？', type: 'select', options: ['语法基础', '逻辑思维', '算法', '项目实践', '调试能力', '都还好'] },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      if (data.tags_json) {
        setAnalysis({
          profile: {
            major: data.major,
            goal: data.goal,
            base_level: data.base_level,
            preferences: data.preferences,
          },
          tags: JSON.parse(data.tags_json),
          weaknesses: JSON.parse(data.weaknesses_json),
        });
      }
    } catch (err) {
      console.error('获取画像失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const data = await profileApi.analyzeProfile(answers, freeText);
      setAnalysis(data);
      await fetchProfile();
    } catch (err) {
      console.error('分析失败', err);
    } finally {
      setAnalyzing(false);
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
        <h1 className="page-title">👤 学生画像</h1>
        <p className="page-desc">填写问卷，让AI更了解你的学习需求</p>
      </div>

      <div className="two-col">
        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">📋 画像问卷</div>
            <div style={{ marginBottom: '20px' }}>
              {questions.map((q) => (
                <div key={q.key} style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    {q.label}
                  </label>
                  {q.type === 'text' ? (
                    <input
                      type="text"
                      className="input"
                      value={answers[q.key] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                      placeholder={q.placeholder}
                    />
                  ) : (
                    <select
                      className="input"
                      value={answers[q.key] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                    >
                      <option value="">请选择</option>
                      {q.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  其他想说的话（选填）
                </label>
                <textarea
                  className="input"
                  style={{ height: '100px', resize: 'vertical' }}
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="可以补充说明你的学习背景、目标、遇到的困难等..."
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleAnalyze}
                disabled={analyzing}
                style={{ width: '100%' }}
              >
                {analyzing ? (
                  <>
                    <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                    分析中...
                  </>
                ) : '🔍 分析画像'}
              </button>
            </div>
          </div>
        </div>

        <div>
          {analysis && (
            <>
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">🏷️ 画像标签</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {analysis.tags.map((tag, idx) => (
                    <span key={idx} className="tag">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">💡 薄弱点识别</div>
                {analysis.weaknesses.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {analysis.weaknesses.map((weak, idx) => (
                      <span key={idx} className="tag tag-warning">{weak}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>暂未识别到明显薄弱点</p>
                )}
              </div>

              <div className="card">
                <div className="card-header">📊 基本信息</div>
                <div style={{ fontSize: '14px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>专业/职业: </span>
                    <strong>{analysis.profile.major || '-'}</strong>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>学习目标: </span>
                    <strong>{analysis.profile.goal || '-'}</strong>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>基础水平: </span>
                    <strong>{analysis.profile.base_level || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>学习偏好: </span>
                    <strong>{analysis.profile.preferences || '-'}</strong>
                  </div>
                </div>
              </div>
            </>
          )}

          {!analysis && (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                填写左侧问卷，开始分析你的学习画像
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
