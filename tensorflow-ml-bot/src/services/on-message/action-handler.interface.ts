import type { Menu } from '@grammyjs/menu';

import type { MyContext } from '../../composers';
import type { TensorResult } from '../../types';

export interface ActionHandlerInterface {
    handle(context: MyContext, predictedResult?: TensorResult, menu?: Menu<MyContext>): Promise<void>;
}
