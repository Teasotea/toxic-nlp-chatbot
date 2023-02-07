import * as process from 'node:process';
import dotenv from 'dotenv';
import { Bot } from 'grammy';
import type { UserFromGetMe } from 'grammy/out/types';

// eslint-disable-next-line import/no-unresolved
import { initSwindlersTensorService } from './services';

dotenv.config();

// eslint-disable-next-line no-void
void (async () => {
    const { swindlersTensorService } = initSwindlersTensorService();

    const bot = new Bot(process.env.BOT_TOKEN!);

    // bot.use(trainingChatMenu);

    // You can now register listeners on your bot object `bot`.
    // grammY will call the listeners when users send messages to your bot.

    bot.command('start', (context) => {
        console.info(context);
        return context.reply('🧙‍ Дороу! Летс окультурювати вас, токсична спільното!');
    });

    bot.on('message', async (context) => {
        const predictedResult = swindlersTensorService.predict(context.msg.text || '');

        if (predictedResult.score >= 0.85) {
            console.info('ok');
            await context.deleteMessage();
            await context.reply(`@${context.msg.from.username as string} заспокійся, бо забанимо! 👿`);
        } else if (predictedResult.score > 0.75) {
            console.info('ok');
            await context.reply('Воу! Шо почалося!', {
                reply_to_message_id: context.msg.message_id,
                // reply_markup: trainingChatMenu,
            });
        }
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
