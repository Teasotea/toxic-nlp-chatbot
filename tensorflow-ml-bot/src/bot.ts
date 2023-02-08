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
    const { swindlersTensorService } = initSwindlersTensorService();

    const bot = new Bot(process.env.BOT_TOKEN!);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // const trainingChatMenu = new Menu();
    //
    // bot.use(trainingChatMenu);

    bot.command('start', (context) => {
        return context.reply('🧙‍ Дороу! Летс окультурювати вас, токсична спільното!');
    });

    const { composer, messageMenu } = initMessageComposer(swindlersTensorService);

    bot.use(messageMenu);

    bot.use(composer);

    bot.filter((context) => context.chat?.type == 'private').on('message', async (context) => {
        const predictedResult = swindlersTensorService.predict(context.msg.text || '');

        if (predictedResult.score >= 0.85) {
            console.info('ok');
            await context.reply(`@${context.msg.from.username as string} та ти реально токсік 🤢, за таке й не гріх забанити ❌`);
        } else if (predictedResult.score > 0.75) {
            console.info('ok');
            await context.reply(`@${context.msg.from.username as string} не лайся, бо я тобі в вічі плюну, — говорила баба Кайдашиха 😤`);
        }
    });

    bot.on('poll', (context) => {
        // context.msg?.reply_to_message;
        // const options = context.poll?.options;
        // const totalVoterCount = context.poll?.total_voter_count;
        // const yesOption = options?.filter((option) => option.text === 'yes');
        // const shouldRemove = yesOption?.at(0).voter_count / totalVoterCount;
        // if (shouldRemove > 10) {
        //     context
        // }
        // TODO take username from text and ban user
        console.info(context.poll?.options);
        console.info();
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
