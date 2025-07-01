import { useState, memo } from 'react'

type ReplyFormProps = {
  readonly onSubmit: (content: string) => Promise<void>
  readonly isPending: boolean
  readonly submitError: string | null
  readonly onClearError: () => void
  readonly canSubmit: () => boolean
}

/**
 * 回覆表單組件 - 極簡版本
 * 添加事件保護，防止外部干擾
 */
export const ReplyForm = memo(function ReplyForm({ 
  onSubmit, 
  isPending, 
  submitError, 
  onClearError,
  canSubmit
}: ReplyFormProps) {
  const [content, setContent] = useState('')

  const handleContentChange = (value: string) => {
    setContent(value)
    if (submitError) {
      onClearError()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!canSubmit() || !content.trim()) {
      return
    }
    
    try {
      await onSubmit(content)
      setContent('')
    } catch (error) {
      // 錯誤已經在 hook 中處理
    }
  }

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      onMouseDown={(e) => e.stopPropagation()}
      className="space-y-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            placeholder="分享你的想法..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            disabled={isPending}
          />
          
          {submitError && (
            <p className="mt-2 text-sm text-red-600">
              {submitError}
            </p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            onMouseDown={(e) => e.stopPropagation()}
            disabled={isPending || !canSubmit() || !content.trim()}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isPending || !canSubmit() || !content.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isPending ? '發送中...' : '發送回覆'}
          </button>
        </div>
      </form>
    </div>
  )
}) 