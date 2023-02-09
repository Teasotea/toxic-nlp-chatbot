import * as process from 'node:process';
import dotenv from 'dotenv';
import { Bot } from 'grammy';
import type { UserFromGetMe } from 'grammy/out/types';

import { initMessageComposer } from './composer';
// import { trainingChatComposer } from './composer';
// eslint-disable-next-line import/no-unresolved
import { initSwindlersTensorService } from './services';

dotenv.config();

// eslint-disable-next-line no-void
void (async () => {
    const { swindlersTensorService } = await initSwindlersTensorService();

    const bot = new Bot(process.env.BOT_TOKEN!);

    bot.command('start', (context) => context.reply('🧙‍ Дороу! Летс окультурювати вас, токсична спільното!'));

    const { messageComposer, messageMenu } = initMessageComposer(swindlersTensorService);
    bot.use(messageMenu);
    bot.use(messageComposer);

    // bot.filter((context) => context.chat?.type !== 'private').on('message', async (context) => {
    //     const predictedResult = await swindlersTensorService.predict(context.msg.text || '');
    //
    //     if (predictedResult.score >= 0.85) {
    //         console.info('ok');
    //         await context.reply(`@${context.msg.from.username as string} та ти реально токсік 🤢, за таке й не гріх забанити ❌`);
    //     } else if (predictedResult.score > 0.75) {
    //         console.info('ok');
    //         await context.reply(`@${context.msg.from.username as string} не лайся, бо я тобі в вічі плюну, — говорила баба Кайдашиха 😤`);
    //     }
    // });

    bot.filter((context) => context.chat?.type !== 'private').on('poll', (context) => {
        // context.msg?.reply_to_message;
        const options = context.poll?.options;
        const totalVoterCount: number = context.poll?.total_voter_count;
        // const yesOption = options?.find((option) => option.text === 'yes');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const yesOptionNumber: number = options.at(0)?.voter_count;
        const shouldRemove = yesOptionNumber / totalVoterCount;
        if (shouldRemove > 0.1) {
            // context.banChatMember(context.msg?.reply_to_message)

            console.info(context.poll.question);
        }
        // TODO take username from text and ban user
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
