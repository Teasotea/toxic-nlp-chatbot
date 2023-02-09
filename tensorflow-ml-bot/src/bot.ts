import * as process from 'node:process';
import dotenv from 'dotenv';
import { Bot } from 'grammy';
import type { UserFromGetMe } from 'grammy/out/types';

import { initMessageComposer } from './composers';
import { onlyAdmin } from './middlewares';
// import { trainingChatComposer } from './composers';
// eslint-disable-next-line import/no-unresolved
import { initSwindlersTensorService } from './services';

dotenv.config();

// eslint-disable-next-line no-void
void (async () => {
    const { swindlersTensorService } = await initSwindlersTensorService();

    const bot = new Bot(process.env.BOT_TOKEN!);

    bot.command('start', (context) => context.reply('🧙‍ Дороу! Летс окультурювати вас, токсична спільното!'));

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

    const { messageComposer, messageMenu } = initMessageComposer(swindlersTensorService);
    bot.use(messageMenu);
    bot.use(messageComposer);

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

    bot.catch((error) => {
        console.error(error);
    });

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
