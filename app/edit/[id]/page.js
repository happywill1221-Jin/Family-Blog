'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function EditPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const cursorPosRef = useRef(0);
  const router = useRouter();
  const params = useParams();
  const postId = params.id;

  useEffect(() => {
    const saved = localStorage.getItem('familyUser');
    if (!saved) { router.push('/login'); return; }
    setUser(JSON.parse(saved));
    fetchPost();
  }, []);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();
    if (error || !data) {
      alert('글을 찾을 수 없습니다.');
      router.push('/essays');
      return;
    }
    setTitle(data.title || '');
    setContent(data.content || '');
    setImages(data.images || []);
    setLoading(false);
  };

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
          if (width > MAX_WIDTH) { height = (height * MAX_WIDTH) / width; width = MAX_WIDTH; }
          if (height > MAX_HEIGHT) { width = (width * MAX_HEIGHT) / height; height = MAX_HEIGHT; }
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

  const handleToolbarImageClick = () => {
    const textarea = textareaRef.current;
    if (textarea) cursorPosRef.current = textarea.selectionStart;
    fileInputRef.current?.click();
  };

  const handleInsertImage = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 10) {
      alert('사진은 최대 10장까지 추가할 수 있습니다.');
      return;
    }
    let cursorPos = cursorPosRef.current;
    let currentImages = [...images];
    let currentContent = content;
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name}의 용량이 너무 큽니다. (10MB 이하)`);
        continue;
      }
      const compressed = await compressImage(file);
      const newIndex = currentImages.length;
      currentImages.push(compressed);
      const marker = `\n[IMG:${newIndex}]\n`;
      currentContent = currentContent.substring(0, cursorPos) + marker + currentContent.substring(cursorPos);
      cursorPos += marker.length;
    }
    setImages(currentImages);
    setContent(currentContent);
    cursorPosRef.current = cursorPos;
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    let newContent = content;
    newContent = newContent.replace(new RegExp(`\\n?\\[IMG:${index}\\]\\n?`, 'g'), '\n');
    for (let i = index + 1; i < images.length; i++) {
      newContent = newContent.replace(new RegExp(`\\[IMG:${i}\\]`, 'g'), `[IMG:${i - 1}]`);
    }
    setImages(newImages);
    setContent(newContent.trim());
  };

  const renderPreview = () => {
    if (!content) return <p className="text-gray-400">내용이 없습니다</p>;
    const parts = content.split(/(\[IMG:\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[IMG:(\d+)\]/);
      if (match) {
        const idx = parseInt(match[1]);
        if (images[idx]) {
          return <img key={i} src={images[idx]} alt={`사진 ${idx + 1}`}
            className="w-full max-w-lg mx-auto rounded-xl my-4 border border-gray-200" />;
        }
        return null;
      }
      if (part.trim()) {
        return <p key={i} className="text-gray-700 leading-relaxed whitespace-pre-wrap">{part.trim()}</p>;
      }
      return null;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from('posts')
      .update({
        title: title.trim(),
        content: content.trim(),
        images: images,
      })
      .eq('id', postId);
    if (error) {
      alert('수정에 실패했습니다: ' + error.message);
      setSubmitting(false);
    } else {
      alert('글이 수정되었습니다! ✨');
      router.push('/essays');
    }
  };

  if (!user || loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">⏳ 불러오는 중...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/essays" className="text-gray-500 hover:text-gray-700 text-sm">← 에세이</Link>
          <h1 className="text-lg font-bold text-gray-800">✏️ 글 수정</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
            <p className="text-sm text-gray-600">📝 글 수정 모드</p>
          </div>

          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="제목을 입력하세요" value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-6 py-4 text-xl font-bold text-gray-800 placeholder-gray-300 border-b focus:outline-none" />

            <div className="px-6 py-2 border-b bg-gray-50 flex items-center gap-2">
              <button type="button" onClick={handleToolbarImageClick}
                className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1">
                📷 사진 삽입
              </button>
              <button type="button" onClick={() => setShowPreview(!showPreview)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  showPreview ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {showPreview ? '✏️ 편집' : '👁️ 미리보기'}
              </button>
              <span className="text-xs text-gray-400 ml-auto">사진 {images.length}/10</span>
              <input ref={fileInputRef} type="file" accept="image/*" multiple
                onChange={handleInsertImage} className="hidden" />
            </div>

            {showPreview ? (
              <div className="px-6 py-4 min-h-[300px]">{renderPreview()}</div>
            ) : (
              <textarea ref={textareaRef} placeholder="내용을 입력하세요..."
                value={content} onChange={(e) => setContent(e.target.value)}
                className="w-full px-6 py-4 text-gray-700 placeholder-gray-300 focus:outline-none resize-none"
                rows={12} />
            )}

            {images.length > 0 && (
              <div className="px-6 py-4 border-t border-dashed border-gray-200 bg-gray-50">
                <p className="text-sm font-medium text-gray-600 mb-3">📎 첨부된 사진 ({images.length}장)</p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group flex-shrink-0">
                      <img src={img} alt={`첨부 ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                      <button type="button" onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        ✕
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center rounded-b-lg">
                        IMG:{index}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <Link href="/essays" className="px-6 py-3 rounded-xl text-gray-500 hover:bg-gray-100">취소</Link>
              <button type="submit" disabled={submitting}
                className={`px-8 py-3 rounded-xl text-white font-bold transition-colors ${
                  submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
                }`}>
                {submitting ? '⏳ 수정 중...' : '✅ 수정 완료'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}