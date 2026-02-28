'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

let blockId = 0;
const newId = () => `b-${Date.now()}-${blockId++}`;

// content 문자열 → 블록 배열 변환
const contentToBlocks = (text, imgs) => {
  if (!text) return [{ id: newId(), type: 'text', value: '' }];
  const hasMarkers = /\[IMG:\d+\]/.test(text);

  if (hasMarkers) {
    const parts = text.split(/(\[IMG:\d+\])/g);
    const result = [];
    for (const part of parts) {
      const m = part.match(/\[IMG:(\d+)\]/);
      if (m) {
        result.push({ id: newId(), type: 'image', imageIndex: parseInt(m[1]) });
      } else if (part) {
        result.push({ id: newId(), type: 'text', value: part });
      }
    }
    if (result.length === 0) result.push({ id: newId(), type: 'text', value: '' });
    if (result[result.length - 1].type !== 'text') {
      result.push({ id: newId(), type: 'text', value: '' });
    }
    return result;
  }

  // 마커 없는 기존 글 → 텍스트 + 이미지 블록으로
  const result = [{ id: newId(), type: 'text', value: text }];
  if (imgs && imgs.length > 0) {
    for (let i = 0; i < imgs.length; i++) {
      result.push({ id: newId(), type: 'image', imageIndex: i });
      result.push({ id: newId(), type: 'text', value: '' });
    }
  }
  return result;
};

export default function EditPage() {
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [images, setImages] = useState([]);
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const insertAfterRef = useRef(0);
  const router = useRouter();
  const params = useParams();
  const postId = params.id;

  useEffect(() => {
    const saved = localStorage.getItem('familyUser');
    if (!saved) { router.push('/login'); return; }
    setUser(JSON.parse(saved));
    fetchPost();
  }, []);

  useEffect(() => {
    document.querySelectorAll('[data-auto]').forEach((el) => {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    });
  }, [blocks]);

  const fetchPost = async () => {
    const { data, error } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (error || !data) { alert('글을 찾을 수 없습니다.'); router.push('/essays'); return; }
    setTitle(data.title || '');
    setImages(data.images || []);
    setBlocks(contentToBlocks(data.content, data.images));
    setLoading(false);
  };

  const compressImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let w = img.width, h = img.height;
          if (w > MAX) { h = (h * MAX) / w; w = MAX; }
          if (h > MAX) { w = (w * MAX) / h; h = MAX; }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

  const handleAddImage = (afterIndex) => {
    insertAfterRef.current = afterIndex;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (images.length + files.length > 10) { alert('사진은 최대 10장까지'); return; }
    const afterIndex = insertAfterRef.current;
    let newBlocks = [...blocks];
    let newImages = [...images];
    let pos = afterIndex + 1;

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) continue;
      const compressed = await compressImage(file);
      const imgIdx = newImages.length;
      newImages.push(compressed);
      newBlocks.splice(pos, 0,
        { id: newId(), type: 'image', imageIndex: imgIdx },
        { id: newId(), type: 'text', value: '' }
      );
      pos += 2;
    }
    setImages(newImages);
    setBlocks(newBlocks);
    e.target.value = '';
  };

  const updateText = (index, value) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, value } : b)));
  };

  const removeImageBlock = (blockIndex) => {
    const removedIdx = blocks[blockIndex].imageIndex;
    let newBlocks = blocks.filter((_, i) => i !== blockIndex);

    const merged = [];
    for (const b of newBlocks) {
      if (b.type === 'text' && merged.length > 0 && merged[merged.length - 1].type === 'text') {
        merged[merged.length - 1] = {
          ...merged[merged.length - 1],
          value: (merged[merged.length - 1].value + '\n' + b.value).replace(/^\n+|\n+$/g, ''),
        };
      } else {
        merged.push({ ...b });
      }
    }
    if (merged.length === 0) merged.push({ id: newId(), type: 'text', value: '' });

    const newImages = images.filter((_, i) => i !== removedIdx);
    const reindexed = merged.map((b) =>
      b.type === 'image' && b.imageIndex > removedIdx
        ? { ...b, imageIndex: b.imageIndex - 1 }
        : b
    );
    setImages(newImages);
    setBlocks(reindexed);
  };

  const blocksToContent = () =>
    blocks.map((b) => (b.type === 'image' ? `[IMG:${b.imageIndex}]` : b.value)).join('\n').trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = blocksToContent();
    if (!title.trim() || !content) { alert('제목과 내용을 입력해주세요.'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('posts').update({ title: title.trim(), content, images }).eq('id', postId);
    if (error) {
      alert('수정 실패: ' + error.message);
      setSubmitting(false);
    } else {
      alert('글이 수정되었습니다! ✨');
      router.push('/essays');
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-lg">⏳ 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/essays" className="text-gray-500 hover:text-gray-700 text-sm">← 에세이</Link>
          <h1 className="text-lg font-bold text-gray-800">✏️ 글 수정</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
            <p className="text-sm text-gray-600">📝 글 수정 모드</p>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-6 py-4 text-xl font-bold text-gray-800 placeholder-gray-300 border-b focus:outline-none"
            />

            <div className="px-6 py-2 border-b bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">📷 글 사이에 사진을 자유롭게 삽입하세요</p>
              <span className="text-xs text-gray-400">사진 {images.length}/10</span>
            </div>

            {/* ★ 블록 에디터 ★ */}
            <div className="px-6 py-4 min-h-[300px]">
              {blocks.map((block, index) => (
                <div key={block.id}>
                  {block.type === 'text' ? (
                    <div>
                      <textarea
                        data-auto
                        value={block.value}
                        onChange={(e) => {
                          updateText(index, e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        placeholder={index === 0 ? '내용을 입력하세요...' : '계속 작성하세요...'}
                        className="w-full resize-none focus:outline-none text-gray-700 leading-relaxed overflow-hidden"
                        style={{ minHeight: '40px' }}
                      />
                      {images.length < 10 && (
                        <div className="flex justify-center my-3">
                          <button
                            type="button"
                            onClick={() => handleAddImage(index)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm text-blue-500 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors border border-blue-200 border-dashed"
                          >
                            📷 여기에 사진 추가
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative my-4 group">
                      <img
                        src={images[block.imageIndex]}
                        alt={`사진 ${block.imageIndex + 1}`}
                        className="w-full max-w-lg mx-auto rounded-xl border border-gray-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageBlock(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center shadow-lg opacity-70 hover:opacity-100 hover:bg-red-500 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelected} className="hidden" />

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <Link href="/essays" className="px-6 py-3 rounded-xl text-gray-500 hover:bg-gray-100">취소</Link>
              <button
                type="submit"
                disabled={submitting}
                className={`px-8 py-3 rounded-xl text-white font-bold transition-colors ${
                  submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {submitting ? '⏳ 수정 중...' : '✅ 수정 완료'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}