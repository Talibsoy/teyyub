export const WA_NUMBER = "994517769632";
export const WA_DEFAULT_MSG = "Salam, tur haqqında təklif almaq istəyirəm";

export function waLink(msg?: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg || WA_DEFAULT_MSG)}`;
}
