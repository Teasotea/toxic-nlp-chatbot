import type { Menu } from '@grammyjs/menu';

import type { MyContext } from '../../../composers';
import type { TensorResult } from '../../../types';
import type { ActionHandlerInterface } from '../action-handler.interface';

export class CollectingStatsStrategyService implements ActionHandlerInterface {
    async handle(context: MyContext, predictedResult: TensorResult, menu?: Menu<MyContext>): Promise<void> {
        console.info(`collected stats with result=${predictedResult.score}`);
        if (menu !== undefined) {
            await context.reply('stats collected');
        }
    }
}
