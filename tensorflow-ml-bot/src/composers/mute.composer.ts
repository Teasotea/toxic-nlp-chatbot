import { Composer } from 'grammy';

import {botActivatedMiddleware, onlyAdmin} from '../middlewares';

import type { MyContext } from './start.composer';

const banChatMember = async (context: MyContext, userId: number, timeout = 60) => {
    await context.kickChatMember(userId, {
        until_date: Math.round(Date.now() / 1000) + timeout,
    });
};

export const initMuteComposer = () => {
    const muteComposer = new Composer<MyContext>();

    const groupMuteComposer = muteComposer.filter((context) => context.chat?.type !== 'private');

    groupMuteComposer.command(
        'mute',
        async (context, next) => botActivatedMiddleware(context, next),
        async (context, next) => onlyAdmin(context, next),
        async (context, next) => {
            if (context.msg.reply_to_message === undefined) {
                await context.reply('You can use /mute only as reply to toxic/offensive message.');
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,camelcase
            const { from } = context.msg.reply_to_message!;
            console.info(context.msg.reply_to_message);
            if (from !== undefined) {
                console.info(`@${from.username as string} was muted for 1 hour.`);
                await banChatMember(context, from.id);
            }
            return next();
        },
    );

    return { muteComposer };
};
