import { describe, it, expect } from 'vitest';
import { authReducer, initialState, AuthState } from './auth.reducer';
import { AuthActions } from './auth.actions';
import { User, UserRole } from '../api/api/v1/auth_pb';

describe('Auth Reducer', () => {
  const testUser = new User({
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    photoUrl: 'https://example.com/photo.png',
    role: UserRole.USER,
  });

  describe('initialState', () => {
    it('should have loading: true, user: null, token: null, error: null', () => {
      expect(initialState).toEqual({
        loading: true,
        user: null,
        token: null,
        error: null,
      });
    });

    it('should return the initial state for an unknown action', () => {
      const action = { type: 'UNKNOWN' } as any;
      const state = authReducer(undefined, action);
      expect(state).toBe(initialState);
    });
  });

  describe('login action', () => {
    it('should set loading to true and clear error', () => {
      const previousState: AuthState = {
        ...initialState,
        loading: false,
        error: 'previous error',
      };
      const action = AuthActions.login({ provider: 'google', token: 'id-token' });
      const state = authReducer(previousState, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('loginSuccess action', () => {
    it('should set user and token, and set loading to false', () => {
      const previousState: AuthState = {
        ...initialState,
        loading: true,
      };
      const action = AuthActions.loginSuccess({
        user: testUser,
        token: 'access-token-123',
        redirect: true,
      });
      const state = authReducer(previousState, action);

      expect(state.user).toBe(testUser);
      expect(state.token).toBe('access-token-123');
      expect(state.loading).toBe(false);
    });
  });

  describe('loginFailure action', () => {
    it('should set error and set loading to false', () => {
      const previousState: AuthState = {
        ...initialState,
        loading: true,
      };
      const action = AuthActions.loginFailure({ error: 'Invalid credentials' });
      const state = authReducer(previousState, action);

      expect(state.error).toBe('Invalid credentials');
      expect(state.loading).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('sessionCheckDone action', () => {
    it('should set loading to false', () => {
      const previousState: AuthState = {
        ...initialState,
        loading: true,
      };
      const action = AuthActions.sessionCheckDone();
      const state = authReducer(previousState, action);

      expect(state.loading).toBe(false);
    });
  });

  describe('logout action', () => {
    it('should clear user, token, and error, and set loading to false', () => {
      const previousState: AuthState = {
        user: testUser,
        token: 'access-token-123',
        loading: true,
        error: 'some error',
      };
      const action = AuthActions.logout();
      const state = authReducer(previousState, action);

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });
});
