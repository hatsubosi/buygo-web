import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from '../api/api/v1/auth_pb';

export const AuthActions = createActionGroup({
    source: 'Auth',
    events: {
        'Login': props<{ provider: string; token: string }>(),
        'Login Success': props<{ user: User; token: string; redirect?: boolean }>(),
        'Login Failure': props<{ error: string }>(),
        'Logout': emptyProps(),
        'Check Session': emptyProps(),
        'Session Check Done': emptyProps(),
    },
});
