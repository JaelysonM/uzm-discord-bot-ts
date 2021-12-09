import Bot from "../../containers/Bot";
import Registration from "../../containers/Registration";
import Ticket from "../../containers/Ticket";
import SettingsCache from "../../database/cache/SettingsCache";
import EventHandler from "../../handlers/EventHandler";
import TimeFormatter from "../../utils/TimeFormatter";


const randomRichPresence = (params: any) => [`📃 | Online a ${params.duration}.`, `na ${params.url}`][Math.floor(Math.random() * 2)]

export default class CommandEvents {

  @EventHandler('ready')
  async onBotReady() {
    const instance = Bot.instance;
    console.log(`\n\x1b[32m✔\x1b[0m  \x1b[46m\x1b[30m discord.js + (.ts) \x1b[0m Bot logged successfully, with ${instance.client.guilds.cache.size} servers e com ${instance.client.users.cache.size} members.`);
    setInterval(() => {
      const rp = randomRichPresence({
        url: 'redesteel.com',
        duration: TimeFormatter.BR_TIMER.format(instance.client.uptime as any)
      })
      instance.client.user?.setActivity(rp, { type: 'PLAYING' })
    }, 1000 * 10)

    instance.client.guilds.cache.forEach(g => {
      g.channels.cache.find(g => g.name == "cfginitial")?.delete();
    })
    const Guilds = Bot.instance.client.guilds.cache.map(guild => guild.id);
    for (let g of Guilds) {
      await SettingsCache.instance().getCache(g);
    }
    Registration.fetchMessages();
    Ticket.updatePainel();
    Ticket.ticketsCleanTask();

  }
}