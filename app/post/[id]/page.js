'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  doc, getDoc, updateDoc, deleteDoc as deleteDocument,
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, deleteDoc
} from 'firebase/firestore';

export default function PostDetailPage() {
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(saved));
    fetchPost();
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;
    const q = query(
      collection(db, 'posts', params.id, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setComments(list);
    }, (error) => {
      console.error('댓글 로드 에러:', error);
      const q2 = query(collection(db, 'posts', params.id, 'comments'));
      onSnapshot(q2, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setComments(list);
      });
    });
    return () => unsubscribe();
  }, [params.id]);

  const fetchPost = async () => {
    try {
      const docRef = doc(db, 'posts', params.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 입력해주세요');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'posts', params.id), {
        title: editTitle.trim(),
        content: editContent.trim()
      });
      setPost({ ...post, title: editTitle.trim(), content: editContent.trim() });
      setIsEditing(false);
      alert('수정되었습니다!');
    } catch (error) {
      console.error(error);
      alert('수정에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('정말 이 글을 삭제하시겠습니까?')) return;
    try {
      await deleteDocument(doc(db, 'posts', params.id));
      alert('삭제되었습니다');
      router.push('/');
    } catch (error) {
      console.error(error);
      alert('삭제에 실패했습니다');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'posts', params.id, 'comments'), {
        text: newComment.trim(),
        author: user.name,
        emoji: user.emoji,
        authorId: user.id,
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error(error);
      alert('댓글 등록에 실패했습니다');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'posts', params.id, 'comments', commentId));
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        justifyContent: 'center', alignItems: 'center'
      }}>
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        justifyContent: 'center', alignItems: 'center',
        flexDirection: 'column'
      }}>
        <p style={{ fontSize: '48px' }}>😢</p>
        <p>글을 찾을 수 없습니다</p>
        <Link href="/" style={{ color: '#667eea' }}>← 홈으로</Link>
      </div>
    );
  }

  const isAuthor = user && post.authorId === user.id;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>🏠 우리 가족 블로그</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/family" style={{
            background: 'rgba(255,255,255,0.2)', color: 'white',
            padding: '8px 16px', borderRadius: '8px',
            textDecoration: 'none', fontSize: '14px'
          }}>👨‍👩‍👧‍👦 가족</Link>
          <Link href="/" style={{
            background: 'rgba(255,255,255,0.2)', color: 'white',
            padding: '8px 16px', borderRadius: '8px',
            textDecoration: 'none', fontSize: '14px'
          }}>← 목록</Link>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {/* 글 내용 */}
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '20px'
        }}>
          {isEditing ? (
            <>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{
                  width: '100%', padding: '12px', fontSize: '20px',
                  fontWeight: '700', border: '2px solid #667eea',
                  borderRadius: '10px', marginBottom: '12px',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={10}
                style={{
                  width: '100%', padding: '12px', fontSize: '15px',
                  border: '2px solid #667eea', borderRadius: '10px',
                  outline: 'none', resize: 'vertical', lineHeight: '1.8',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button onClick={handleEditSave} disabled={saving} style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                }}>{saving ? '저장 중...' : '✅ 저장'}</button>
                <button onClick={() => setIsEditing(false)} style={{
                  padding: '10px 24px', background: '#eee',
                  color: '#666', border: 'none', borderRadius: '10px',
                  fontSize: '14px', cursor: 'pointer'
                }}>취소</button>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ margin: '0 0 12px', fontSize: '24px', color: '#333' }}>
                {post.title}
              </h1>
              <div style={{
                fontSize: '14px', color: '#999', marginBottom: '24px',
                paddingBottom: '16px', borderBottom: '1px solid #eee',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                {/* ★ 작성자 클릭 → 프로필 이동 */}
                <Link href={`/profile/${post.authorId}`} style={{
                  textDecoration: 'none', color: '#667eea', fontWeight: '600'
                }}>
                  {post.emoji} {post.author}
                </Link>
                <span style={{ color: '#ccc' }}>{formatDate(post.createdAt)}</span>
              </div>

              {/* 수정/삭제 버튼 (작성자만) */}
              {isAuthor && (
                <div style={{
                  display: 'flex', gap: '8px', marginBottom: '20px'
                }}>
                  <button onClick={handleEditStart} style={{
                    background: '#f0f0f0', border: 'none',
                    padding: '6px 14px', borderRadius: '8px',
                    fontSize: '13px', cursor: 'pointer', color: '#555'
                  }}>✏️ 수정</button>
                  <button onClick={handleDeletePost} style={{
                    background: '#fee', border: 'none',
                    padding: '6px 14px', borderRadius: '8px',
                    fontSize: '13px', cursor: 'pointer', color: '#e74c3c'
                  }}>🗑️ 삭제</button>
                </div>
              )}

              <div style={{
                fontSize: '16px', lineHeight: '1.8',
                color: '#444', whiteSpace: 'pre-wrap'
              }}>
                {post.content}
              </div>
            </>
          )}
        </div>

        {/* 댓글 */}
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#333' }}>
            💬 댓글 ({comments.length}개)
          </h3>

          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#aaa', fontSize: '14px' }}>
              아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {comments.map((c) => (
                <div key={c.id} style={{
                  background: '#f8f9fa', borderRadius: '12px', padding: '14px 16px'
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '6px'
                  }}>
                    <Link href={`/profile/${c.authorId}`} style={{
                      fontSize: '13px', fontWeight: '600', color: '#667eea',
                      textDecoration: 'none'
                    }}>
                      {c.emoji} {c.author}
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#bbb' }}>
                        {formatDate(c.createdAt)}
                      </span>
                      {user && user.id === c.authorId && (
                        <button onClick={() => handleDeleteComment(c.id)} style={{
                          background: 'none', border: 'none',
                          color: '#ccc', cursor: 'pointer', fontSize: '12px', padding: '0'
                        }}>🗑️</button>
                      )}
                    </div>
                  </div>
                  <p style={{
                    margin: 0, fontSize: '14px', color: '#444',
                    lineHeight: '1.6', whiteSpace: 'pre-wrap'
                  }}>{c.text}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{
            display: 'flex', gap: '10px', alignItems: 'flex-end',
            borderTop: '1px solid #eee', paddingTop: '16px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px' }}>
                {user?.emoji} {user?.name}
              </div>
              <textarea
                placeholder="댓글을 입력하세요..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                rows={2}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: '2px solid #e0e0e0', fontSize: '14px',
                  resize: 'none', outline: 'none', boxSizing: 'border-box',
                  lineHeight: '1.5'
                }}
              />
            </div>
            <button
              onClick={handleAddComment}
              disabled={sending || !newComment.trim()}
              style={{
                padding: '12px 20px',
                background: (!newComment.trim() || sending)
                  ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: '600',
                cursor: sending ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >{sending ? '...' : '등록'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}