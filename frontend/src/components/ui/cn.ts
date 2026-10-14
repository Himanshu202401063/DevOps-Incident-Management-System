import { twMerge } from 'tailwind-merge'

// Joins class lists so a later class wins over a conflicting earlier one (`px-2` replaces `px-3.5`).
// Plain string joining leaves the winner to Tailwind's stylesheet order instead.
export const cn = twMerge
