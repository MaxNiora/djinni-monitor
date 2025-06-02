import TelegramBot from "node-telegram-bot-api";
import { prisma } from "../db/client";
import { buildKeyboard, toggleStack } from "./stacks";

export const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await prisma.user.upsert({ where: { chatId }, create: { chatId }, update: {} });

  await bot.sendMessage(
    chatId,
    "Обери технології, які цікавлять (натисни вдруге, щоб прибрати):",
    { reply_markup: { inline_keyboard: buildKeyboard() } }
  );
});

bot.on("callback_query", async (cq) => {
  if (!cq.data) return;
  const [action, payload] = cq.data.split(":");
  const chatId = cq.message!.chat.id;

  if (action === "toggle") {
    const added = await toggleStack(chatId, payload);
    bot.answerCallbackQuery(cq.id, {
      text: added ? `Додано ${payload}` : `Вимкнено ${payload}`,
      show_alert: false
    });
  }

  if (action === "done") {
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: chatId,
      message_id: cq.message!.message_id
    });
    bot.answerCallbackQuery(cq.id, { text: "Підписка збережена!" });
  }
});
