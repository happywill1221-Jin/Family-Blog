'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EssaysPage() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('familyPosts');
      if (saved) setPosts(JSON.parse(saved));
    } catch (e) {}
    try {
      const savedUser = localStorage.getItem('familyUser');
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (e) {}
  }, []);

  const handleDelete = (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const updated = posts.filter((p) => p.id !== id);
    setPosts(updated);
    localStorage.setItem('familyPosts', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← 홈으로
          </Link>
          <h1 className="text-xl font-bold text-gray-800">📝 에세이</h1>
          <Link
            href="/write"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            ✏️ 새 글쓰기
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">📖</p>
            <p className="text-gray-500 text-lg">아직 작성된 글이 없습니다.</p>
            <Link
              href="/write"
              className="inline-block mt-6 bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600"
            >
              첫 번째 글 쓰기
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-500 text-sm mb-3 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{post.emoji} {post.author}</span>
                      <span>📅 {post.date}</span>
                    </div>
                  </div>
                  {user && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-400 hover:text-red-600 text-sm ml-4"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}