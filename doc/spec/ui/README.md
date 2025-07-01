# UI 系統規格 - Toast Queue & 智能建議介面

## 🎯 目標功能

UI 系統負責將 AI Agent 的智能建議以友好、非侵入的方式呈現給用戶，並處理用戶的交互回饋。

### 核心職責
1. **Toast Queue UI** - 右下角疊加式建議顯示
2. **智能建議生成** - 基於 Context 的動態建議介面
3. **用戶交互處理** - Accept/Reject/Dismiss 操作管理

## 📋 功能清單

### Phase 4.1: Toast Queue UI 基礎 🎨
- [ ] **Toast 組件架構**
  - [ ] 基於 shadcn/ui Toast 組件
  - [ ] 右下角多 Toast 疊加顯示
  - [ ] 響應式佈局適配 (mobile/tablet/desktop)
- [ ] **動畫系統**
  - [ ] 進入/退出動畫 (fade/slide/bounce)
  - [ ] 疊加順序動畫 (stack reordering)
  - [ ] 互動回饋動畫 (hover/click effects)
- [ ] **佈局管理**
  - [ ] 最大顯示數量控制
  - [ ] 智能位置調整 (避免遮擋重要內容)
  - [ ] Z-index 層級管理

### Phase 4.2: 智能建議介面 💡
- [ ] **動態 Action Button**
  - [ ] 基於 Context Event 動態生成按鈕
  - [ ] 按鈕樣式主題化 (primary/secondary/success/warning)
  - [ ] Loading 狀態和成功/失敗反饋
- [ ] **建議內容渲染**
  - [ ] 口語化建議文本顯示
  - [ ] Rich Text 內容支援 (markdown/html)
  - [ ] 圖標和視覺提示整合
- [ ] **優先級視覺化**
  - [ ] 不同優先級的視覺差異 (顏色/大小/位置)
  - [ ] 緊急建議特殊處理
  - [ ] 建議分類標籤系統

### Phase 4.3: 用戶交互優化 🎭
- [ ] **操作回饋系統**
  - [ ] Accept/Reject/Dismiss 三種操作
  - [ ] 操作確認對話框 (重要操作)
  - [ ] 批次操作支援 (全部關閉/全部接受)
- [ ] **個性化設定**
  - [ ] 顯示位置偏好設定
  - [ ] 建議頻率控制
  - [ ] 主題和樣式自定義
- [ ] **無障礙支援**
  - [ ] 鍵盤導航支援
  - [ ] 螢幕閱讀器相容性
  - [ ] 高對比度主題

## 🏗️ 技術架構

### UI 組件層次結構
```
ToastQueueContainer
├── ToastProvider (Context)
├── ToastStack (Layout Manager)
│   ├── ToastItem (Individual Toast)
│   │   ├── ToastHeader (Title & Controls)
│   │   ├── ToastContent (Suggestion Content)
│   │   └── ToastActions (Action Buttons)
│   └── ToastOverflow (More Items Indicator)
└── ToastSettings (Configuration Panel)
```

### 核心組件設計

#### 1. ToastQueueContainer - 主容器組件
```typescript
// src/components/ui/ToastQueue/ToastQueueContainer.tsx
interface ToastQueueProps {
  messages: AIMessage[]
  maxVisible: number          // 最多同時顯示的 toast 數量
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  stackDirection: 'up' | 'down'
  autoHideDelay: number       // 自動隱藏延遲 (ms)
  
  // 事件處理
  onActionClick: (message: AIMessage) => Promise<void>
  onDismiss: (messageId: string) => void
  onQueueEmpty: () => void
  
  // 樣式設定
  theme: 'light' | 'dark' | 'auto'
  animations: {
    enter: string
    exit: string
    stackShift: string
  }
}

export function ToastQueueContainer({
  messages,
  maxVisible = 3,
  position = 'bottom-right',
  stackDirection = 'up',
  autoHideDelay = 8000,
  onActionClick,
  onDismiss,
  onQueueEmpty,
  theme = 'auto',
  animations
}: ToastQueueProps): JSX.Element {
  // 實作邏輯
}
```

#### 2. ToastItem - 個別建議項目
```typescript
// src/components/ui/ToastQueue/ToastItem.tsx
interface ToastMessage extends AIMessage {
  // UI 狀態
  isVisible: boolean
  isExpanded: boolean
  zIndex: number
  
  // 動畫狀態
  animationState: 'entering' | 'visible' | 'exiting'
  
  // 用戶互動
  hasBeenSeen: boolean
  interactionCount: number
  
  // 佈局
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface ToastItemProps {
  message: ToastMessage
  index: number
  totalCount: number
  onAction: (action: string) => Promise<void>
  onDismiss: () => void
  onExpand: () => void
}

export function ToastItem({
  message,
  index,
  totalCount,
  onAction,
  onDismiss,
  onExpand
}: ToastItemProps): JSX.Element {
  // 實作邏輯
}
```

#### 3. ActionButton - 動態動作按鈕
```typescript
// src/components/ui/ToastQueue/ActionButton.tsx
interface ActionButtonProps {
  label: string
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  confirmRequired?: boolean
  icon?: React.ReactNode
  
  onClick: () => Promise<void>
  onConfirm?: () => Promise<void>
}

export function ActionButton({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  confirmRequired = false,
  icon,
  onClick,
  onConfirm
}: ActionButtonProps): JSX.Element {
  // 實作邏輯
}
```

