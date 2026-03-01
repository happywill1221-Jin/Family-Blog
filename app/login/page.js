'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const familyMembers = [
  { name: '아빠', emoji: '🧔' },
  { name: '엄마', emoji: '👩' },
  { name: '아들', emoji: '👦' },
  { name: '딸', emoji: '👧' },
];

export default function LoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) router.push('/');
  }, [router]);

  const handleLogin = async () => {
    if (!selected) {
      setError('가족 구성원을 선택해주세요');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const configDoc = await getDoc(doc(db, 'config', 'app'));
      const correctPassword = configDoc.exists()
        ? configDoc.data().password
        : '1234';

      if (password !== correctPassword) {
        setError('비밀번호가 올바르지 않습니다');
        setLoading(false);
        return;
      }

      localStorage.setItem(
        'user',
        JSON.stringify({ name: selected.name, emoji: selected.emoji })
      );
      router.push('/');
    } catch (err) {
      console.error('로그인 실패:', err);
      setError('로그인 중 오류가 발생했습니다');
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        animation: 'scaleIn 0.6s ease',
      }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🏠</div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}>
            우리 가족 블로그
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            누구인지 알려주세요!
          </p>
        </div>

        {/* 가족 선택 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}>
          {familyMembers.map((member, i) => (
            <button
              key={member.name}
              onClick={() => { setSelected(member); setError(''); }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                background: selected?.name === member.name
                  ? 'var(--gradient)'
                  : 'var(--card)',
                color: selected?.name === member.name ? 'white' : 'var(--text)',
                border: selected?.name === member.name
                  ? '2px solid var(--primary)'
                  : '2px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: '20px 16px',
                cursor: 'pointer',
                transition: 'var(--transition)',
                transform: hoveredIdx === i ? 'translateY(-2px)' : 'none',
                boxShadow: hoveredIdx === i ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 36 }}>{member.emoji}</span>
              {member.name}
            </button>
          ))}
        </div>

        {/* 비밀번호 */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="가족 비밀번호를 입력하세요"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(108,92,231,0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
            style={{
              width: '100%',
              padding: '14px 18px',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 15,
              outline: 'none',
              transition: 'var(--transition)',
              background: 'var(--card)',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* 에러 */}
        {error && (
          <div style={{
            background: '#FFF5F5',
            color: 'var(--danger)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            marginBottom: 16,
            animation: 'fadeIn 0.3s ease',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* 로그인 버튼 */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            background: loading ? 'var(--text-light)' : 'var(--gradient)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'var(--transition)',
            boxShadow: loading ? 'none' : 'var(--shadow-glow)',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              로그인 중...
            </>
          ) : (
            '로그인'
          )}
        </button>

        <p style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 13,
          color: 'var(--text-light)',
        }}>
          처음이라면 비밀번호는 <strong>1234</strong> 입니다
        </p>
      </div>
    </div>
  );
}