export function formatPhoneBY(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (!digits.startsWith("375") || digits.length !== 12) {
    return phone;
  }

  const country = digits.slice(0, 3); // 375
  const operator = digits.slice(3, 5); // 29
  const part1 = digits.slice(5, 8); // 603
  const part2 = digits.slice(8, 10); // 80
  const part3 = digits.slice(10, 12); // 38

  return `+${country} ${operator} ${part1}-${part2}-${part3}`;
}
