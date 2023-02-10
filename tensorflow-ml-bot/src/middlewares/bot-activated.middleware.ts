import type { NextFunction } from 'grammy';

import type { MyContext } from '../composers';

export const botActivatedMiddleware = async (context: MyContext, next: NextFunction) => {
    if (context.session && context.session.isConfigured) {
        return next();
    }
};
