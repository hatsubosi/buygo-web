# BuyGo Frontend Implementation Plan (buygo-web)

## Goal
Implement the frontend for BuyGo using Angular, focusing on "Rich Aesthetics" via Vanilla CSS and solid architecture.

## Architecture
**Framework**: Angular (Latest)
**State Management**: NgRx (Signal Store or Classic Store)
**Style**: Vanilla CSS (Variables, Glassmorphism)
**API**: Connect-Web (gRPC Client)

### Directory Structure
```text
buygo-web/
├── src/
│   ├── app/
│   │   ├── core/        # Singleton Services (Auth, API)
│   │   ├── state/       # Global State (NgRx)
│   │   ├── shared/      # UI Components (GlassCard, Button)
│   │   ├── features/    # Smart Components
│   │   │   ├── home/
│   │   │   ├── auth/    
│   │   │   ├── project/ # Wizard, Details
│   │   │   ├── event/   
│   │   │   └── admin/   # Dashboard
```

## Strategy

### 1. Design System & UX
- **Theme**: Dark/Light mode, Glassmorphism.
- **Components**: 
    - `GlassCard`: Reusable container.
    - `GradientButton`: Primary actions.

### 2. Feature Implementation
- **Auth**: Login with Provider -> Assign Role logic.
- **Project Wizard**:
    - Multi-step form: Config -> Payment -> Shipping -> Products.
    - Logic: Dynamic Spec generation.
- **Manager Dashboard**:
    - **Batch Logic**: Visual input for "Update Top 5 items".
    - **Payment**: Grid view of payments to confirm.
- **User Order**: 
    - Shopping Cart experience.
    - Dynamic Price (Rate + Rounding) display.

## Next Steps
1.  **Setup**: Configure CSS Variables and Index.
2.  **API**: Generate gRPC clients from `buygo-api` protos.
3.  **UI Core**: Build Layout and Shared Components.
4.  **Pages**: Implement Auth -> Dash -> Project.
