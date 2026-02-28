'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('familyUser');
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {}
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto py-6 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            🏠 우리 가족 블로그
          </h1>
          <p className="text-gray-500 mt-2">소중한 우리 가족의 이야기</p>
        </div>
      </header>

      {/* 로그인/대시보드 버튼 */}
      <section className="max-w-4xl mx-auto px-4 py-10 text-center">
        {user ? (
          <div>
            <p className="text-lg text-gray-700 mb-4">
              {user.emoji} <strong>{user.name}</strong>님, 환영합니다!
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all"
            >
              📋 대시보드로 가기
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-5xl mb-4">👨‍👩‍👧‍👦</p>
            <p className="text-lg text-gray-600 mb-6">
              가족 블로그에 오신 것을 환영합니다!
            </p>
            <Link
              href="/login"
              className="inline-block bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all"
            >
              🔑 로그인하기
            </Link>
          </div>
        )}
      </section>

      {/* 가족 사진 */}
      <section className="max-w-4xl mx-auto py-6 px-4 pb-12">
        <h2 className="text-2xl font-bold text-gray-700 mb-6 text-center">
          📷 가족 사진
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { src: '/family1.jpg', text: '우리 가족 ❤️' },
            { src: '/family2.jpg', text: '행복한 순간 😊' },
            { src: '/family3.jpg', text: '즐거운 하루 🎉' },
            { src: '/family4.jpg', text: '사랑해요 💕' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <Image
                src={item.src}
                alt={item.text}
                width={600}
                height={400}
                className="w-full h-72 object-cover"
              />
              <div className="p-4">
                <p className="text-gray-600 text-center font-medium">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}