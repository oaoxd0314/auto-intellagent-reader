export interface Post {
    id: string
    title: string
    date: string
    author: string
    tags?: string[]
    component?: React.ComponentType // MDX 組件
}

export interface PostFrontmatter {
    title: string
    date: string
    author: string
    tags?: string[]
}

export interface ParsedMarkdown {
    frontmatter: PostFrontmatter
    content: string
}

/**
 * 文字選擇位置
 */
export interface TextPosition {
    start: number
    end: number
    sectionId?: string // 對應到文章的段落 ID
}

/**
 * 文章互動類型
 */
export type InteractionType = 'reply' | 'mark' | 'comment'

/**
 * 文章互動記錄
 */
export interface PostInteraction {
    id: string
    postId: string
    type: InteractionType
    content: string
    selectedText?: string
    position?: TextPosition
    timestamp: string
    author?: string
}

/**
 * 標記樣式
 */
export interface MarkStyle {
    backgroundColor?: string
    color?: string
    borderColor?: string
    className?: string
}

/**
 * 結構化內容節點
 */
export interface ContentNode {
    id: string
    type: 'heading' | 'paragraph' | 'code' | 'quote' | 'list' | 'other'
    level?: number // for headings
    content: string
    children?: ContentNode[]
    interactions?: PostInteraction[]
}

/**
 * 創建文章數據類型
 */
export interface CreatePostData {
    title: string
    content: string
    author: string
    tags?: string[]
    date?: string // 可選，默認為當前時間
} 