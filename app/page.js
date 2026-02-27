'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, COLOR_HEX, formatDate } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [members, setMembers] = useState([])
  const [filterAuthor, setFilterAuthor] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!author_id(id, name, emoji, color),
        likes(user_id),
        comments(id)
      `)
      .order('created_at', { ascending: false })
    setPosts(data || [])
  }, [])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      const { data: membersData } = await supabase.from('profiles').select('*')
      setMembers(membersData || [])

      await fetchPosts()
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.push('/login')
    })
    return () => subscription.unsubscribe()
  }, [router, fetchPosts])

  // 실시간 업데이트 (새 글이 올라오면 자동 반영)
  useEffect(() => {
    const channel = supabase
      .channel('posts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
        fetchPosts()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        fetchPosts()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchPosts])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleLike = async (e, post) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    const alreadyLiked = post.likes.some((l) => l.user_id === user.id)
    if (alreadyLiked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
    }
    fetchPosts()
  }

  const filteredPosts = filterAuthor
    ? posts.filter((p) => p.author_id === filterAuthor)
    : posts

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-lg">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <h1 className="text-lg font-bold text-gray-800">우리 가족 이야기</h1>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5">
                <span>{profile.emoji}</span>
                <span className="text-sm font-medium text-gray-700">{profile.name}</span>
              </div>
            )}
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 text-sm">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* 가족 필터 */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterAuthor(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !filterAuthor ? 'bg-orange-400 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            👨‍👩‍👧‍👦 전체
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setFilterAuthor(filterAuthor === m.id ? null : m.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterAuthor === m.id ? 'bg-orange-400 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {m.emoji} {m.name}
            </button>
          ))}
        </div>

        {/* 게시글 목록 */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">📝</div>
            <p>아직 작성된 글이 없어요</p>
            <p className="text-sm mt-1">첫 번째 이야기를 시작해 보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const liked = user && post.likes.some((l) => l.user_id === user.id)
              return (
                <Link key={post.id} href={`/post/${post.id}`}>
                  <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition-shadow mb-3">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div
                        style={{ backgroundColor: COLOR_HEX[post.author?.color] || '#9ca3af' }}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-lg text-white"
                      >
                        {post.author?.emoji}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{post.author?.name}</div>
                        <div className="text-xs text-gray-400">{formatDate(post.created_at)}</div>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1.5">{post.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 text-sm">
                      <button
                        onClick={(e) => handleLike(e, post)}
                        className={`flex items-center gap-1 ${liked ? 'text-red-500' : 'text-gray-400'}`}
                      >
                        {liked ? '❤️' : '🤍'} {post.likes.length}
                      </button>
                      <span className="text-gray-400">💬 {post.comments.length}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* 글쓰기 버튼 */}
      <Link href="/write">
        <button className="fixed bottom-6 right-6 bg-orange-400 hover:bg-orange-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors">
          ✏️
        </button>
      </Link>
    </div>
  )
}