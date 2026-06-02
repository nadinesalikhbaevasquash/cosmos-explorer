export const locales = ['en', 'ru', 'uz'] as const
export type Locale = typeof locales[number]
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  uz: "O'zbek",
}
