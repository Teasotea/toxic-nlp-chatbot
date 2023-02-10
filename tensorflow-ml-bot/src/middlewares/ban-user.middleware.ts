import type { MyContext } from '../composers';

export const banUserMiddleware = async (context: MyContext) => {
    if (!context.msg || context.msg.reply_to_message === undefined) {
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,camelcase
    const { from } = context.msg.reply_to_message;
    if (from === undefined) {
        console.info('from was not defined.');
        return;
    }
    await context.banChatMember(from.id);
    await context.reply(`@${from.username as string} was banned.`);
};
