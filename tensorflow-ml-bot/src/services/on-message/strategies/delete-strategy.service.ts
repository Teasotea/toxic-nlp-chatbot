import type { Menu } from '@grammyjs/menu';

import type { MyContext } from '../../../composers';
import type { TensorResult } from '../../../types';
import type { ActionHandlerInterface } from '../action-handler.interface';

export class DeleteStrategyService implements ActionHandlerInterface {
    async handle(context: MyContext, predictedResult: TensorResult, menu?: Menu<MyContext>): Promise<void> {
        if (predictedResult.score >= 0.85 && menu) {
            await context.deleteMessage();
        }
    }
}
