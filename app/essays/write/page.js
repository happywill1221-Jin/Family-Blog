'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EssayWritePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    addImages(files);
    e.target.value = '';
  };

  const addImages = (files) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    const newImages = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };

  const uploadImages = async () => {
    const urls = [];
    for (const img of images) {
      const fileExt = img.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('essay-images')
        .upload(fileName, img.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('이미지 업로드 오류:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('essay-images')
        .getPublicUrl(fileName);

      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setPublishing(true);
    try {
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }

      let author = '아빠';
      try {
        const user = JSON.parse(localStorage.getItem('familyUser'));
        if (user?.name) author = user.name;
      } catch (e) {}

      const { error } = await supabase.from('essays').insert({
        title: title.trim(),
        content: content.trim(),
        images: imageUrls,
        author,
      });

      if (error) throw error;

      alert('에세이가 게시되었습니다! 📝');
      router.push('/essays');
    } catch (error) {
      console.error('에세이 게시 오류:', error);
      alert('에세이 게시 중 오류가 발생했습니다.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/essays" className="text-gray-500 hover:text-gray-700 text-sm">
            ← 에세이 목록
          </Link>
          <h1 className="text-lg font-bold text-gray-800">✏️ 새 에세이 쓰기</h1>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors
              ${publishing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
          >
            {publishing ? '게시 중...' : '게시하기'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <input
            type="text"
            placeholder="에세이 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-6 py-5 text-2xl font-bold text-gray-800 placeholder-gray-300 border-b border-gray-100 focus:outline-none"
          />

          <textarea
            placeholder="이야기를 적어보세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-6 py-5 text-gray-700 leading-relaxed placeholder-gray-300 focus:outline-none resize-none"
            rows={15}
            style={{ minHeight: '400px' }}
          />

          <div className="px-6 pb-6">
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">
                  🖼️ 사진 첨부 {images.length > 0 && `(${images.length}장)`}
                </h3>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                >
                  + 사진 추가
                </button>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => images.length === 0 && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer
                  ${dragOver
                    ? 'border-blue-500 bg-blue-50'
                    : images.length === 0
                      ? 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      : 'border-gray-200'
                  }`}
              >
                {images.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-4xl mb-3">📷</p>
                    <p className="text-gray-400 text-sm">
                      클릭하거나 사진을 여기로 드래그하세요
                    </p>
                    <p className="text-gray-300 text-xs mt-1">
                      JPG, PNG, GIF 지원
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((img, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={img.preview}
                          alt={`첨부 이미지 ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                        >
                          ✕
                        </button>
                        <div className="absolute bottom-2 left-2 w-6 h-6 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors"
                    >
                      <span className="text-3xl">+</span>
                    </button>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}