'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, COLOR_HEX, formatDate } from '@/lib/supabase'

export default function PostDetailPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id

  const [user, setUser] = useState(null)
  const [post, setPost] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)

  const fetchPost = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!author_id(id, name, emoji, color),
        likes(user_id),
        comments(
          id, content, created_at,
          author:profiles!author_id(id, name, emoji, color)
        )
      `)
      .eq('id', postId)
      .single()

    if (data) {
      // 댓글을 시간순으로 정렬
      data.comments = (data.comments || []).sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      )
    }
    setPost(data)
  }, [postId])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      await fetchPost()
      setLoading(false)
    }
    init()
  }, [router, fetchPost])

  // 실시간 업데이트
  useEffect(() => {
    const channel = supabase
      .channel(`post-${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes', filter: `post_id=eq.${postId}` }, () => fetchPost())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, () => fetchPost())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [postId, fetchPost])

  const handleLike = async () => {
    if (!user || !post) return
    const liked = post.likes.some((l) => l.user_id === user.id)
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
    }
    fetchPost()
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return
    setCommentLoading(true)
    await supabase.from('comments').insert({
      post_id: post.id,
      author_id: user.id,
      content: newComment.trim(),
    })
    setNewComment('')
    setCommentLoading(false)
    fetchPost()
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠어요?')) return
    await supabase.from('posts').delete().eq('id', post.id)
    router.push('/')
  }

  const handleDeleteComment = async (commentId) => {
    await supabase.from('comments').delete().eq('id', commentId)
    fetchPost()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">게시글을 찾을 수 없어요</p>
          <button onClick={() => router.push('/')} className="text-orange-500 hover:underline">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const liked = user && post.likes.some((l) => l.user_id === user.id)

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600">
            ← 돌아가기
          </button>
          {user && post.author_id === user.id && (
            <button onClick={handleDelete} className="text-gray-300 hover:text-red-400 text-sm">
              🗑️ 삭제
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* 작성자 정보 */}
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{ backgroundColor: COLOR_HEX[post.author?.color] || '#9ca3af' }}
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl text-white"
            >
              {post.author?.emoji}
            </div>
            <div>
              <div className="font-semibold text-gray-800">{post.author?.name}</div>
              <div className="text-xs text-gray-400">{formatDate(post.created_at)}</div>
            </div>
          </div>

          {/* 본문 */}
          <h2 className="text-xl font-bold text-gray-800 mb-3">{post.title}</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {/* 좋아요 */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              {liked ? '❤️' : '🤍'} {post.likes.length}명이 좋아합니다
            </button>
          </div>

          {/* 댓글 목록 */}
          <div className="mt-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-600">💬 댓글 {post.comments.length}개</h3>
            {post.comments.map((c) => (
              <div key={c.id} className="flex gap-2.5 bg-gray-50 rounded-xl p-3">
                <div
                  style={{ backgroundColor: COLOR_HEX[c.author?.color] || '#9ca3af' }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm text-white flex-shrink-0 mt-0.5"
                >
                  {c.author?.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">{c.author?.name}</span>
                    <span className="text-xs text-gray-300">{formatDate(c.created_at)}</span>
                    {user && c.author_id === user.id && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-xs text-gray-300 hover:text-red-400 ml-auto"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 댓글 입력 */}
          <form onSubmit={handleComment} className="flex gap-2 mt-4">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 남겨보세요..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              type="submit"
              disabled={commentLoading || !newComment.trim()}
              className="bg-orange-400 hover:bg-orange-500 disabled:bg-gray-300 text-white rounded-xl px-5 text-sm font-medium transition-colors"
            >
              {commentLoading ? '...' : '전송'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}