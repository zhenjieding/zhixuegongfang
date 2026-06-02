import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pathApi, courseApi } from '../../services/api';
import { PathStep, CourseUnit } from '../../types';

const LearningPath: React.FC = () => {
  const [steps, setSteps] = useState<PathStep[]>([]);
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pathData, unitsData] = await Promise.all([
        pathApi.getCurrentPath(),
        courseApi.getUnits(),
      ]);
      setSteps(pathData.steps || []);
      setUnits(unitsData);
    } catch (err) {
      console.error('获取数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePath = async () => {
    setGenerating(true);
    try {
      const data = await pathApi.generatePath();
      setSteps(data.steps);
    } catch (err) {
      console.error('生成路径失败', err);
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
        <h1 className="page-title">📚 学习路径</h1>
        <p className="page-desc">基于你的画像生成的个性化学习计划</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="card-header" style={{ border: 'none', padding: '0', margin: '0' }}>
              你的学习路径
            </div>
            {steps.length > 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                共 {steps.length} 个阶段，预计总时长 {steps.reduce((acc, s) => acc + s.estimated_minutes, 0)} 分钟
              </p>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleGeneratePath}
            disabled={generating}
          >
            {generating ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                生成中...
              </>
            ) : '🔄 重新生成路径'}
          </button>
        </div>
      </div>

      {steps.length > 0 ? (
        <div className="card">
          <div className="timeline">
            {steps.map((step, idx) => {
              const unit = units.find((u) => u.id === step.unit_id);
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div
                  key={step.id}
                  className={`timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  <div className="timeline-dot"></div>
                  <div className="resource-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span className="tag">阶段 {idx + 1}</span>
                          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0' }}>
                            {unit?.title || `单元 ${step.unit_id}`}
                          </h3>
                          {isCompleted && <span className="tag tag-success">已完成</span>}
                          {isCurrent && <span className="tag">进行中</span>}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
                          {step.goal}
                        </p>
                        <p style={{ fontSize: '14px', marginBottom: '16px' }}>
                          💡 {step.reason}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            ⏱️ 预计 {step.estimated_minutes} 分钟
                          </span>
                          {isCurrent && (
                            <button
                              className="btn btn-primary"
                              onClick={() => navigate('/student/resources')}
                            >
                              开始学习 →
                            </button>
                          )}
                          {isCompleted && (
                            <button
                              className="btn btn-secondary"
                              onClick={() => navigate('/student/resources')}
                            >
                              复习 →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
          <h3 style={{ marginBottom: '12px' }}>还没有学习路径</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            点击下方按钮，为你生成个性化的学习路径
          </p>
          <button
            className="btn btn-primary"
            onClick={handleGeneratePath}
            disabled={generating}
            style={{ padding: '14px 32px' }}
          >
            {generating ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                生成中...
              </>
            ) : '✨ 生成我的学习路径'}
          </button>
        </div>
      )}
    </div>
  );
};

export default LearningPath;
