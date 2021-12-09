export default class TimeUnit {

  public static SECONDS = new TimeUnit(1000, 'SECONDS');
  public static MINUTES = new TimeUnit(60000, 'MINUTES');
  public static HOURS = new TimeUnit(3600000, 'HOURS');
  public static DAYS = new TimeUnit(86400000, 'DAYS');

  private static _values = [TimeUnit.SECONDS, TimeUnit.MINUTES, TimeUnit.HOURS, TimeUnit.DAYS];
  constructor(milliseconds: number, labels: string) {
    this.milliseconds = milliseconds;
    this.labels = labels;
  }
  toMillis(seconds: number): number {
    return this.milliseconds * seconds;
  }
  static values(): TimeUnit[] { return this._values; }
  static valueOf = (string: string): any =>
    TimeUnit._values.find(value => value.labels.toLowerCase() === string.toLowerCase());


  private readonly labels: string;
  private readonly milliseconds: number;
}