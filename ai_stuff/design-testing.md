# Chat-Anywhere Testing Strategy

## Testing Philosophy

Testing focuses on ensuring reliability, correctness, and user experience while respecting the constraints of a Next.js/Vercel deployment. The strategy emphasizes:
- **Unit testing** for business logic and utilities
- **Integration testing** for component interactions and API routes
- **End-to-end testing** for critical user flows
- **Manual testing** for UI/UX and edge cases difficult to automate
- **Test coverage goals**: 80%+ for core logic, prioritizing user-facing functionality

## 1. Unit Testing

### Utilities and Helpers
- **File**: `utils/` directory (date formatters, sanitizers, UUID helpers, etc.)
- **Framework**: Jest with React Testing Library
- **Examples**:
  - Test message sanitization (XSS prevention)
  - Test UUID generation validity
  - Test timestamp formatting functions
  - Test link URL detection regex
  - Test image file validation logic

### Custom Hooks
- **File**: `hooks/` directory
- **Examples**:
  - `useRoomConnection` (SSE management)
  - `useLocalStorage` (session persistence)
  - `useMessageQueue` (optimistic updates)
- **Focus**: Test hook behavior with different inputs, cleanup, re-renders

### Context Providers
- **File**: `context/` directory (RoomProvider)
- **Focus**: 
  - State initialization from localStorage
  - State updates and persistence
  - Error handling within provider
  - Cleanup on unmount

## 2. Component Testing

### UI Components
- **Framework**: React Testing Library + Jest
- **Approach**: Test rendering, user interactions, and output
- **Key Components**:
  - **MessageComponent**: 
    - Test rendering different message types (text, image, link)
    - Test timestamp formatting
    - Test own vs other message styling
  - **MessageInput**:
    - Test text input handling
    - Test image attachment flow
    - Test link detection and preview
    - Test send button disabled state
  - **UserRegistrationModal**:
    - Test form validation
    - Test avatar selection
    - Test submission and localStorage storage
  - **NewMessageIndicator**:
    - Test visibility based on scroll position
    - Test click-to-scroll behavior

### Testing Guidelines
- Test user-visible behavior, not implementation details
- Use `getByRole`, `getByLabelText` for accessibility
- Mock external dependencies (API calls, localStorage)
- Test error states and edge cases
- Test responsive breakpoints where relevant

## 3. API Route Testing

### Next.js API Routes
- **Framework**: Jest with SuperTest or manual fetch mocking
- **Approach**: Test request handling, validation, responses
- **Key Endpoints**:
  - **`/api/rooms/[roomId]/messages`**:
    - GET: test pagination, filtering by timestamp
    - POST: test message validation, storage, SSE triggering
  - **`/api/rooms/[roomId]/sse`**:
    - Test connection setup, authentication
    - Test message streaming
    - Test disconnection handling
  - **`/api/upload/image`**:
    - Test file validation (type, size)
    - Test successful upload and URL return
    - Test error handling for invalid files
  - **`/api/link-preview`**:
    - Test valid URL processing
    - Test invalid URL handling
    - Test timeout behavior
    - Test Open Graph tag extraction

### Mocking Strategy
- Mock Vercel KV client methods (ZADD, ZRANGE, HSET, etc.)
- Mock Vercel Blob upload function
- Mock external fetch for link previews
- Use controlled test data and timestamps
- Verify correct parameters passed to mocked services

## 4. Integration Testing

### Component Interactions
- **Framework**: React Testing Library + Jest
- **Focus**: Test how components work together
- **Examples**:
  - RoomProvider + MessageList + MessageInput flow
  - User registration → session persistence → chat access
  - Image upload flow: picker → API → message sending
  - Link preview: typing → detection → preview display → send
  - SSE connection: connect → receive message → UI update

### Critical User Flows
1. **New User Joins Room**:
   - Navigate to `/testroom`
   - See registration modal
   - Complete registration
   - Verify user data in localStorage
   - Verify initial empty history load
   - Verify SSE connection established

2. **Sending and Receiving Messages**:
   - User A sends text message
   - Verify message appears in User A's UI
   - Verify message stored in Vercel KV (mock)
   - Verify User B (in another test instance) receives via SSE
   - Verify message appears in User B's UI

3. **Image Sharing**:
   - User selects valid image
   - Verify upload API called with correct file
   - Verify message sent with image URL
   - Verify image renders in chat for both users

4. **Link Preview**:
   - User pastes valid URL
   - Verify link preview API called
   - Verify preview displays in input
   - Verify sent message includes preview data
   - Verify link renders as preview card in chat

5. **History Fetching**:
   - User joins room with existing history
   - Verify last 50 messages loaded
   - User scrolls to top
   - Verify older messages loaded
   - Verify "end of history" when no more messages

## 5. End-to-End (E2E) Testing

### Framework: Cypress or Playwright
- **Focus**: Test real user scenarios in realistic environments
- **Test Environment**: 
  - Use mocked Vercel KV and Blob services
  - Or use test instances of these services
  - Run against local Next.js dev server
- **Key Flows**:
  - Complete user journey: register → chat → send/receive → history
  - Multi-user scenario: two browsers interacting
  - Network resilience: offline → online recovery
  - Session persistence: close/reopen browser
  - Multi-tab support: same room in different tabs

