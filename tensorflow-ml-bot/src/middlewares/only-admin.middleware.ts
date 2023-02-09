import type { Chat, ChatMember } from '@grammyjs/types/manage';
import type { CommandContext, Context, NextFunction } from 'grammy';

export const onlyAdmin = async (context: CommandContext<Context>, next: NextFunction) => {
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
    console.info(chatMember);
    if (adminStatuses.has(chatMember.status)) {
        console.info('ok, its admin');
        return next();
    }
    console.info(context, 'User is neither admin nor regular');
};
