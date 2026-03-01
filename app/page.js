'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [essays, setEssays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
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
        const q = query(
          collection(db, 'essays'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setEssays(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('에세이 불러오기 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchEssays();

    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [router]);

  const getGreeting = () => {
    const h = now.getHours();
    if (h < 6) return '고요한 밤이에요';
    if (h < 12) return '좋은 아침이에요';
    if (h < 18) return '좋은 오후예요';
    return '편안한 저녁이에요';
  };

  const formatDate = () =>
    now.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });

  const getThumbnail = (essay) => {
    if (!essay.blocks || essay.blocks.length === 0) return null;
    const img = essay.blocks.find(b => b.type === 'image');
    return img?.url || null;
  };

  const getPreview = (essay) => {
    if (!essay.blocks || essay.blocks.length === 0) return '';
    const txt = essay.blocks.find(b => b.type === 'text');
    const content = txt?.content || '';
    return content.length > 80 ? content.slice(0, 80) + '…' : content;
  };

  const formatEssayDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🏠</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            우리 가족
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/change-password"
            style={{
              background: 'none', border: '1px solid var(--border)',
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              fontSize: 13, color: 'var(--text-secondary)',
              textDecoration: 'none', transition: 'var(--transition)',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            🔒 비밀번호 변경
          </Link>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid var(--border)',
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
              transition: 'var(--transition)', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            로그아웃
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* 인사 섹션 */}
        <section style={{
          background: 'var(--gradient-hero)',
          borderRadius: 'var(--radius-2xl)',
          padding: '48px 40px', color: 'white',
          position: 'relative', overflow: 'hidden',
          marginBottom: 32,
          animation: 'slideUp 0.7s ease',
          boxShadow: '0 12px 40px rgba(45,52,54,0.2)',
        }}>
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />
          <div style={{
            position: 'absolute', bottom: -60, right: 60,
            width: 150, height: 150, borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{user.emoji}</div>
            <h1 style={{
              fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 900,
              marginBottom: 8, lineHeight: 1.3, letterSpacing: '-0.02em',
            }}>
              {getGreeting()},<br />{user.name}!
            </h1>
            <p style={{ opacity: 0.7, fontSize: 15, fontWeight: 300 }}>
              {formatDate()}
            </p>
          </div>
        </section>

        {/* 통계 & 빠른 액션 */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16, marginBottom: 40,
          animation: 'slideUp 0.7s ease 0.1s both',
        }}>
          {[
            { icon: '📖', label: '전체 에세이', value: `${essays.length}편`, action: () => router.push('/essays') },
            { icon: '✏️', label: '새 글 쓰기', value: '이야기를 남겨요', action: () => router.push('/essays/new') },
            { icon: '👨‍👩‍👧‍👦', label: '우리 가족', value: '4명', action: null },
          ].map((item, i) => (
            <div
              key={i}
              onClick={item.action || undefined}
              onMouseEnter={() => setHoveredCard(`stat-${i}`)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: 'var(--card)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px 20px',
                border: '1px solid var(--border)',
                boxShadow: hoveredCard === `stat-${i}` ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                cursor: item.action ? 'pointer' : 'default',
                transition: 'var(--transition)',
                transform: hoveredCard === `stat-${i}` ? 'translateY(-4px)' : 'none',
              }}
            >
              <span style={{ fontSize: 32 }}>{item.icon}</span>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, fontWeight: 500 }}>
                {item.label}
              </p>
              <p style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                {item.value}
              </p>
            </div>
          ))}
        </section>

        {/* 최근 에세이 */}
        <section style={{ animation: 'slideUp 0.7s ease 0.2s both' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 20,
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>📚 최근 에세이</h2>
            <button
              onClick={() => router.push('/essays')}
              style={{
                background: 'none', border: 'none', color: 'var(--primary)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              전체보기 →
            </button>
          </div>

          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-xl)' }} />
              ))}
            </div>
          ) : essays.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: 'var(--card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>📝</p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                아직 작성된 에세이가 없어요
              </p>
              <button
                onClick={() => router.push('/essays/new')}
                style={{
                  background: 'var(--gradient)', color: 'white', border: 'none',
                  padding: '12px 28px', borderRadius: 'var(--radius-full)',
                  fontWeight: 600, cursor: 'pointer', fontSize: 15,
                  fontFamily: 'inherit', boxShadow: 'var(--shadow-glow)',
                }}
              >
                첫 글 쓰러가기 ✏️
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}>
              {essays.slice(0, 6).map((essay, i) => {
                const thumb = getThumbnail(essay);
                return (
                  <div
                    key={essay.id}
                    onClick={() => router.push(`/essays/${essay.id}`)}
                    onMouseEnter={() => setHoveredCard(essay.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      background: 'var(--card)',
                      borderRadius: 'var(--radius-xl)',
                      overflow: 'hidden', cursor: 'pointer',
                      border: '1px solid var(--border)',
                      boxShadow: hoveredCard === essay.id ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                      transform: hoveredCard === essay.id ? 'translateY(-6px)' : 'none',
                      transition: 'var(--transition)',
                      animation: `slideUp 0.6s ease ${0.05 * i}s both`,
                    }}
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
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 12, color: 'var(--text-light)',
                      }}>
                        <span style={{ fontSize: 16 }}>{essay.authorEmoji || '👤'}</span>
                        <span style={{ fontWeight: 500 }}>{essay.author}</span>
                        <span>·</span>
                        <span>{formatEssayDate(essay.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}