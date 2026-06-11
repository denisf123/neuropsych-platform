import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useUI } from '../context/UIContext';
import Spinner from '../components/Spinner';

export default function TestPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { toast } = useUI();
  const [test, setTest] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    API.content.getTest(topicId).then(setTest).catch(setError);
  }, [topicId]);

  if (error?.code === 'SUBSCRIPTION_REQUIRED') {
    return (
      <div className="card paywall">
        <div className="paywall-icon">🔒</div>
        <h2 className="paywall-title">Требуется подписка</h2>
        <p className="paywall-text">Оформите подписку от 199 руб./месяц для доступа ко всем материалам</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/subscription')}>Выбрать тариф →</button>
      </div>
    );
  }

  if (!test) return <Spinner />;

  const selectAnswer = async (answerIdx) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = answerIdx;
    setAnswers(newAnswers);

    setTimeout(async () => {
      if (currentQ + 1 < test.questions.length) {
        setCurrentQ(currentQ + 1);
      } else {
        try {
          const res = await API.content.submitTest(topicId, {
            answers: newAnswers,
            timeTaken: Math.round((Date.now() - startTime.current) / 1000),
          });
          setResult(res);
        } catch (err) {
          toast(err.message, 'error');
        }
      }
    }, 500);
  };

  if (result) {
    return (
      <div className="test-card" style={{ maxWidth: 720 }}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>{result.passed ? '🎉' : '📚'}</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{result.passed ? 'Тест пройден!' : 'Почти!'}</h2>
          <div style={{ fontSize: 48, fontWeight: 700, color: result.passed ? '#10B981' : 'var(--orange)', margin: '16px 0' }}>{result.score}%</div>
          <p className="text-muted" style={{ marginBottom: 20 }}>Правильных ответов: {result.correct} из {result.total}</p>
          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            {result.results.map((r, i) => (
              <div key={i} style={{ padding: 10, marginBottom: 8, background: r.isCorrect ? '#F0FDF4' : '#FEF2F2', borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.question}</div>
                <div style={{ fontSize: 12, color: r.isCorrect ? '#065F46' : '#991B1B', marginTop: 4 }}>
                  {r.isCorrect ? '✅' : '❌'} {r.explanation || ''}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-12" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => { setAnswers([]); setCurrentQ(0); setResult(null); startTime.current = Date.now(); }}>🔄 Пройти снова</button>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Назад</button>
          </div>
        </div>
      </div>
    );
  }

  const q = test.questions[currentQ];
  const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📝 {test.title}</h1>
        <p className="page-subtitle">{test.description || ''} · Проходной балл: {test.pass_score}%</p>
      </div>
      <div className="test-card">
        <div className="question-num">Вопрос {currentQ + 1} из {test.questions.length}</div>
        <div className="progress-bar-container" style={{ marginBottom: 20 }}>
          <div className="progress-bar" style={{ width: `${(currentQ / test.questions.length) * 100}%` }} />
        </div>
        <div className="question-text">{q.question}</div>
        <div className="options-list">
          {options.map((opt, oi) => (
            <button key={oi} className={`option-btn${answers[currentQ] === oi ? ' selected' : ''}`} onClick={() => selectAnswer(oi)}>
              <span style={{ fontWeight: 600, marginRight: 8 }}>{String.fromCharCode(65 + oi)}.</span>{opt}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
