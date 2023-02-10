import type { Menu } from "@grammyjs/menu";
import type { MyContext } from '../../../composers';
import type { ActionHandlerInterface } from '../action-handler.interface';
import type { TensorResult } from '../../../types';

export class BanStrategyService implements ActionHandlerInterface {
    async handle(context: MyContext, predictedResult: TensorResult, menu?: Menu<MyContext>): Promise<void> {
        if (context.msg?.from === undefined) {
            console.info('Message from is undefined :(');
            return;
        }
        // eslint-disable-next-line camelcase
        const { text, message_id } = context.msg;
        if (predictedResult.score >= 0.9) {
            await context.deleteMessage();
            await context.reply(
                `score: ${predictedResult.score}, message: ${text || ''} @${
                    context.msg.from.username as string
                } та ти реально токсік 🤢, за таке й не гріх забанити ❌ \nЗаспокійся трішки`,
            );
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
