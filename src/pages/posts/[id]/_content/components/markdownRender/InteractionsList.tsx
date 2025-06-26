import type { PostInteraction } from '../../../../../../types/post'

export interface InteractionsListProps {
  interactions: PostInteraction[]
  postId: string
}

export function InteractionsList({ interactions, postId }: InteractionsListProps) {
  const postInteractions = interactions.filter((i: PostInteraction) => i.postId === postId)
  
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