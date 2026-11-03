
# Competitive Research & Engineering Strategy

## 1. Project Vision

Build a modular, high-performance ecosystem for React developers.

The ecosystem will provide unified tools for:

- Async data management
- HTTP requests
- Global state management
- Forms and validation
- List virtualization
- Persistence
- Developer tools

Our goal is to solve real developer problems with reliable, predictable and maintainable solutions.

## 2. Competitors

### Data Management
- TanStack Query
- RTK Query
- SWR

### HTTP Clients
- Axios
- Native Fetch

### State Management
- Redux Toolkit
- Zustand
- Jotai

### Forms
- React Hook Form
- Formik

### Virtualization
- TanStack Virtual
- React Window

## 3. Problems We Want to Investigate

### Query Engine
- Race conditions
- Request deduplication
- Cache invalidation
- Background refetch
- Retry storms
- Cancellation
- Stale data
- Memory management
- Pagination
- Infinite queries
- Offline support

### Mutations
- Optimistic update conflicts
- Safe rollback
- Concurrent mutations
- Mutation retries
- Mutation persistence

### HTTP
- Token refresh concurrency
- Interceptor ordering
- Error normalization
- Request cancellation
- Retry policies
- Upload/download progress

### React Integration
- Unnecessary re-renders
- Subscription lifecycle
- Concurrent rendering
- SSR cache isolation
- Hydration consistency

### Developer Experience
- TypeScript inference
- Clear error messages
- Simple APIs
- Debugging tools
- Bundle size
- Documentation

## 4. Engineering Principles

1. Type safety first.
2. Test before implementing complex features.
3. Avoid unnecessary dependencies.
4. Keep core framework-independent.
5. Prefer modular architecture.
6. Protect against race conditions.
7. Optimize only after measuring.
8. Never sacrifice correctness for performance.
9. Document important design decisions.
10. Maintain backward compatibility where practical.

## 5. Quality Requirements

Every major feature must have:

- Unit tests
- Integration tests
- Edge-case tests
- TypeScript tests
- Documentation
- Performance benchmarks where relevant

## 6. Research Rules

For every competitor problem:

1. Find official documentation or GitHub evidence.
2. Check the affected version.
3. Reproduce the issue.
4. Check whether it is already fixed.
5. Design our proposed solution.
6. Write a regression test.
7. Benchmark the implementation.

Never claim a feature is better without evidence.

## 7. Current Development Status

- [x] Repository initialized
- [x] npm workspaces configured
- [x] TypeScript configured
- [x] Vitest configured
- [x] Core QueryClient created
- [x] Basic caching implemented
- [x] Request deduplication implemented
- [ ] Comprehensive query tests
- [ ] Error lifecycle
- [ ] Query observers
- [ ] Cache lifecycle
- [ ] Retry engine
- [ ] Query invalidation
- [ ] Mutations
- [ ] React adapter
- [ ] HTTP client
- [ ] DevTools
