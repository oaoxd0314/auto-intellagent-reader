import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from './ui/button'

interface CommentFormProps {
  selectedText: string
  isSubmitting?: boolean
  onSubmit: (content: string) => Promise<void>
  onCancel: () => void
  placeholder?: string
  maxLength?: number
  autoFocus?: boolean
}

/**
 * 評論表單組件 - 用於輸入段落評論
 * 支援字數限制、錯誤處理、載入狀態
 */
export function CommentForm({
  selectedText,
  isSubmitting = false,
  onSubmit,
  onCancel,
  placeholder = '對這段文字發表評論...',
  maxLength = 500,
  autoFocus = true
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自動聚焦
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  // 處理表單提交
  const handleSubmit = useCallback(async () => {
    const trimmedContent = content.trim()
    
    // 驗證
    if (!trimmedContent) {
      setError('評論內容不能為空')
      return
    }

    if (trimmedContent.length > maxLength) {
      setError(`評論內容過長（最多 ${maxLength} 字）`)
      return
    }

    setError(null)

    try {
      await onSubmit(trimmedContent)
      setContent('') // 成功後清空表單
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提交評論失敗'
      setError(errorMessage)
    }
  }, [content, maxLength, onSubmit])

  // 處理鍵盤快捷鍵
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }, [handleSubmit, onCancel])

  // 處理輸入變化
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setError(null) // 清除錯誤
  }, [])

  // 字數統計
  const characterCount = content.length
  const isOverLimit = characterCount > maxLength
  const isNearLimit = characterCount > maxLength * 0.8

  return (
    <div className="space-y-3">
      {/* 選中文字預覽 */}
      <div className="text-xs text-gray-500 border-l-2 border-gray-200 pl-2">
        <span className="font-medium">評論目標：</span>
        <div className="italic text-gray-600 mt-1">
          "{selectedText.length > 50 ? selectedText.slice(0, 50) + '...' : selectedText}"
        </div>
      </div>

      {/* 評論輸入框 */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSubmitting}
        className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md resize-none 
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   disabled:bg-gray-50 disabled:text-gray-500"
        rows={3}
      />

      {/* 錯誤訊息 */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      {/* 表單底部 */}
      <div className="flex items-center justify-between">
        {/* 字數統計 */}
        <div className={`text-xs ${
          isOverLimit ? 'text-red-500' : isNearLimit ? 'text-orange-500' : 'text-gray-500'
        }`}>
          {characterCount}/{maxLength}
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim() || isOverLimit}
          >
            {isSubmitting ? '提交中...' : '發表評論'}
          </Button>
        </div>
      </div>

      {/* 快捷鍵提示 */}
      <div className="text-xs text-gray-400">
        <span>快捷鍵：</span>
        <kbd className="mx-1 px-1 py-0.5 bg-gray-100 rounded text-xs">Cmd/Ctrl + Enter</kbd>
        <span>提交，</span>
        <kbd className="mx-1 px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd>
        <span>取消</span>
      </div>
    </div>
  )
} 