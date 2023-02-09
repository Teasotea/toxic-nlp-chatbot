import { Composer } from 'grammy';

import { onlyAdmin } from '../middlewares';

import type { MyContext } from './start.composer';

export const initMuteComposer = () => {
    const muteComposer = new Composer<MyContext>();

    const groupMuteComposer = muteComposer.filter((context) => context.chat?.type !== 'private');

    groupMuteComposer.command(
        'mute',
        async (context, next) => onlyAdmin(context, next),
        async (context, next) => {
            console.info(context);
            return next();
        },
    );

    return { muteComposer };
};
