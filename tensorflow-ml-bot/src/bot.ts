import * as process from 'node:process';
import { RedisAdapter } from '@grammyjs/storage-redis';
import { Bot, session } from 'grammy';
import type { UserFromGetMe } from 'grammy/out/types';
import IORedis from 'ioredis';
import { googleSheetService } from './services/sheet/google-sheet.service';

import { banUserMiddleware } from './middlewares/ban-user.middleware';
import { initStrategyDelegatorService } from './services/on-message/strategy-delegator.service';
import type { MyContext } from './composers';
import { createInitialSessionData, initMessageComposer, initMuteComposer, initStartComposer } from './composers';
import { botActivatedMiddleware, onlyAdmin } from './middlewares';
import { initSwindlersTensorService } from './services';

// eslint-disable-next-line no-void
void (async () => {
    const redisInstance = new IORedis(process.env.REDIS_CONNECTION!);
    const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);
    // create storage
    const storage = new RedisAdapter({ instance: redisInstance });

    // eslint-disable-next-line no-void
    void googleSheetService.getSheet('1a8hnDONCDw6-beeXiKiC0JpWhdkeDhltB-7n850VoyA', 'TOXICS', 'A2:A').then(console.info);

    bot.use(
        session({
            initial: createInitialSessionData,
            storage,
        }),
    );

    // bot.command('photo', async (context) => {
    //     const { id } = context.chat;
    //     const photo = new InputFile('./shrek.jpeg');
    //     await bot.api.setChatPhoto(id, photo);
    //     await bot.api.setChatDescription(id, 'description');
    // });

    const { swindlersTensorService } = await initSwindlersTensorService();
    const { strategyDelegatorService } = initStrategyDelegatorService();

    /**
     * START MENU logic
     */
    const { startComposer, startMenu, reconfigureMenu } = initStartComposer();

    bot.use(startMenu);
    bot.use(reconfigureMenu);
    bot.use(startComposer);

    /**
     * FINISH command logic
     */
    bot.command(
        'finish',
        async (context, next) => botActivatedMiddleware(context, next),
        async (context, next) => onlyAdmin(context, next),
        async (context) => {
            context.session.isConfigured = false;
            context.session.usersStats = new Map<string, number>();
            await context.reply('як скажеш, цвіль. але ви без мене тут просто пропадете...');
        },
    );
    /**
     * HELP command logic
     */
    bot.command('help', async (context) => {
        await context.reply(
            '😎\nYou can perform the next commands:\n\n' +
                '/start - robot will be activated in the chat, write about giving permissions to him\n' +
                '/help- show list of available commands\n' +
                '/report - report inappropriate message and ban user (ADMIN)\n' +
                '/mute - mute user for inappropriate message and ban for a couple of hours (ADMIN)\n' +
                '/contact- contact customer support.\n',
        );
    });
    /**
     * CONTACT command logic
     */
    bot.command(
        'contact',
        async (context, next) => botActivatedMiddleware(context, next),
        async (context) => {
            await context.reply(
                '😎\nYou can write us:\n\n' +
                    '@proc1v_n - Назар\n' +
                    '@katia_boguslavska - Катя\n' +
                    '@tea_sotea - Соня\n' +
                    '@Di_chiK - Діма\n',
            );
        },
    );
    /**
     * MUTE command logic
     */
    const { muteComposer } = initMuteComposer();
    bot.use(muteComposer);
    /**
     * REPORT command logic
     */
    bot.command(
        'report',
        async (context, next) => botActivatedMiddleware(context, next),
        async (context, next) => onlyAdmin(context, next),
        async (context) => {
            if (!context.msg || context.msg.reply_to_message === undefined) {
                await context.reply('You can use /report as reply to toxic/offensive message.');
                return;
            }
            await banUserMiddleware(context);
            await context.deleteMessage();
        },
    );
    /**
     * UNBAN command logic
     */
    bot.command(
        'unban',
        async (context, next) => botActivatedMiddleware(context, next),
        async (context, next) => onlyAdmin(context, next),
        async (context) => {
            // const username = context.match;
            // const chatId = context.msg.chat.id;
            // await context.api.unbanChatMember(chatId, )
            console.info(context.msg.text);
            return context.reply('ok, unbanned.');
        },
    );

    const { messageComposer, messageMenu } = initMessageComposer(swindlersTensorService, strategyDelegatorService);
    bot.use(messageMenu);
    bot.use(messageComposer);
    /**
     * POLL events logic
     */
    bot.on('poll', async (context) => {
        await context.pinChatMessage(Number(context.poll.id));
        console.info(context.poll.id);
        const options = context.poll?.options;
        const totalVoterCount: number = context.poll?.total_voter_count;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const yesOptionNumber: number = options.at(0)?.voter_count;
        const shouldRemove = yesOptionNumber / totalVoterCount;
        if (shouldRemove > 0.1) {
            const question = context.poll.question.toString();
            const userId = question.slice(question.indexOf('['), question.indexOf(']'));
            await context.kickChatMember(Number(userId));
        }
    });

    /**
     * ERROR HANDLING
     */
    bot.catch((error) => {
        console.error(error);
    });

    /**
     * APPLICATION START
     */
    await bot.start({
        onStart: () => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const botInfo = bot.me as UserFromGetMe;
            console.info(`Bot @${botInfo.username} started!`, new Date().toString());
        },
    });
})().catch((error) => {
    console.error(error);
    console.error('Bot has been stopped!');
});
