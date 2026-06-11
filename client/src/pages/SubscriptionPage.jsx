import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';
import { PLAN_LABELS, PLAN_PRICES } from '../utils/helpers';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, subscription, hasSubscription, setSubscription, loadUser } = useAuth();
  const { toast, showModal, closeModal } = useUI();
  const [plans, setPlans] = useState(null);

  useEffect(() => {
    API.subscription.getPlans().then(setPlans).catch(console.error);
  }, []);

  const subscribeTo = (planType) => {
    if (!user) {
      toast('Для оформления подписки необходимо войти в аккаунт', 'warning');
      navigate('/login');
      return;
    }
    showModal(
      <div style={{ textAlign: 'center', padding: 8 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
        <h2 className="modal-title">Оформление подписки</h2>
        <p className="text-muted" style={{ marginBottom: 24 }}>
          Это демонстрационная версия. В реальном проекте здесь будет интеграция с платёжной системой (ЮKassa, Stripe и др.)
        </p>
        <div className="card" style={{ background: 'var(--bg)', padding: 16, marginBottom: 20, textAlign: 'left' }}>
          <div className="flex justify-between" style={{ marginBottom: 8 }}>
            <span>Тариф:</span><strong>{PLAN_LABELS[planType]}</strong>
          </div>
          <div className="flex justify-between">
            <span>Сумма:</span><strong style={{ color: 'var(--orange)' }}>{PLAN_PRICES[planType]} руб.</strong>
          </div>
        </div>
        <button className="btn btn-primary btn-block btn-lg" onClick={() => confirmSubscribe(planType)}>Подтвердить оплату</button>
        <button className="btn btn-ghost btn-block mt-8" onClick={closeModal}>Отмена</button>
      </div>
    );
  };

  const confirmSubscribe = async (planType) => {
    try {
      const { subscription: sub } = await API.subscription.subscribe(planType);
      setSubscription(sub);
      closeModal();
      toast('Подписка активирована! Добро пожаловать в PRO!', 'success');
      navigate('/');
    } catch (err) {
      toast(err.message, 'error');
      closeModal();
    }
  };

  const confirmCancel = () => {
    showModal(
      <>
        <h2 className="modal-title">Отменить подписку?</h2>
        <p className="text-muted" style={{ marginBottom: 20 }}>Вы потеряете доступ к платным материалам. Доступ сохраняется до конца оплаченного периода.</p>
        <div className="flex gap-12">
          <button className="btn btn-danger btn-block" onClick={async () => {
            try {
              await API.subscription.cancel();
              setSubscription(null);
              closeModal();
              toast('Подписка отменена', 'warning');
            } catch (err) { toast(err.message, 'error'); }
          }}>Отменить подписку</button>
          <button className="btn btn-secondary btn-block" onClick={closeModal}>Назад</button>
        </div>
      </>
    );
  };

  const hasSub = hasSubscription();
  const planOrder = ['monthly', 'half_year', 'yearly'];

  const features = [
    ['📚', 'Полный доступ', 'Все 2 блока, 16 тем, 128 техник, 512 методов'],
    ['🎥', 'Видео-материалы', 'Короткие видео с визуализацией каждого метода'],
    ['📊', 'Аналитика', 'Детальный анализ вашего прогресса и успехов'],
    ['🧪', 'Тесты', 'Интерактивные тесты для проверки знаний'],
    ['🤖', 'Рекомендации', 'Персональные рекомендации на основе ИИ'],
    ['🏋️', 'Тренажёры', 'Интерактивные упражнения для отработки методов'],
  ];

  return (
    <>
      <div className="page-header text-center" style={{ marginBottom: 36 }}>
        <h1 className="page-title" style={{ fontSize: 32 }}>Выберите подходящий тариф</h1>
        <p className="text-muted">{hasSub ? 'У вас есть активная подписка' : 'Получите полный доступ ко всем материалам центра'}</p>
      </div>

      <div className="plans-grid">
        {plans ? planOrder.map((key) => {
          const p = plans[key];
          if (!p) return null;
          const isCurrent = subscription?.plan_type === key;
          return (
            <div key={key} className={`plan-card${key === 'half_year' ? ' featured' : ''}`}>
              {p.discount && <div className="plan-badge">-{p.discount}%</div>}
              <div className="plan-name">{p.label}</div>
              <div className="plan-price">{p.price}</div>
              <div className="plan-currency">рублей</div>
              <div className="plan-desc">Полный доступ ко всем платным материалам</div>
              <div className="plan-duration"><span>{p.days}</span> дней</div>
              {isCurrent
                ? <button className="btn-activate" style={{ background: '#10B981', cursor: 'default' }}>✓ АКТИВНА</button>
                : <button className="btn-activate" onClick={() => subscribeTo(key)}>АКТИВИРОВАТЬ</button>}
            </div>
          );
        }) : <div className="loading-state"><div className="spinner" /></div>}
      </div>

      {hasSub && (
        <div className="text-center mt-24">
          <button className="btn btn-secondary" onClick={confirmCancel}>Отменить подписку</button>
        </div>
      )}

      <div className="card mt-24" style={{ maxWidth: 900, margin: '32px auto 0' }}>
        <h3 className="section-title">✅ Что входит в подписку</h3>
        <div className="grid-3" style={{ gap: 12 }}>
          {features.map(([icon, title, desc]) => (
            <div key={title} className="flex gap-12" style={{ alignItems: 'flex-start' }}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <div><div className="font-bold" style={{ fontSize: 14 }}>{title}</div><div className="text-muted" style={{ fontSize: 13 }}>{desc}</div></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
