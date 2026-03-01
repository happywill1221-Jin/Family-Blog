'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';

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
    fetchPostCount();
  }, [router]);

  const fetchPostCount = async () => {
    try {
      const coll = collection(db, 'posts');
      const snapshot = await getCountFromServer(coll);
      setPostCount(snapshot.data().count);
    } catch (error) {
      console.error('글 수 조회 실패:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('familyUser');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">🏠 우리 가족</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white mb-8 shadow-lg">
          <p className="text-3xl mb-2">{user.emoji}</p>
          <h2 className="text-2xl font-bold mb-1">안녕하세요, {user.name}!</h2>
          <p className="text-blue-100 text-sm">오늘도 가족과 함께하는 하루 되세요 💕</p>
        </div>

        <div className="grid gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-green-100 hover:border-green-300 transition-colors">
            <p className="text-3xl mb-3">📖</p>
            <h3 className="text-lg font-bold text-gray-800 mb-1">에세이 보기</h3>
            <p className="text-sm text-gray-500 mb-1">가족들이 쓴 글을 읽어보세요.</p>
            <p className="text-sm text-gray-400 mb-4">현재 {postCount}개의 글이 있어요.</p>
            <Link href="/essays" className="text-green-500 font-bold text-sm hover:text-green-600">
              읽으러 가기 →
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-blue-100 hover:border-blue-300 transition-colors">
            <p className="text-3xl mb-3">✏️</p>
            <h3 className="text-lg font-bold text-gray-800 mb-1">새 글 쓰기</h3>
            <p className="text-sm text-gray-500 mb-4">오늘의 이야기를 들려주세요.</p>
            <Link href="/write" className="text-blue-500 font-bold text-sm hover:text-blue-600">
              글쓰러 가기 →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}