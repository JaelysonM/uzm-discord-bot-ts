export default interface IDatabase {
  readonly databaseName: string;
  fetch(uniqueKey: string, defaultValues?: Object): Promise<any>;
  set(uniqueKey: string, data: Object): Promise<void>;
  delete(uniqueKey: string): Promise<void>;
  update(uniqueKey: string, data: Object): Promise<void>;
  list(): Promise<Object>;
}