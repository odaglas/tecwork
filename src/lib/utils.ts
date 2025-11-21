import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// RUT validation and formatting utilities
export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return cleaned;
  
  const dv = cleaned.slice(-1);
  const number = cleaned.slice(0, -1);
  
  const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}

export function validateRut(rut: string): boolean {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 8 || cleaned.length > 9) return false;
  
  const dv = cleaned.slice(-1);
  const number = cleaned.slice(0, -1);
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = number.length - 1; i >= 0; i--) {
    sum += parseInt(number[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();
  
  return dv === calculatedDv;
}

// Content filtering utilities
const BANNED_WORDS = [
  'puta', 'mierda', 'concha', 'ctm', 'weon', 'weón', 'culiao', 'culiado',
  'pico', 'conchetumare', 'maricon', 'maricón', 'hijo de puta', 'hdp',
  'pendejo', 'imbecil', 'imbécil', 'estupido', 'estúpido', 'idiota',
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap'
];

export function containsBannedContent(text: string): { isValid: boolean; reason?: string } {
  const lowerText = text.toLowerCase();
  
  // Check for banned words
  for (const word of BANNED_WORDS) {
    if (lowerText.includes(word)) {
      return { isValid: false, reason: 'El mensaje contiene palabras inapropiadas' };
    }
  }
  
  // Check for phone numbers (Chilean format and general patterns)
  const phonePatterns = [
    /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, // General phone
    /\b\d{8,11}\b/g, // Long number sequences
    /\b9\s?\d{4}\s?\d{4}\b/g, // Chilean mobile format
  ];
  
  for (const pattern of phonePatterns) {
    if (pattern.test(text)) {
      return { isValid: false, reason: 'No se permite compartir números de teléfono' };
    }
  }
  
  // Check for email patterns
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g.test(text)) {
    return { isValid: false, reason: 'No se permite compartir correos electrónicos' };
  }
  
  // Check for social media handles
  if (/@\w+/g.test(text) || /instagram|facebook|whatsapp|telegram|twitter|discord/gi.test(lowerText)) {
    return { isValid: false, reason: 'No se permite compartir información de contacto de redes sociales' };
  }
  
  return { isValid: true };
}
