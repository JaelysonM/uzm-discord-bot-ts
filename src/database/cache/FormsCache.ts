import CacheHandler from "../../handlers/CacheHandler";
import IDatabase from "../solutions/IDatabase";

export default class FormsCache extends CacheHandler {
  get defaultData(): any {
    return {
      minecraft: {
        nickname: null,
        uuid: null
      },
      role: null,
      user: null,
      guild: null
    };
  }
  constructor(database: IDatabase) {
    super(database);
  }
  private static _instance: FormsCache;

  static instance(database?: IDatabase): FormsCache {
    if (!this._instance) {
      if (database != undefined)
        this._instance = new FormsCache(database);
    }
    return this._instance;
  }

}