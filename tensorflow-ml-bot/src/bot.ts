import * as process from 'node:process';
import dotenv from 'dotenv';
import { Bot, session } from 'grammy';
import type { UserFromGetMe } from 'grammy/out/types';
import { RedisAdapter } from '@grammyjs/storage-redis';
import IORedis from 'ioredis';

import { initMuteComposer } from './composers/mute.composer';
import type { MyContext } from './composers';
import { createInitialSessionData, initMessageComposer, initStartComposer } from './composers';
import { onlyAdmin } from './middlewares';
import { initSwindlersTensorService } from './services';

dotenv.config();

// eslint-disable-next-line no-void
void (async () => {
    const redisInstance = new IORedis(process.env.REDIS_CONNECTION!);
    // create storage
    const storage = new RedisAdapter({ instance: redisInstance });

    const { swindlersTensorService } = await initSwindlersTensorService();

    const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);

    /**
     * START MENU logic
     */
    const { startComposer, startMenu, reconfigureMenu } = initStartComposer();

    bot.use(
        session({
            initial: createInitialSessionData,
            storage: storage,
            // storage: new MemorySessionStorage(), //
        }),
    );
    bot.use(startMenu);
    bot.use(reconfigureMenu);
    bot.use(startComposer);
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
        async (context, next) => onlyAdmin(context, next),
        async (context) => {
            if (context.msg.reply_to_message === undefined) {
                await context.reply('You can use /report as reply to toxic/offensive message.');
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,camelcase
            const { from } = context.msg.reply_to_message!;

            if (from !== undefined) {
                console.info(`@${from.username as string} was banned.`);
                await context.banChatMember(from.id);
            }
        },
    );

    /**
     * UNBAN command logic
     */
    bot.command(
        'unban',
        async (context, next) => onlyAdmin(context, next),
        async (context) => {
            console.info(context.msg.text);
            return context.reply('ok, unbanned.');
        },
    );

    const { messageComposer, messageMenu } = initMessageComposer(swindlersTensorService);
    bot.use(messageMenu);
    bot.use(messageComposer);

    /**
     * POLL events logic
     */
    bot.on('poll', (context) => {
        const options = context.poll?.options;
        const totalVoterCount: number = context.poll?.total_voter_count;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const yesOptionNumber: number = options.at(0)?.voter_count;
        const shouldRemove = yesOptionNumber / totalVoterCount;
        if (shouldRemove > 0.1) {
            const question = context.poll.question.toString();
            const userId = question.slice(question.indexOf('['), question.indexOf(']'));
            console.info(context.banChatMember(Number(userId)));
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
})().catch(() => {
    console.error('Bot has been stopped!');
});
