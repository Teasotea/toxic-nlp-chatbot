import { Menu } from '@grammyjs/menu';
import type { NextFunction } from 'grammy';
import { Composer } from 'grammy';

import { botActivatedMiddleware } from '../middlewares';
import type { SwindlersTensorService } from '../services';
import type { StrategyDelegatorService } from '../services/on-message/strategy-delegator.service';

import type { MyContext } from './start.composer';

export const initMessageComposer = (swindlersTensorService: SwindlersTensorService, strategyDelegator: StrategyDelegatorService) => {
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
    groupComposer.on(
        'message',
        async (context: MyContext, next: NextFunction) => botActivatedMiddleware(context, next),
        // async (context: MyContext, next: NextFunction) => onlyAdmin(context, next),
        async (context: MyContext, next: NextFunction) => {
            // eslint-disable-next-line camelcase
            const { text } = context.msg!;

            if (!text || text.startsWith('/')) {
                await context.deleteMessage();
                return next();
            }
            const predictedResult = await swindlersTensorService.predict(text || '');
            console.info(`Predicted result: ${predictedResult.score}, Text: ${text}`);

            const actionType = context.session.action;
            await strategyDelegator.performStrategy(context, actionType, predictedResult, messageMenu);
        },
    );

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
