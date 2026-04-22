export function getBitrixHtmlClasses(userAgent: string) {
  let cl = "bx-core";

  if (/(iPad;)|(iPhone;)/i.test(userAgent)) {
    cl += " bx-ios";
  } else if (/Windows/i.test(userAgent)) {
    cl += " bx-win";
  } else if (/Macintosh/i.test(userAgent)) {
    cl += " bx-mac";
  } else if (/Linux/i.test(userAgent) && !/Android/i.test(userAgent)) {
    cl += " bx-linux";
  } else if (/Android/i.test(userAgent)) {
    cl += " bx-android";
  }

  cl += /(ipad|iphone|android|mobile|touch)/i.test(userAgent) ? " bx-touch" : " bx-no-touch";

  if (/AppleWebKit/.test(userAgent)) {
    cl += " bx-chrome";
  } else if (/Opera/.test(userAgent)) {
    cl += " bx-opera";
  } else if (/Firefox/.test(userAgent)) {
    cl += " bx-firefox";
  }

  return cl;
}
