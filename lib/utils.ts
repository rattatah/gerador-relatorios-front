import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeFilename(name: string): string {
    return name
        .normalize('NFD') // Separa os caracteres acentuados
        .replace(/[\u0300-\u036f]/g, "") // Remove as marcações de acento
        .replace(/[^a-zA-Z0-9]/g, '_') // Substitui caracteres não alfanuméricos por underline
        .replace(/_+/g, '_') // Remove sublinhados duplicados
        .replace(/^_|_$/g, '') // Remove sublinhados do início e do final
        .toLowerCase();
}
