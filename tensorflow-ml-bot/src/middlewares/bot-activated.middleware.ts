import type { CommandContext, NextFunction } from 'grammy';

import type { MyContext } from '../composers';

export const botActivatedMiddleware = async (context: CommandContext<MyContext>, next: NextFunction) => {
    if (context.session && context.session.isConfigured) {
        return next();
    }
};
