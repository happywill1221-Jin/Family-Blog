'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('familyUser');
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    const posts = JSON.parse(localStorage.getItem('familyPosts') || '[]');
    const newPost = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      author: user?.name || '익명',
      emoji: user?.emoji || '👤',
      date: new Date().toLocaleDateString('ko-KR'),
    };
    posts.unshift(newPost);
    localStorage.setItem('familyPosts', JSON.stringify(posts));
    alert('글이 등록되었습니다! ✨');
    router.push('/essays');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← 홈으로
          </Link>
          <h1 className="text-lg font-bold text-gray-800">✏️ 글쓰기</h1>
          <div className="w-16"></div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        {!user ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <p className="text-4xl mb-4">🔒</p>
            <p className="text-gray-500 mb-4">로그인이 필요합니다</p>
            <Link href="/login" className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600">
              로그인하기
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <p className="text-sm text-gray-500">
                {user.emoji} <strong>{user.name}</strong>(으)로 글쓰기
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-6 py-4 text-xl font-bold text-gray-800 placeholder-gray-300 border-b focus:outline-none"
              />
              <textarea
                placeholder="내용을 입력하세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-6 py-4 text-gray-700 placeholder-gray-300 focus:outline-none resize-none"
                rows={12}
              />
              <div className="px-6 py-4 border-t flex justify-end gap-3">
                <Link href="/" className="px-6 py-3 rounded-xl text-gray-500 hover:bg-gray-100">
                  취소
                </Link>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}