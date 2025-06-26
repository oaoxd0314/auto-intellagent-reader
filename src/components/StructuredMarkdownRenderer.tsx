import { useState, useRef, useCallback, useEffect } from 'react'
import type { Post, PostInteraction, TextPosition } from '../types/post'
import { PostController } from '../controllers/PostController'
import { cn } from '../lib/utils'

interface StructuredMarkdownRendererProps {
  post: Post
}

/**
 * 結構化 Markdown 渲染器
 * 支援文字選擇、標記、評論等互動功能
 * 功能已封裝，外部只需傳入 post
 */
export function StructuredMarkdownRenderer({ post }: StructuredMarkdownRendererProps) {
  const [selectedText, setSelectedText] = useState('')
  const [selectionPosition, setSelectionPosition] = useState<TextPosition | null>(null)
  const [showInteractionMenu, setShowInteractionMenu] = useState(false)
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [selectionRange, setSelectionRange] = useState<Range | null>(null)
  const [currentSectionId, setCurrentSectionId] = useState<string>('')
  
  const contentRef = useRef<HTMLDivElement>(null)
  const postController = PostController.getInstance()
  
  // 獲取互動記錄
  const interactions = postController.getInteractions(post.id)

  /**
   * 處理文字選擇 - 修正邏輯，支持 mouse up 後顯示選單
   */
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    
    if (!selection || selection.rangeCount === 0) {
      // 只有當真的沒有選擇時才隱藏選單，不清除狀態
      setShowInteractionMenu(false)
      return
    }

    const range = selection.getRangeAt(0)
    const text = selection.toString().trim()
    
    if (text.length === 0) {
      // 沒有選中文字時隱藏選單，但保留狀態
      setShowInteractionMenu(false)
      return
    }

    // 檢查選擇是否在我們的內容區域內
    if (!contentRef.current?.contains(range.commonAncestorContainer)) {
      setShowInteractionMenu(false)
      return
    }

    // 計算選擇位置
    const position: TextPosition = {
      start: range.startOffset,
      end: range.endOffset,
      sectionId: generateSectionId(range.startContainer)
    }

    // 檢查是否為新段落
    const newSectionId = position.sectionId || ''
    const isNewSection = newSectionId !== currentSectionId
    
    if (isNewSection) {
      // 選取新段落 - 完全清除舊狀態
      setShowInteractionMenu(false) // 先隱藏舊選單
      setSelectedText('')
      setSelectionPosition(null)
      setSelectionRange(null)
      setCurrentSectionId(newSectionId)
      
      // 短暫延遲後設置新狀態，確保舊選單完全清除
      setTimeout(() => {
        setSelectedText(text)
        setSelectionPosition(position)
        setSelectionRange(range.cloneRange())
        setShowInteractionMenu(true)
      }, 10)
    } else {
      // 同一段落內的選擇變化
      setSelectedText(text)
      setSelectionPosition(position)
      setSelectionRange(range.cloneRange())
      setShowInteractionMenu(true)
    }
  }, [selectedText, currentSectionId])



  /**
   * 生成段落 ID - 為每個段落生成穩定的 ID
   */
  const generateSectionId = (node: Node): string => {
    let element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element
    
    while (element && element !== contentRef.current) {
      if (element.id) return element.id
      
      // 檢查是否為段落元素
      if (element.tagName && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV', 'SECTION', 'ARTICLE'].includes(element.tagName)) {
        // 使用元素內容的 hash 生成穩定的 ID
        const textContent = element.textContent || ''
        const hash = textContent.slice(0, 50).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
        const id = `section-${hash}-${element.tagName.toLowerCase()}`
        element.id = id
        return id
      }
      element = element.parentElement
    }
    
    return `section-default`
  }

  /**
   * 處理標記 - 直接調用 PostController
   */
  const handleAddMark = () => {
    if (selectedText && selectionPosition) {
      postController.addMark(post.id, selectedText, selectionPosition)
      // 執行 action 後清除所有狀態
      setShowInteractionMenu(false)
      setSelectedText('')
      setSelectionPosition(null)
      setSelectionRange(null)
      setCurrentSectionId('')
      clearSelection()
    }
  }

  /**
   * 處理評論
   */
  const handleAddComment = () => {
    setShowInteractionMenu(false)
    setShowCommentDialog(true)
  }

  /**
   * 提交評論 - 直接調用 PostController
   */
  const submitComment = () => {
    if (selectedText && selectionPosition && commentText.trim()) {
      postController.addComment(post.id, selectedText, commentText, selectionPosition)
      setShowCommentDialog(false)
      setCommentText('')
      // 執行 action 後清除所有狀態
      setShowInteractionMenu(false)
      setSelectedText('')
      setSelectionPosition(null)
      setSelectionRange(null)
      setCurrentSectionId('')
      clearSelection()
    }
  }

  /**
   * 處理回覆
   */
  const handleAddReply = () => {
    setShowReplyDialog(true)
  }

  /**
   * 提交回覆 - 直接調用 PostController
   */
  const submitReply = () => {
    if (replyText.trim()) {
      postController.addReply(post.id, replyText)
      setShowReplyDialog(false)
      setReplyText('')
    }
  }

  /**
   * 清除選擇
   */
  const clearSelection = () => {
    window.getSelection()?.removeAllRanges()
    setSelectedText('')
    setSelectionPosition(null)
    setSelectionRange(null)
  }

  /**
   * 獲取標記樣式
   */
  const getMarkStyles = (): string => {
    const markInteractions = interactions.filter((i: PostInteraction) => i.type === 'mark' && i.selectedText)
    
    if (markInteractions.length === 0) return ''

    return markInteractions.map((mark: PostInteraction) => `
      .prose [data-text*="${mark.selectedText}"] {
        background-color: #fef08a;
        padding: 0 0.25rem;
        border-radius: 0.25rem;
        cursor: pointer;
      }
      .prose [data-text*="${mark.selectedText}"]:hover::after {
        content: "標記於 ${new Date(mark.timestamp).toLocaleDateString()}";
        position: absolute;
        background: #374151;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        margin-top: 1.5rem;
        margin-left: -2rem;
        z-index: 10;
      }
    `).join('\n')
  }

  /**
   * 渲染互動選單 - Medium 風格，出現在選擇範圍上方
   */
  const renderInteractionMenu = () => {
    if (!showInteractionMenu || !selectionRange) return null

    // 找到選中文字的真正邊界
    const rects = selectionRange.getClientRects()
    if (rects.length === 0) return null
    
    // 找到最左邊和最右邊的實際文字位置
    let leftMost = Infinity
    let rightMost = -Infinity
    let topMost = Infinity
    
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i]
      // 過濾掉寬度為0的矩形（可能是空白）
      if (r.width > 0) {
        leftMost = Math.min(leftMost, r.left)
        rightMost = Math.max(rightMost, r.right)
        topMost = Math.min(topMost, r.top)
      }
    }
    
    // 獲取內容容器的位置
    const containerRect = contentRef.current?.getBoundingClientRect()
    if (!containerRect) return null
    
    // 計算相對於內容容器的位置
    const relativeLeft = (leftMost + rightMost) / 2 - containerRect.left
    const relativeTop = topMost - containerRect.top
    
    const menuWidth = 160 // 預估選單寬度（加了文字後更寬）
    
    return (
      <div
        className={cn(
          "absolute z-50 w-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg interaction-menu",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        style={{
          left: relativeLeft - menuWidth / 2, // 相對於容器的中間點
          top: relativeTop - 10, // 相對於容器的上方
          transform: 'translateY(-100%)', // 確保完全在選擇範圍上方
        }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddMark}
            className={cn(
              "px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded flex items-center gap-2",
              "transition-colors duration-150 whitespace-nowrap"
            )}
          >
            <span className="w-3 h-3 bg-yellow-300 rounded border border-yellow-400"></span>
            <span>標記</span>
            <kbd className="ml-1 text-xs opacity-60 bg-gray-100 px-1 rounded">⌘⇧H</kbd>
          </button>
          <button
            onClick={handleAddComment}
            className={cn(
              "px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded flex items-center gap-2",
              "transition-colors duration-150 whitespace-nowrap"
            )}
          >
            <span className="text-sm">💬</span>
            <span>評論</span>
            <kbd className="ml-1 text-xs opacity-60 bg-gray-100 px-1 rounded">⌘⇧C</kbd>
          </button>
        </div>
      </div>
    )
  }

  /**
   * 渲染評論對話框
   */
  const renderCommentDialog = () => {
    if (!showCommentDialog) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">添加評論</h3>
          <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
            <strong>選中文字：</strong> {selectedText}
          </div>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="輸入你的評論..."
            className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setShowCommentDialog(false)
                setCommentText('')
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              onClick={submitComment}
              disabled={!commentText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交評論
            </button>
          </div>
        </div>
      </div>
    )
  }

  /**
   * 渲染回覆對話框
   */
  const renderReplyDialog = () => {
    if (!showReplyDialog) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">回覆文章</h3>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="輸入你的回覆..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setShowReplyDialog(false)
                setReplyText('')
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              onClick={submitReply}
              disabled={!replyText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交回覆
            </button>
          </div>
        </div>
      </div>
    )
  }

  /**
   * 渲染互動列表
   */
  const renderInteractions = () => {
    const postInteractions = interactions.filter((i: PostInteraction) => i.postId === post.id)
    if (postInteractions.length === 0) return null

    return (
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-4">互動記錄</h3>
        <div className="space-y-4">
          {postInteractions.map((interaction: PostInteraction) => (
            <div key={interaction.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">
                  {interaction.type === 'reply' && '💬 回覆'}
                  {interaction.type === 'mark' && '🔖 標記'}
                  {interaction.type === 'comment' && '💭 評論'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(interaction.timestamp).toLocaleString()}
                </span>
              </div>
              
              {interaction.selectedText && (
                <div className="mb-2 p-2 bg-gray-50 rounded text-sm">
                  <strong>選中文字：</strong> {interaction.selectedText}
                </div>
              )}
              
              <div className="text-sm">
                {interaction.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 監聽文字選擇事件 - 即時響應選擇變化
  useEffect(() => {
    const handleSelectionChange = () => {
      // 即時處理選擇變化
      handleTextSelection()
    }

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Element
      // 只有當點擊不在選單上時才隱藏選單，不清除狀態
      if (!target.closest('.interaction-menu')) {
        setShowInteractionMenu(false)
      }
    }

    // 使用 selectionchange 事件來即時響應選擇變化
    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mousedown', handleMouseDown)
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [handleTextSelection])

  // 點擊外部關閉選單，但不包括選擇文字的操作
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      // 檢查點擊是否在選單外部，且不是在內容區域內選擇文字
      if (showInteractionMenu && 
          !target.closest('.interaction-menu') && 
          !contentRef.current?.contains(target)) {
        // 點擊外部 - 清除所有狀態
        setShowInteractionMenu(false)
        setSelectedText('')
        setSelectionPosition(null)
        setSelectionRange(null)
        setCurrentSectionId('')
        clearSelection()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showInteractionMenu])

  // 鍵盤快捷鍵支援
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 只在有選擇文字時處理快捷鍵
      if (!selectedText || !showInteractionMenu) return
      
      // Cmd+Shift+H: 標記
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        handleAddMark()
      }
      
      // Cmd+Shift+C: 評論
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        handleAddComment()
      }
      
      // Escape: 清除選擇
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        setShowInteractionMenu(false)
        setSelectedText('')
        setSelectionPosition(null)
        setSelectionRange(null)
        setCurrentSectionId('')
        clearSelection()
      }
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [selectedText, showInteractionMenu, handleAddMark, handleAddComment])

  // 載入互動記錄
  useEffect(() => {
    postController.loadInteractions()
  }, [postController])

  // 為所有段落添加 ID
  useEffect(() => {
    if (!contentRef.current) return
    
    const addIdsToElements = () => {
      const elements = contentRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div.prose > div, section, article')
      elements?.forEach((element, index) => {
        if (!element.id) {
          const textContent = element.textContent || ''
          const hash = textContent.slice(0, 30).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
          element.id = `section-${hash}-${element.tagName.toLowerCase()}-${index}`
        }
      })
    }
    
    // 延遲執行，確保 MDX 內容已經渲染
    const timer = setTimeout(addIdsToElements, 100)
    return () => clearTimeout(timer)
  }, [post.id])

  return (
    <div className="relative">
      {/* 文章內容 */}
      <div 
        ref={contentRef}
        className="prose prose-lg max-w-none select-text relative"
        style={{ userSelect: 'text' }}
      >
        {/* 動態標記樣式 */}
        {getMarkStyles() && (
          <style dangerouslySetInnerHTML={{ __html: getMarkStyles() }} />
        )}
        
        
        {/* 文章內容 */}
        {post.component ? (
          <post.component />
        ) : (
          <div className="text-gray-500">
            <p>文章內容載入失敗</p>
          </div>
        )}
      </div>

      {/* 回覆按鈕 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={handleAddReply}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          💬 回覆文章
        </button>
      </div>

      {/* 互動記錄 */}
      {renderInteractions()}

      {/* 互動選單 - 使用 Popover */}
      {renderInteractionMenu()}

      {/* 評論對話框 */}
      {renderCommentDialog()}

      {/* 回覆對話框 */}
      {renderReplyDialog()}
    </div>
  )
} 