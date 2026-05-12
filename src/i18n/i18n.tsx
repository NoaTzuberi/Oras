import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  he: {
    translation: {
      common: {
        save: "שמור",
        total: "סה״כ"
      },

      nav: {
        home: "ראשי",
        shifts: "משמרות",
        stats: "נתונים",
        settings: "הגדרות",
        LogoutButton:"התנתקות"
      },

      shift: {
        addShift: "הוסף משמרת",
        salary: "שכר",
        start: "התחלה",
        end: "סוף"
      },

      greeting: {
        morning: "בוקר טוב",
        afternoon: "צהריים טובים",
        evening: "ערב טוב"
      },

      dashboard: {
        completeProfileTitle: "השלם את הפרופיל שלך",
        completeProfileSubtitle: "לחישוב מדויק של נטו, מס ונקודות זיכוי",
        settingsButton: "הגדר",

        grossTitle: "ברוטו חודשי",
        grossSubtitle: "סה״כ השתכרות החודש",

        netTitle: "נטו חודשי",
        netSubtitle: "אחרי ניכויים",

        creditsTitle: "נקודות זיכוי",
        creditsSubtitle: "חסכון ₪{{value}} לחודש",

        deductionsTitle: "ניכויים",
        deductionsSubtitle: "מס + ביטוח לאומי + בריאות",
        AverageTitle: "ממוצע שעתי"
      },

      shiftCard: {
        shiftHours: "שעות משמרת",
        hr: "ש",
        income: "הכנסות",
        total: "סה״כ",
        end: "סיום",
        start: "התחלה",
        baseSalary: "שכר בסיס",
        tips: "טיפים",
        applied150: "שכר 150% הוחל",
        holiday: "שבת/חג",
        delete: "מחק משמרת",
        confirmDelete: "בטוח שברצונך למחוק את המשמרת הזו?",
        hourly: "לפי שעה",
        optional: "אופציונלי",
        hours: "שעות"
      },
      ShiftsPage: {
        netTitle: "נטו",
        grossTitle: "ברוטו",
        hours: "שעות",
        Shifts: "משמרות",
      }
    }
  },

  en: {
    translation: {
      common: {
        save: "Save",
        total: "Total"
      },

      nav: {
        home: "Home",
        shifts: "Shifts",
        stats: "Stats",
        settings: "Settings",
        LogoutButton: "Logout"

      },

      shift: {
        addShift: "Add Shift",
        salary: "Salary",
        start: "Start",
        end: "End"
      },

      greeting: {
        morning: "Good morning",
        afternoon: "Good afternoon",
        evening: "Good evening"
      },

      dashboard: {
        completeProfileTitle: "Complete your profile",
        completeProfileSubtitle: "For accurate tax and net calculations",
        settingsButton: "Settings",

        grossTitle: "Gross Monthly",
        grossSubtitle: "Total earnings this month",

        netTitle: "Net Monthly",
        netSubtitle: "After deductions",

        creditsTitle: "Tax Credits",
        creditsSubtitle: "Monthly savings of ₪{{value}}",

        deductionsTitle: "Deductions",
        deductionsSubtitle: "Tax + insurance",
        AverageTitle: "Hourly Average"

      },
      shiftCard: {
        shiftHours: "Shift hours",
        hours: "hrs",
        income: "Income",
        total: "Total",
        start: "Start",
        end: "End",
        baseSalary: "Base salary",
        tips: "Tips",
        applied150: "150% applied",
        holiday: "Holiday / Shabbat",
        delete: "Delete shift",
        confirmDelete: "Are you sure you want to delete this shift?",
        hourly: "hourly",
        optional: "optional",
        },
      ShiftsPage: {
        netTitle: "Net Monthly",
        grossTitle: "Gross Monthly",
        hours: "Hours",
        Shifts: "Shifts",
      }
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('lang') || 'he',
    fallbackLng: 'he',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n