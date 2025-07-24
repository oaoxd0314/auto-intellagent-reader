import * as React from "react"
import { Check, X, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastTitle,
} from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import type { AISuggestion, UserResponseAction } from "@/types/suggestion"
import { cn } from "@/lib/utils"

interface AISuggestionToastProps {
  suggestion: AISuggestion
  onAccept: (suggestion: AISuggestion) => void
  onReject: (suggestion: AISuggestion) => void  
  onDismiss: (suggestion: AISuggestion) => void
}

export function AISuggestionToast({
  suggestion,
  onAccept,
  onReject,
  onDismiss
}: AISuggestionToastProps) {
  const handleUserResponse = React.useCallback((action: UserResponseAction) => {
    switch (action) {
      case 'accept':
        onAccept(suggestion)
        break
      case 'reject':
        onReject(suggestion)
        break
      case 'dismiss':
        onDismiss(suggestion)
        break
    }
  }, [suggestion, onAccept, onReject, onDismiss])

  const getPriorityIcon = () => {
    switch (suggestion.priority) {
      case 'high':
        return <Clock className="h-4 w-4 text-red-500" />
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTypeLabel = () => {
    switch (suggestion.type) {
      case 'action':
        return '建議操作'
      case 'recommendation':
        return '推薦內容'
      case 'reminder':
        return '提醒'
      default:
        return 'AI 建議'
    }
  }

  return (
    <Toast
      className={cn(
        "group pointer-events-auto relative flex w-full max-w-[320px] flex-col space-y-2 overflow-hidden rounded-lg border bg-background p-4 shadow-lg transition-all",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
        "data-[state=open]:slide-in-from-bottom-full data-[state=open]:sm:slide-in-from-right-full",
        // 優先級相關樣式
        suggestion.priority === 'high' && "border-red-200 bg-red-50/50",
        suggestion.priority === 'medium' && "border-yellow-200 bg-yellow-50/50",
        suggestion.priority === 'low' && "border-blue-200 bg-blue-50/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getPriorityIcon()}
          <ToastTitle className="text-sm font-medium">
            {getTypeLabel()}
          </ToastTitle>
        </div>
        <ToastClose onClick={() => handleUserResponse('dismiss')} />
      </div>

      {/* Description */}
      <ToastDescription className="text-sm text-muted-foreground leading-relaxed">
        {suggestion.description}
      </ToastDescription>

      {/* Action Buttons */}
      <div className="flex space-x-2 pt-2">
        <Button
          size="sm"
          onClick={() => handleUserResponse('accept')}
          className="flex-1 bg-green-600 text-white hover:bg-green-700 h-8"
        >
          <Check className="h-3 w-3 mr-1" />
          接受
        </Button>
        <Button
          size="sm" 
          variant="outline"
          onClick={() => handleUserResponse('reject')}
          className="flex-1 h-8"
        >
          <X className="h-3 w-3 mr-1" />
          拒絕
        </Button>
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground opacity-60 pt-1 border-t">
          ID: {suggestion.id.substring(0, 8)}... | Action: {suggestion.actionType}
        </div>
      )}
    </Toast>
  )
}

/**
 * 根據建議優先級獲取智能顯示時長
 */
function getSmartDuration(priority: AISuggestion['priority']): number {
  switch (priority) {
    case 'high':
      return 12000 // 12秒 - 高優先級需要更多時間考慮
    case 'medium':
      return 8000  // 8秒 - 標準時長
    case 'low':
      return 6000  // 6秒 - 低優先級可以更快消失
    default:
      return 8000
  }
}

// 便利函數：顯示 AI 建議 Toast
export function showAISuggestionToast(
  suggestion: AISuggestion,
  callbacks: {
    onAccept: (suggestion: AISuggestion) => void
    onReject: (suggestion: AISuggestion) => void  
    onDismiss: (suggestion: AISuggestion) => void
  },
  options?: {
    customDuration?: number // 可選的自定義顯示時長
  }
) {
  const getPriorityIcon = () => {
    switch (suggestion.priority) {
      case 'high':
        return '🔴'
      case 'medium':
        return '🟡'
      case 'low':
        return '🔵'
      default:
        return '💡'
    }
  }

  // 使用自定義時長或智能時長
  const duration = options?.customDuration ?? getSmartDuration(suggestion.priority)

  return toast({
    title: `${getPriorityIcon()} AI 建議`,
    description: suggestion.description,
    duration, // 使用智能計算的時長
    action: (
      <div className="flex space-x-2">
        <ToastAction 
          altText="接受建議"
          onClick={() => callbacks.onAccept(suggestion)}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <Check className="h-3 w-3 mr-1" />
          接受
        </ToastAction>
        <ToastAction 
          altText="拒絕建議"
          onClick={() => callbacks.onReject(suggestion)}
        >
          <X className="h-3 w-3 mr-1" />
          拒絕
        </ToastAction>
      </div>
    )
  })
}