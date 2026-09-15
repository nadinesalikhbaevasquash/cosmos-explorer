import { shell } from "./email";

/**
 * Email copy, in all three languages.
 *
 * Kept out of i18n/*.ts on purpose. Those files are bundled into the client for
 * the UI dictionary; email copy is only ever needed on the server, and shipping
 * it to every browser would be dead weight on a site where most visitors never
 * make an account at all.
 *
 * Which language someone gets is decided by the page they were on when they asked,
 * not by a browser header. If you clicked "forgot password" on the Uzbek site, the
 * email arrives in Uzbek.
 */

export type Lang = "en" | "ru" | "uz";

export function normaliseLang(raw: unknown): Lang {
  return raw === "ru" || raw === "uz" ? raw : "en";
}

type Built = { subject: string; html: string; text: string };

/* ── Password reset ──────────────────────────────────────────────────────── */

const RESET = {
  en: {
    subject: "Reset your AstraNova password",
    heading: "Forgot your password?",
    body: "Click the button below to choose a new one. The link works for one hour.",
    cta: "Choose a new password",
    note: "If you didn't ask for this, you can ignore this email. Your password stays as it is and nobody has been let in.",
    fallback: "Or paste this into your browser:",
    footer: "AstraNova — astronomy in English, Russian and Uzbek.",
  },
  ru: {
    subject: "Сброс пароля AstraNova",
    heading: "Забыли пароль?",
    body: "Нажмите кнопку ниже, чтобы задать новый. Ссылка действует один час.",
    cta: "Задать новый пароль",
    note: "Если вы этого не запрашивали, просто проигнорируйте письмо. Пароль останется прежним, и никого не впустили.",
    fallback: "Или вставьте эту ссылку в браузер:",
    footer: "AstraNova — астрономия на английском, русском и узбекском.",
  },
  uz: {
    subject: "AstraNova parolini tiklash",
    heading: "Parolni unutdingizmi?",
    body: "Yangisini tanlash uchun quyidagi tugmani bosing. Havola bir soat ishlaydi.",
    cta: "Yangi parol tanlash",
    note: "Agar buni siz so'ramagan bo'lsangiz, xatga e'tibor bermang. Parolingiz o'zgarmaydi va hech kim kiritilmadi.",
    fallback: "Yoki bu havolani brauzerga joylashtiring:",
    footer: "AstraNova — ingliz, rus va o'zbek tillarida astronomiya.",
  },
} as const;

export function resetEmail(lang: Lang, link: string): Built {
  const t = RESET[lang];
  return {
    subject: t.subject,
    html: shell({
      heading: t.heading,
      body: t.body,
      ctaLabel: t.cta,
      ctaHref: link,
      footnote: `${t.note}<br><br>${t.fallback}<br><span style="color:#9a92f5;word-break:break-all">${link}</span>`,
      footer: t.footer,
    }),
    text: `${t.heading}\n\n${t.body}\n\n${link}\n\n${t.note}\n\n${t.footer}`,
  };
}

/* ── Email verification ──────────────────────────────────────────────────── */

const VERIFY = {
  en: {
    subject: "Confirm your email for AstraNova",
    heading: "One click and you're in",
    body: "Confirm this address so we can reach you if you ever forget your password.",
    cta: "Confirm my email",
    note: "If you didn't make an AstraNova account, you can ignore this. Nothing will happen.",
    fallback: "Or paste this into your browser:",
    footer: "AstraNova — astronomy in English, Russian and Uzbek.",
  },
  ru: {
    subject: "Подтвердите почту для AstraNova",
    heading: "Один клик — и готово",
    body: "Подтвердите этот адрес, чтобы мы могли связаться с вами, если вы забудете пароль.",
    cta: "Подтвердить почту",
    note: "Если вы не создавали аккаунт в AstraNova, просто проигнорируйте письмо. Ничего не произойдёт.",
    fallback: "Или вставьте эту ссылку в браузер:",
    footer: "AstraNova — астрономия на английском, русском и узбекском.",
  },
  uz: {
    subject: "AstraNova uchun pochtangizni tasdiqlang",
    heading: "Bir bosish va tayyor",
    body: "Parolni unutib qo'ysangiz siz bilan bog'lana olishimiz uchun bu manzilni tasdiqlang.",
    cta: "Pochtani tasdiqlash",
    note: "Agar AstraNova akkaunti yaratmagan bo'lsangiz, e'tibor bermang. Hech narsa sodir bo'lmaydi.",
    fallback: "Yoki bu havolani brauzerga joylashtiring:",
    footer: "AstraNova — ingliz, rus va o'zbek tillarida astronomiya.",
  },
} as const;

export function verifyEmail(lang: Lang, link: string): Built {
  const t = VERIFY[lang];
  return {
    subject: t.subject,
    html: shell({
      heading: t.heading,
      body: t.body,
      ctaLabel: t.cta,
      ctaHref: link,
      footnote: `${t.note}<br><br>${t.fallback}<br><span style="color:#9a92f5;word-break:break-all">${link}</span>`,
      footer: t.footer,
    }),
    text: `${t.heading}\n\n${t.body}\n\n${link}\n\n${t.note}\n\n${t.footer}`,
  };
}
