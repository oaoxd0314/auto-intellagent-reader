import { MDXProvider } from '@mdx-js/react'
import type { ReactNode } from 'react'

// MDX 組件樣式
const components = {
  h1: ({ children }: { children: ReactNode }) => (
    <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: { children: ReactNode }) => (
    <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3">
      {children}
    </h2>
  ),
  h3: ({ children }: { children: ReactNode }) => (
    <h3 className="text-xl font-bold text-gray-900 mt-5 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }: { children: ReactNode }) => (
    <p className="text-gray-700 leading-relaxed mb-4">
      {children}
    </p>
  ),
  ul: ({ children }: { children: ReactNode }) => (
    <ul className="list-disc list-inside mb-4 space-y-2">
      {children}
    </ul>
  ),
  ol: ({ children }: { children: ReactNode }) => (
    <ol className="list-decimal list-inside mb-4 space-y-2">
      {children}
    </ol>
  ),
  li: ({ children }: { children: ReactNode }) => (
    <li className="text-gray-700">{children}</li>
  ),
  code: ({ children, className }: { children: ReactNode; className?: string }) => {
    const isBlock = className?.includes('language-')
    
    if (isBlock) {
      return (
        <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto mb-4">
          <code className="text-sm text-gray-800">{children}</code>
        </pre>
      )
    }
    
    return (
      <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-800">
        {children}
      </code>
    )
  },
  blockquote: ({ children }: { children: ReactNode }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: { href?: string; children: ReactNode }) => (
    <a 
      href={href}
      className="text-blue-600 hover:text-blue-800 underline"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  table: ({ children }: { children: ReactNode }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse border border-gray-300">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: { children: ReactNode }) => (
    <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">
      {children}
    </th>
  ),
  td: ({ children }: { children: ReactNode }) => (
    <td className="border border-gray-300 px-4 py-2">
      {children}
    </td>
  ),
  hr: () => (
    <hr className="my-8 border-gray-300" />
  ),
}

interface CustomMDXProviderProps {
  children: ReactNode
}

export function CustomMDXProvider({ children }: CustomMDXProviderProps) {
  return (
    <MDXProvider components={components}>
      {children}
    </MDXProvider>
  )
} 