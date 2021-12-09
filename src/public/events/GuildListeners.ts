import { Guild, Message, MessageEmbed, TextChannel, User } from 'discord.js';
import { ArgsOf } from '../../classes/types/ArgsOf';
import Bot from '../../containers/Bot';
import Registration from '../../containers/Registration';
import SettingsCache from '../../database/cache/SettingsCache';
import EventHandler from '../../handlers/EventHandler';
import IssueManager from '../../managers/IssueManager';
import TimeFormatter from '../../utils/TimeFormatter';

export default class GuildListeners {

  public static presenceQueue: User[] = [];

  @EventHandler('guildDelete')
  onGuildDelete([guild]: ArgsOf<'guildDelete'>) {
    const cache = SettingsCache.instance();
    cache.deleteCache(guild.id);
  }

  @EventHandler('presenceUpdate')
  async onAntiSpam([presence]: ArgsOf<'presenceUpdate'>) {
    if (presence != undefined) {
      if (presence.user != null) {
        if (GuildListeners.presenceQueue.includes(presence.user)) return;
        const customStatus = presence.activities.find(a => a.type == 'CUSTOM_STATUS');
        if (customStatus && customStatus.state) {

          const guilds: Guild[] = [];
          const cache = SettingsCache.instance();
          if (customStatus.state.search(`/((?:discord\.gg|discordapp\.com|www\.|htStp|invite))/g`) >= 0) {
            (await SettingsCache.instance().list(true)).forEach(async (settings: any, key: any) => {
              if (settings.type != 'PRINCIPAL') return;
              if (!cache.isReady(key)) return;
              const guild = Bot.instance.client.guilds.cache.get(key);
              if (!guild) return;
              const member = guild?.members.cache.find((member) => member.id === presence.userID);
              if (!member) return;

              const commandIssues = await new IssueManager(guild as Guild).finder().issues(async (obj, objs) => {
                if (!guild?.roles.cache.get(settings.roles.spam)) {
                  objs.push('roles.spam');
                  obj = Object.assign(obj, {
                    roles: {
                      spam: null
                    }
                  });
                } if (!guild?.roles.cache.get(settings.roles.member)) {
                  objs.push('roles.member');
                  obj = Object.assign(obj, {
                    roles: {
                      member: null
                    }
                  });
                } if (!guild?.channels.cache.get(settings.channels.captcha)) {
                  objs.push('channels.captcha', 'messages.captcha');
                  obj = Object.assign(obj, {
                    channels: {
                      captcha: null
                    },
                    messages: {
                      captcha: null
                    }
                  });
                } else {
                  if (await (member.guild.channels.cache.get(settings.channels.captcha) as TextChannel)
                    .messages.fetch(settings.messages.captcha)) {
                    objs.push('messages.captcha');
                    obj = Object.assign(obj, {
                      messages: {
                        captcha: null
                      }
                    });
                  }
                }
              });

              if (commandIssues) return;




              if (!member.hasPermission('ADMINISTRATOR')) {
                guilds.push(guild)
                member.roles.add(settings.roles.spam);
                member.roles.remove(settings.roles.member);
              }

              if (presence.status == 'offline') return;
              if (member.roles.cache.has(settings.roles.spam)) {
                if (member.hasPermission('ADMINISTRATOR'))
                  member.roles.add(settings.roles.member);
                else
                  await (member.guild.channels.cache.get(settings.channels.captcha) as TextChannel)
                    .messages.fetch(settings.messages.captcha).then(async (message: Message) => {
                      await message.reactions.cache.get('✅')?.users.remove(member.user);
                    }).catch((err) => { });
                member.roles.remove(settings.roles.spam);
              }
            });
            if (guilds.length > 0) {
              const index = GuildListeners.presenceQueue.push(presence.user);
              try {
                await presence.user.send(new MessageEmbed().setThumbnail('https://media1.giphy.com/media/BT4ygwV9vgwAU/giphy.gif?cid=ecf05e47e912f692eb945be82987cdfc10414cf3e9709a37&rid=giphy.gif').setTitle('Punição! - __Divulgação__').setColor('#525252')
                  .setFooter(`A punição foi aplicada ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`)
                  .setDescription(` || ${presence.user} ||
    
                Em nosso sistema é feito uma averiguação de \`\`anti-divulgação\`\` pelos status, por tanto foi averiguado que você está com uma mensagem proibida em nosso sistema.\n\nPara a punição ser revogada, basta retirar o \`\`status personalizado!\`\``));
              } catch (error) { }
              GuildListeners.presenceQueue.splice(index, 1)
            }
          }
        }
      }
    }
  }
}