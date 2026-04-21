import { fetchDato } from "@/src/lib/api/dato-cms";
import { logger } from "@/src/lib/api/logger";
import type { CmsData, CmsDataResponse, PublicCmsData } from "@/src/types";

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
      map: {
        centerCoords: {
          lat: 53.929594999996425,
          lng: 27.490854999999996,
        },
        markerCoords: [
          { lat: 53.929594999996425, lng: 27.490854999999996 },
          { lat: 59.994863, lng: 30.247871 },
        ],
      },
    },
    content: {
      headerGreyText: `
        <p><span>ООО "АБ Маркет"&nbsp;<strong>является официальным дистрибьютором по коммерческим ковровым покрытиям </strong></span></p>
        <p><span><strong>фабрики </strong><a class="text-inherit! border-b-0! !underline" target="_blank" href="https://nevatuft.ru/" rel="noopener">"Нева Тафт"</a>&nbsp;- крупнейшего производителя ковровых покрытий в ЕАЭС,</span></p>
        <p><span>а также <strong>партнером</strong>&nbsp;<a class="text-inherit!  border-b-0! !underline" target="_blank" href="https://velvet-pro.ru/" rel="noopener">ООО "Вельвет Про"</a>&nbsp;- ведущего производителя ковров и штор под заказ в Российской Федерации.</span></p>
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

  private deepTrim<T>(obj: T): T {
    if (typeof obj === "string") {
      return obj.trim() as T;
    }
    if (Array.isArray(obj)) {
      return obj.map(this.deepTrim) as T;
    }
    if (obj && typeof obj === "object") {
      const result = {} as T;
      for (const key in obj) {
        result[key] = this.deepTrim(obj[key]);
      }
      return result;
    }
    return obj;
  }

  private normalize(response: CmsDataResponse): CmsData {
    if (!response.config) {
      throw new Error("No config provided");
    }
    const d = response.config;
    const restrictedLinks = d.settings.restrictedLinks.map(({ url }) => url.trim());
    const homepageLink = d.settings.homepageLink?.url.trim();
    const renamedLinks = d.settings.renamedLinks.map((l) => this.deepTrim(l));
    return {
      contact: this.deepTrim(d.contact),
      content: d.content,
      settings: {
        ...d.settings,
        restrictedLinks,
        renamedLinks,
        homepageLink,
      },
    };
  }

  private async fetch(): Promise<CmsData> {
    try {
      const fetchResult = await fetchDato<CmsDataResponse>(`
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
              map
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
      logger.info("CMS successfully fetched", fetchResult.config);
      return this.normalize(fetchResult);
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

const globalForServices = globalThis as typeof globalThis & {
  headlessCms?: HeadlessCmsService;
};

// singleton
export const headlessCms =
  globalForServices.headlessCms ??
  (() => {
    const service = new HeadlessCmsService();
    globalForServices.headlessCms = service;
    return service;
  })();
