'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';

/* ── 썸네일용 그라데이션 팔레트 ── */
const PALETTES = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#fccb90', '#d57eeb'],
  ['#e0c3fc', '#8ec5fc'],
  ['#f6d365', '#fda085'],
  ['#89f7fe', '#66a6ff'],
];

const ICONS = ['📖','✏️','💡','🌟','🎵','🌈','🍀','🎨','💬','🏡','📝','🎯','📚','🌸','🎶','☀️','🦋','🌻','🍎','✨'];

function getThumbnail(postId) {
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    hash = postId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % PALETTES.length;
  const iconIdx = Math.abs(hash >> 3) % ICONS.length;
  return { gradient: PALETTES[idx], icon: ICONS[iconIdx] };
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [writing, setWriting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    setUser(JSON.parse(saved));

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {
      const q2 = query(collection(db, 'posts'));
      onSnapshot(q2, (snapshot) => {
        setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setWriting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        title: title.trim(),
        content: content.trim(),
        author: user.name,
        emoji: user.emoji,
        authorId: user.id,
        likes: [],
        createdAt: serverTimestamp()
      });
      setTitle(''); setContent(''); setShowForm(false);
    } catch (e) { console.error(e); alert('글 작성에 실패했습니다'); }
    finally { setWriting(false); }
  };

  const handleToggleLike = async (e, postId, currentLikes) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    try {
      const ref = doc(db, 'posts', postId);
      const arr = currentLikes || [];
      if (arr.includes(user.id)) {
        await updateDoc(ref, { likes: arrayRemove(user.id) });
      } else {
        await updateDoc(ref, { likes: arrayUnion(user.id) });
      }
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => { localStorage.removeItem('user'); router.push('/login'); };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - d;
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  const getReadTime = (text) => {
    if (!text) return '1분';
    const min = Math.max(1, Math.ceil(text.length / 200));
    return `${min}분`;
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* ── 헤더 ── */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 20px 28px', color: 'white'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', maxWidth: '860px', margin: '0 auto'
        }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>🏠 우리 가족 블로그</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link href="/family" style={{
              background: 'rgba(255,255,255,0.2)', color: 'white',
              padding: '8px 16px', borderRadius: '8px',
              textDecoration: 'none', fontSize: '14px'
            }}>👨‍👩‍👧‍👦 가족</Link>
            <span style={{ fontSize: '14px' }}>{user.emoji} {user.name}</span>
            <button onClick={handleLogout} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none',
              color: 'white', padding: '6px 12px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '12px'
            }}>로그아웃</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px' }}>

        {/* ── 글쓰기 버튼 ── */}
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{
            width: '100%', padding: '18px', marginBottom: '28px',
            background: 'white', border: '2px dashed #d0d5dd',
            borderRadius: '16px', fontSize: '15px', color: '#999',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.color = '#667eea'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#d0d5dd'; e.currentTarget.style.color = '#999'; }}
          >
            ✏️ 새 글 작성하기...
          </button>
        )}

        {/* ── 글쓰기 폼 ── */}
        {showForm && (
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px',
            marginBottom: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ margin: '0 0 18px', fontSize: '16px', fontWeight: '700' }}>
              ✏️ 새 글 작성
            </h3>
            <input type="text" placeholder="제목을 입력하세요" value={title}
              onChange={e => setTitle(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', marginBottom: '12px',
                border: '2px solid #e0e0e0', borderRadius: '12px',
                fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                transition: 'border 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#667eea'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
            <textarea placeholder="내용을 입력하세요" value={content}
              onChange={e => setContent(e.target.value)} rows={5}
              style={{
                width: '100%', padding: '14px 16px',
                border: '2px solid #e0e0e0', borderRadius: '12px',
                fontSize: '15px', resize: 'vertical', outline: 'none',
                boxSizing: 'border-box', lineHeight: '1.7', transition: 'border 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#667eea'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button onClick={handleSubmit} disabled={writing} style={{
                padding: '11px 28px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>{writing ? '작성 중...' : '✅ 작성하기'}</button>
              <button onClick={() => setShowForm(false)} style={{
                padding: '11px 28px', background: '#f0f0f0',
                color: '#666', border: 'none', borderRadius: '10px',
                fontSize: '14px', cursor: 'pointer'
              }}>취소</button>
            </div>
          </div>
        )}

        {/* ── 글 카드 목록 ── */}
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
            <p style={{ fontSize: '56px', marginBottom: '12px' }}>📝</p>
            <p style={{ fontSize: '15px' }}>아직 글이 없습니다. 첫 글을 작성해 보세요!</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
            gap: '20px'
          }}>
            {posts.map((post) => {
              const likesArr = post.likes || [];
              const isLiked = user && likesArr.includes(user.id);
              const likeCount = likesArr.length;
              const thumb = getThumbnail(post.id);

              return (
                <Link key={post.id} href={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'white', borderRadius: '20px', overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    transition: 'transform 0.25s, box-shadow 0.25s',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
                  >
                    {/* ── 썸네일 영역 ── */}
                    <div style={{
                      background: `linear-gradient(135deg, ${thumb.gradient[0]}, ${thumb.gradient[1]})`,
                      height: '130px', position: 'relative', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {/* 장식 원 */}
                      <div style={{
                        position: 'absolute', width: '180px', height: '180px',
                        borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
                        top: '-60px', right: '-40px'
                      }} />
                      <div style={{
                        position: 'absolute', width: '120px', height: '120px',
                        borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
                        bottom: '-50px', left: '-20px'
                      }} />
                      <div style={{
                        position: 'absolute', width: '80px', height: '80px',
                        borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                        top: '20px', left: '60%'
                      }} />

                      {/* 아이콘 */}
                      <span style={{
                        fontSize: '48px', zIndex: 1,
                        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))'
                      }}>{thumb.icon}</span>

                      {/* 읽기 시간 배지 */}
                      <div style={{
                        position: 'absolute', top: '12px', left: '12px',
                        background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)',
                        color: 'white', padding: '4px 10px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px'
                      }}>
                        🕐 {getReadTime(post.content)} 읽기
                      </div>

                      {/* 좋아요 배지 */}
                      {likeCount > 0 && (
                        <div style={{
                          position: 'absolute', top: '12px', right: '12px',
                          background: 'rgba(255,255,255,0.9)',
                          color: '#e74c3c', padding: '4px 10px', borderRadius: '20px',
                          fontSize: '12px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', gap: '3px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          ❤️ {likeCount}
                        </div>
                      )}

                      {/* 작성자 아바타 */}
                      <div style={{
                        position: 'absolute', bottom: '-20px', left: '20px',
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: 'white', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '22px', boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                        border: '3px solid white', zIndex: 2
                      }}>
                        {post.emoji}
                      </div>
                    </div>

                    {/* ── 본문 영역 ── */}
                    <div style={{ padding: '28px 20px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* 작성자 & 날짜 */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        marginBottom: '10px', paddingLeft: '36px'
                      }}>
                        <Link href={`/profile/${post.authorId}`}
                          onClick={e => e.stopPropagation()}
                          style={{
                            textDecoration: 'none', color: '#667eea',
                            fontWeight: '700', fontSize: '13px'
                          }}>
                          {post.author}
                        </Link>
                        <span style={{ color: '#d0d0d0', fontSize: '13px' }}>·</span>
                        <span style={{ color: '#bbb', fontSize: '12px' }}>
                          {formatDate(post.createdAt)}
                        </span>
                      </div>

                      {/* 제목 */}
                      <h3 style={{
                        margin: '0 0 8px', fontSize: '17px', fontWeight: '800',
                        color: '#1a1a2e', lineHeight: '1.4',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {post.title}
                      </h3>

                      {/* 미리보기 */}
                      <p style={{
                        margin: '0', fontSize: '13.5px', color: '#888',
                        lineHeight: '1.65', flex: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {post.content}
                      </p>

                      {/* 하단 액션 바 */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginTop: '16px',
                        paddingTop: '14px', borderTop: '1px solid #f0f0f0'
                      }}>
                        {/* 좋아요한 사람 아바타 */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {likesArr.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{ display: 'flex', marginRight: '8px' }}>
                                {likesArr.slice(0, 4).map((id, i) => {
                                  const emojiMap = { dad: '👨', mom: '👩', son: '👦', daughter: '👧' };
                                  return (
                                    <div key={id} style={{
                                      width: '24px', height: '24px', borderRadius: '50%',
                                      background: '#fff0f0', border: '2px solid white',
                                      display: 'flex', alignItems: 'center',
                                      justifyContent: 'center', fontSize: '12px',
                                      marginLeft: i > 0 ? '-6px' : '0',
                                      zIndex: 4 - i, position: 'relative'
                                    }}>
                                      {emojiMap[id] || '👤'}
                                    </div>
                                  );
                                })}
                              </div>
                              <span style={{ fontSize: '12px', color: '#bbb' }}>
                                {likeCount}명이 좋아해요
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#d0d0d0' }}>
                              첫 좋아요를 눌러보세요
                            </span>
                          )}
                        </div>

                        {/* 하트 버튼 */}
                        <button
                          onClick={e => handleToggleLike(e, post.id, post.likes)}
                          style={{
                            background: isLiked ? '#fff0f0' : '#f8f8f8',
                            border: isLiked ? '1.5px solid #ffcccc' : '1.5px solid #eee',
                            borderRadius: '24px', padding: '6px 14px',
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: '5px',
                            transition: 'all 0.25s', fontSize: '13px'
                          }}
                          onMouseEnter={e => {
                            if (!isLiked) { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.borderColor = '#ffd5d5'; }
                          }}
                          onMouseLeave={e => {
                            if (!isLiked) { e.currentTarget.style.background = '#f8f8f8'; e.currentTarget.style.borderColor = '#eee'; }
                          }}
                        >
                          <span style={{ fontSize: '16px', lineHeight: 1 }}>
                            {isLiked ? '❤️' : '🤍'}
                          </span>
                          {likeCount > 0 && (
                            <span style={{
                              fontWeight: '700', fontSize: '12px',
                              color: isLiked ? '#e74c3c' : '#bbb'
                            }}>
                              {likeCount}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}