#### 4. ToastAnimations - 動畫管理器
```typescript
// src/components/ui/ToastQueue/ToastAnimations.ts
type AnimationType = 'fade' | 'slide' | 'bounce' | 'scale'
type AnimationDirection = 'up' | 'down' | 'left' | 'right'

interface AnimationConfig {
  type: AnimationType
  direction?: AnimationDirection
  duration: number
  easing: string
  delay?: number
}

class ToastAnimations {
  // 動畫配置
  static getEnterAnimation(config: AnimationConfig): string
  static getExitAnimation(config: AnimationConfig): string
  static getStackShiftAnimation(config: AnimationConfig): string
  
  // 動畫控制
  static playEnterAnimation(element: HTMLElement, config: AnimationConfig): Promise<void>
  static playExitAnimation(element: HTMLElement, config: AnimationConfig): Promise<void>
  static playStackReorder(elements: HTMLElement[], config: AnimationConfig): Promise<void>
  
  // 預設動畫配置
  static DEFAULT_ANIMATIONS: Record<string, AnimationConfig>
}
```

## 🎨 視覺設計規格

### Toast 樣式主題

#### 1. 基本樣式
```scss
// src/components/ui/ToastQueue/ToastQueue.scss
.toast-queue-container {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  
  &.position-bottom-right {
    bottom: 1rem;
    right: 1rem;
  }
  
  &.position-bottom-left {
    bottom: 1rem;
    left: 1rem;
  }
  
  &.position-top-right {
    top: 1rem;
    right: 1rem;
  }
  
  &.position-top-left {
    top: 1rem;
    left: 1rem;
  }
}

.toast-item {
  width: 360px;
  min-height: 80px;
  max-height: 200px;
  margin-bottom: 0.5rem;
  pointer-events: auto;
  
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
  
  @media (max-width: 480px) {
    width: calc(100vw - 2rem);
    max-width: 360px;
  }
}
```

#### 2. 優先級樣式
```scss
.toast-item {
  &.priority-low {
    border-left: 4px solid #6b7280;
    background: #f9fafb;
  }
  
  &.priority-medium {
    border-left: 4px solid #3b82f6;
    background: #eff6ff;
  }
  
  &.priority-high {
    border-left: 4px solid #f59e0b;
    background: #fffbeb;
  }
  
  &.priority-urgent {
    border-left: 4px solid #ef4444;
    background: #fef2f2;
    animation: pulse 2s infinite;
  }
}
```

#### 3. 動畫效果
```scss
@keyframes toast-enter {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes toast-exit {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(100%) scale(0.9);
  }
}

@keyframes stack-shift {
  from {
    transform: translateY(var(--old-position));
  }
  to {
    transform: translateY(var(--new-position));
  }
}
```

## 📊 實作清單

### Phase 4.1: Toast UI 基礎架構 (Week 3)
- [ ] **創建 UI 組件基礎**
  - [ ] 創建 `src/components/ui/ToastQueue/` 目錄
  - [ ] 實作 `ToastQueueContainer` 組件
  - [ ] 整合 shadcn/ui Toast 組件
- [ ] **佈局和定位系統**
  - [ ] 響應式佈局邏輯
  - [ ] 位置計算和碰撞檢測
  - [ ] Z-index 管理系統
- [ ] **基礎動畫系統**
  - [ ] 進入/退出動畫
  - [ ] CSS-in-JS 動畫配置
  - [ ] 動畫性能優化

### Phase 4.2: 智能建議介面 (Week 3-4)
- [ ] **動態內容渲染**
  - [ ] 實作 `ToastItem` 組件
  - [ ] Rich Text 內容支援
  - [ ] 圖標和主題整合
- [ ] **Action Button 系統**
  - [ ] 實作 `ActionButton` 組件
  - [ ] Loading 和狀態管理
  - [ ] 確認對話框整合
- [ ] **優先級視覺化**
  - [ ] 優先級樣式系統
  - [ ] 動態顏色主題
  - [ ] 緊急通知特效

### Phase 4.3: 用戶體驗優化 (Week 4)
- [ ] **交互操作完善**
  - [ ] Accept/Reject/Dismiss 邏輯
  - [ ] 批次操作介面
  - [ ] 操作歷史記錄
- [ ] **個性化設定**
  - [ ] 設定面板實作
  - [ ] 偏好設定持久化
  - [ ] 主題切換系統
- [ ] **無障礙和相容性**
  - [ ] 鍵盤導航實作
  - [ ] ARIA 標籤完善
  - [ ] 螢幕閱讀器測試

## 🎯 技術重點

### 1. 性能優化
確保大量 Toast 顯示時不影響應用性能

### 2. 用戶體驗
非侵入式設計，不干擾正常操作流程

### 3. 響應式設計
適配各種設備和螢幕尺寸

### 4. 無障礙支援
確保所有用戶都能正常使用

## 📈 評估指標

### **UI 性能指標**
- 動畫流暢度 60fps
- 組件渲染時間 < 16ms
- 記憶體使用穩定 (無洩漏)

### **用戶體驗指標**
- 建議可見性 > 95%
- 操作成功率 > 98%
- 用戶滿意度 > 4.5/5

### **無障礙指標**
- WCAG 2.1 AA 合規性
- 鍵盤導航完整度 100%
- 螢幕閱讀器相容性

## 🔮 擴展規劃

### **短期擴展**
- [ ] 手勢操作支援 (swipe to dismiss)
- [ ] 語音交互整合
- [ ] 更多動畫效果

### **長期規劃**
- [ ] AR/VR 介面適配
- [ ] 多螢幕協同顯示
- [ ] AI 驅動的 UI 適應

---

**相關文檔：**
- [🤖 AI Controller 規格](../ai-controller/) - 建議來源
- [🔍 Observer 規格](../observer/) - 用戶行為回饋
- [🧠 策略系統規格](../strategy/) - 建議策略整合 