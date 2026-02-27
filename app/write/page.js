'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function WritePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else setUser(user)
    })
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !user) return
    setLoading(true)

    const { error } = await supabase.from('posts').insert({
      author_id: user.id,
      title: title.trim(),
      content: content.trim(),
    })

    if (error) {
      console.error(error)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            ← 돌아가기
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">✏️ 새 글 쓰기</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base font-semibold outline-none focus:ring-2 focus:ring-orange-300"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="가족에게 전하고 싶은 이야기를 적어보세요..."
              required
              rows={10}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 resize-none leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !title.trim() || !content.trim()}
                className="bg-orange-400 hover:bg-orange-500 disabled:bg-gray-300 text-white font-semibold px-8 py-2.5 rounded-xl transition-colors"
              >
                {loading ? '게시 중...' : '게시하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}