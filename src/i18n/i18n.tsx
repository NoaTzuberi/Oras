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
        AverageTitle: "ממוצע שעתי",
        AverageSubtitle: "ממוצע הכנסה לשעה"
      },

      auth: {
        welcomeBack: "ברוך הבא ל Oras 👋",
        createAccount: "צור חשבון חדש",
        loginSubtitle: "התחבר לחשבון שלך",
        signupSubtitle: "הצטרף ועקוב אחרי המשמרות שלך",
        email: "אימייל",
        password: "סיסמה",
        passwordPlaceholder: "לפחות 6 תווים",
        firstName: "שם פרטי",
        lastName: "שם משפחה",
        login: "התחבר",
        signup: "הירשם",
        loading: "...",
        noAccount: "אין לך חשבון? הירשם",
        haveAccount: "כבר יש לך חשבון? התחבר",
        errorFillFields: "נא למלא אימייל וסיסמה",
        errorPasswordShort: "הסיסמה חייבת להיות לפחות 6 תווים",
        errorInvalidCredentials: "אימייל או סיסמה שגויים",
        errorFillNames: "נא למלא שם פרטי ושם משפחה",
        errorSignup: "שגיאה בהרשמה, נסה שוב",
        successVerification: "נשלח אימייל אימות! בדוק תיבת דואר"
      },

      shiftForm: {
        date: "תאריך",
        checkingDate: "בודק תאריך...",
        shiftHoursLabel: "שעות המשמרת",
        start: "התחלה",
        end: "סוף",
        hoursWorked: "{{hours}} שעות עבודה",
        salary: "שכר",
        hourly: "לפי שעה",
        dailyTotal: "סה״כ יומי",
        perHour: "לשעה",
        holidaySuffix: "שבת / חג",
        applyOnlyIfEmployerPays: "החל רק אם המעסיק משלם שכר חג",
        apply150: "החל שכר 150%",
        apply150Active: "✓ הוחל 150%",
        baseSalary: "שכר בסיס",
        tip: "טיפ",
        optional: "אופציונלי",
        tipsPlaceholder: "סה״כ טיפים",
        totalIncome: "סה״כ הכנסה",
        breakdown: "₪{{salary}} שכר + ₪{{tips}} טיפים",
        saveShift: "שמור משמרת",
        saveChanges: "שמור שינויים",
        saving: "שומר...",
        alertEnterTimes: "אנא הכנס שעות משמרת",
        alertEnterHourlyRate: "אנא הכנס שכר לשעה",
        alertEnterTotalSalary: "אנא הכנס שכר כולל"
      },

      settings: {
        title: "הגדרות",
        subtitle: "מלא את הפרטים כדי לחשב את נקודות הזיכוי שלך",
        creditPoints: "נקודות זיכוי",
        monthlyTaxDiscount: "הנחת מס חודשית",
        gender: "מגדר",
        male: "גבר",
        female: "אישה",
        basePointsMale: "2.25 נקודות בסיס",
        basePointsFemale: "2.75 נקודות בסיס",
        children: "ילדים",
        childAgePlaceholder: "גיל הילד",
        addChild: "+ הוסף",
        age: "גיל {{age}}",
        childrenHint: "נקודות זיכוי לפי גיל הילד לפי חוק",
        military: "חיילים משוחררים/ שירות לאומי",
        none: "ללא",
        militaryPointsHint: "+{{points}} נקודות",
        additionalDetails: "פרטים נוספים",
        moshavMember: "חבר מושב שיתופי / קיבוץ",
        moshavHint: "+1 נקודת זיכוי",
        academicDegree: "תואר אקדמי",
        academicHint: "+0.5 נקודת זיכוי",
        priorityArea: "אזור עדיפות לאומית",
        priorityHint: "+0.5 נקודת זיכוי",
        newImmigrant: "עולה חדש",
        newImmigrantHint: "עד +3 נקודות לפי שנת עלייה",
        immigrationYear: "שנת עלייה",
        defaultHourlyRate: "שכר ברירת מחדל לשעה",
        defaultHourlyRateHint: "יוכנס אוטומטית בכל משמרת חדשה",
        perHourSuffix: "לשעה",
        save: "שמור הגדרות",
        saved: "✓ נשמר!"
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
        hours: "שעות",
        edit: "ערוך",
        editTitle: "עריכת משמרת"
      },
      ShiftsPage: {
        netTitle: "נטו",
        grossTitle: "ברוטו",
        hours: "שעות",
        Shifts: "משמרות",
        completeProfileHint: "מלא פרופיל",
        emptyTitle: "אין משמרות עדיין",
        emptySubtitle: "הוסף משמרת עם כפתור ה-+",
        months: [
          "ינואר", "פברואר", "מרץ", "אפריל",
          "מאי", "יוני", "יולי", "אוגוסט",
          "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
        ]
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
        AverageTitle: "Hourly Average",
        AverageSubtitle: "Average hourly earnings"

      },

      auth: {
        welcomeBack: "Welcome to Oras 👋",
        createAccount: "Create a new account",
        loginSubtitle: "Sign in to your account",
        signupSubtitle: "Join and track your shifts",
        email: "Email",
        password: "Password",
        passwordPlaceholder: "At least 6 characters",
        firstName: "First name",
        lastName: "Last name",
        login: "Log in",
        signup: "Sign up",
        loading: "...",
        noAccount: "Don't have an account? Sign up",
        haveAccount: "Already have an account? Log in",
        errorFillFields: "Please fill in email and password",
        errorPasswordShort: "Password must be at least 6 characters",
        errorInvalidCredentials: "Incorrect email or password",
        errorFillNames: "Please fill in first and last name",
        errorSignup: "Signup error, please try again",
        successVerification: "Verification email sent! Check your inbox"
      },

      shiftForm: {
        date: "Date",
        checkingDate: "Checking date...",
        shiftHoursLabel: "Shift hours",
        start: "Start",
        end: "End",
        hoursWorked: "{{hours}} hours worked",
        salary: "Salary",
        hourly: "Hourly",
        dailyTotal: "Daily total",
        perHour: "/ hr",
        holidaySuffix: "Shabbat / Holiday",
        applyOnlyIfEmployerPays: "Apply only if your employer pays holiday rate.",
        apply150: "Apply 150% Rate",
        apply150Active: "✓ 150% Applied",
        baseSalary: "Base salary",
        tip: "Tip",
        optional: "optional",
        tipsPlaceholder: "Total tips",
        totalIncome: "Total income",
        breakdown: "₪{{salary}} salary + ₪{{tips}} tips",
        saveShift: "Save Shift",
        saveChanges: "Save changes",
        saving: "Saving...",
        alertEnterTimes: "Please enter shift times",
        alertEnterHourlyRate: "Please enter hourly rate",
        alertEnterTotalSalary: "Please enter total salary"
      },

      settings: {
        title: "Settings",
        subtitle: "Fill in the details to calculate your tax credit points",
        creditPoints: "Tax credit points",
        monthlyTaxDiscount: "Monthly tax discount",
        gender: "Gender",
        male: "Male",
        female: "Female",
        basePointsMale: "2.25 base points",
        basePointsFemale: "2.75 base points",
        children: "Children",
        childAgePlaceholder: "Child's age",
        addChild: "+ Add",
        age: "Age {{age}}",
        childrenHint: "Tax credit points by child's age per law",
        military: "Discharged soldiers / national service",
        none: "None",
        militaryPointsHint: "+{{points}} points",
        additionalDetails: "Additional details",
        moshavMember: "Moshav / kibbutz member",
        moshavHint: "+1 tax credit point",
        academicDegree: "Academic degree",
        academicHint: "+0.5 tax credit point",
        priorityArea: "National priority area",
        priorityHint: "+0.5 tax credit point",
        newImmigrant: "New immigrant",
        newImmigrantHint: "Up to +3 points based on immigration year",
        immigrationYear: "Immigration year",
        defaultHourlyRate: "Default hourly rate",
        defaultHourlyRateHint: "Will be auto-filled in every new shift",
        perHourSuffix: "per hour",
        save: "Save settings",
        saved: "✓ Saved!"
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
        edit: "edit",
        editTitle: "Edit Shift"

        },
      ShiftsPage: {
        netTitle: "Net Monthly",
        grossTitle: "Gross Monthly",
        hours: "Hours",
        Shifts: "Shifts",
        completeProfileHint: "Complete profile",
        emptyTitle: "No shifts yet",
        emptySubtitle: "Add a shift using the + button",
        months: [
          "January", "February", "March", "April",
          "May", "June", "July", "August",
          "September", "October", "November", "December"
        ]
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

const applyDocumentDirection = (lng: string) => {
  document.documentElement.lang = lng
  document.documentElement.dir = lng === 'he' ? 'rtl' : 'ltr'
}

applyDocumentDirection(i18n.language)
i18n.on('languageChanged', applyDocumentDirection)

export default i18n