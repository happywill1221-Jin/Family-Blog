'use client';
import { useState } from 'react';
import { updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleChange = async (e) => {
    e.preventDefault();
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage('로그인이 필요합니다.');
        return;
      }

      // 현재 비밀번호로 재인증
      await signInWithEmailAndPassword(auth, user.email, currentPassword);

      // 새 비밀번호로 변경
      await updatePassword(user, newPassword);
      setMessage('비밀번호가 변경되었습니다!');
      setTimeout(() => router.push('/'), 2000);
    } catch (error) {
      setMessage('현재 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div style={{
      maxWidth: 400,
      margin: '80px auto',
      padding: 30,
      background: 'white',
      borderRadius: 12,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: 30 }}>🔒 비밀번호 변경</h1>

      <form onSubmit={handleChange}>
        <input
          type="password"
          placeholder="현재 비밀번호"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          style={{
            width: '100%', padding: 12, marginBottom: 12,
            border: '1px solid #ddd', borderRadius: 8, fontSize: 14,
            boxSizing: 'border-box'
          }}
          required
        />
        <input
          type="password"
          placeholder="새 비밀번호 (6자 이상)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{
            width: '100%', padding: 12, marginBottom: 12,
            border: '1px solid #ddd', borderRadius: 8, fontSize: 14,
            boxSizing: 'border-box'
          }}
          required
        />
        <input
          type="password"
          placeholder="새 비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{
            width: '100%', padding: 12, marginBottom: 20,
            border: '1px solid #ddd', borderRadius: 8, fontSize: 14,
            boxSizing: 'border-box'
          }}
          required
        />
        <button
          type="submit"
          style={{
            width: '100%', padding: 12,
            background: '#0070f3', color: 'white',
            border: 'none', borderRadius: 8,
            fontSize: 16, cursor: 'pointer'
          }}
        >
          비밀번호 변경
        </button>
      </form>

      {message && (
        <p style={{
          marginTop: 15, textAlign: 'center',
          color: message.includes('변경되었습니다') ? 'green' : 'red'
        }}>
          {message}
        </p>
      )}

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link href="/" style={{ color: '#666', fontSize: 14 }}>
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}