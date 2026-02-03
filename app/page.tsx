export default async function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-gray-800">Cuggu</h1>
        <p className="text-xl text-gray-600">
          AI로 만드는 특별한 모바일 청첩장
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <button className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors">
            시작하기
          </button>
          <button className="px-6 py-3 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            템플릿 보기
          </button>
        </div>
      </div>
    </div>
  );
}
