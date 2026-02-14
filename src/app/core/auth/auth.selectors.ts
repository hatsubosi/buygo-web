import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';
import { UserRole } from '../api/api/v1/auth_pb';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(selectAuthState, (state) => state.user);
export const selectIsAuthenticated = createSelector(selectAuthState, (state) => !!state.user);
export const selectIsLoading = createSelector(selectAuthState, (state) => state.loading);

export const selectIsManager = createSelector(selectUser, (user) => {
    return user?.role === UserRole.CREATOR || user?.role === UserRole.SYS_ADMIN;
});

export const selectToken = createSelector(selectAuthState, (state) => state.token);
