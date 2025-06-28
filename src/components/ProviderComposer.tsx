import React, { type ReactNode, type ComponentType } from 'react'

type ProviderComponent = ComponentType<{ children: ReactNode }>

type ProviderComposerProps = {
  readonly providers: ProviderComponent[]
  readonly children: ReactNode
}

/**
 * Provider 組合器 - 避免 Provider Hell
 * 使用 reduceRight 確保正確的嵌套順序
 */
export function ProviderComposer({ providers, children }: ProviderComposerProps) {
  return providers.reduceRight(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children
  ) as React.ReactElement
} 