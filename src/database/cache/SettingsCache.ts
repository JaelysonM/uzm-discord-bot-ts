import CacheHandler from "../../handlers/CacheHandler";
import { dotify } from "../../utils/Functions";
import TimeUnit from "../../utils/TimeUnit";
import IDatabase from "../solutions/IDatabase";

export default class SettingsCache extends CacheHandler {

  constructor(database: IDatabase) {
    super(database);
  }
  private static _instance: SettingsCache;

  static instance(database?: IDatabase): SettingsCache {
    if (!this._instance) {
      if (database != undefined)
        this._instance = new SettingsCache(database);
    }
    return this._instance;
  }

  async isReady(param: any): Promise<boolean> {
    const cache = (param instanceof Object ? param : await this.getCache(param));
    return cache.configured && Object.values(dotify(cache)).filter((o: any) => o === null).length <= 0;
  }
  async listMissingData(param: any): Promise<any[]> {
    const cache = (param instanceof Object ? param : await this.getCache(param));
    const filtered = [...Object.entries(dotify(cache))].filter((i: any) => i[1] === null).map((i: any) => i[0]);
    return filtered;
  }
  async listMissingDataTranslated(param: any): Promise<Object[]> {
    const cache = await this.listMissingData(param);
    return cache.map((s: any) => this.missingDataTranslated[s as any] != null ? this.missingDataTranslated[s as any] : s);
  }

  async missingDataTranslatedFromObject(obj: any): Promise<Object[]> {
    return [...Object.entries(dotify(obj))].filter((i: any) => i[1] === null).map((i: any) => i[0]).map((s: any) => this.missingDataTranslated[s as any] != null ? this.missingDataTranslated[s as any] : s);
  }

  get missingDataTranslated(): any {
    return {
      "type": "Tipo do servidor",
      "name": "Nome do servidor",
      "captchaType": "Tipo de segurança do captcha",
      "ip": "Endereço ip do servidor",
      "shop": "Endereço da loja do servidor",
      "guilds.attendance": "Servidor de atendimento",
      "guilds.main": "Servidor principal",
      "category.tickets": "Categoria do canal de atendimento",
      "channels.appel": "Canal de revisão",
      "channels.mainReport": "Canal principal de denúncias (S.A)",
      "channels.reportRejected": "Canal de denúncias rejeitadas (S.A)",
      "channels.reportAccepted": "Canal de denúncias aceitas (S.A)",
      "channels.forms": "Canal de formulários (S.A)",
      "channels.suggestions": "Canal de sugestões",
      "channels.captcha": "Canal do captcha",
      "channels.logs": "Canal de logs (S.A)",
      "channels.status": "Canal de estatísticas de servidores",
      "channels.attendancePainel": "Canal de atendimento",
      "channels.punish": "Canal de punições",
      "channels.welcome": "Canal de boas-vindas",
      "messages.attendancePainel": "Mensagem do painel de atendimento",
      "messages_content.welcome": "Mensagem de boas-vindas",
      "messages.captcha": "Mensagem de captcha",
      "roles.spam": "Cargo para spammers silenciados",
      "roles.member": "Cargo após verificação",
      "roles.lowerStaff": "Cargo de superior mais baixo",
      "roles.muted": "Cargo de silenciados"
    }
  }

  get defaultData(): Object {
    return {
      configured: false,
      type: null,
      shop: null,
      captchaType: null,
      commandPrefix: '/',
      name: null,
      ip: null,
      booleans: {
        tickets: true,
        ticketsDelay: true,
        reports: true,
        reviews: true,
        forms: true,
      },
      guilds: {
        attendance: null,
        main: null,
      },
      category: {
        tickets: null,
      },
      tickets: {
        capacity: 50,
      },
      channels: {
        appel: null,
        mainReport: null,
        reportRejected: null,
        reportAccepted: null,
        forms: null,
        captcha: null,
        status: null,
        attendancePainel: null,
        punish: null,
        welcome: null,
        suggestions: null,
        logs: null,
      },
      messages: {
        attendancePainel: null,
        captcha: null,
      },
      messages_content: {
        welcome: null,
        review: `As aplicações para a equipe são realizadas por um formulário que pode ser enviado utilizando o link abaixo. \n\n Link: https://bit.ly/formularioskylar \n Clique [aqui](https://bit.ly/formularioskylar) para ser redirecionado.`,
      },
      roles: {
        spam: null,
        member: null,
        lowerStaff: null,
        muted: null,
      },
      commands: {
      },
      form: {
        roles: [],
        asks: [
          {
            ask: 'Qual é o seu nome?',
            description: 'Para fazer tal coisa precisamos conhecer mais você ok 😉?',
            obligated: true,
          }, {
            ask: 'Já foi staff em algum server',
            description: 'Nota da equipe: Perguntamos isso pra conhecer melhor você.',
            obligated: true,
          },
        ]
      },
      faq: [
        {
          name: 'Formulário de integração a equipe',
          response: `O link do formulário para ajudante da network são:
          > Factions e RankUP: http://bit.ly/formmini
        > Minigames: http://bit.ly/formsurv
        
        Resultado o divulgado até 14 dias e o resultado sai na \`\`#formulários\`\` do discord do servidor.
        Por fim, os aprovados serão chamados através das mensagens privadas do discord.`
        }
      ],
      punishes: {
        1: {
          timestamp: TimeUnit.HOURS.toMillis(2),
          name: 'Ofensa a membros da equipe.'
        },
        2: {
          timestamp: TimeUnit.HOURS.toMillis(3),
          name: 'Ofensa a jogadores.'
        },
        3: {
          timestamp: TimeUnit.HOURS.toMillis(5),
          name: 'Discórdia no bate-papo.'
        },
        4: {
          timestamp: TimeUnit.HOURS.toMillis(3),
          name: 'Divulgação. (Servidores)'
        },
        5: {
          timestamp: TimeUnit.HOURS.toMillis(4),
          name: 'Divulgação. (Links)'
        },
        6: {
          timestamp: TimeUnit.HOURS.toMillis(2),
          name: 'Mensagens falsas/Chat Fake.'
        },
        7: {
          timestamp: TimeUnit.HOURS.toMillis(3),
          name: ' Comércio não autorizado.'
        }
      }
    }
  }
}