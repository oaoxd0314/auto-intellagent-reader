import { useInteraction } from '../contexts/InteractionContext'

type InteractionStatsProps = {
  readonly postId: string
  readonly size?: 'sm' | 'md' | 'lg'
  readonly showEmpty?: boolean
}

export default function InteractionStats({ 
  postId, 
  size = 'sm', 
  showEmpty = false 
}: InteractionStatsProps) {
  const { getPostStats, isLoading } = useInteraction()
  
  if (isLoading) {
    return (
      <div className="flex gap-2 text-gray-400 animate-pulse">
        <div className="w-16 h-4 bg-gray-200 rounded"></div>
        <div className="w-16 h-4 bg-gray-200 rounded"></div>
      </div>
    )
  }

  const stats = getPostStats(postId)
  
  if (!showEmpty && stats.totalInteractions === 0) {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  }

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={`flex gap-3 text-gray-500 ${sizeClasses[size]}`}>
      {stats.comments > 0 && (
        <span className="flex items-center gap-1">
          <span className={iconSizes[size]}>💬</span>
          <span>{stats.comments}</span>
          <span className="hidden sm:inline">則段落評論</span>
        </span>
      )}
      
      {stats.marks > 0 && (
        <span className="flex items-center gap-1">
          <span className={iconSizes[size]}>✨</span>
          <span>{stats.marks}</span>
          <span className="hidden sm:inline">個標記</span>
        </span>
      )}
      
      {stats.replies > 0 && (
        <span className="flex items-center gap-1">
          <span className={iconSizes[size]}>💭</span>
          <span>{stats.replies}</span>
          <span className="hidden sm:inline">個回覆</span>
        </span>
      )}
      
      {showEmpty && stats.totalInteractions === 0 && (
        <span className="text-gray-400">尚無互動</span>
      )}
    </div>
  )
} 