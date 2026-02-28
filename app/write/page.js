'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('familyUser');
    if (!saved) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(saved));
  }, [router]);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      alert('사진은 최대 5장까지 추가할 수 있습니다.');
      return;
    }

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name}의 용량이 너무 큽니다. (10MB 이하)`);
        continue;
      }
      const compressed = await compressImage(file);
      setImages((prev) => [...prev, compressed]);
    }
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

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
      images: images,
      author: user?.name || '익명',
      emoji: user?.emoji || '👤',
      date: new Date().toLocaleDateString('ko-KR'),
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    posts.unshift(newPost);

    try {
      localStorage.setItem('familyPosts', JSON.stringify(posts));
      alert('글이 등록되었습니다! ✨');
      router.push('/essays');
    } catch (err) {
      alert('저장 공간이 부족합니다. 사진 수를 줄여주세요.');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">
            ← 대시보드
          </Link>
          <h1 className="text-lg font-bold text-gray-800">✏️ 글쓰기</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 작성자 표시 */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <p className="text-sm text-gray-600">
              {user.emoji} <strong>{user.name}</strong>(으)로 글쓰기
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* 제목 */}
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-6 py-4 text-xl font-bold text-gray-800 placeholder-gray-300 border-b focus:outline-none"
            />

            {/* 내용 */}
            <textarea
              placeholder="내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-6 py-4 text-gray-700 placeholder-gray-300 focus:outline-none resize-none"
              rows={10}
            />

            {/* 이미지 업로드 영역 */}
            <div className="px-6 py-4 border-t border-dashed border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">
                  📷 사진 첨부 ({images.length}/5)
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  + 사진 추가
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* 이미지 미리보기 */}
              {images.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`첨부 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                  <p className="text-3xl mb-2">🖼️</p>
                  <p className="text-sm text-gray-400">
                    사진을 추가해보세요 (최대 5장)
                  </p>
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl text-gray-500 hover:bg-gray-100"
              >
                취소
              </Link>
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors"
              >
                🚀 등록하기
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}