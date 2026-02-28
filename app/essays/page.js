'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function EssaysPage() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Supabase에서 글 불러오기
  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('글 불러오기 실패:', error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    try {
      const savedUser = localStorage.getItem('familyUser');
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (e) {}
  }, []);

  // ✅ Supabase에서 삭제
  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      setPosts(posts.filter((p) => p.id !== id));
    }
  };

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}월 ${day}일 ${hours}:${minutes}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 이미지 확대 모달 */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <img
            src={viewingImage}
            alt="확대"
            className="max-w-full max-h-full rounded-lg"
          />
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">
            ← 대시보드
          </Link>
          <h1 className="text-xl font-bold text-gray-800">📖 에세이</h1>
          <Link
            href="/write"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            ✏️ 새 글
          </Link>
        </div>
      </header>

      {/* 글 목록 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">⏳</p>
            <p className="text-gray-500">불러오는 중...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">📖</p>
            <p className="text-gray-500 text-lg mb-2">아직 작성된 글이 없습니다.</p>
            <p className="text-gray-400 text-sm mb-6">첫 번째 이야기를 들려주세요!</p>
            <Link
              href="/write"
              className="inline-block bg-blue-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600"
            >
              ✏️ 첫 번째 글 쓰기
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* 글 헤더 */}
                <div className="px-6 pt-6 pb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{post.author_emoji}</span>
                    <div>
                      <p className="font-bold text-gray-800">{post.author_name}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(post.created_at)}
                      </p>
                    </div>
                  </div>
                  {user && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors text-sm"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* 글 내용 */}
                <div className="px-6 pb-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {/* 이미지들 */}
                {post.images && post.images.length > 0 && (
                  <div className="px-6 pb-4">
                    <div className={`grid gap-2 ${
                      post.images.length === 1
                        ? 'grid-cols-1'
                        : post.images.length === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                    }`}>
                      {post.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`사진 ${idx + 1}`}
                          onClick={() => setViewingImage(img)}
                          className={`w-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity border border-gray-100 ${
                            post.images.length === 1 ? 'h-80' : 'h-48'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 하단 */}
                <div className="px-6 pb-4">
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400">
                      📷 사진 {post.images?.length || 0}장
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}