import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { User, UserRole } from '../api/api/v1/auth_pb';

export interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

const savedToken = localStorage.getItem('auth_token');
const savedUser = localStorage.getItem('auth_user');

export const initialState: AuthState = {
    user: savedUser ? User.fromJson(JSON.parse(savedUser)) : null,
    token: savedToken,
    loading: false,
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
    on(AuthActions.logout, (state) => ({
        ...state,
        user: null,
        token: null,
        error: null,
        loading: false
    }))
);
