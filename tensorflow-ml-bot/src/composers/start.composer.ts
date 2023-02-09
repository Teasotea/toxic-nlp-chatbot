import { Menu } from '@grammyjs/menu';
import type { Context, NextFunction, SessionFlavor } from 'grammy';
import { Composer } from 'grammy';

import { onlyAdmin } from '../middlewares';
import type { StartSettings } from '../types';
import { ActionType } from '../types';

export const createInitialSessionData = () => ({ chatID: '0', chatType: 'private', action: ActionType.NOTHING, isConfigured: false });

export type MyContext = Context & SessionFlavor<StartSettings>;

export const initStartComposer = () => {
    const startComposer = new Composer<MyContext>();

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const messageButtonHandler = (actionType: ActionType) => async (context: MyContext, next: NextFunction) => {
        if (!context.chat) {
            return next();
        }
        context.session.action = actionType;

        await context.deleteMessage();
        await context.reply(`Ви вибрали ${actionType.toString()}`);
    };
    const startMenu = new Menu<MyContext>('start-menu-identifier')
        .text('Залишити токсіків у спокої', messageButtonHandler(ActionType.NOTHING))
        .row()
        .text('Видаляти повідомлення', messageButtonHandler(ActionType.DELETE))
        .row()
        .text('Банити після 2 токсичних поідомлень', messageButtonHandler(ActionType.BAN))
        .row()
        .text('Vox populi vox Dei, голосуємо', messageButtonHandler(ActionType.POLL));

    const groupStartComposer = startComposer.filter((context) => context.chat?.type !== 'private');

    groupStartComposer.command(
        'start',
        async (context, next) => onlyAdmin(context, next),
        async (context) => {
            if (context.session.isConfigured) {
                await context.reply('Бот уже налаштований');
                // TODO Ask user if he wants to reconfigure
            } else {
                await context.reply('Виберіть налаштування', { reply_markup: startMenu });
                context.session.chatID = context.chat.id.toString();
                context.session.chatType = context.chat.type;
                context.session.isConfigured = true;
            }
        },
    );

    return { startComposer, startMenu };
};
