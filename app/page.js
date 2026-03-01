'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';

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
    if (!saved) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(saved));

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(list);
    }, (error) => {
      console.error('글 로드 에러:', error);
      const q2 = query(collection(db, 'posts'));
      onSnapshot(q2, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setPosts(list);
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
      setTitle('');
      setContent('');
      setShowForm(false);
    } catch (error) {
      console.error(error);
      alert('글 작성에 실패했습니다');
    } finally {
      setWriting(false);
    }
  };

  const handleToggleLike = async (e, postId, currentLikes) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    try {
      const postRef = doc(db, 'posts', postId);
      const likesArray = currentLikes || [];
      if (likesArray.includes(user.id)) {
        await updateDoc(postRef, { likes: arrayRemove(user.id) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(user.id) });
      }
    } catch (error) {
      console.error('좋아요 에러:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return date.toLocaleDateString('ko-KR', {
      month: 'long', day: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', color: 'white'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px'
        }}>
          <h1 style={{ margin: 0, fontSize: '20px' }}>🏠 우리 가족 블로그</h1>
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

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {/* 글쓰기 버튼 */}
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{
            width: '100%', padding: '16px', marginBottom: '20px',
            background: 'white', border: '2px dashed #ddd',
            borderRadius: '16px', fontSize: '15px', color: '#999',
            cursor: 'pointer'
          }}>
            ✏️ 새 글 작성하기...
          </button>
        )}

        {/* 글쓰기 폼 */}
        {showForm && (
          <div style={{
            background: 'white', borderRadius: '16px', padding: '24px',
            marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>
              ✏️ 새 글 작성
            </h3>
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%', padding: '12px', marginBottom: '12px',
                border: '2px solid #e0e0e0', borderRadius: '10px',
                fontSize: '15px', outline: 'none', boxSizing: 'border-box'
              }}
            />
            <textarea
              placeholder="내용을 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              style={{
                width: '100%', padding: '12px',
                border: '2px solid #e0e0e0', borderRadius: '10px',
                fontSize: '15px', resize: 'vertical', outline: 'none',
                boxSizing: 'border-box', lineHeight: '1.6'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button onClick={handleSubmit} disabled={writing} style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>{writing ? '작성 중...' : '✅ 작성하기'}</button>
              <button onClick={() => setShowForm(false)} style={{
                padding: '10px 24px', background: '#eee',
                color: '#666', border: 'none', borderRadius: '10px',
                fontSize: '14px', cursor: 'pointer'
              }}>취소</button>
            </div>
          </div>
        )}

        {/* 글 목록 */}
        {posts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px', color: '#aaa'
          }}>
            <p style={{ fontSize: '48px' }}>📝</p>
            <p>아직 글이 없습니다. 첫 글을 작성해 보세요!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {posts.map((post) => {
              const likesArray = post.likes || [];
              const isLiked = user && likesArray.includes(user.id);
              const likeCount = likesArray.length;

              return (
                <Link key={post.id} href={`/post/${post.id}`}
                  style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'white', borderRadius: '16px',
                    padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'transform 0.2s', cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          margin: '0 0 8px', fontSize: '17px',
                          fontWeight: '700', color: '#333'
                        }}>
                          {post.title}
                        </h3>
                        <p style={{
                          margin: '0 0 12px', fontSize: '14px',
                          color: '#888', lineHeight: '1.5',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {post.content}
                        </p>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', fontSize: '13px', color: '#aaa'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Link href={`/profile/${post.authorId}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            textDecoration: 'none', color: '#667eea',
                            fontWeight: '600', fontSize: '13px'
                          }}>
                          {post.emoji} {post.author}
                        </Link>
                        <span style={{ color: '#ccc' }}>{formatDate(post.createdAt)}</span>
                      </div>

                      {/* ★ 하트 버튼 */}
                      <button
                        onClick={(e) => handleToggleLike(e, post.id, post.likes)}
                        style={{
                          background: 'none', border: 'none',
                          cursor: 'pointer', padding: '4px 8px',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          fontSize: '14px', borderRadius: '20px',
                          transition: 'background 0.2s',
                          color: isLiked ? '#e74c3c' : '#ccc'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fff0f0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <span style={{ fontSize: '18px' }}>
                          {isLiked ? '❤️' : '🤍'}
                        </span>
                        {likeCount > 0 && (
                          <span style={{
                            fontSize: '13px', fontWeight: '600',
                            color: isLiked ? '#e74c3c' : '#bbb'
                          }}>
                            {likeCount}
                          </span>
                        )}
                      </button>
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