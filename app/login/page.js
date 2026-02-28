'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const FAMILY_MEMBERS = [
  { id: 'dad', name: '아빠', emoji: '👨' },
  { id: 'mom', name: '엄마', emoji: '👩' },
  { id: 'son', name: '아들', emoji: '👦' },
  { id: 'daughter', name: '딸', emoji: '👧' },
];

export default function LoginPage() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!selectedMember) {
      setError('가족 구성원을 선택해주세요.');
      return;
    }

    if (password === '1221') {
      localStorage.setItem('familyUser', JSON.stringify(selectedMember));
      router.push('/');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">🏠 가족 로그인</h1>
          <p className="text-gray-500 mt-2">누구인지 선택해주세요!</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {FAMILY_MEMBERS.map((member) => (
            <button
              key={member.id}
              onClick={() => { setSelectedMember(member); setError(''); }}
              className={`p-4 rounded-xl border-2 transition-all text-center
                ${selectedMember?.id === member.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
            >
              <span className="text-3xl">{member.emoji}</span>
              <p className="mt-2 font-medium text-gray-700">{member.name}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            로그인
          </button>
        </form>

        <Link href="/" className="block text-center mt-4 text-gray-400 hover:text-gray-600 text-sm">
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}