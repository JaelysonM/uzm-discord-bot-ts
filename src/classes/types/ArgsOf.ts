import { ClientEvents, GuildMember, PartialGuildMember, Role } from "discord.js";


export interface CustomEvents extends ClientEvents {
  guildMemberRoleAdded: [GuildMember | PartialGuildMember, Role];
  guildMemberRoleRemoved: [GuildMember | PartialGuildMember, Role];
  guildMemberNicknameUpdated: [GuildMember | PartialGuildMember, string, string];
  guildMemberUsernameUpdated: [GuildMember | PartialGuildMember, string, string];
}

type DiscordEvents = CustomEvents;

export type ArgsOf<K extends keyof DiscordEvents> = DiscordEvents[K];