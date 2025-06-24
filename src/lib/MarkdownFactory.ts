import type { Post } from '../types/post'

// MDX 組件類型
interface MDXComponent {
    default: React.ComponentType
    frontmatter?: {
        title: string
        date: string
        author: string
        tags?: string[]
    }
}

export class MarkdownFactory {
    // 使用 Vite 的 import.meta.glob 來動態導入所有 MDX 文件
    private static getMDXModules() {
        return (import.meta as any).glob('/src/content/posts/*.mdx', {
            eager: false
        })
    }

    // 從文件路徑提取文章 ID
    private static extractIdFromPath(path: string): string {
        return path.replace('/src/content/posts/', '').replace('.mdx', '')
    }

    // 載入單個文章
    static async loadPostById(id: string): Promise<Post | undefined> {
        const modules = this.getMDXModules()
        const targetPath = `/src/content/posts/${id}.mdx`

        if (!modules[targetPath]) {
            return undefined
        }

        try {
            const mdxModule = await modules[targetPath]() as MDXComponent

            // 嘗試從 mdxModule.frontmatter 或直接從 module 中獲取 frontmatter
            let frontmatter = mdxModule.frontmatter || (mdxModule as any).frontmatter

            if (!frontmatter) {
                console.error(`No frontmatter found in ${id}.mdx`, mdxModule)
                console.log('Available keys:', Object.keys(mdxModule))
                return undefined
            }

            return {
                id,
                title: frontmatter.title,
                date: frontmatter.date,
                author: frontmatter.author,
                tags: frontmatter.tags,
                component: mdxModule.default
            }
        } catch (error) {
            console.error(`Failed to load post ${id}:`, error)
            return undefined
        }
    }

    // 載入所有文章
    static async loadAllPosts(): Promise<Post[]> {
        const modules = this.getMDXModules()
        const posts: Post[] = []

        for (const [path, moduleLoader] of Object.entries(modules)) {
            try {
                const mdxModule = await (moduleLoader as () => Promise<MDXComponent>)()

                // 嘗試從 mdxModule.frontmatter 或直接從 module 中獲取 frontmatter
                let frontmatter = mdxModule.frontmatter || (mdxModule as any).frontmatter
                const id = this.extractIdFromPath(path)

                if (!frontmatter) {
                    console.error(`No frontmatter found in ${path}`)
                    console.log('Available keys:', Object.keys(mdxModule))
                    continue
                }

                posts.push({
                    id,
                    title: frontmatter.title,
                    date: frontmatter.date,
                    author: frontmatter.author,
                    tags: frontmatter.tags,
                    component: mdxModule.default
                })
            } catch (error) {
                console.error(`Failed to load post from ${path}:`, error)
            }
        }

        // 按日期排序（最新的在前面）
        return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    // 獲取所有可用的文章 ID
    static getAvailablePostIds(): string[] {
        const modules = this.getMDXModules()
        return Object.keys(modules).map(path => this.extractIdFromPath(path))
    }
} 