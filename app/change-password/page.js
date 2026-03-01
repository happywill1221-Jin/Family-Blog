'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      const configRef = doc(db, 'config', 'app');

      // 1. 현재 비밀번호 확인
      const configDoc = await getDoc(configRef);
      if (!configDoc.exists()) {
        setError('설정 문서를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      const correctPassword = configDoc.data().password;
      console.log('DB 비밀번호:', correctPassword);
      console.log('입력한 현재 비밀번호:', currentPassword);

      if (currentPassword !== correctPassword) {
        setError('현재 비밀번호가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      // 2. 비밀번호 변경 (updateDoc 사용)
      await updateDoc(configRef, {
        password: newPassword
      });

      // 3. 변경 확인
      const verifyDoc = await getDoc(configRef);
      const updatedPassword = verifyDoc.data().password;
      console.log('변경 후 DB 비밀번호:', updatedPassword);

      if (updatedPassword === newPassword) {
        setSuccess('비밀번호가 성공적으로 변경되었습니다! ✅');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => router.push('/'), 2000);
      } else {
        setError('변경이 저장되지 않았습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      console.error('비밀번호 변경 오류:', err);
      setError(`오류 발생: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
        maxWidth: 400,
        animation: 'scaleIn 0.6s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h1 style={{ fontSize: 24, fontWeight: 900 }}>비밀번호 변경</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
            가족 공용 비밀번호를 변경합니다
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, display: 'block' }}>
              현재 비밀번호
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 18px',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 15,
                outline: 'none',
                background: 'var(--card)',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, display: 'block' }}>
              새 비밀번호
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 18px',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 15,
                outline: 'none',
                background: 'var(--card)',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, display: 'block' }}>
              새 비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 18px',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 15,
                outline: 'none',
                background: 'var(--card)',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#FFF5F5',
              color: '#E53E3E',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              marginBottom: 16,
              textAlign: 'center',
              border: '1px solid #FED7D7',
            }}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#F0FFF4',
              color: '#38A169',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              marginBottom: 16,
              textAlign: 'center',
              border: '1px solid #C6F6D5',
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
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
              fontFamily: 'inherit',
              boxShadow: loading ? 'none' : 'var(--shadow-glow)',
            }}
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              padding: '14px',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginTop: 12,
              fontFamily: 'inherit',
            }}
          >
            돌아가기
          </button>
        </form>
      </div>
    </div>
  );
}