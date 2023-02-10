import { Menu } from '@grammyjs/menu';
import type { NextFunction } from 'grammy';
import { Composer } from 'grammy';

import type { SwindlersTensorService } from '../services';
import type { MyContext } from "./start.composer";

export const initMessageComposer = (swindlersTensorService: SwindlersTensorService) => {
    const messageComposer = new Composer<MyContext>();

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const messageButtonHandler = (isOffensive: boolean) => async (context: MyContext, next: NextFunction) => {
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
    const pollButtonHandler = () => async (context: MyContext, next: NextFunction) => {
        if (!context.msg?.reply_to_message || !context.chat) {
            return next();
        }
        // eslint-disable-next-line camelcase
        const { text, from, message_id } = context.msg.reply_to_message;

        await context.api.deleteMessage(context.chat.id, message_id);

        await context.replyWithPoll(
            `should we ban id=[${from?.id as number}] username=@${from?.username as string} for '${text as string}'?`,
            ['yes', 'no', 'Slava Ukraini'],
            {
                open_period: 5,
            },
        );
        await context.deleteMessage();
    };

    const messageMenu = new Menu<MyContext>('my-menu-identifier')
        .text('✅ Toxic detected 😎', messageButtonHandler(true))
        .text('⛔️ все ровно', messageButtonHandler(false))
        .row()
        .text('👨‍⚖️ lets vote, dudes', pollButtonHandler());

    const groupComposer = messageComposer.filter((context) => context.chat?.type !== 'private');
    groupComposer.on('message', async (context, next) => {
        // eslint-disable-next-line camelcase
        const { text, message_id } = context.msg;

        if (!text) {
            await context.deleteMessage();
            return next();
        }
        if (text.startsWith('/')) {
            return next();
        }
        const predictedResult = await swindlersTensorService.predict(text || '');
        console.info(predictedResult.score);

        if (predictedResult.score >= 0.9) {
            await context.deleteMessage();
            await context.reply(
                `score: ${predictedResult.score}, message: ${text} @${
                    context.msg.from.username as string
                } та ти реально токсік 🤢, за таке й не гріх забанити ❌ \nЗаспокійся трішки`,
            );
        } else if (predictedResult.score > 0.5) {
            await context.reply(
                `${predictedResult.score} @${
                    context.msg.from.username as string
                } не лайся, бо я тобі в вічі плюну, — говорила баба Кайдашиха 😤\``,
                {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,camelcase
                    reply_to_message_id: message_id,
                    reply_markup: messageMenu,
                },
            );
            // await context.deleteMessage();
            // await context.reply('Ваше повідомлення видалено, бо ви токсік, ідіть поплачте 👿');
        }
        // else {
        //     await context.reply(`${predictedResult.score}`, {
        //         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,camelcase
        //         reply_to_message_id: message_id,
        //         reply_markup: messageMenu,
        //     });
        // }
    });

    const privateComposer = messageComposer.filter((context) => context.chat?.type === 'private');
    privateComposer.on('message', async (context) => {
        // eslint-disable-next-line camelcase
        const { text, message_id } = context.msg;
        const { score, isToxic } = await swindlersTensorService.predict(text || '');
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        await context.reply(`Score: ${score} \nisToxic: ${isToxic}`, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,camelcase
            reply_to_message_id: message_id,
        });
    });

    return { messageComposer, messageMenu };
};
