import { useQuery } from '@tanstack/react-query'
import { PostService } from '../services/PostService'
// import type { Post } from '../types/post' // 暫時不需要
import { useQueryClient } from '@tanstack/react-query'

/**
 * 獲取所有文章
 */
export function useAllPosts() {
    return useQuery({
        queryKey: ['posts'],
        queryFn: () => PostService.getAllPosts(),
        staleTime: 5 * 60 * 1000, // 5分鐘快取
        gcTime: 30 * 60 * 1000, // 30分鐘垃圾回收時間
    })
}

/**
 * 獲取單個文章
 */
export function usePostDetail(id: string) {
    return useQuery({
        queryKey: ['post', id],
        queryFn: () => PostService.getPostById(id),
        enabled: !!id, // 只有當 id 存在時才執行查詢
        staleTime: 10 * 60 * 1000, // 10分鐘快取
        gcTime: 60 * 60 * 1000, // 1小時垃圾回收時間
    })
}

/**
 * 獲取所有標籤
 */
export function useAllTags() {
    return useQuery({
        queryKey: ['tags'],
        queryFn: () => PostService.getAllTags(),
        staleTime: 15 * 60 * 1000, // 15分鐘快取
        gcTime: 60 * 60 * 1000, // 1小時垃圾回收時間
    })
}

/**
 * 預載入文章 - 用於提升用戶體驗
 */
export function usePrefetchPost() {
    const queryClient = useQueryClient()

    const prefetchPost = (id: string) => {
        queryClient.prefetchQuery({
            queryKey: ['post', id],
            queryFn: () => PostService.getPostById(id),
            staleTime: 10 * 60 * 1000,
        })
    }

    return { prefetchPost }
} 