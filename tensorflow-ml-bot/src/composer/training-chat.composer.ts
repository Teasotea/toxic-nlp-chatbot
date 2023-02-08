import { Menu } from '@grammyjs/menu';
import type { Context, NextFunction } from 'grammy';
import { Composer } from 'grammy';

import type { SwindlersTensorService } from '../services';

export const initTrainingChatComposer = (swindlersTensorService: SwindlersTensorService) => {
    const trainingChatComposer = new Composer();

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const trainingChatButtonHandler = (isSpam: boolean) => async (context: Context, next: NextFunction) => {
        if (!context.msg?.reply_to_message || !context.chat) {
            return next();
        }

        // eslint-disable-next-line camelcase
        const { text, message_id } = context.msg.reply_to_message;

        await context.api.deleteMessage(context.chat.id, message_id);
        await context.deleteMessage();

        await context.reply(`${text || ''}\nYou pressed ${isSpam.toString()}`);
    };

    /**
     * Training menu
     * */
    const trainingChatMenu = new Menu('my-menu-identifier')
        .text('✅ Спам', trainingChatButtonHandler(true))
        .text('⛔️ Не спам', trainingChatButtonHandler(false));

    /**
     * Main composer
     * */
    // const composer = trainingChatComposer.filter((context) => context.chat?.id === TRAINING_CHAT_ID);

    trainingChatComposer.on('message', async (context, next) => {
        // eslint-disable-next-line camelcase
        const { text, message_id } = context.msg;

        if (!text) {
            await context.deleteMessage();
            return next();
        }

        const predictResult = swindlersTensorService.predict(text || '');

        await context.reply(`ok, ${predictResult.score}`, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,camelcase
            reply_to_message_id: message_id,
            reply_markup: trainingChatMenu,
        });
    });

    return { trainingChatComposer, trainingChatMenu };
};
