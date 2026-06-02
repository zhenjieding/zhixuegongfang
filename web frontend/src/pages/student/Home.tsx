import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { progressApi, courseApi } from '../../services/api';
import { ProgressOverview, CourseUnit } from '../../types';

const Home: React.FC = () => {
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [overviewData, unitsData] = await Promise.all([
        progressApi.getOverview(),
        courseApi.getUnits(),
      ]);
      setOverview(overviewData);
      setUnits(unitsData);
    } catch (err) {
      console.error('获取数据失败', err);
    } finally {
      setLoading(false);
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
        <h1 className="page-title">🏠 学习首页</h1>
        <p className="page-desc">欢迎回来，开始今天的学习吧！</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{overview?.mastery?.length || 0}</div>
          <div className="stat-label">已学模块</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {overview?.mastery?.length > 0
              ? Math.round(overview.mastery.reduce((acc, m) => acc + m.mastery_score, 0) / overview.mastery.length)
              : 0}%
          </div>
          <div className="stat-label">平均掌握度</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{overview?.recentActivities?.length || 0}</div>
          <div className="stat-label">最近活动</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{units.length}</div>
          <div className="stat-label">课程总数</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">🚀 下一步行动</div>
            {overview?.nextActions?.length > 0 ? (
              <div>
                {overview.nextActions.map((action, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      background: 'var(--bg-color)',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      if (action.type === 'path') navigate('/student/learning-path');
                      if (action.type === 'resource') navigate('/student/resources');
                      if (action.type === 'quiz') navigate('/student/quiz');
                      if (action.type === 'tutor') navigate('/student/tutor');
                    }}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{action.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{action.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>
                先去完善学生画像，开始个性化学习吧！
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '12px', width: '100%' }}
                  onClick={() => navigate('/student/profile')}
                >
                  前往画像页面
                </button>
              </p>
            )}
          </div>

          <div className="card">
            <div className="card-header">📚 课程模块</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {units.map((unit) => {
                const mastery = overview?.mastery?.find((m) => m.unit_id === unit.id);
                return (
                  <div
                    key={unit.id}
                    className="resource-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/student/resources')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{unit.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {unit.description}
                        </div>
                      </div>
                      {mastery && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--secondary-color)' }}>
                            {mastery.mastery_score}%
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>掌握度</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">📊 掌握度进度</div>
            {overview?.mastery?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {overview.mastery.map((m) => (
                  <div key={m.unit_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{m.unit_title}</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-color)' }}>
                        {m.mastery_score}%
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: 'var(--border-color)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        background: 'var(--primary-color)',
                        width: `${m.mastery_score}%`,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>暂无掌握度数据</p>
            )}
          </div>

          <div className="card">
            <div className="card-header">⏰ 最近活动</div>
            {overview?.recentActivities?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {overview.recentActivities.map((activity, idx) => (
                  <div key={idx} style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{activity.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{activity.type} · {activity.time}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>暂无活动记录</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
