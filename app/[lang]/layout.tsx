import type { Metadata } from "next";
import { locales } from "@/i18n/config";

type Props = { params: Promise<{ lang: string }> }

const META: Record<string, { title: string; description: string; lang: string }> = {
  en: {
    lang: "en",
    title: "AstraNova — Explore the Universe",
    description: "Interactive space exploration platform. Learn about planets, moons, stars, galaxies, black holes and missions in English.",
  },
  ru: {
    lang: "ru",
    title: "AstraNova — Исследуй Вселенную",
    description: "Интерактивная платформа для изучения космоса. Планеты, спутники, звёзды, галактики, чёрные дыры и миссии.",
  },
  uz: {
    lang: "uz",
    title: "AstraNova — Koinotni kashf eting",
    description: "Interaktiv kosmik tadqiqot platformasi. Sayyoralar, oylar, yulduzlar, galaktikalar, qora tuynuklar va missiyalar.",
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const m = META[lang] ?? META.en
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `https://astranova.uz/${lang}`,
      languages: {
        en: "https://astranova.uz/en",
        ru: "https://astranova.uz/ru",
        uz: "https://astranova.uz/uz",
      },
    },
    openGraph: {
      title: m.title,
      description: m.description,
      url: `https://astranova.uz/${lang}`,
      locale: lang,
    },
  }
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
