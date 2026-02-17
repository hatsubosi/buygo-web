import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { User } from '../api/api/v1/auth_pb';

export interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

export const initialState: AuthState = {
    user: null,
    token: null,
    loading: true,
    error: null,
};

export const authReducer = createReducer(
    initialState,
    on(AuthActions.login, (state) => ({ ...state, loading: true, error: null })),
    on(AuthActions.loginSuccess, (state, { user, token }) => ({
        ...state,
        user,
        token,
        loading: false,
    })),
    on(AuthActions.loginFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error,
    })),
    on(AuthActions.sessionCheckDone, (state) => ({
        ...state,
        loading: false,
    })),
    on(AuthActions.logout, (state) => ({
        ...state,
        user: null,
        token: null,
        error: null,
        loading: false
    }))
);
