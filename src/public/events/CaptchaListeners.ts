import { Guild, Message, TextChannel } from 'discord.js';
import { ArgsOf } from '../../classes/types/ArgsOf';
import Captcha from '../../containers/Captcha';
import SettingsCache from '../../database/cache/SettingsCache';
import EventHandler from '../../handlers/EventHandler';
import IssueManager from '../../managers/IssueManager';


export default class CaptchaListener {

  @EventHandler('messageReactionAdd')
  async onCaptchaReaction([messageReaction, user]: ArgsOf<'messageReactionAdd'>) {
    if (!messageReaction) return;
    if (messageReaction.message.guild == null || messageReaction.message.channel == null || user.bot) return;
    const cache = SettingsCache.instance();

    switch (messageReaction.emoji.name) {
      case '✅':
        const member = messageReaction.message.guild.members.cache.find((member) => member.id === user.id);
        if (!member) return;

        const settings = await cache.getCache(member.guild.id);
        if (settings.channels.captcha != messageReaction.message.channel.id) return;
        if (settings.messages.captcha != messageReaction.message.id) return;

        const commandIssues = await new IssueManager(messageReaction.message.guild as Guild).finder().issues(async (obj, objs) => {
          if (!member.guild.roles.cache.get(settings.roles.member)) {
            objs.push('roles.member');
            obj = Object.assign(obj, {
              roles: {
                member: null
              }
            });

          } if (!member.guild.channels.cache.get(settings.channels.welcome)) {
            objs.push('channels.welcome');
            obj = Object.assign(obj, {
              channels: {
                welcome: null
              }
            });
          }
          if (!member.guild.channels.cache.get(settings.channels.captcha)) {
            objs.push('channels.captcha', 'messages.captcha');
            obj = Object.assign(obj, {
              channels: {
                captcha: null
              },
              messages: {
                captcha: null
              }
            });
          }
        }, (settings: any) => {
          if (settings.type != 'PRINCIPAL') {
            return true;
          }
          return false;
        });

        if (commandIssues) return;

        if (messageReaction.message.channel.id === settings.channels.captcha) {
          if (messageReaction.message.id === settings.messages.captcha) {
            if (member.roles.cache.has(settings.roles.member))
              return;
            const captcha = Captcha.build(member, messageReaction.message.guild, messageReaction.message.channel as TextChannel, settings.captchaType)
            await captcha.init();

          }
        }
        break;
    }
  }

  @EventHandler('guildMemberAdd')
  async onGuildMemberAnd([member]: ArgsOf<'guildMemberAdd'>) {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(member.guild.id);

    const commandIssues = await new IssueManager(member.guild as Guild).finder().issues(async (obj, objs) => {
      if (!member.guild.roles.cache.get(settings.roles.member)) {
        objs.push('roles.member');
        obj = Object.assign(obj, {
          roles: {
            member: null
          }
        });
      } if (!member.guild.channels.cache.get(settings.channels.captcha)) {
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
        const messages = await (member.guild.channels.cache.get(settings.channels.captcha) as TextChannel)
          .messages.fetch(settings.messages.captcha);
        if (!messages) {
          objs.push('messages.captcha');
          obj = Object.assign(obj, {
            messages: {
              captcha: null
            }
          });
        }
      }
    }, (settings: any) => {
      if (settings.type != 'PRINCIPAL') {
        return true;
      }
      return false;
    });

    if (commandIssues) return;

    await (member.guild.channels.cache.get(settings.channels.captcha) as TextChannel)
      .messages.fetch(settings.messages.captcha).then(async (message: Message) => {
        await message.reactions.cache.get('✅')?.users.remove(member.user);
      }).catch((err) => { });
  }


}