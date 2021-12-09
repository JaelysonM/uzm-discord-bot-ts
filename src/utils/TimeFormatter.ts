const MONTHS_ARRAY = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DAYS_ARRAY = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];


function findMonth(date: any) {
  return MONTHS_ARRAY[date.month];
}
function findDayOfWeek(date: any) {
  return DAYS_ARRAY[date.day_of_week];
}

function destructorDate(milliseconds: number) {
  const date = new Date(milliseconds);
  return {
    day: date.getDate(),
    day_of_week: date.getDay(),
    year: date.getFullYear(),
    month: date.getMonth(),
    minutes: date.getMinutes(),
    hours: date.getHours(),
    seconds: date.getSeconds(),
  };
}
function zeroLeft(number: number) {
  return number < 10 ? `0${number}` : number;
}
export default class TimeFormatter {

  public static BR_TIMER = new TimeFormatter((params: any) => {
    let ms = Math.ceil(params / 1000);
    let sb = '';
    if (Math.round(ms / 31449600) > 0) {
      const years = Math.round((ms / 31449600));
      sb += years + `${years == 1 ? ` ano` : ` anos `}`;
      ms -= years * 31449600;
    }
    if (Math.round(ms / 2620800) > 0) {
      const months = Math.round(ms / 2620800);
      sb += months + `${months == 1 ? ` mês ` : ` meses `}`;
      ms -= months * 2620800;
    }
    if (Math.round(ms / 604800) > 0) {
      const weeks = Math.round(ms / 604800);
      sb += weeks + `${weeks == 1 ? ` semana ` : ` semanas `}`;
      ms -= weeks * 604800;
    }
    if (Math.round(ms / 86400) > 0) {
      const days = Math.round(ms / 86400);
      sb += days + `${days == 1 ? ` dia ` : ` dias `}`;
      ms -= days * 86400;
    }
    if (Math.round(ms / 3600) > 0) {
      const hours = Math.round(ms / 3600);
      sb += hours + `${hours == 1 ? ` hora ` : ` horas `}`;
      ms -= hours * 3600;
    }
    if (Math.round(ms / 60) > 0) {
      const minutes = Math.round(ms / 60);
      sb += minutes + `${minutes == 1 ? ` minuto ` : ` minutos `}`;
      ms -= minutes * 60;
    }
    if (ms > 0) {
      sb += ms + `${ms == 1 ? ` segundo ` : ` segundos `}`;
    }
    return sb.trim();
  });
  public static BR_DATE = new TimeFormatter((params: any) => {
    return `${params.day} de ${findMonth(params)} de ${params.year}`;
  })

  public static VANILLA_TIME = new TimeFormatter((params: any) => {
    return `${zeroLeft(params.hours)}:${zeroLeft(params.minutes)}`;
  })

  public static VANILLA_TIMER = new TimeFormatter((time: any) => {
    const date = new Date(time);


    return `${zeroLeft(date.getUTCHours())}:${zeroLeft(date.getUTCMinutes())}:${zeroLeft(date.getUTCSeconds())}`;
  })
  public static BR_COMPLETE_DATE = new TimeFormatter((params: any) => {
    const date = destructorDate(params) as any;
    return `${findDayOfWeek(date)}, ${TimeFormatter.BR_DATE.format(date)} às ${TimeFormatter.VANILLA_TIME.format(date)}`;
  });


  constructor(trigger: Function) {
    this.trigger = trigger;
  }
  format(seconds: number): any {
    return this.trigger(seconds);
  }
  private readonly trigger: Function;

}