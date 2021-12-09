import { DiscordEvents } from '../classes/types/DiscordEvents';
import Bot from '../containers/Bot';

export default function EventHandler(event: DiscordEvents) {
  return (target: Object, key: string, descriptor?: PropertyDescriptor): void => {
    Bot.instance.addHandleMethod({
      eventKey: event,
      getMethod: descriptor?.value
    })
  };
}