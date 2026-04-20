import { fetchDato } from "@/src/lib/api/dato-cms";
import { logger } from "@/src/lib/api/logger";
import type { CmsData, PublicCmsData } from "@/src/types";

class HeadlessCmsService {
  private readonly defaultValue: CmsData = {
    contact: {
      person: "Директор Працкевич Игорь Вячеславович",
      address: "Республика Беларусь, Центральный район, г. Минск, ул. Тимирязева, дом 97, каб. 22-148",
      phone: "+375296038038",
      email: "abmarketbel@gmail.com",
      unp: "193659113",
      bank: '"Приорбанк" ОАО г. Минск, ул. .Хоружей, 31 А',
      bankBic: "PJCBBY2X",
    },
    content: {
      headerGreyText: `
        ООО &#34;АБ Маркет&#34;{" "}
        <strong>является официальным дистрибьютором по коммерческим ковровым покрытиям фабрики </strong>{" "}
        <Link href="https://nevatuft.ru/" className={"text-inherit! border-b-0! !underline"} target={"_blank"}>
          &#34;Нева Тафт&#34;
        </Link>{" "}
        - крупнейшего производителя ковровых покрытий в ЕАЭС
      `,
      partnersSiteDeadTitle: "Чтобы заказать ковролин вам не нужен сайт!",
    },
    settings: {
      pingEndpoint: "/local/templates/new/static/dist/img/close.svg",
      renamedLinks: [],
      restrictedLinks: [],
      scripts: {
        jivochat: "//code.jivosite.com/widget/WPBvGc2oxZ",
      },
    },
  };

  public data: CmsData;

  constructor() {
    this.data = { ...this.defaultValue };
  }

  private async fetch(): Promise<CmsData> {
    try {
      const fetchResult = await fetchDato<{ config: CmsData }>(`
        query {
          config {
            contact {
              address
              unp
              bank
              bankBic
              email
              phone
              person
            }
            content {
              headerGreyText
              partnersSiteDeadTitle
            }
            settings {
              pingEndpoint
              homepageLink {
                url
              }
              renamedLinks {
                url
                text
              }
              restrictedLinks {
                url
              }
              scripts {
                jivochat
              }
            }
          }
        }
      `);
      if (!fetchResult.config) {
        throw new Error("No config provided");
      }
      return fetchResult.config;
    } catch (error) {
      logger.error("Dato CMS fetch error", error);
      return this.data || this.defaultValue;
    }
  }

  async init(): Promise<CmsData> {
    return this.fetch()
      .then((data) => {
        this.data = data;
        return data;
      })
      .catch((error) => {
        logger.error("Dato CMS fetch error", error);
        throw error;
      });
  }

  async refresh(): Promise<PublicCmsData> {
    const fresh = await this.fetch();
    this.data = fresh;
    return {
      content: fresh.content,
      contact: fresh.contact,
    };
  }
}

export const headlessCms = new HeadlessCmsService();
