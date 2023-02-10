import {Menu} from '@grammyjs/menu';
import type {Context, NextFunction, SessionFlavor} from 'grammy';
import {Composer} from 'grammy';

import {onlyAdmin} from '../middlewares';
import type {StartSettings} from '../types';
import {ActionType} from '../types';

export const createInitialSessionData = () => ({
    chatID: '0',
    chatType: 'private',
    action: ActionType.NOTHING,
    isConfigured: false,
});

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
        if (actionType === ActionType.POLL) {
            if (context.chat === undefined || context.msg === undefined) {
                return;
            }
            await context.replyWithPoll(
                `нумо оберемо налаштування`,
                ['Залишити токсіків у спокої', 'Видаляти повідомлення', 'Банити після 2 токсичних поідомлень'],
                {
                    open_period: 60,
                },
            );
        }
    };
    const startMenu = new Menu<MyContext>('start-menu-identifier')
        .text('Залишити токсіків у спокої', messageButtonHandler(ActionType.NOTHING))
        .row()
        .text('Видаляти повідомлення', messageButtonHandler(ActionType.DELETE))
        .row()
        .text('Банити після 2 токсичних поідомлень', messageButtonHandler(ActionType.BAN))
        .row()
        .text('Vox populi vox Dei, голосуємо', messageButtonHandler(ActionType.POLL));
    const configureBot = async (context: MyContext) => {
        await context.reply('Виберіть налаштування', { reply_markup: startMenu });
        if (!context.chat) {
            return;
        }
        context.session.chatID = context.chat.id.toString();
        context.session.chatType = context.chat.type;
        context.session.isConfigured = true;
    };
    const reconfigureButtonHandler = (reconfigure: boolean) => async (context: MyContext, next: NextFunction) => {
        await context.deleteMessage();
        if (!reconfigure) {
            return next();
        }
        await configureBot(context);
    };
    const reconfigureMenu = new Menu<MyContext>('reconfigure-menu-identifier')
        .text('✅ Так', reconfigureButtonHandler(true))
        .text('❌ Ні', reconfigureButtonHandler(false));

    const groupStartComposer = startComposer.filter((context) => context.chat?.type !== 'private');

    groupStartComposer.command(
        'start',
        async (context, next) => onlyAdmin(context, next),
        async (context) => {
            await (context.session.isConfigured
                ? context.reply('Ви хочете переналаштувати бота? 🤖', { reply_markup: reconfigureMenu })
                : configureBot(context));
        },
    );

    return { startComposer, startMenu, reconfigureMenu };
};
