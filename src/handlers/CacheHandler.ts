import IDatabase from "../database/solutions/IDatabase";
import { objectAssign } from "../utils/Functions";

interface ICacheHandler {
  cache: Map<String, Object>
  database: IDatabase,
  createCache(uniqueId: string): Promise<Object>
  updateCache(uniqueId: string, data: Object, save?: boolean): Promise<void>,
  getCache(uniqueId: string): Promise<Object>,
  saveCache(uniqueId: string): Promise<void>

}
export class ExtendedData {
  action?: ActionsEnum
  value: any
}
export enum ActionsEnum {
  ADDICTION = 'addiction',
  SUBTRACTION = 'subtraction',
  DIVISION = 'division',
  MULTIPLICATION = 'multiplication'
}
export default abstract class CacheHandler implements ICacheHandler {

  public get database(): IDatabase { return this._database };
  public get cache(): Map<String, Object> { return this.cache; };


  private _database: IDatabase;
  private _cache: Map<String, Object>;

  abstract get defaultData(): any

  constructor(database: IDatabase) {
    this._database = database;
    this._cache = new Map<String, Object>()

  }

  async saveCache(uniqueId: any) {
    const cache = this._cache.get(uniqueId) as any;
    if (cache != undefined) {
      Object.keys(cache).forEach((key: any) => {
        if (!Object.keys(this.defaultData).includes(key)) {
          delete cache[key]
        }

      })
      this._database.update(uniqueId, Object.assign(this.defaultData, cache));
    }
  }
  async deleteCache(uniqueId: any) {
    this._cache.delete(uniqueId);
    this._database.delete(uniqueId)
  }
  async getCache(uniqueId: any, create: boolean = true): Promise<any> {
    try {
      const cache = this._cache.get(uniqueId);
      if (cache != undefined) {
        return cache;
      }
      const fetched = await this._database.fetch(uniqueId);
      const assigned = Object.assign(this.defaultData, fetched.data);
      if (create)
        this._cache.set(uniqueId, assigned);
      return assigned;
    } catch (err) {
      if (create)
        return this.createCache(uniqueId);
      else
        return undefined;
    }
  }
  async createCache(uniqueId: any): Promise<Object> {
    this._cache.set(uniqueId, this.defaultData);
    this._database.set(uniqueId, this.defaultData);
    return this.defaultData;
  }

  async list(cache: boolean = false): Promise<Object[] | Map<String, Object>> {
    if (cache)
      return this._cache;
    else
      return this._database.list() as unknown as Object[];
  }


  async updateCache(uniqueId: any, data: Object, save?: boolean): Promise<void> {
    const cached = await this.getCache(uniqueId) as any;

    const cachedAssign = { ...cached };
    new Map(Object.entries(data)).forEach((value: any, key: any | ExtendedData) => {
      if (value != null && value.action !== undefined) {
        switch (value.action) {
          case ActionsEnum.ADDICTION:
            cached[key] += value.value;
            break;
          case ActionsEnum.SUBTRACTION:
            cached[key] -= value.value;
            break;
          case ActionsEnum.DIVISION:
            cached[key] /= value.value;
            break;
          case ActionsEnum.MULTIPLICATION:
            cached[key] *= value.value;
            break;
          default:
            cached[key] = value.value;
            break;
        }
      } else {
        cached[key] = value;
      }
    });
    this._cache.set(uniqueId, objectAssign(this.defaultData, cachedAssign, cached));
    if (save) this.saveCache(uniqueId);
  }
}

export type CacheHandlers = | 'settings'
  | 'forms'
  | 'account'
