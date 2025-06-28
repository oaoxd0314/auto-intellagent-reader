import { useState } from 'react'

type ReplyFormProps = {
  readonly onSubmit: (content: string) => Promise<void>
  readonly isSubmitting: boolean
  readonly submitError: string | null
  readonly onClearError: () => void
  readonly validateContent: (content: string) => string | null
  readonly canSubmit: (content: string) => boolean
}

/**
 * 回覆表單組件
 * 純 UI 組件，所有邏輯通過 props 傳入
 */
export function ReplyForm({ 
  onSubmit, 
  isSubmitting, 
  submitError, 
  onClearError,
  validateContent,
  canSubmit
}: ReplyFormProps) {
  const [content, setContent] = useState('')
  const [showForm, setShowForm] = useState(false)

  const validationError = validateContent(content)
  const isValid = canSubmit(content)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid) return

    try {
      await onSubmit(content)
      setContent('')
      setShowForm(false)
    } catch (error) {
      // 錯誤已經在 hook 中處理
    }
  }

  const handleCancel = () => {
    setContent('')
    setShowForm(false)
    onClearError()
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        新增回覆
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="reply-content" className="block text-sm font-medium text-gray-700 mb-2">
          回覆內容
        </label>
        <textarea
          id="reply-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的想法..."
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
            validationError ? 'border-red-300' : 'border-gray-300'
          }`}
          disabled={isSubmitting}
        />
        
        {/* 字數統計 */}
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-500">
            {content.length}/1000 字符
          </div>
          {validationError && (
            <div className="text-xs text-red-600">
              {validationError}
            </div>
          )}
        </div>
      </div>

      {/* 提交錯誤顯示 */}
      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-600">{submitError}</span>
          </div>
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              發布中...
            </div>
          ) : (
            '發布回覆'
          )}
        </button>
        
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  )
} 