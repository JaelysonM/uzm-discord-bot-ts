import CacheHandler from "../../handlers/CacheHandler";
import IDatabase from "../solutions/IDatabase";

export default class AccountCache extends CacheHandler {
  get defaultData(): any {
    return {
      ticketTimestamp: 0,
      muteTimestamp: 0,
      suggestionTimestamp: 0,
      minecraft: {
        nickname: null,
        uuid: null
      },
      punishTimes: 0,
    };
  }
  constructor(database: IDatabase) {
    super(database);
  }
  private static _instance: AccountCache;


  static instance(database?: IDatabase): AccountCache {
    if (!this._instance) {
      if (database != undefined)
        this._instance = new AccountCache(database);
    }
    return this._instance;
  }

}