# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Auto Intellagent Reader - An AI-powered reading assistant that analyzes user behavior and provides intelligent suggestions. The project is currently undergoing a major refactor to introduce AI Agent control flow with a Command Pattern architecture.

## Development Commands

```bash
# Development server
pnpm dev

# Build the project
pnpm build

# Lint code
pnpm lint

# Preview production build
pnpm preview
```

## Current Architecture (Under Refactor)

### New AI Agent Control Flow

The project is transitioning to a **Command Pattern + Facade Pattern** architecture with AI Agent integration:

```
AI Agent (string commands) → SuperController → Controller Facade → xxxController/Services
```

#### Key Components:

1. **AI Agent**: Generates string commands like `"ADD_TASK title=\"Buy milk\""`
2. **SuperController**: 
   - Acts as Invoker/Mediator
   - Parses commands → Creates Command objects
   - Manages queue and applies policies (direct/toast confirmation)
3. **Controller Facade**: Unified interface that internally calls specific controllers
4. **ApplyPolicy**: Strategy pattern for execution (DirectApplyPolicy/ToastPolicy)

### Core Design Patterns:

- **Command Pattern**: Encapsulates actions + parameters as objects
- **Facade Pattern**: Provides simplified, unified API
- **Mediator Pattern**: Centralized coordination via SuperController
- **Strategy Pattern**: Pluggable execution policies

### Legacy Architecture (Still Present):

Controller-Facade Pattern with layered architecture:
```
UI Components → Hooks → Controllers → Context/Services/Factories
```

## Project Structure

```
src/
├── components/          # UI components
├── hooks/              # Custom hooks (UI abstraction layer)
├── controllers/        # Business logic coordination
│   ├── AIAgentController.ts
│   ├── AbstractController.ts
│   ├── InteractionController.ts
│   └── PostController.ts
├── contexts/           # State management
├── services/           # Data operations
├── lib/                # Utilities and factories
├── pages/              # Route components
├── content/posts/      # MDX content files
└── types/              # TypeScript type definitions

doc/
├── spec/ai-controller/new.md  # Latest AI Agent architecture spec
└── dev/architecture.md        # Legacy architecture documentation
```

## Key Technologies

- **React 19** with TypeScript
- **Vite** for build tooling
- **MDX** for content management
- **Zustand** for state management
- **Tailwind CSS** for styling
- **React Router** for routing

## Development Guidelines

### TypeScript Rules (from .cursor rules):
- Prefer `type` over `interface`
- Never use `any` - always define explicit types
- Use `const` by default, avoid `let`
- Always define explicit return types for functions
- **Forbidden**: `switch-case` statements - use object constants instead

### React Patterns:
- Use function components and hooks only
- Extract complex logic into custom hooks
- Use Context + useReducer for shared state
- Implement proper error boundaries
- Use React.memo for performance optimization

### AI Agent Command Structure:
```typescript
interface AgentCommand {
  type: string;             // e.g., "ADD_TASK"
  payload: unknown;
  toHumanReadable(): string;
  apply(policy: ApplyPolicy): Promise<void>;
  undo?(): Promise<void>;   // Optional
}
```

### SuperController Flow:
1. Parse string command → AgentCommand object
2. Queue management
3. Policy selection (direct/toast confirmation)
4. Execute via Controller Facade
5. Update state/UI

## Testing Strategy

- **Unit Tests**: AgentCommand.apply, SuperController.enqueue
- **Component Tests**: Toast confirmation flow, UI rendering
- **E2E Tests**: Agent command → UI state verification

## Important Notes

- **Project is in active refactor** - AI Agent integration is the current focus
- The new architecture coexists with legacy Controller-Facade pattern
- All AI Agent commands go through SuperController for safety and audit
- MDX content management remains in `src/content/posts/`
- Follow the Command Pattern for new AI Agent features
- Use ApplyPolicy for user confirmation on critical operations

## Current Development Status

- ✅ Basic architecture established
- ✅ Controller system implemented (80%)
- 🚧 AI Agent system (30% - under active development)
- 🚧 Behavior tracking (60%)

For detailed AI Agent architecture, refer to `doc/spec/ai-controller/new.md`.