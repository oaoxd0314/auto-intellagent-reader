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