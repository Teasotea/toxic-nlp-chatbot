import { Menu } from '@grammyjs/menu';
import type { Context, NextFunction } from 'grammy';
import { Composer } from 'grammy';

import type { SwindlersTensorService } from '../services';

export const initMessageComposer = (swindlersTensorService: SwindlersTensorService) => {
    const messageComposer = new Composer();

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const messageButtonHandler = (isOffensive: boolean) => async (context: Context, next: NextFunction) => {
        if (!context.msg?.reply_to_message || !context.chat) {
            return next();
        }

        // eslint-disable-next-line camelcase
        const { text, message_id } = context.msg.reply_to_message;

        await context.deleteMessage();
        if (isOffensive) {
            await context.api.deleteMessage(context.chat.id, message_id);
            await context.reply(`Message "${text as string}" was deleted because хтось токсична гнида.`);
        }
    };
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const pollButtonHandler = () => async (context: Context, next: NextFunction) => {
        if (!context.msg?.reply_to_message || !context.chat) {
            return next();
        }
        // eslint-disable-next-line camelcase
        const { text, from, message_id } = context.msg.reply_to_message;

        await context.api.deleteMessage(context.chat.id, message_id);

        await context.replyWithPoll(`should we ban @${from?.username as string} for '${text as string}'?`, ['yes', 'no', 'Slava Ukraini'], {
            open_period: 5,
        });
        await context.deleteMessage();
    };

    const messageMenu = new Menu('my-menu-identifier')
        .text('✅ Toxic detected 😎', messageButtonHandler(true))
        .row()
        .text('👨‍⚖️ lets vote, dudes', pollButtonHandler())
        .row()
        .text('⛔️ все ровно', messageButtonHandler(false));

    const composer = messageComposer.filter((context) => context.chat?.type !== 'private');

    composer.on('message', async (context, next) => {
        // eslint-disable-next-line camelcase
        const { text, message_id } = context.msg;

        if (!text) {
            await context.deleteMessage();
            return next();
        }
        const predictedResult = await swindlersTensorService.predict(text || '');
        console.info(predictedResult.score);

        if (predictedResult.score >= 0.9) {
            await context.deleteMessage();
            await context.reply(`score: ${predictedResult.score}, message: ${text} @${context.msg.from.username as string} заспокійся, бо забанимо! 👿`);
        } else if (predictedResult.score > 0.5) {
            await context.reply(`${predictedResult.score} нуууу куда, нормально ж спілкувалися...`, {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,camelcase
                reply_to_message_id: message_id,
                reply_markup: messageMenu,
            });
            // await context.deleteMessage();
            // await context.reply('Ваше повідомлення видалено, бо ви токсік, ідіть поплачте 👿');
        } else {
            await context.reply(`${predictedResult.score}`, {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,camelcase
                reply_to_message_id: message_id,
                reply_markup: messageMenu,
            });
        }
    });

    return { messageComposer, messageMenu };
};
