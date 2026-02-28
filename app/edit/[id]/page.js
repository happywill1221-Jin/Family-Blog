'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

let _c = 0;
const uid = () => `b${Date.now()}_${_c++}`;

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const MAX = 800;
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
}

/* ── 기존 content를 블록으로 파싱 ── */
function parseToBlocks(content, images) {
  if (!content) return [{ id: uid(), type: 'text', value: '' }];

  const hasMarkers = /\[IMG:\d+\]/.test(content);

  if (hasMarkers) {
    const blocks = [];
    const regex = /\[IMG:(\d+)\]/g;
    let last = 0, m;
    while ((m = regex.exec(content)) !== null) {
      const txt = content.slice(last, m.index).replace(/^\n+|\n+$/g, '');
      blocks.push({ id: uid(), type: 'text', value: txt });
      blocks.push({ id: uid(), type: 'image', imageIndex: parseInt(m[1]) });
      last = regex.lastIndex;
    }
    blocks.push({ id: uid(), type: 'text', value: content.slice(last).replace(/^\n+|\n+$/g, '') });
    return blocks;
  }

  // 이미지는 있는데 마커가 없는 경우 → 끝에 배치
  if (images && images.length > 0) {
    const blocks = [{ id: uid(), type: 'text', value: content }];
    for (let i = 0; i < images.length; i++) {
      blocks.push({ id: uid(), type: 'image', imageIndex: i });
      blocks.push({ id: uid(), type: 'text', value: '' });
    }
    return blocks;
  }

  return [{ id: uid(), type: 'text', value: content }];
}

