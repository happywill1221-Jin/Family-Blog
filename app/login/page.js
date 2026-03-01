'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    if (!name.trim() || !password.trim()) {
      setError('이름과 비밀번호를 입력해주세요');
      return;
    }
    try {
      const q = query(collection(db, 'users'), where('name', '==', name.trim()));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setError('등록되지 않은 이름입니다');
        return;
      }
      const userData = snapshot.docs[0].data();
      const userId = snapshot.docs[0].id;
      if (userData.password !== password) {
        setError('비밀번호가 틀립니다');
        return;
      }
      localStorage.setItem('user', JSON.stringify({
        id: userId,
        name: userData.name,
        emoji: userData.emoji || '👤'
      }));
      router.push('/');
    } catch (err) {
      console.error('로그인 에러:', err);
      setError('로그인 중 오류가 발생했습니다');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '40px',
        width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>🏠</h1>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#333' }}>
          우리 가족 블로그
        </h2>

        {error && (
          <div style={{
            background: '#ffe0e0', color: '#c00', padding: '10px',
            borderRadius: '8px', marginBottom: '16px', fontSize: '14px', textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: '10px',
            border: '2px solid #e0e0e0', fontSize: '16px',
            marginBottom: '12px', outline: 'none', boxSizing: 'border-box'
          }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: '10px',
            border: '2px solid #e0e0e0', fontSize: '16px',
            marginBottom: '20px', outline: 'none', boxSizing: 'border-box'
          }}
        />
        <button
          onClick={handleLogin}
          style={{
            width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          로그인
        </button>
      </div>
    </div>
  );
}