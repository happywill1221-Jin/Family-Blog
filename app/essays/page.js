'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';

export default function EssaysPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [essays, setEssays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('전체');
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(stored));

    const fetchEssays = async () => {
      try {
        const q = query(collection(db, 'essays'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setEssays(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('에세이 불러오기 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchEssays();
  }, [router]);

  const authors = ['전체', ...new Set(essays.map(e => e.author).filter(Boolean))];

  const filtered = essays.filter(e => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase());
    const matchAuthor = filterAuthor === '전체' || e.author === filterAuthor;
    return matchSearch && matchAuthor;
  });

  const handleDelete = async (essayId, essayAuthor) => {
    if (user.name !== essayAuthor) return;
    if (!window.confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      await deleteDoc(doc(db, 'essays', essayId));
      setEssays(prev => prev.filter(e => e.id !== essayId));
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const getThumbnail = (essay) => {
    if (!essay.blocks || essay.blocks.length === 0) return null;
    const img = essay.blocks.find(b => b.type === 'image');
    return img?.url || null;
  };

  const getPreview = (essay) => {
    if (!essay.blocks || essay.blocks.length === 0) return '';
    const txt = essay.blocks.find(b => b.type === 'text');
    const content = txt?.content || '';
    return content.length > 100 ? content.slice(0, 100) + '…' : content;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  if (!user) return null;

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
          onClick={() => router.push('/')}
          style={{
            background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontSize: 15, fontWeight: 600,
            color: 'var(--text)', fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: 20 }}>←</span> 홈
        </button>
        <button
          onClick={() => router.push('/essays/new')}
          style={{
            background: 'var(--gradient)', color: 'white', border: 'none',
            padding: '8px 20px', borderRadius: 'var(--radius-full)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: 'var(--shadow-glow)',
          }}
        >
          ✏️ 새 글 쓰기
        </button>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 32, animation: 'slideUp 0.6s ease' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
            📚 모든 에세이
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            우리 가족의 이야기 모음
          </p>
        </div>

        {/* 검색 & 필터 */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
          animation: 'slideUp 0.6s ease 0.1s both',
        }}>
          <input
            type="text"
            placeholder="제목으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
            style={{
              flex: 1, minWidth: 200,
              padding: '10px 16px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 14, outline: 'none',
              transition: 'var(--transition)',
              background: 'var(--card)',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {authors.map(a => (
              <button
                key={a}
                onClick={() => setFilterAuthor(a)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: filterAuthor === a ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: filterAuthor === a ? 'var(--primary)' : 'var(--card)',
                  color: filterAuthor === a ? 'white' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'var(--transition)',
                  fontFamily: 'inherit',
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* 에세이 목록 */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-xl)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--card)', borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              {search || filterAuthor !== '전체'
                ? '검색 결과가 없습니다'
                : '아직 작성된 에세이가 없어요'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
            animation: 'slideUp 0.6s ease 0.15s both',
          }}>
            {filtered.map((essay, i) => {
              const thumb = getThumbnail(essay);
              const isOwner = user.name === essay.author;
              return (
                <div
                  key={essay.id}
                  onMouseEnter={() => setHoveredCard(essay.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: 'var(--card)',
                    borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    boxShadow: hoveredCard === essay.id ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                    transform: hoveredCard === essay.id ? 'translateY(-4px)' : 'none',
                    transition: 'var(--transition)',
                    animation: `slideUp 0.5s ease ${0.03 * i}s both`,
                    position: 'relative',
                  }}
                >
                  <div
                    onClick={() => router.push(`/essays/${essay.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{
                      height: 160, overflow: 'hidden',
                      background: thumb
                        ? '#f5f5f5'
                        : `linear-gradient(135deg, ${['#E17055','#6C5CE7','#00B894','#FDCB6E'][i % 4]}22, ${['#FDCB6E','#A29BFE','#55EFC4','#E17055'][i % 4]}22)`,
                    }}>
                      {thumb ? (
                        <img src={thumb} alt="" style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          transition: 'var(--transition-slow)',
                          transform: hoveredCard === essay.id ? 'scale(1.05)' : 'scale(1)',
                        }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 48, opacity: 0.5,
                        }}>
                          📝
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '16px 20px 20px' }}>
                      <h3 style={{
                        fontSize: 16, fontWeight: 700, marginBottom: 6, lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {essay.title}
                      </h3>
                      <p style={{
                        fontSize: 13, color: 'var(--text-secondary)',
                        marginBottom: 12, lineHeight: 1.6,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {getPreview(essay)}
                      </p>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: 12, color: 'var(--text-light)',
                        }}>
                          <span style={{ fontSize: 16 }}>{essay.authorEmoji || '👤'}</span>
                          <span style={{ fontWeight: 500 }}>{essay.author}</span>
                          <span>·</span>
                          <span>{formatDate(essay.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 삭제 버튼 (본인 글만) */}
                  {isOwner && hoveredCard === essay.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(essay.id, essay.author);
                      }}
                      style={{
                        position: 'absolute', top: 12, right: 12,
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-full)',
                        width: 36, height: 36,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 16,
                        transition: 'var(--transition)',
                        animation: 'fadeIn 0.2s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FFF5F5'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; }}
                      title="삭제"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}