export default function EditPage() {
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [images, setImages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);
  const insertInfoRef = useRef(null);
  const lastFocusedRef = useRef(0); // 마지막으로 포커스된 텍스트 블록 인덱스
  const router = useRouter();
  const { id: postId } = useParams();

  useEffect(() => {
    const saved = localStorage.getItem('familyUser');
    if (!saved) return router.push('/login');
    setUser(JSON.parse(saved));
    fetchPost();
  }, []);

  useEffect(() => {
    document.querySelectorAll('[data-grow]').forEach(el => {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    });
  }, [blocks]);

  async function fetchPost() {
    const { data, error } = await supabase
      .from('posts').select('*').eq('id', postId).single();
    if (error || !data) { alert('글을 찾을 수 없습니다.'); return router.push('/essays'); }
    setTitle(data.title || '');
    setImages(data.images || []);
    setBlocks(parseToBlocks(data.content, data.images));
    setLoading(false);
  }

  function setBlockValue(i, v) {
    setBlocks(b => b.map((bl, idx) => idx === i ? { ...bl, value: v } : bl));
  }

  /* ── 텍스트 블록의 커서 위치에 사진 삽입 ── */
  function triggerInsert(textBlockIndex) {
    const ta = document.querySelector(`[data-bidx="${textBlockIndex}"]`);
    const pos = ta ? ta.selectionStart : (blocks[textBlockIndex]?.value?.length || 0);
    insertInfoRef.current = { textBlockIndex, cursorPos: pos };
    fileRef.current?.click();
  }

  /* ── 상단 툴바에서 사진 추가 클릭 ── */
  function triggerToolbarInsert() {
    // 마지막으로 포커스된 텍스트 블록 사용
    const idx = lastFocusedRef.current;
    const textBlocks = blocks.map((b, i) => ({ ...b, i })).filter(b => b.type === 'text');
    const target = textBlocks.find(b => b.i === idx) || textBlocks[0];
    if (!target) return;
    triggerInsert(target.i);
  }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const info = insertInfoRef.current;
    if (!info) return;

    const { textBlockIndex, cursorPos } = info;
    const block = blocks[textBlockIndex];
    if (!block || block.type !== 'text') return;

    if (images.length + files.length > 10) { alert('최대 10장'); return; }

    const before = (block.value || '').slice(0, cursorPos).trimEnd();
    const after = (block.value || '').slice(cursorPos).trimStart();

    const ni = [...images];
    const parts = [{ id: block.id, type: 'text', value: before }];

    for (const f of files) {
      if (ni.length >= 10) break;
      if (f.size > 10 * 1024 * 1024) continue;
      const compressed = await compressImage(f);
      parts.push({ id: uid(), type: 'image', imageIndex: ni.length });
      ni.push(compressed);
      parts.push({ id: uid(), type: 'text', value: '' });
    }
    parts[parts.length - 1].value = after;

    const nb = [...blocks];
    nb.splice(textBlockIndex, 1, ...parts);

    setImages(ni);
    setBlocks(nb);
    insertInfoRef.current = null;
    e.target.value = '';
  }

  function removeImage(blockIndex) {
    const imgIdx = blocks[blockIndex].imageIndex;
    const nb = [...blocks];
    nb.splice(blockIndex, 1);

    // 인접 텍스트 블록 합치기
    const merged = [];
    for (const b of nb) {
      if (b.type === 'text' && merged.length && merged[merged.length - 1].type === 'text') {
        merged[merged.length - 1].value =
          [merged[merged.length - 1].value, b.value].filter(Boolean).join('\n');
      } else {
        merged.push({ ...b });
      }
    }
    if (!merged.length) merged.push({ id: uid(), type: 'text', value: '' });

    const ni = images.filter((_, i) => i !== imgIdx);
    setImages(ni);
    setBlocks(merged.map(b =>
      b.type === 'image' && b.imageIndex > imgIdx
        ? { ...b, imageIndex: b.imageIndex - 1 }
        : b
    ));
  }

  function toContent() {
    return blocks.map(b => b.type === 'image' ? `[IMG:${b.imageIndex}]` : b.value).join('\n').trim();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const content = toContent();
    if (!title.trim() || !content) { alert('제목과 내용을 입력해주세요.'); return; }
    setSubmitting(true);
    const { error } = await supabase
      .from('posts').update({ title: title.trim(), content, images }).eq('id', postId);
    if (error) { alert('수정 실패: ' + error.message); setSubmitting(false); }
    else { alert('수정 완료! ✨'); router.push('/essays'); }
  }

  if (!user || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>⏳ 불러오는 중...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/essays" className="text-gray-500 text-sm">← 목록</Link>
          <h1 className="font-bold text-gray-800">✏️ 글 수정</h1>
          <span className="text-[10px] text-red-400 font-mono">v5</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* 제목 */}
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="제목"
              className="w-full px-6 py-4 text-xl font-bold border-b focus:outline-none"
            />

            {/* ★★★ 상단 사진 추가 툴바 ★★★ */}
            <div className="px-6 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                📷 {images.length}/10장 · 원하는 위치를 터치 후 버튼 클릭
              </div>
              <button
                type="button"
                onClick={triggerToolbarInsert}
                disabled={images.length >= 10}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors whitespace-nowrap flex items-center gap-1 shrink-0"
              >
                📷 사진 추가
              </button>
            </div>

            {/* ★★★ 블록 에디터 ★★★ */}
            <div className="px-6 py-4 min-h-[250px]">
              {blocks.map((block, idx) => (
                <div key={block.id}>
                  {block.type === 'text' ? (
                    <>
                      <textarea
                        data-grow
                        data-bidx={idx}
                        value={block.value}
                        onFocus={() => { lastFocusedRef.current = idx; }}
                        onChange={e => {
                          setBlockValue(idx, e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        placeholder={idx === 0 ? '내용을 입력하세요...' : '계속 작성...'}
                        className="w-full resize-none focus:outline-none text-gray-700 leading-relaxed"
                        style={{ minHeight: '40px' }}
                      />

                      {/* 인라인 사진 삽입 버튼 */}
                      {images.length < 10 && (
                        <button
                          type="button"
                          onClick={() => triggerInsert(idx)}
                          className="w-full my-3 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                        >
                          <span>📷</span>
                          <span>여기에 사진 추가</span>
                        </button>
                      )}
                    </>
                  ) : (
                    /* 이미지 블록 */
                    <div className="relative my-4">
                      {images[block.imageIndex] ? (
                        <img
                          src={images[block.imageIndex]}
                          alt=""
                          className="w-full max-w-md mx-auto rounded-xl border shadow-sm"
                        />
                      ) : (
                        <div className="h-24 bg-red-50 rounded-xl flex items-center justify-center text-red-400 border border-red-200 text-sm">
                          ⚠️ 이미지 없음
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                      >✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

            {/* 하단 버튼 */}
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <Link href="/essays" className="px-6 py-3 rounded-xl text-gray-500 hover:bg-gray-100">취소</Link>
              <button
                type="submit" disabled={submitting}
                className={`px-8 py-3 rounded-xl text-white font-bold ${submitting ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {submitting ? '⏳ 수정 중...' : '✅ 수정 완료'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}