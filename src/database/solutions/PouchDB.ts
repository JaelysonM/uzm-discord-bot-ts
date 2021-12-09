import db from 'pouchdb';
import IDatabase from './IDatabase';
interface DataStructure {
  _id: any,
  _rev: string,
  data: object
}

export default class PouchDB implements IDatabase {

  public get databaseName(): string { return this._databaseName }

  private _database: PouchDB.Database;
  private _databaseName: string;

  constructor(databaseName: string) {
    this._database = new db(databaseName);
    this._databaseName = databaseName;
  }
  public async list(): Promise<Object> {
    const docs = await this._database.allDocs({
      include_docs: true,
      attachments: false,
    });
    return docs.rows.map(row => row.doc);
  }
  public async delete(uniqueKey: string): Promise<void> {
    try {
      await this._database.get(uniqueKey).then((req) => {
        const doc = req as DataStructure;
        this._database.remove(doc);
      })
    } catch (err) {
      throw new Error(`[Database - PouchDB] _id: ${uniqueKey} not found in ours database, so is impossible to update.`)
    }
  }

  public async set(uniqueKey: string, data: Object): Promise<void> {

    await this._database.put({
      _id: uniqueKey,
      data: data as any
    });
  }
  public async update(uniqueKey: string, data: Object): Promise<void> {
    try {
      await this._database.get(uniqueKey).then((req) => {
        const doc = req as DataStructure;
        this._database.put({
          _id: uniqueKey,
          _rev: doc._rev,
          data: Object.assign(doc.data, data) as any
        }).catch(err => { })
      })
    } catch (err) {
      throw new Error(`[Database - PouchDB] _id: ${uniqueKey} not found in ours database, so is impossible to update.`)
    }
  }
  public async fetch(uniqueKey: string, defaultValue?: Object): Promise<DataStructure> {
    try {
      return await this._database.get(uniqueKey);
    } catch (err) {
      throw new Error(`[Database - PouchDB] _id: ${uniqueKey} not found in ours database.`)
    }
  }

}