"use client"
import { useParams } from 'next/navigation'
import { dict as en } from '@/i18n/en'
import { dict as ru } from '@/i18n/ru'
import { dict as uz } from '@/i18n/uz'
import type { Locale } from '@/i18n/config'

const dicts = { en, ru, uz }

export function useDict() {
  const params = useParams()
  const lang = (params?.lang as Locale) || 'en'
  return dicts[lang] ?? dicts.en
}
