'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove,
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { getCategoryById } from '@/lib/categories';

export default function PostDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // null = 글 삭제, commentId = 댓글 삭제

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    setUser(JSON.parse(saved));

    /* ── 글 실시간 구독 (getDoc 대신 onSnapshot) ── */
    const postRef = doc(db, 'posts', id);
    const unsubPost = onSnapshot(postRef, (snap) => {
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() });
      } else {
        setPost(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Post snapshot error, falling back to getDoc:', error);
      // onSnapshot 실패 시 getDoc으로 재시도
      getDoc(postRef).then((snap) => {
        if (snap.exists()) {
          setPost({ id: snap.id, ...snap.data() });
        } else {
          setPost(null);
        }
      }).catch((e) => {
        console.error('getDoc also failed:', e);
        setPost(null);
      }).finally(() => {
        setLoading(false);
      });
    });

    /* ── 댓글 실시간 구독 ── */
    const commentsQuery = query(
      collection(db, 'posts', id, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsubComments = onSnapshot(commentsQuery, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {
      // orderBy 인덱스 없을 경우 fallback
      const fallbackQuery = query(collection(db, 'posts', id, 'comments'));
      onSnapshot(fallbackQuery, (snap) => {
        const sorted = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() || 0;
            const tb = b.createdAt?.toMillis?.() || 0;
            return ta - tb;
          });
        setComments(sorted);
      });
    });

    return () => {
      unsubPost();
      unsubComments();
    };
  }, [id]);

  const handleLike = async () => {
    if (!user || !post) return;
    try {
      const ref = doc(db, 'posts', id);
      const arr = post.likes || [];
      if (arr.includes(user.id)) {
        await updateDoc(ref, { likes: arrayRemove(user.id) });
      } else {
        await updateDoc(ref, { likes: arrayUnion(user.id) });
      }
      // onSnapshot이 자동으로 post 상태를 갱신하므로 수동 setPost 불필요
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'posts', id));
      router.push('/');
    } catch (e) { console.error(e); }
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'posts', id, 'comments'), {
        text: commentText.trim(),
        author: user.name,
        emoji: user.emoji,
        authorId: user.id,
        createdAt: serverTimestamp()
      });
      setCommentText('');
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId) => {
    try { await deleteDoc(doc(db, 'posts', id, 'comments', commentId)); }
    catch (e) { console.error(e); }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  /* ── 커스텀 확인 다이얼로그 (alert/confirm 대체) ── */
  const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      padding: '20px'
    }} onClick={onCancel}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '28px',
        maxWidth: '340px', width: '100%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>
        <p style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</p>
        <p style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '24px', lineHeight: '1.6' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '12px', borderRadius: '12px',
            border: 'none', background: '#f0f0f0', color: '#666',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer'
          }}>취소</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '12px', borderRadius: '12px',
            border: 'none', background: '#e74c3c', color: 'white',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer'
          }}>삭제</button>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f0f2f5'
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '40px', marginBottom: '12px' }}>📖</p>
        <p style={{ fontSize: '16px', color: '#999' }}>글을 불러오는 중...</p>
      </div>
    </div>
  );

  if (!post) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#f0f2f5'
    }}>
      <p style={{ fontSize: '48px', marginBottom: '12px' }}>😢</p>
      <p style={{ color: '#999', marginBottom: '20px' }}>글을 찾을 수 없습니다</p>
      <Link href="/" style={{
        color: '#667eea', textDecoration: 'none', fontWeight: '600',
        padding: '10px 24px', background: 'white', borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>← 홈으로 돌아가기</Link>
    </div>
  );

  const likesArr = post.likes || [];
  const isLiked = user && likesArr.includes(user.id);
  const isAuthor = user && user.id === post.authorId;
  const cat = getCategoryById(post.category);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>

      {/* ── 삭제 확인 다이얼로그 ── */}
      {showDeleteConfirm && (
        <ConfirmDialog
          message={deleteTarget ? '이 댓글을 삭제하시겠습니까?' : '이 글을 정말 삭제하시겠습니까?\n댓글도 모두 삭제됩니다.'}
          onConfirm={() => {
            if (deleteTarget) {
              handleDeleteComment(deleteTarget);
            } else {
              handleDelete();
            }
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
          }}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
          }}
        />
      )}

      {/* ── 헤더 ── */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px 20px', color: 'white'
      }}>
        <div style={{
          maxWidth: '700px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <Link href="/" style={{
            color: 'white', textDecoration: 'none',
            fontSize: '15px', fontWeight: '600'
          }}>← 홈</Link>
          <span style={{ fontSize: '14px' }}>{user?.emoji} {user?.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 16px' }}>
        {/* ── 글 본문 ── */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '32px 28px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '20px'
        }}>
          {/* 카테고리 태그 */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '5px 14px', borderRadius: '20px',
            background: cat.bg, color: cat.color,
            fontSize: '13px', fontWeight: '700', marginBottom: '16px'
          }}>
            {cat.emoji} {cat.label}
          </div>

          <h1 style={{
            margin: '0 0 16px', fontSize: '24px', fontWeight: '800',
            color: '#1a1a2e', lineHeight: '1.4'
          }}>
            {post.title}
          </h1>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '24px', paddingBottom: '20px',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: '#f0f2f5', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '22px'
            }}>
              {post.emoji}
            </div>
            <div>
              <Link href={`/profile/${post.authorId}`} style={{
                textDecoration: 'none', color: '#667eea',
                fontWeight: '700', fontSize: '15px'
              }}>{post.author}</Link>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#aaa' }}>
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          <div style={{
            fontSize: '15px', lineHeight: '1.85', color: '#333',
            whiteSpace: 'pre-wrap'
          }}>
            {post.content}
          </div>

          {/* ── 좋아요 & 액션 ── */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #f0f0f0'
          }}>
            <button onClick={handleLike} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '28px',
              background: isLiked ? '#fff0f0' : '#f8f8f8',
              border: isLiked ? '2px solid #ffcccc' : '2px solid #eee',
              cursor: 'pointer', fontSize: '15px', transition: 'all 0.25s'
            }}>
              <span>{isLiked ? '❤️' : '🤍'}</span>
              <span style={{ fontWeight: '700', color: isLiked ? '#e74c3c' : '#999' }}>
                {likesArr.length > 0 ? `${likesArr.length}명 좋아요` : '좋아요'}
              </span>
            </button>

            {isAuthor && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href={`/post/${id}/edit`} style={{
                  padding: '10px 18px', borderRadius: '10px',
                  background: '#f0f2f5', color: '#667eea',
                  textDecoration: 'none', fontSize: '13px', fontWeight: '600'
                }}>✏️ 수정</Link>
                <button onClick={() => {
                  setDeleteTarget(null);
                  setShowDeleteConfirm(true);
                }} style={{
                  padding: '10px 18px', borderRadius: '10px',
                  background: '#fff0f0', color: '#e74c3c',
                  border: 'none', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer'
                }}>🗑 삭제</button>
              </div>
            )}
          </div>
        </div>

        {/* ── 댓글 ── */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '28px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '700' }}>
            💬 댓글 {comments.length > 0 && `(${comments.length})`}
          </h3>

          {/* 댓글 입력 */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#f0f2f5', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '18px', flexShrink: 0
            }}>
              {user?.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <textarea value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="댓글을 남겨보세요..."
                rows={2}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '2px solid #e8e8e8', borderRadius: '12px',
                  fontSize: '14px', resize: 'none', outline: 'none',
                  boxSizing: 'border-box', lineHeight: '1.6',
                  transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#667eea'}
                onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleComment();
                  }
                }}
              />
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <button onClick={handleComment}
                  disabled={submitting || !commentText.trim()}
                  style={{
                    padding: '8px 20px', borderRadius: '10px', border: 'none',
                    background: commentText.trim()
                      ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#e8e8e8',
                    color: commentText.trim() ? 'white' : '#bbb',
                    fontSize: '13px', fontWeight: '600',
                    cursor: commentText.trim() ? 'pointer' : 'default'
                  }}>
                  {submitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </div>
          </div>

          {/* 댓글 목록 */}
          {comments.length === 0 ? (
            <p style={{
              textAlign: 'center', color: '#ccc',
              fontSize: '14px', padding: '20px 0'
            }}>
              아직 댓글이 없습니다. 첫 댓글을 남겨보세요! 💬
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {comments.map(c => (
                <div key={c.id} style={{
                  display: 'flex', gap: '12px', padding: '14px',
                  background: '#fafafa', borderRadius: '14px'
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'white', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '17px', flexShrink: 0,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }}>
                    {c.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <Link href={`/profile/${c.authorId}`} style={{
                        textDecoration: 'none', color: '#667eea',
                        fontWeight: '700', fontSize: '13px'
                      }}>{c.author}</Link>
                      <span style={{ fontSize: '11px', color: '#ccc' }}>
                        {formatDate(c.createdAt)}
                      </span>
                      {user && user.id === c.authorId && (
                        <button onClick={() => {
                          setDeleteTarget(c.id);
                          setShowDeleteConfirm(true);
                        }} style={{
                          background: 'none', border: 'none', color: '#ddd',
                          cursor: 'pointer', fontSize: '12px', marginLeft: 'auto'
                        }}>삭제</button>
                      )}
                    </div>
                    <p style={{
                      margin: 0, fontSize: '14px', color: '#444',
                      lineHeight: '1.6', whiteSpace: 'pre-wrap'
                    }}>
                      {c.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}