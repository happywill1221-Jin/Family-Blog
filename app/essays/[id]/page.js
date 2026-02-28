'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EssayDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchEssay();
  }, [id]);

  const fetchEssay = async () => {
    try {
      const { data, error } = await supabase
        .from('essays')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEssay(data);
    } catch (error) {
      console.error('에세이 불러오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 에세이를 삭제하시겠습니까?')) return;

    try {
      if (essay.images && essay.images.length > 0) {
        const fileNames = essay.images.map((url) => {
          const parts = url.split('/');
          return parts[parts.length - 1];
        });
        await supabase.storage.from('essay-images').remove(fileNames);
      }

      const { error } = await supabase.from('essays').delete().eq('id', id);
      if (error) throw error;

      alert('에세이가 삭제되었습니다.');
      router.push('/essays');
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!essay) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">😢</p>
          <p className="text-gray-500 text-lg">에세이를 찾을 수 없습니다.</p>
          <Link href="/essays" className="inline-block mt-4 text-blue-500">
            ← 에세이 목록으로
          </Link>
        </div>
      </div>
    );
  }

  const images = essay.images || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/essays" className="text-gray-500 hover:text-gray-700 text-sm">
            ← 에세이 목록
          </Link>
          <button
            onClick={handleDelete}
            className="text-red-400 hover:text-red-600 text-sm"
          >
            🗑️ 삭제
          </button>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 pt-10 pb-6 border-b border-gray-50">
            <h1 className="text-3xl font-bold text-gray-800 leading-tight mb-4">
              {essay.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>✍️ {essay.author || '아빠'}</span>
              <span>📅 {formatDate(essay.created_at)}</span>
              {images.length > 0 && <span>🖼️ 사진 {images.length}장</span>}
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="text-gray-700 leading-loose text-lg whitespace-pre-wrap">
              {essay.content}
            </div>
          </div>

          {images.length > 0 && (
            <div className="px-8 pb-10">
              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-sm font-medium text-gray-400 mb-4">📷 첨부된 사진</h3>
                <div className={`grid gap-3 ${
                  images.length === 1
                    ? 'grid-cols-1'
                    : 'grid-cols-2'
                }`}>
                  {images.map((url, index) => (
                    <div
                      key={index}
                      className="cursor-pointer overflow-hidden rounded-xl"
                      onClick={() => setSelectedImage(url)}
                    >
                      <img
                        src={url}
                        alt={`사진 ${index + 1}`}
                        className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </article>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white text-2xl hover:text-gray-300"
          >
            ✕
          </button>
          <img
            src={selectedImage}
            alt="확대 보기"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}