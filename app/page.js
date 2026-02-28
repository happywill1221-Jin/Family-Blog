import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-center text-gray-800">
            🏠 우리 가족 블로그
          </h1>
          <p className="text-center text-gray-500 mt-2">
            소중한 우리 가족의 이야기
          </p>
        </div>
      </header>

      {/* 가족 사진 갤러리 */}
      <section className="max-w-4xl mx-auto py-10 px-4">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">📷 가족 사진</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Image
              src="/family1.jpg"
              alt="가족 사진 1"
              width={600}
              height={400}
              className="w-full h-72 object-cover"
            />
            <div className="p-4">
              <p className="text-gray-600 text-center">우리 가족 ❤️</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Image
              src="/family2.jpg"
              alt="가족 사진 2"
              width={600}
              height={400}
              className="w-full h-72 object-cover"
            />
            <div className="p-4">
              <p className="text-gray-600 text-center">행복한 순간 😊</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Image
              src="/family3.jpg"
              alt="가족 사진 3"
              width={600}
              height={400}
              className="w-full h-72 object-cover"
            />
            <div className="p-4">
              <p className="text-gray-600 text-center">즐거운 하루 🎉</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Image
              src="/family4.jpg"
              alt="가족 사진 4"
              width={600}
              height={400}
              className="w-full h-72 object-cover"
            />
            <div className="p-4">
              <p className="text-gray-600 text-center">사랑해요 💕</p>
            </div>
          </div>
        </div>
      </section>

      {/* 메뉴 */}
      <section className="max-w-4xl mx-auto py-6 px-4">
        <div className="flex justify-center gap-4">
          <a href="/write" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">
            ✏️ 글쓰기
          </a>
          <a href="/login" className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600">
            🔑 로그인
          </a>
        </div>
      </section>
    </main>
  );
}