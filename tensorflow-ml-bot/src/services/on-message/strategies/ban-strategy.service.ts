import type { Menu } from '@grammyjs/menu';

import type { MyContext } from '../../../composers';
import { banUserMiddleware } from '../../../middlewares/ban-user.middleware';
import type { TensorResult } from '../../../types';
import type { ActionHandlerInterface } from '../action-handler.interface';
import { googleSheetService } from '../../sheet/google-sheet.service';

export class BanStrategyService implements ActionHandlerInterface {
    async handle(context: MyContext, predictedResult: TensorResult, menu?: Menu<MyContext>): Promise<void> {
        if (context.msg?.from === undefined) {
            console.info('Message from is undefined :(');
            return;
        }
        // eslint-disable-next-line camelcase
        const { text, message_id } = context.msg;

        const range = predictedResult.isToxic ? 'B2:B' : 'A2:A';

        await googleSheetService.appendToSheetSafe('1a8hnDONCDw6-beeXiKiC0JpWhdkeDhltB-7n850VoyA', 'TOXICS', range, text || '');


        if (predictedResult.score >= 0.9) {
            const { username } = context.msg.from;
            if (!username) {
                console.info('username is unknown in handle method.');
                return;
            }
            // const stats: Map<string, number> = context.session.usersStats;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const stats: Map<string, number> = new Map(Object.entries(context.session.usersStats));
            if (stats.get(username) === 2) {
                await context.reply(`$Та ти реально токсік 🤢, за таке й не гріх забанити ❌ \n`);
                await banUserMiddleware(context);
            } else {
                await context.reply(`🤢+1 до твоєї статистики бидла. Продовжуй в тому ж дусі, ти все для того маєш. \n`);
                console.info(context.session.usersStats);
                if (stats.get(username) === undefined) {
                    stats.set(username, 1);
                } else {
                    const value = stats.get(username) || 1;
                    stats.set(username, value + 1);
                }
                context.session.usersStats = stats;
                console.info(context.session.usersStats);
            }
            await context.deleteMessage();
        } else if (predictedResult.score > 0.5 && menu) {
            await context.reply(
                `${predictedResult.score} @${
                    context.msg.from.username as string
                } не лайся, бо я тобі в вічі плюну, — говорила баба Кайдашиха 😤\``,
                {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,camelcase
                    reply_to_message_id: message_id,
                    reply_markup: menu,
                },
            );
            // await context.deleteMessage();
            // await context.reply('Ваше повідомлення видалено, бо ви токсік, ідіть поплачте 👿');
        }
    }
}
