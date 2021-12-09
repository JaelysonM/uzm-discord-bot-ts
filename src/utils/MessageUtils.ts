import { TextChannel, Channel, Message } from "discord.js";

export async function sendMessageAndDelete(channel: Channel, message: any, timeout: number): Promise<Message> {
  try {
    const m = await (channel as TextChannel).send(message);
    try {
      m.delete({
        timeout: timeout
      }).then(() => { }).catch(() => { });
    } catch (ignore) { }
    return m;
  } catch (err) {
    return Promise.reject(err);
  }
}