import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
        </div>
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            頁面不存在
          </h2>
          <p className="text-gray-600 text-lg mb-2">
            抱歉，您訪問的頁面無法找到
          </p>
          <p className="text-gray-500">
            可能是頁面已被移動或刪除
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              返回首頁
            </Link>
          </div>
          
          <div className="text-sm text-gray-500">
            或者嘗試以下頁面：
          </div>
          
          <div className="flex justify-center space-x-4 text-sm">
            <Link to="/posts" className="text-blue-500 hover:underline">
              📝 文章列表
            </Link>
            <Link to="/about" className="text-blue-500 hover:underline">
              ℹ️ 關於
            </Link>
          </div>
        </div>

        <div className="mt-12 text-xs text-gray-400">
          如果您認為這是一個錯誤，請聯繫我們
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage 