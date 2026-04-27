"use client";

import { useLayoutEffect } from "react";

type Props = {
  rubToBynRate: number;
};

const PRICE_MARK_CLASS = "ab-price";
const PROCESSED_ATTR = "data-ab-processed";

function formatByn(value: number): string {
  return `${value.toFixed(2)} BYN`;
}

// For formats "8 922", "8,922", "8922", "8 922.50"
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

function isInsideMarkedNode(node: Node | null): boolean {
  let current: Node | null = node;

  while (current) {
    if (
      current instanceof HTMLElement &&
      (current.classList.contains(PRICE_MARK_CLASS) || current.hasAttribute(PROCESSED_ATTR))
    ) {
      return true;
    }
    current = current.parentNode;
  }

  return false;
}

/**
 * If the price is wrapped with span tag
 * <span>8922</span> ₽
 */
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

/**
 * Not wrapped price
 * "от 8922 ₽/шт."
 */
function processTextNodePrices(root: ParentNode, rate: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent?.includes("₽")) {
        return NodeFilter.FILTER_SKIP;
      }

      if (isInsideMarkedNode(node)) {
        return NodeFilter.FILTER_SKIP;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let current: Node | null = walker.nextNode();

  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      textNodes.push(current as Text);
    }
    current = walker.nextNode();
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? "";

    // Search for value
    const match = text.match(/(\d[\d\s.,]*)\s*₽/);

    if (!match) continue;

    const rub = parsePrice(match[1]);
    if (rub === null) continue;

    const byn = convertRubToByn(rub, rate);
    const formatted = formatByn(byn);

    const fullMatch = match[0];
    const startIndex = match.index ?? 0;
    const endIndex = startIndex + fullMatch.length;

    const before = text.slice(0, startIndex);
    const after = text.slice(endIndex);

    const frag = document.createDocumentFragment();

    if (before) {
      frag.appendChild(document.createTextNode(before));
    }

    const span = document.createElement("span");
    span.className = PRICE_MARK_CLASS;
    span.setAttribute("data-original-rub", String(rub));
    span.setAttribute("data-price", "true");
    span.textContent = formatted;
    frag.appendChild(span);

    if (after) {
      frag.appendChild(document.createTextNode(after));
    }

    textNode.parentNode?.replaceChild(frag, textNode);
  }
}

function removeRubSignGlobally(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);

  let node: Node | null;

  while ((node = walker.nextNode())) {
    if (!node.textContent?.includes("₽")) continue;

    if (node.parentElement?.closest(".ab-price")) {
      continue;
    }

    node.textContent = node.textContent.replace(/(\s|\u00A0)*₽/g, "");
  }
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

function scan(root: ParentNode, rate: number) {
  processSpanPrices(root, rate);
  processTextNodePrices(root, rate);
  removeRubSignGlobally(root);
  if (root instanceof HTMLElement && root.querySelector(`.${PRICE_MARK_CLASS}`)) {
    root.setAttribute(PROCESSED_ATTR, "1");
  }
}

export const PriceObserver = ({ rubToBynRate }: Props) => {
  useLayoutEffect(() => {
    let cleanup: (() => void) | null = null;

    const timer = setTimeout(() => {
      scan(document.body, rubToBynRate);

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const target = mutation.target;
          const parentElement = target instanceof HTMLElement ? target : target.parentElement;

          const markedContainer = parentElement?.closest(`.${PRICE_MARK_CLASS}`);

          if (markedContainer instanceof HTMLElement) {
            reprocessMarkedNode(markedContainer, rubToBynRate);
            continue;
          }

          if (mutation.type === "childList") {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement) {
                if (node.classList.contains(PRICE_MARK_CLASS) || node.closest(`.${PRICE_MARK_CLASS}`)) {
                  return;
                }

                scan(node, rubToBynRate);
              } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
                scan(node.parentElement, rubToBynRate);
              }
            });
          }

          if (mutation.type === "characterData") {
            const parent = mutation.target.parentElement;
            if (parent && !parent.closest(`.${PRICE_MARK_CLASS}`)) {
              scan(parent, rubToBynRate);
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
  }, [rubToBynRate]);

  return null;
};