### E2E Test Examples
1. **Basic Chat Flow**:
   - Visit `/room1` in two browser instances
   - Both complete registration with different users
   - User 1 sends message → appears in both browsers
   - User 2 sends image → appears in both browsers
   - Both users scroll history and send more messages

2. **Persistence Test**:
   - User visits `/room2`, registers, sends messages
   - Close browser, reopen to same URL
   - Verify user is automatically recognized
   - Verify previous messages still visible
   - Verify can send new messages

3. **Error Recovery Test**:
   - Simulate API failure during message send
   - Verify error UI and retry option
   - Restore API, verify retry succeeds
   - Verify message appears in chat

4. **Performance Test**:
   - Send 50 rapid messages
   - Verify UI remains responsive
   - Verify all messages eventually appear
   - Verify memory usage doesn't grow unbounded

## 6. Manual Testing Checklist

### UI/UX Testing
- [ ] Responsive design on mobile, tablet, desktop
- [ ] Accessibility: keyboard navigation, screen reader support
- [ ] Color contrast compliance
- [ ] Touch targets minimum size
- [ ] Loading states and skeletons
- [ ] Empty states (new room, no history)
- [ ] Error states and recovery paths

### Feature Testing
- [ ] Image upload: various formats, sizes, invalid files
- [ ] Link preview: various sites, edge cases (redirects, auth required)
- [ ] Avatar selection: all options, visual feedback
- [ ] Timestamp formatting: recent vs old messages
- [ ] Message selection/copying (if implemented)
- [ ] Notification/badge for new messages

### Performance Testing
- [ ] Initial load time (< 3s on 3G)
- [ ] Message send/receive latency (< 1s typical)
- [ ] Scroll performance with 100+ messages
- [ ] Memory usage over extended session
- [ ] Battery impact (minimize polling/SSE overhead)

### Compatibility Testing
- [ ] Modern browsers: Chrome, Firefox, Safari, Edge
- [ ] Mobile browsers: iOS Safari, Android Chrome
- [ ] Behavior when JavaScript disabled (graceful degradation)
- [ ] Behavior with cookies/localStorage disabled

### Vercel-Specific Testing
- [ ] Deployment builds successfully on Vercel
- [ ] Environment variables handled correctly
- [ ] API routes respect Vercel serverless limits
- [ ] Blob storage integration works in Vercel environment
- [ ] KV storage operations succeed within limits

## 7. Testing Infrastructure

### Test Data Management
- **Fixtures**: Sample messages, user data, link previews
- **Factories**: Functions to generate test variations
- **Mock Servers**: For API route testing (msw or similar)
- **Test IDs**: `data-testid` attributes for critical E2E selectors

### Continuous Integration
- **GitHub Actions** (or similar):
  - On push/pull request:
    - Install dependencies
    - Run unit tests (jest)
    - Run component tests
    - Run linting (eslint)
    - Run type checking (tsc --noEmit)
    - Build next.js application
    - (Optional) Deploy to preview environment and run E2E
  - On merge to main:
    - Full test suite
    - Performance benchmarks
    - Security scanning (if configured)

### Coverage Reporting
- **Tool**: Jest coverage + optional Istanbul
- **Goals**:
  - 90%+ for utilities and helpers
  - 80%+ for components and hooks
  - 70%+ for API routes (focus on critical paths)
  - 60%+ overall (accepting lower for UI-specific logic)
- **Thresholds**: Fail build if coverage drops below minimum

## 8. Testing Trade-offs and Prioritization

### What to Test (High Priority)
- User authentication and session persistence
- Message sending and receiving (core chat functionality)
- History loading and infinite scroll
- SSE connection management and recovery
- Image upload and link preview features
- Error handling and user feedback mechanisms
- Room isolation and data scoping

### What to Test (Medium Priority)
- Edge cases in validation
- Performance optimizations (virtualized lists, memoization)
- Accessibility features
- Cross-browser compatibility
- Deployment and environment configuration

### What to Test (Low Priority or Manual)
- Pixel-perfect UI matching designs
- Animation timing and easing
- Third-party service integrations (beyond mocks)
- Rare edge cases (browser-specific bugs)
- Performance micro-optimizations

### Manual Testing Focus
- Exploratory testing for usability issues
- Ad-hoc testing of reported bugs
- Testing new features before automation
- UX feedback sessions with real users
- Testing in production-like environments (staging)

## 9. Test Maintenance Strategy

### Test Organization
- Unit tests: `__tests__` folders alongside source
- Component tests: `__tests__` in component directories
- E2E tests: `cypress/` or `playwright/` directory
- Test utilities: shared mocks, helpers, fixtures

### Naming Conventions
- `[filename].test.js` or `[filename].spec.js`
- Descriptive test names: `should show error when invalid email`
- Group related tests with `describe` blocks

### Reliability Practices
- Avoid brittle selectors (use roles, labels, text)
- Use `waitFor` for asynchronous assertions
- Clean up mocks and spies between tests
- Use `beforeEach`/`afterEach` for test isolation
- Prioritize deterministic tests over timing-dependent ones

### Review Process
- Tests reviewed alongside code in pull requests
- Test coverage considered in code review
- Flaky tests investigated and fixed promptly
- Tests updated when requirements change
- Obsolete tests removed when features deprecated

This testing strategy ensures chat-anywhere remains reliable and maintainable while providing confidence in core functionality, especially the real-time chat experience that is central to the application's value.