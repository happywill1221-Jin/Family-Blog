'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

export default function EssayDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(stored));

    const fetchEssay = async () => {
      try {
        const snap = await getDoc(doc(db, 'essays', id));
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setEssay({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error('에세이 불러오기 실패:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchEssay();
  }, [id, router]);

  /* ESC로 라이트박스 닫기 */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      await deleteDoc(doc(db, 'essays', id));
      router.push('/essays');
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return d.toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
      });
    } catch {
      return '';
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <nav style={{
          height: 64, borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 24px',
        }}>
          <div className="skeleton" style={{ width: 80, height: 20, borderRadius: 8 }} />
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>
          <div className="skeleton" style={{ height: 40, marginBottom: 16, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 40, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <span style={{ fontSize: 64 }}>😢</span>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>에세이를 찾을 수 없습니다</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          삭제되었거나 존재하지 않는 글입니다.
        </p>
        <button
          onClick={() => router.push('/essays')}
          style={{
            marginTop: 8,
            background: 'var(--gradient)', color: 'white', border: 'none',
            padding: '12px 28px', borderRadius: 'var(--radius-full)',
            fontWeight: 600, cursor: 'pointer', fontSize: 15,
            fontFamily: 'inherit',
          }}
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const isOwner = user.name === essay.author;
  const blocks = essay.blocks || [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* 네비게이션 */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(250,250,248,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: 'slideDown 0.6s ease',
      }}>
        <button
          onClick={() => router.push('/essays')}
          style={{
            background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontSize: 15, fontWeight: 600,
            color: 'var(--text)', fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: 20 }}>←</span> 목록
        </button>
        {isOwner && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => router.push(`/edit/${id}`)}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'var(--transition)', fontFamily: 'inherit',
              }}
            >
              ✏️ 수정
            </button>
            <button
              onClick={handleDelete}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'var(--transition)', color: 'var(--danger)',
                fontFamily: 'inherit',
              }}
            >
              🗑️ 삭제
            </button>
          </div>
        )}
      </nav>

      {/* 본문 */}
      <article style={{
        maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px',
        animation: 'slideUp 0.7s ease',
      }}>
        {/* 제목 */}
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 40px)',
          fontWeight: 900, lineHeight: 1.3,
          letterSpacing: '-0.02em', marginBottom: 16,
        }}>
          {essay.title}
        </h1>

        {/* 작성자 정보 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 40, paddingBottom: 24,
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{
            fontSize: 32, width: 48, height: 48,
            background: '#f5f5f5', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {essay.authorEmoji || '👤'}
          </span>
          <div>
            <p style={{ fontWeight: 600, fontSize: 15 }}>{essay.author}</p>
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
              {formatDate(essay.createdAt)}
            </p>
          </div>
        </div>

        {/* 블록 렌더링 */}
        {blocks.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--text-light)',
          }}>
            <p>내용이 없습니다.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {blocks.map((block) => {
              if (block.type === 'text') {
                return (
                  <div key={block.id} style={{
                    fontSize: 16, lineHeight: 1.9,
                    color: 'var(--text)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'keep-all',
                  }}>
                    {block.content}
                  </div>
                );
              }
              if (block.type === 'image') {
                return (
                  <figure key={block.id} style={{ margin: 0 }}>
                    <img
                      src={block.url}
                      alt={block.caption || ''}
                      onClick={() => setLightbox(block.url)}
                      style={{
                        width: '100%',
                        borderRadius: 'var(--radius-xl)',
                        cursor: 'zoom-in',
                        transition: 'var(--transition)',
                      }}
                    />
                    {block.caption && (
                      <figcaption style={{
                        textAlign: 'center',
                        fontSize: 13,
                        color: 'var(--text-light)',
                        marginTop: 8,
                      }}>
                        {block.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              }
              return null;
            })}
          </div>
        )}
      </article>

      {/* 라이트박스 */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.3s ease',
            cursor: 'zoom-out',
            padding: 20,
          }}
        >
          <img
            src={lightbox}
            alt=""
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              objectFit: 'contain', borderRadius: 8,
            }}
          />
        </div>
      )}
    </div>
  );
}