"use client";

import { useLayoutEffect } from "react";

type Props = {
  rubToBynRate: number;
  priceMultiplier?: number;
};

const PRICE_MARK_CLASS = "ab-price";
const PROCESSED_ATTR = "data-ab-processed";

function formatByn(value: number): string {
  return `${value.toFixed(2)} BYN`;
}

function parsePrice(raw: string): number | null {
  const normalized = raw
    .replace(/\u00A0/g, "")
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "");

  if (!normalized) return null;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function convertRubToByn(rub: number, rate: number): number {
  return rub * rate;
}

function processNumberBeforeRubSpan(root: ParentNode, rate: number) {
  const spans = root.querySelectorAll("span");
  spans.forEach((span) => {
    if (!(span instanceof HTMLSpanElement)) return;
    if (span.hasAttribute(PROCESSED_ATTR)) return;
    if (span.closest(`.${PRICE_MARK_CLASS}`)) return;

    const spanText = span.textContent?.trim() ?? "";
    if (spanText !== "₽") return;

    const prev = span.previousSibling;
    if (!prev || prev.nodeType !== Node.TEXT_NODE) return;

    const prevText = prev.textContent?.trim() ?? "";
    const rub = parsePrice(prevText);
    if (rub === null) return;

    const bynText = document.createTextNode(formatByn(convertRubToByn(rub, rate)));
    prev.replaceWith(bynText);
    span.remove();

    const parent = span.parentElement;
    if (parent && !parent.classList.contains(PRICE_MARK_CLASS)) {
      parent.classList.add(PRICE_MARK_CLASS);
      parent.setAttribute(PROCESSED_ATTR, "1");
    }
  });
}

function processPriceWithDataAttribute(root: ParentNode, rate: number) {
  const priceElements = root.querySelectorAll("[data-unit-price], [data-tota-price]");
  priceElements.forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    if (el.hasAttribute(PROCESSED_ATTR)) return;
    if (el.closest(`.${PRICE_MARK_CLASS}`)) return;

    const rub = parsePrice(el.textContent ?? "");
    if (rub === null) return;

    let next: Node | null = el.nextSibling;
    let rubNode: Node | null = null;
    while (next) {
      if (next.nodeType === Node.TEXT_NODE && next.textContent?.includes("₽")) {
        rubNode = next;
        break;
      }
      if (next instanceof HTMLElement && next.textContent?.trim() === "₽") {
        rubNode = next;
        break;
      }
      next = next.nextSibling;
    }

    if (!rubNode) return;

    const byn = convertRubToByn(rub, rate);
    el.textContent = formatByn(byn);
    rubNode.parentNode?.removeChild(rubNode);

    el.classList.add(PRICE_MARK_CLASS);
    el.setAttribute(PROCESSED_ATTR, "1");
    el.setAttribute("data-original-rub", String(rub));
  });
}

function processSpanPrices(root: ParentNode, rate: number) {
  const spans = root.querySelectorAll(`span:not(.${PRICE_MARK_CLASS})`);
  spans.forEach((span) => {
    if (!(span instanceof HTMLSpanElement)) return;
    if (span.hasAttribute(PROCESSED_ATTR)) return;
    if (span.closest(`.${PRICE_MARK_CLASS}`)) return;

    const rawText = span.textContent?.trim() ?? "";
    const rub = parsePrice(rawText);
    if (rub === null) return;

    const next = span.nextSibling;
    const nextText = next?.nodeType === Node.TEXT_NODE ? (next.textContent ?? "") : "";
    if (!/^\s*₽/.test(nextText)) return;

    const byn = convertRubToByn(rub, rate);
    const replacement = document.createElement("span");
    replacement.className = PRICE_MARK_CLASS;
    replacement.setAttribute("data-original-rub", String(rub));
    replacement.setAttribute("data-price", "true");
    replacement.textContent = formatByn(byn);
    span.replaceWith(replacement);
  });
}

function reprocessMarkedNode(node: HTMLElement, rate: number) {
  const currentText = node.textContent ?? "";
  if (currentText.includes("BYN")) return;
  const rub = parsePrice(currentText);
  if (rub !== null) {
    node.textContent = formatByn(convertRubToByn(rub, rate));
    node.setAttribute("data-original-rub", String(rub));
  }
}

function removeRubSignGlobally(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (!node.textContent?.includes("₽")) continue;
    if (node.parentElement?.closest(`.${PRICE_MARK_CLASS}`)) continue;
    node.textContent = node.textContent.replace(/(\s|\u00A0)*₽/g, "");
  }
}

function scan(root: ParentNode, rate: number) {
  processNumberBeforeRubSpan(root, rate);
  processPriceWithDataAttribute(root, rate);
  processSpanPrices(root, rate);
  removeRubSignGlobally(root);

  if (root instanceof HTMLElement && root.querySelector(`.${PRICE_MARK_CLASS}`)) {
    root.setAttribute(PROCESSED_ATTR, "1");
  }
}

export const PriceObserver = ({ rubToBynRate, priceMultiplier = 1 }: Props) => {
  const effectiveRate = rubToBynRate * priceMultiplier;

  useLayoutEffect(() => {
    let cleanup: (() => void) | null = null;

    const timer = setTimeout(() => {
      scan(document.body, effectiveRate);

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const target = mutation.target;
          const parentElement = target instanceof HTMLElement ? target : target.parentElement;

          const markedContainer = parentElement?.closest(`.${PRICE_MARK_CLASS}`);
          if (markedContainer instanceof HTMLElement) {
            reprocessMarkedNode(markedContainer, effectiveRate);
            continue;
          }

          if (mutation.type === "childList") {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement) {
                if (node.classList.contains(PRICE_MARK_CLASS) || node.closest(`.${PRICE_MARK_CLASS}`)) {
                  return;
                }
                scan(node, effectiveRate);
              } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
                scan(node.parentElement, effectiveRate);
              }
            });
          }

          if (mutation.type === "characterData") {
            const parent = mutation.target.parentElement;
            if (parent && !parent.closest(`.${PRICE_MARK_CLASS}`)) {
              scan(parent, effectiveRate);
            }
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      cleanup = () => observer.disconnect();
    }, 2000);

    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, [effectiveRate]);

  return null;
};
