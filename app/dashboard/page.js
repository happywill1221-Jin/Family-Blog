'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [postCount, setPostCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('familyUser');
    if (!saved) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(saved));
    try {
      const posts = JSON.parse(localStorage.getItem('familyPosts') || '[]');
      setPostCount(posts.length);
    } catch (e) {}
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('familyUser');
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← 홈으로
          </Link>
          <h1 className="text-lg font-bold text-gray-800">🏠 가족 블로그</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-600"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 인사말 */}
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-6 text-center">
        <div className="text-6xl mb-4">{user.emoji}</div>
        <h2 className="text-2xl font-bold text-gray-800">
          안녕하세요, {user.name}! 👋
        </h2>
        <p className="text-gray-500 mt-2">오늘은 어떤 이야기를 나눠볼까요?</p>
      </div>

      {/* 메뉴 카드들 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 글쓰기 카드 */}
          <Link href="/write" className="group">
            <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-transparent hover:border-blue-400 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
              <div className="text-5xl mb-4">✏️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                글쓰기
              </h3>
              <p className="text-gray-500 text-sm">
                새로운 이야기를 작성해보세요.<br />
                사진도 함께 올릴 수 있어요!
              </p>
              <div className="mt-4 text-blue-500 font-medium text-sm group-hover:translate-x-2 transition-transform">
                글쓰러 가기 →
              </div>
            </div>
          </Link>

          {/* 에세이 카드 */}
          <Link href="/essays" className="group">
            <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-transparent hover:border-green-400 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
              <div className="text-5xl mb-4">📖</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                에세이 보기
              </h3>
              <p className="text-gray-500 text-sm">
                가족들이 쓴 글을 읽어보세요.<br />
                현재 {postCount}개의 글이 있어요.
              </p>
              <div className="mt-4 text-green-500 font-medium text-sm group-hover:translate-x-2 transition-transform">
                읽으러 가기 →
              </div>
            </div>
          </Link>

          {/* 가족 사진 카드 */}
          <Link href="/" className="group">
            <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-transparent hover:border-pink-400 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
              <div className="text-5xl mb-4">📷</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                가족 사진
              </h3>
              <p className="text-gray-500 text-sm">
                소중한 가족 사진을 감상하세요.<br />
                행복한 순간들이 담겨있어요.
              </p>
              <div className="mt-4 text-pink-500 font-medium text-sm group-hover:translate-x-2 transition-transform">
                사진 보기 →
              </div>
            </div>
          </Link>

          {/* 내 정보 카드 */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              내 정보
            </h3>
            <div className="space-y-2 text-sm text-gray-500">
              <p>👤 이름: <strong className="text-gray-700">{user.name}</strong></p>
              <p>📝 전체 글: <strong className="text-gray-700">{postCount}개</strong></p>
              <p>💝 상태: <strong className="text-green-600">접속 중</strong></p>
            </div>
          </div>

        </div>
      </div>

      {/* 하단 */}
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-400 text-sm">
          🏠 우리 가족만의 소중한 공간
        </p>
      </div>
    </div>
  );
}