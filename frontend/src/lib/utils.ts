import { clsx, type ClassValue } from "clsx";

// Classnames merging helper
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export { clsx, type ClassValue };
