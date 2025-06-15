import { prisma } from "../db/client";
import TelegramBot, { InlineKeyboardButton } from "node-telegram-bot-api";

export const STACKS = ["Node.js", "Python", "Java", "Ruby", "PHP", "Android", "Rust"];

export function buildKeyboard(): InlineKeyboardButton[][] {
  const kbd = STACKS.map((s) => [{ text: s, callback_data: `toggle:${s}` }]);
  kbd.push([{ text: "✅ Готово", callback_data: "done" }]);
  return kbd;
}

export async function toggleStack(chatId: number, stackName: string) {
  const stack = await prisma.stack.upsert({
    where: { name: stackName },
    create: { name: stackName },
    update: {}
  });

  const user = await prisma.user.findUnique({
    where: { chatId },
    include: { stacks: true }
  });

  const subscribed = user!.stacks.some((s) => s.name === stackName);

  await prisma.user.update({
    where: { chatId },
    data: {
      stacks: {
        [subscribed ? "disconnect" : "connect"]: { id: stack.id }
      }
    }
  });

  return !subscribed;        // true ⇒ підписався, false ⇒ відписався
}
