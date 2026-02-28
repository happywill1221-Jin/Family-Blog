'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EssaysPage() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('글 불러오기 실패:', error);
    else setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    try {
      const saved = localStorage.getItem('familyUser');
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else setPosts(posts.filter((p) => p.id !== id));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    return `${m}월 ${d}일 ${hh}:${mm}`;
  };

  // ★ 본문+이미지 인라인 렌더링
  const renderContent = (text, imgs) => {
    if (!text) return null;
    const hasMarkers = /\[IMG:\d+\]/.test(text);

    if (hasMarkers) {
      const parts = text.split(/(\[IMG:\d+\])/g);
      return (
        <div>
          {parts.map((part, i) => {
            const match = part.match(/\[IMG:(\d+)\]/);
            if (match) {
              const idx = parseInt(match[1]);
              if (imgs && imgs[idx]) {
                return (
                  <img
                    key={i}
                    src={imgs[idx]}
                    alt={`사진 ${idx + 1}`}
                    onClick={() => setViewingImage(imgs[idx])}
                    className="w-full max-w-lg rounded-xl my-4 cursor-pointer hover:opacity-90 transition-opacity border border-gray-100"
                  />
                );
              }
              return null;
            }
            if (part.trim()) {
              return (
                <p key={i} className="text-gray-600 leading-relaxed whitespace-pre-wrap my-1">
                  {part.trim()}
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    }

    // 마커 없는 기존 글
    return (
      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{text}</p>
    );
  };

  // 마커에 포함되지 않은 이미지 (기존 형식 호환)
  const getExtraImages = (text, imgs) => {
    if (!imgs || imgs.length === 0) return [];
    if (!/\[IMG:\d+\]/.test(text)) return imgs; // 마커 없으면 전부 표시
    return imgs.filter((_, idx) => !text.includes(`[IMG:${idx}]`));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 이미지 확대 모달 */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <img src={viewingImage} alt="확대" className="max-w-full max-h-full rounded-lg" />
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
            {posts.map((post) => {
              const extraImgs = getExtraImages(post.content, post.images);
              return (
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
                        <p className="text-xs text-gray-400">{formatDate(post.created_at)}</p>
                      </div>
                    </div>
                    {user && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/edit/${post.id}`)}
                          className="text-gray-300 hover:text-blue-500 transition-colors text-lg"
                          title="수정"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors text-lg"
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 제목 + 본문 (인라인 이미지 포함) */}
                  <div className="px-6 pb-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">{post.title}</h2>
                    {renderContent(post.content, post.images)}
                  </div>

                  {/* 마커에 없는 이미지 (기존 글 호환) */}
                  {extraImgs.length > 0 && (
                    <div className="px-6 pb-4">
                      <div
                        className={`grid gap-2 ${
                          extraImgs.length === 1
                            ? 'grid-cols-1'
                            : extraImgs.length === 2
                            ? 'grid-cols-2'
                            : 'grid-cols-3'
                        }`}
                      >
                        {extraImgs.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`사진 ${idx + 1}`}
                            onClick={() => setViewingImage(img)}
                            className={`w-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity border border-gray-100 ${
                              extraImgs.length === 1 ? 'h-80' : 'h-48'
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
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}