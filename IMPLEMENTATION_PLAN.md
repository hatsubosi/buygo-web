# BuyGo Web Frontend Implementation Plan

## Technology Stack
- **Framework**: Angular (Standalone Components).
- **Styling**: TailwindCSS + SCSS (Premium Glassmorphism).
- **API Client**: ConnectRPC (TypeScript/Protobuf).
- **State Management**: **Hybrid Strategy**.
    - **Global/Business State**: NgRx (Store, Effects, Entity) for Auth, Data Caching, and Side Effects.
    - **View/Component State**: Angular Signals (`computed`, `signal`) for derived UI state and local reactivity.

## Phases

### Phase 1: Foundation & Core
- [x] **Project Setup**: Angular CLI, TailwindCSS, API Client Generation.
- [x] **Core Architecture**:
    - `ApiModule`: ConnectRPC Transport configuration (Interceptors).
    - `AuthState`: NgRx Store for User Session & JWT.
    - `AuthService`: Facade exposing Signals from Store.
    - `Guard`: AuthGuard linked to Store state.
- [x] **Shared UI (Design System)**:
    - `Layout`: Responsive Navbar (Glass effect), Sidenav.
    - `Components`: 
        - `Btn`: Gradient buttons with loading state.
        - `Card`: Glassmorphism container.
        - `Badge`: Status indicators (Order/GroupBuy status).
        - `Input`: Floated label inputs.

### Phase 2: Authentication
- [x] **Login Page**: 
    - Hero section background.
    - "Login with Line/Google" mock buttons.
    - Integration with `AuthService.Login`.

### Phase 3: GroupBuy Domain
- [x] **GroupBuy List**: Card grid with "Status" and "Deadline" countdown.
- [x] **GroupBuy Detail**:
    - Hero Image (Parallax).
    - Product List with "Add to Order" counters.
    - Dynamic Price Calculator (based on Rounding Config).
- [x] **Checkout**:
    - Order Summary.
    - Contact/Shipping Form.
    - `CreateOrder` RPC integration.

### Phase 4: Dashboard (User)
- [x] **My Orders**:
    - List with Status Timeline (Unordered -> ... -> Sent).
    - Payment Upload (Mock UI).
- [x] **My Registrations**:
    - Event signup status.

### Phase 5: Management Dashboard (Creator)
- [x] **GroupBuy Manager**:
    - **Batch Operations**: UI to "Receive items" and see Orders move status.
    - **Payment Verification**: Table of pending payments with "Confirm" action.

## Testing Strategy
- **Unit Tests (Vitest)**:
    - **State**: Test NgRx Reducers and Selectors (Pure functions).
    - **Services**: Mock ConnectRPC clients to verify service logic.
    - **Components**: Shallow rendering to verify Signals and Inputs/Outputs.
- **Integration Tests**:
    - Verify Component + Store interaction.
- **Tools**:
    - `Vitest`: Fast unit testing.
    - `Protobuf-ES`: Mocking generated clients.
    - `@vitest/coverage-v8`: Code coverage reporting.

## Design Aesthetic
- **Theme**: Dark Mode focus.
- **Effects**: `backdrop-filter: blur(12px)`, Gradient Borders, Micro-interactions.
