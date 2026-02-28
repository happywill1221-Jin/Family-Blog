'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const FAMILY_MEMBERS = [
  { id: 1, name: '아빠', emoji: '👨' },
  { id: 2, name: '엄마', emoji: '👩' },
  { id: 3, name: '아들', emoji: '👦' },
  { id: 4, name: '딸', emoji: '👧' },
];

export default function LoginPage() {
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selected) {
      setError('가족을 선택해주세요');
      return;
    }
    const member = FAMILY_MEMBERS.find((m) => m.id === selected);

    // 간단한 해시 비교 (평문 노출 방지)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // "1234"의 SHA-256 해시값
    const correctHash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

    if (hashHex === correctHash) {
      localStorage.setItem('familyUser', JSON.stringify(member));
      router.push('/dashboard');
    } else {
      setError('비밀번호가 틀렸습니다');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
          ← 홈으로
        </Link>
        <div className="text-center mt-4 mb-8">
          <p className="text-5xl mb-3">🏠</p>
          <h1 className="text-2xl font-bold text-gray-800">가족 로그인</h1>
          <p className="text-gray-500 text-sm mt-1">누구인지 선택해주세요</p>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {FAMILY_MEMBERS.map((member) => (
            <button
              key={member.id}
              onClick={() => { setSelected(member.id); setError(''); }}
              className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                selected === member.id
                  ? 'border-blue-500 bg-blue-50 scale-105 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-3xl mb-1">{member.emoji}</span>
              <span className="text-xs font-medium text-gray-700">{member.name}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 text-center text-lg tracking-widest mb-4"
          />
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors text-lg"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}