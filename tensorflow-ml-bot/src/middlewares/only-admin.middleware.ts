import type { Chat, ChatMember } from '@grammyjs/types/manage';
import type { NextFunction } from 'grammy';

import type { MyContext } from "../composers";

export const onlyAdmin = async (context: MyContext, next: NextFunction) => {
    if (!context.chat) {
        return;
    }

    const defaultAdminChatType = new Set<Chat['type']>(['channel', 'private']);

    if (defaultAdminChatType.has(context.chat.type)) {
        return next();
    }

    if (!context.from?.id) {
        return;
    }

    const adminStatuses = new Set<ChatMember['status']>(['creator', 'administrator']);

    const chatMember = await context.getChatMember(context.from.id);
    if (adminStatuses.has(chatMember.status)) {
        return next();
    }
    console.info(context, 'User is neither admin nor regular');
    await context.reply(`@${context.from.username || ''} - you are not admin, sorry :(`);
};
