import { headlessCms } from "@/src/services/api/headless-cms.service";

enum PAGES {
  MAIN = "/",
  CONTACT = "/contacts/",
}

type PageHandler = (document: Document) => void;

export class PageTransformerService {
  private transformMainPage(document: Document) {
    const featuresBlock = document.querySelector(".features-section-2025");
    if (featuresBlock) {
      featuresBlock.remove();
    }
    const nevaBlock = document.querySelector(".neva-taft");
    const main = document.querySelector("main");
    if (main && nevaBlock) {
      const div = document.createElement("div");
      div.classList.add("container-2025");
      div.appendChild(nevaBlock);

      main.insertAdjacentElement("afterbegin", div);
    }
  }

  private transformContactPage(document: Document) {
    const mapBlock = document.querySelector("#contacts-map");
    if (mapBlock) {
      mapBlock.setAttribute(
        "data-center-coords",
        `${headlessCms.data.contact.map.centerCoords.lat},${headlessCms.data.contact.map.centerCoords.lng}`,
      );

      mapBlock.setAttribute("data-marker-coords", JSON.stringify(headlessCms.data.contact.map.markerCoords));
    }
    const tabs = document.querySelector(".contacts-cities-tabs");
    const maxContacts = document.querySelectorAll(".contacts__item--max");
    if (tabs) {
      tabs.remove();
    }
    maxContacts.forEach((contact) => contact.remove());

    const addresses = document.querySelectorAll(".contacts__address");
    addresses.forEach((address) => (address.textContent = headlessCms.data.contact.address));

    const contactForm = document.querySelector(".contacts-form-wrap__body");

    if (contactForm) {
      contactForm.remove();
    }

    const requisitesBlock = document.querySelector(".requisites_body");

    if (requisitesBlock) {
      const paragraphs = requisitesBlock.querySelectorAll("p");

      paragraphs[0].textContent = headlessCms.data.contact.person;
      paragraphs[1].textContent = `УНП ${headlessCms.data.contact.unp}`;
      paragraphs[2].textContent = `${headlessCms.data.contact.address}`;
    }
  }

  private pageHandlers: Record<string, PageHandler> = {
    [PAGES.MAIN]: this.transformMainPage,
    [PAGES.CONTACT]: this.transformContactPage,
  };

  private defaultHandler(document: Document) {
    const contactSection = document.querySelector(
      '[class^="ContactsSection_root"], [class^="kovrolin-detail_contacts"]',
    );
    if (contactSection) {
      contactSection.remove();
    }

    const honestService = document.querySelector(".honest-service");
    if (honestService) {
      honestService.remove();
    }

    const infoAccount = document.querySelector(".info-account");
    if (infoAccount) {
      infoAccount.remove();
    }

    const numberOne = document.querySelector(".number-one");
    if (numberOne) {
      numberOne.remove();
    }

    const deliveryPaymentDetails = document.querySelector(
      '[class^="KovrolinDeliveryPayment_root"], [href="#kovrolin-delivery"]',
    );
    if (deliveryPaymentDetails) {
      deliveryPaymentDetails.remove();
    }
  }

  public transform(path: string, document: Document) {
    const handler = this.pageHandlers[path];

    if (handler) {
      handler(document);
    }

    this.defaultHandler(document);
  }
}
