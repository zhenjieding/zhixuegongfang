import React, { useState, useEffect } from 'react';
import { quizApi, courseApi } from '../../services/api';
import { CourseUnit, Quiz, QuizQuestion, QuizAnalysis } from '../../types';

const QuizPage: React.FC = () => {
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<CourseUnit | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [analysis, setAnalysis] = useState<QuizAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizState, setQuizState] = useState<'idle' | 'in-progress' | 'completed'>('idle');

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
      const data = await quizApi.generateQuiz(selectedUnit.id, 'medium', 5);
      setQuiz(data);
      setQuestions(JSON.parse(data.questions_json));
      setAnswers({});
      setAnalysis(null);
      setQuizState('in-progress');
    } catch (err) {
      console.error('生成测验失败', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const data = await quizApi.submitQuiz(quiz.id, answers);
      setAnalysis(data);
      setQuizState('completed');
    } catch (err) {
      console.error('提交测验失败', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setQuiz(null);
    setQuestions([]);
    setAnswers({});
    setAnalysis(null);
    setQuizState('idle');
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
        <h1 className="page-title">📝 测验评估</h1>
        <p className="page-desc">测试你的掌握程度，获取个性化反馈</p>
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
              }}
              disabled={quizState !== 'idle'}
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.title}
                </option>
              ))}
            </select>
          </div>
          {quizState === 'idle' && (
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
              ) : '📝 开始测验'}
            </button>
          )}
          {quizState !== 'idle' && (
            <button className="btn btn-secondary" onClick={handleReset}>
              🔄 重新开始
            </button>
          )}
        </div>
      </div>

      {analysis && (
        <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ marginBottom: '8px' }}>测验完成！</h3>
              <p>你答对了 {analysis.analysis.correctAnswers}/{analysis.analysis.totalQuestions} 道题</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '56px', fontWeight: '800' }}>{analysis.score}%</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>得分</div>
            </div>
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div className="card">
          {quiz?.title && <div className="card-header">{quiz.title}</div>}

          <div>
            {questions.map((q, idx) => {
              const wrongQ = analysis?.analysis.wrongQuestions?.find((wq) => wq.questionIndex === idx);
              const isAnswered = idx in answers;
              const isCorrect = analysis && !wrongQ;
              const isWrong = analysis && !!wrongQ;

              return (
                <div
                  key={idx}
                  style={{
                    marginBottom: '28px',
                    padding: '20px',
                    background: isCorrect ? '#D1FAE5' : isWrong ? '#FEE2E2' : 'var(--bg-color)',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isCorrect ? '#10B981' : isWrong ? '#EF4444' : 'var(--primary-color)',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <span className="tag">{q.type}</span>
                      </div>
                      <p style={{ fontWeight: '500', marginBottom: '16px' }}>{q.question}</p>

                      {q.type === 'choice' && q.options && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {q.options.map((opt, optIdx) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            const isSelected = answers[idx] === letter;
                            const isCorrectOption = analysis && q.answer === letter;
                            const isWrongOption = analysis && wrongQ?.userAnswer === letter && wrongQ?.correctAnswer !== letter;

                            return (
                              <div
                                key={optIdx}
                                className={`quiz-option ${isSelected ? 'selected' : ''} ${isCorrectOption ? 'correct' : ''} ${isWrongOption ? 'incorrect' : ''}`}
                                onClick={() => {
                                  if (!analysis) {
                                    setAnswers({ ...answers, [idx]: letter });
                                  }
                                }}
                              >
                                {letter}. {opt}
                                {isCorrectOption && <span style={{ marginLeft: '8px' }}>✓ 正确</span>}
                                {isWrongOption && <span style={{ marginLeft: '8px' }}>✗ 错误</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'fill' && (
                        <div>
                          <input
                            type="text"
                            className="input"
                            value={answers[idx] || ''}
                            onChange={(e) => {
                              if (!analysis) {
                                setAnswers({ ...answers, [idx]: e.target.value });
                              }
                            }}
                            placeholder="请输入答案"
                            disabled={!!analysis}
                          />
                          {analysis && (
                            <div style={{ marginTop: '12px' }}>
                              <p><strong>正确答案:</strong> {q.answer}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {wrongQ && (
                        <div style={{ marginTop: '16px', padding: '16px', background: 'white', borderRadius: '8px' }}>
                          <p style={{ marginBottom: '8px', fontWeight: '500' }}>💡 错题解析</p>
                          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>{wrongQ.reason}</p>
                          <p style={{ color: 'var(--text-secondary)' }}><strong>建议:</strong> {wrongQ.suggestion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {quizState === 'in-progress' && (
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting || Object.keys(answers).length < questions.length}
                style={{ padding: '12px 48px' }}
              >
                {submitting ? (
                  <>
                    <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                    评分中...
                  </>
                ) : '✓ 提交答案'}
              </button>
              {Object.keys(answers).length < questions.length && (
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  还有 {questions.length - Object.keys(answers).length} 道题未作答
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {quizState === 'idle' && !generating && (
        <div className="card" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ marginBottom: '12px' }}>准备好测试了吗？</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            选择课程单元，生成一份个性化测验
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
