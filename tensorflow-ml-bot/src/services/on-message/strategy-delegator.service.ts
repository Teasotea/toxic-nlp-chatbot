import type { Menu } from '@grammyjs/menu';

import type { MyContext } from '../../composers';
import type { TensorResult } from '../../types';
import { ActionType } from '../../types';

import type { ActionHandlerInterface } from './action-handler.interface';
import { BanStrategyService, CollectingStatsStrategyService, DeleteStrategyService } from './strategies';

export class StrategyDelegatorService {
    strategies: Map<ActionType, ActionHandlerInterface>;

    constructor() {
        this.strategies = new Map<ActionType, ActionHandlerInterface>();
    }

    loadStrategies() {
        this.strategies.set(ActionType.DELETE, new DeleteStrategyService());
        this.strategies.set(ActionType.NOTHING, new CollectingStatsStrategyService());
        this.strategies.set(ActionType.BAN, new BanStrategyService());
    }

    async performStrategy(context: MyContext, actionType: ActionType, predictedResult: TensorResult, menu?: Menu<MyContext>) {
        const actionHandler: ActionHandlerInterface | undefined = this.strategies.get(actionType);
        if (actionHandler === undefined) {
            console.info(`No ${actionType} type`);
            return;
        }
        console.info(actionHandler);
        await actionHandler.handle(context, predictedResult, menu);
    }
}

export const initStrategyDelegatorService = () => {
    const strategyDelegatorService = new StrategyDelegatorService();
    strategyDelegatorService.loadStrategies();

    return { strategyDelegatorService };
};
