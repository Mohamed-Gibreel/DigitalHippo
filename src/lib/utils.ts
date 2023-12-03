import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (
  price: number | string,
  options: {
    currency?: "AED" | "USD" | "EUR" | "GBD" | "BDT";
    notation?: Intl.NumberFormatOptions["notation"];
  } = {}
) => {
  const { currency = "AED", notation = "compact" } = options;
  const numberPrice = typeof price === "string" ? parseFloat(price) : price;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation,
    maximumFractionDigits: 2,
  }).format(numberPrice);
};
