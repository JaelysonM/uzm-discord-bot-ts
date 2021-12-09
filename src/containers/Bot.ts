require('dotenv').config();
import { Client } from 'discord.js';
import * as fs from 'fs';
import path from 'path';

import { ICommand } from '../interfaces/CommandInterfaces';
import HandleMethod from '../interfaces/EventHandlerInterfaces';
import { ArgsOf } from '../classes/types/ArgsOf';
import { DiscordEvents } from '../classes/types/DiscordEvents';
import PouchDB from '../database/solutions/PouchDB';
import AccountCache from '../database/cache/AccountCache';
import SettingsCache from '../database/cache/SettingsCache';
import IDatabase from '../database/solutions/IDatabase';
import { runCleanTask } from './Punish';
import FormsCache from '../database/cache/FormsCache';
import CacheHandler, { CacheHandlers } from '../handlers/CacheHandler';


export interface IBot {
  readonly commands: ICommand[];
  readonly client: Client;
  readonly databases: IDatabase[];
  start(commandsPath: string, eventsPath: string): void;
}

export default class Bot implements IBot {

  public get client() { return this._client; }


  public get commands(): ICommand[] { return this._commands }

  public get databases() { return this._databases }

  private readonly _commands: ICommand[] = []
  private readonly _listeners: HandleMethod[] = [];
  private _databases: IDatabase[] = [];
  private _client: Client;

  private static _instance: Bot;

  static get instance() {
    if (!this._instance) {
      this._instance = new Bot();
    }
    return this._instance;
  }

  constructor() {
    this._client = new Client({
      disableMentions: "everyone"
    });
    this._client.login(process.env.TOKEN)
    this._databases.push(new PouchDB('databases/accounts'), new PouchDB('databases/settings'), new PouchDB('databases/forms'))
  }

  public async start(commandsPath: string, eventsPath: string) {
    await this.fetchCommands(commandsPath);
    await this.fetchListeners(eventsPath);
    this.registerListeners();
    this.registerCaches();

    runCleanTask();
  }

  registerCaches() {
    AccountCache.instance(this.getDatabase('databases/accounts'));
    SettingsCache.instance(this.getDatabase('databases/settings'));
    FormsCache.instance(this.getDatabase('databases/forms'));
  }
  registerListeners() {
    this._listeners.forEach(value => {
      this._client.on(value.eventKey, async (...params: ArgsOf<DiscordEvents>[]) => value.getMethod(params))
    })
  }
  addHandleMethod(handled: HandleMethod) {
    this._listeners.push(handled);
  }
  getDatabase(databaseName: string): IDatabase | undefined {
    return this._databases.find(d => d.databaseName === databaseName)
  }
  public static fromHandler(handler: CacheHandlers): CacheHandler {
    switch (handler) {
      case 'settings':
        return SettingsCache.instance();
      case 'forms':
        return FormsCache.instance();
      case 'account':
        return AccountCache.instance();
    }
  }

  private async fetchCommands(fpath: string) {
    const file = await fs.readdirSync(path.join(__dirname, fpath));
    console.log(`\n\x1b[34m⟳\x1b[0m  \x1b[46m\x1b[30m discord.js + (.ts) \x1b[0m Trying to load commands.\n`);
    file.filter(f => f.endsWith('.ts') || f.endsWith('.js')).forEach(file => {
      try {
        console.log(`\x1b[32m  ⤷\x1b[0m ${file} loaded`);
        this._commands.push(new (require(path.join(__dirname, fpath, file)).default) as ICommand)
      } catch (err) {
        console.error(`\x1b[31m  ⤷\x1b[0m ${file} isn't loaded (InvalidType error)`)
      }
    })
  }

  private async fetchListeners(fpath: string) {
    const file = await fs.readdirSync(path.join(__dirname, fpath));
    console.log(`\n\x1b[34m⟳\x1b[0m  \x1b[46m\x1b[30m discord.js + (.ts) \x1b[0m Trying to load handlers.\n`);
    file.filter(f => f.endsWith('.ts') || f.endsWith('.js')).forEach(file => {
      try {
        console.log(`\x1b[32m  ⤷\x1b[0m ${file} loaded`);
        new (require(path.join(__dirname, fpath, file)).default);
      } catch (err) {
        console.error(`\x1b[31m  ⤷\x1b[0m ${file} isn't loaded (InvalidType error)`)
      }
    })
  }
}