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
        netSubtitleApprox: "הערכה לפי שיעורי {{year}}",

        creditsTitle: "נקודות זיכוי",
        creditsSubtitle: "חסכון ₪{{value}} לחודש",

        deductionsTitle: "ניכויים",
        deductionsSubtitle: "מס + ביטוח לאומי + בריאות + פנסיה",
        AverageTitle: "ממוצע שעתי",
        AverageSubtitle: "ממוצע הכנסה לשעה",
        hoursTitle: "שעות עבודה",
        hoursSubtitle: "סה״כ שעות החודש",
        jobGrossSubtitle: "השתכרות החודש ב{{job}}",
        breakdownTitle: "לפי עבודה",
        breakdownRow: "{{hours}} ש׳ · {{gross}}",
        noJob: "ללא עבודה",
        netAllOnly: "נטו וניכויים מוצגים רק ב״הכל״, כי הם תלויים בסך ההכנסה מכל העבודות"
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
        successVerification: "נשלח אימייל אימות! בדוק תיבת דואר",

        forgotPassword: "שכחת סיסמה?",
        forgotTitle: "איפוס סיסמה",
        forgotSubtitle: "הזן את האימייל שלך ונשלח לך קישור לאיפוס",
        sendResetLink: "שלח קישור לאיפוס",
        backToLogin: "חזרה להתחברות",
        errorFillEmail: "נא למלא כתובת אימייל",
        errorResetFailed: "שגיאה בשליחת הקישור, נסה שוב",
        successResetSent: "קישור לאיפוס סיסמה נשלח! בדוק את תיבת הדואר שלך",

        resetTitle: "בחר סיסמה חדשה",
        resetSubtitle: "בחר סיסמה חדשה לחשבון שלך",
        newPassword: "סיסמה חדשה",
        confirmPassword: "אימות סיסמה",
        errorPasswordsMismatch: "הסיסמאות אינן תואמות",
        successPasswordUpdated: "הסיסמה עודכנה בהצלחה! מעביר אותך פנימה...",
        updatePassword: "עדכן סיסמה"
      },

      shiftForm: {
        job: "עבודה",
        noJob: "ללא עבודה",
        addJobHint: "אפשר להוסיף עבודות (שכר, עיר, תוספת שבת) בהגדרות",
        date: "תאריך",
        shiftHoursLabel: "שעות המשמרת",
        start: "התחלה",
        end: "סוף",
        hoursWorked: "{{hours}} שעות עבודה",
        salary: "שכר",
        hourly: "לפי שעה",
        dailyTotal: "סה״כ יומי",
        perHour: "לשעה",
        holidaySuffix: "שבת / חג",
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
        alertSameTimes: "שעת ההתחלה והסיום זהות",
        alertEnterHourlyRate: "אנא הכנס שכר לשעה",
        alertEnterTotalSalary: "אנא הכנס שכר כולל",
        errorSaveFailed: "שגיאה בשמירת המשמרת, נסה שוב"
      },

      jobs: {
        title: "העבודות שלי",
        defaultName: "עבודה ראשית",
        premiumUnset: "תוספת שבת: לא הוגדר",
        premiumUnsetHint: "עוד לא הוגדר. נשאל אותך במשמרת השבת הראשונה",
        hint: "לכל עבודה שכר, עיר (לזמני שבת) ומדיניות תוספת שבת משלה",
        empty: "עוד לא הוספת עבודה",
        add: "+ הוסף עבודה",
        namePlaceholder: "שם העבודה / המעסיק",
        ratePlaceholder: "שכר לשעה",
        city: "עיר (לזמני כניסת ויציאת שבת)",
        paysPremium: "המעסיק משלם 150% בשבת",
        paysPremiumHint: "ברירת המחדל למשמרות בעבודה הזו",
        premiumOn: "תוספת שבת",
        premiumOff: "ללא תוספת שבת",
        edit: "עריכה",
        archive: "העבר לארכיון",
        restore: "שחזר",
        archivedTag: "בארכיון",
        showArchived: "הצג ארכיון ({{count}})",
        hideArchived: "הסתר ארכיון",
        save: "שמור",
        cancel: "ביטול",
        errorNameRequired: "אנא הכנס שם לעבודה",
        errorRate: "שכר לשעה לא תקין",
        errorSaveFailed: "שגיאה בשמירת העבודה, נסה שוב",
        pension: "הפרשה לפנסיה",
        pensionHint: "ההפרשה יורדת מהנטו ומזכה ב-35% זיכוי ממס",
        pensionPct: "אחוז הפרשת עובד",
        pensionOn: "פנסיה {{pct}}%",
        pensionOff: "ללא פנסיה",
        errorPensionPct: "אחוז פנסיה לא תקין (0–20)",
        tipsInPayslip: "הטיפים מופיעים בתלוש",
        tipsInPayslipHint: "כבוי = טיפים במזומן מחוץ לתלוש: לא חייבים במס ונוספים לנטו"
      },

      shabbat: {
        breakdownPremium: "{{regular}} ש׳ רגילות · {{shabbat}} ש׳ שבת ×1.5",
        breakdownNoPremium: "{{regular}} ש׳ רגילות · {{shabbat}} ש׳ שבת (ללא תוספת)",
        loading: "טוען זמני שבת...",
        loadFailed: "לא הצלחנו לטעון את זמני השבת — הקש לנסות שוב",
        loadFailedSub: "אפשר לשמור בכל זאת. המשמרת תסומן לבדיקה חוזרת ותחושב בינתיים לפי שכר רגיל.",
        waitForTimes: "רגע, טוענים את זמני השבת",
        askJobPremium: "האם העבודה הזו משלמת תוספת שבת (150%)?",
        askJobPremiumSub: "התשובה תישמר לעבודה הזו. אפשר לשנות בהגדרות.",
        yes: "כן",
        no: "לא",
        applyPremium: "תשלום 150% על שעות השבת במשמרת הזו",
        unverified: "זמני השבת לא אומתו",
        savedBreakdown: "{{regular}} ש׳ רגילות · {{shabbat}} ש׳ שבת",
        cardTitle: "שעות שבת",
        windowTimes: "{{city}} · {{from}} ← {{to}}",
        boundary: "{{day}} {{time}}",
        weekdays: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
        saturdayNight: "מוצ״ש",
        tickIn: "כניסת שבת",
        tickOut: "צאת שבת",
        regular: "רגילות",
        shabbatPremium: "שבת ×1.5",
        shabbatNoPremium: "שבת (ללא תוספת)",
        hoursValue: "{{hours}} ש׳",
        dailyTotalSplit: "{{regular}} ש׳ רגילות · {{shabbat}} ש׳ שבת — הסכום היומי לא מפוצל",
        timelineLabel: "משמרת {{start}}–{{end}}: {{regular}} ש׳ רגילות, {{shabbat}} ש׳ שבת",
        baseSalaryHours: "שכר בסיס · {{hours}} ש׳"
      },

      jobFilter: {
        label: "סינון לפי עבודה",
        all: "הכל"
      },

      whatsNew: {
        title: "✨ Oras התעדכנה!",
        items: [
          {
            icon: "🕯",
            title: "שעות שבת מחושבות אוטומטית",
            body: "המערכת יודעת עכשיו מתי שבת נכנסת ויוצאת לפי העיר שלך, ומחשבת 150% רק על השעות שבאמת נפלו בשבת. משמרת שמתחילה בשישי בצהריים ונגמרת בלילה מתחלקת אוטומטית לשעות רגילות ושעות שבת."
          },
          {
            icon: "💼",
            title: "כמה עבודות, כל אחת בצבע משלה",
            body: "עובדים ביותר ממקום אחד? אפשר להוסיף עבודות בהגדרות, לכל אחת תעריף, עיר וצבע, ולסנן משמרות ונתונים לפי עבודה."
          },
          {
            icon: "🧾",
            title: "חישוב נטו מעודכן ל-2026",
            body: "עדכנו את מדרגות המס החדשות, את שיעורי ביטוח לאומי ובריאות, והוספנו הפרשה לפנסיה. הנטו שתראו עכשיו קרוב יותר למה שמופיע בתלוש."
          },
          {
            icon: "👶",
            title: "נקודות זיכוי לילדים",
            body: "נקודות הזיכוי מחושבות עכשיו לפי שנת הלידה של כל ילד. אם יש לך ילדים, היכנסו להגדרות ואשרו את שנות הלידה."
          }
        ],
        unchanged: "המשמרות הקיימות שלך לא השתנו. אם תרצו, אפשר לחשב משמרת ישנה מחדש בשיטה החדשה דרך מסך העריכה.",
        feedback: "מצאתם משהו שלא נראה נכון? נשמח לשמוע 💜",
        gotIt: "הבנתי",
        reopen: "מה חדש ב-Oras"
      },

      shiftEdit: {
        legacyNote: "המשמרת נשמרה בחישוב הקודם, ללא פיצול שעות שבת.",
        legacyNote150: "המשמרת נשמרה בחישוב הקודם: 150% על כל המשמרת.",
        unverifiedNote: "זמני השבת לא נטענו כשהמשמרת נשמרה, ולכן היא חושבה לפי שכר רגיל.",
        recalculate: "חשב מחדש לפי שעות השבת החדשות",
        recheck: "בדוק שוב את זמני השבת",
        previewTitle: "תצוגה מקדימה של החישוב מחדש",
        before: "לפני",
        after: "אחרי",
        beforeHours: "{{hours}} ש׳",
        confirmRecalc: "אשר חישוב מחדש",
        previewHint: "שום דבר לא נשמר עד שלוחצים על שמור שינויים.",
        switchNotice: "המשמרת תחושב מחדש לפי שעות השבת החדשות. שכר: {{from}} ← {{to}}",
        keepOld: "השאר את החישוב הקודם"
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
        childBirthYearPlaceholder: "שנת לידה",
        addChild: "+ הוסף",
        childBirthYear: "{{year}} · גיל {{age}}",
        childEstimated: "משוער",
        childN: "ילד/ה {{n}}",
        childYearInvalid: "שנת לידה לא תקינה",
        childrenHint: "נקודות הזיכוי מחושבות לפי גיל הילד בשנת המס",
        confirmChildrenTitle: "בדיקה חד-פעמית: שנות לידה של הילדים",
        confirmChildrenBody: "מעכשיו נשמרת שנת לידה במקום גיל, כדי שהנקודות יתעדכנו כל שנה. חישבנו אותה מהגיל שהזנת. תקנו אם צריך ואשרו.",
        confirmChildrenButton: "אישור שנות הלידה",
        parentColumn: "עמודה בטופס 101",
        parentColumn1: "1 · אם / הורה משמורן",
        parentColumn2: "2 · הורה אחר",
        parentColumnHint: "משפיע על הנקודות לגילאי 6–18. ברירת מחדל: 1 לנשים, 2 לגברים",
        genderRequired: "בחרו מגדר כדי שנחשב נקודות זיכוי. עד אז לא נספרות נקודות, והנטו המוצג נמוך מהאמיתי.",
        none: "ללא",
        serviceType: "שירות צבאי או לאומי",
        serviceNone: "ללא שירות",
        serviceMilitary: "שירות צבאי",
        serviceNational: "שירות לאומי / אזרחי",
        dischargeDate: "תאריך שחרור",
        dischargeDateHint: "נקודות זיכוי לחיילים משוחררים ניתנות למשך 36 חודשים (3 שנים) מהחודש שלאחר השחרור.",
        additionalDetails: "פרטים נוספים",
        academicDegree: "תואר אקדמי",
        academicHint: "+0.5 נקודת זיכוי",
        newImmigrant: "עולה חדש",
        newImmigrantHint: "עד +3 נקודות לפי שנת עלייה",
        immigrationYear: "שנת עלייה",
        defaultHourlyRate: "שכר ברירת מחדל לשעה",
        defaultHourlyRateHint: "יוכנס אוטומטית בכל משמרת חדשה",
        perHourSuffix: "לשעה",
        save: "שמור הגדרות",
        saved: "✓ נשמר!",
        errorSaveFailed: "שגיאה בשמירת ההגדרות, נסה שוב"
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
        errorUpdateFailed: "שגיאה בעדכון המשמרת, נסה שוב",
        errorDeleteFailed: "שגיאה במחיקת המשמרת, נסה שוב",
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
      },

      stats: {
        title: "סטטיסטיקה",
        headerSubtitle: "המשמרות וההכנסות שלך לאורך זמן",
        hoursTitle: "שעות עבודה",
        hoursSubtitle: "סה״כ שעות ב-6 החודשים האחרונים",
        hoursUnit: " ש",
        rateTitle: "שכר שעתי ממוצע",
        rateSubtitle: "ממוצע ₪ לשעה ב-6 החודשים האחרונים",
        noDataTitle: "אין עדיין נתונים",
        noDataSubtitle: "הוסף משמרות כדי לראות סטטיסטיקה",
        monthsShort: [
          "ינו", "פבר", "מרץ", "אפר",
          "מאי", "יונ", "יול", "אוג",
          "ספט", "אוק", "נוב", "דצמ"
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
        netSubtitleApprox: "Estimate using {{year}} rates",

        creditsTitle: "Tax Credits",
        creditsSubtitle: "Monthly savings of ₪{{value}}",

        deductionsTitle: "Deductions",
        deductionsSubtitle: "Tax + insurance + pension",
        AverageTitle: "Hourly Average",
        AverageSubtitle: "Average hourly earnings",
        hoursTitle: "Hours Worked",
        hoursSubtitle: "Total hours this month",
        jobGrossSubtitle: "Earned this month at {{job}}",
        breakdownTitle: "By job",
        breakdownRow: "{{hours}} h · {{gross}}",
        noJob: "No job",
        netAllOnly: "Net and deductions show on “All” only, since they depend on your combined income"

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
        successVerification: "Verification email sent! Check your inbox",

        forgotPassword: "Forgot password?",
        forgotTitle: "Reset password",
        forgotSubtitle: "Enter your email and we'll send you a reset link",
        sendResetLink: "Send reset link",
        backToLogin: "Back to login",
        errorFillEmail: "Please fill in your email",
        errorResetFailed: "Failed to send reset link, please try again",
        successResetSent: "Reset link sent! Check your inbox",

        resetTitle: "Choose a new password",
        resetSubtitle: "Set a new password for your account",
        newPassword: "New password",
        confirmPassword: "Confirm password",
        errorPasswordsMismatch: "Passwords do not match",
        successPasswordUpdated: "Password updated! Redirecting you...",
        updatePassword: "Update password"
      },

      shiftForm: {
        job: "Job",
        noJob: "No job",
        addJobHint: "Add your jobs (rate, city, Shabbat premium) in Settings",
        date: "Date",
        shiftHoursLabel: "Shift hours",
        start: "Start",
        end: "End",
        hoursWorked: "{{hours}} hours worked",
        salary: "Salary",
        hourly: "Hourly",
        dailyTotal: "Daily total",
        perHour: "/ hr",
        holidaySuffix: "Shabbat / Holiday",
        baseSalary: "Base salary",
        tip: "Tip",
        optional: "optional",
        tipsPlaceholder: "Total tips",
        totalIncome: "Total income",
        breakdown: "₪{{salary}} salary + ₪{{tips}} tips",
        saveShift: "Save Shift",
        saveChanges: "Save changes",
        saving: "Saving...",
        alertSameTimes: "Start and end times are the same",
        alertEnterTimes: "Please enter shift times",
        alertEnterHourlyRate: "Please enter hourly rate",
        alertEnterTotalSalary: "Please enter total salary",
        errorSaveFailed: "Failed to save shift, please try again"
      },

      jobs: {
        title: "My jobs",
        defaultName: "Main job",
        premiumUnset: "Shabbat premium: not set",
        premiumUnsetHint: "Not set yet. We'll ask on your first Shabbat shift",
        hint: "Each job has its own rate, city (for Shabbat times) and Shabbat premium policy",
        empty: "You haven't added a job yet",
        add: "+ Add job",
        namePlaceholder: "Job / employer name",
        ratePlaceholder: "Hourly rate",
        city: "City (for Shabbat start and end times)",
        paysPremium: "Employer pays 150% on Shabbat",
        paysPremiumHint: "Default for shifts at this job",
        premiumOn: "Shabbat premium",
        premiumOff: "No Shabbat premium",
        edit: "Edit",
        archive: "Archive",
        restore: "Restore",
        archivedTag: "archived",
        showArchived: "Show archived ({{count}})",
        hideArchived: "Hide archived",
        save: "Save",
        cancel: "Cancel",
        errorNameRequired: "Please enter a job name",
        errorRate: "Invalid hourly rate",
        errorSaveFailed: "Couldn't save the job, please try again",
        pension: "Pension contribution",
        pensionHint: "Deducted from net; 35% of it comes back as a tax credit",
        pensionPct: "Employee contribution %",
        pensionOn: "pension {{pct}}%",
        pensionOff: "no pension",
        errorPensionPct: "Invalid pension % (0–20)",
        tipsInPayslip: "Tips are on the payslip",
        tipsInPayslipHint: "Off = cash tips outside the payslip: not taxed, added to net"
      },

      shabbat: {
        breakdownPremium: "{{regular}} h regular · {{shabbat}} h Shabbat ×1.5",
        breakdownNoPremium: "{{regular}} h regular · {{shabbat}} h Shabbat (no premium)",
        loading: "Loading Shabbat times...",
        loadFailed: "Couldn't load Shabbat times — tap to retry",
        loadFailedSub: "You can still save. The shift will be marked for re-checking and paid at the regular rate until then.",
        waitForTimes: "One moment, loading Shabbat times",
        askJobPremium: "Does this job pay a Shabbat premium (150%)?",
        askJobPremiumSub: "Your answer is saved for this job. You can change it in Settings.",
        yes: "Yes",
        no: "No",
        applyPremium: "Pay 150% for this shift's Shabbat hours",
        unverified: "Shabbat times not verified",
        savedBreakdown: "{{regular}}h regular · {{shabbat}}h Shabbat",
        cardTitle: "Shabbat hours",
        windowTimes: "{{city}} · {{from}} → {{to}}",
        boundary: "{{day}} {{time}}",
        weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        saturdayNight: "Sat",
        tickIn: "Shabbat starts",
        tickOut: "Shabbat ends",
        regular: "Regular",
        shabbatPremium: "Shabbat ×1.5",
        shabbatNoPremium: "Shabbat (no premium)",
        hoursValue: "{{hours}} h",
        dailyTotalSplit: "{{regular}} h regular · {{shabbat}} h Shabbat — daily total isn't split",
        timelineLabel: "Shift {{start}}–{{end}}: {{regular}} h regular, {{shabbat}} h Shabbat",
        baseSalaryHours: "Base salary · {{hours}} h"
      },

      jobFilter: {
        label: "Filter by job",
        all: "All"
      },

      whatsNew: {
        title: "✨ Oras has been updated!",
        items: [
          {
            icon: "🕯",
            title: "Shabbat hours, calculated automatically",
            body: "The app now knows when Shabbat starts and ends in your city, and pays 150% only for the hours that actually fell on Shabbat. A shift that starts Friday afternoon and ends at night is split automatically into regular hours and Shabbat hours."
          },
          {
            icon: "💼",
            title: "Several jobs, each with its own color",
            body: "Work in more than one place? Add your jobs in Settings, each with its own rate, city and color, and filter your shifts and stats by job."
          },
          {
            icon: "🧾",
            title: "Net pay updated for 2026",
            body: "We added the new tax brackets and the updated National Insurance and health tax rates, plus pension contributions. The net you see now is closer to what's on your payslip."
          },
          {
            icon: "👶",
            title: "Tax credit points for children",
            body: "Credit points are now calculated from each child's birth year. If you have children, go to Settings and confirm their birth years."
          }
        ],
        unchanged: "Your existing shifts haven't changed. If you'd like, you can recalculate an old shift with the new method from its edit screen.",
        feedback: "Found something that doesn't look right? We'd love to hear from you 💜",
        gotIt: "Got it",
        reopen: "What's new in Oras"
      },

      shiftEdit: {
        legacyNote: "Saved with the previous calculation, without splitting Shabbat hours.",
        legacyNote150: "Saved with the previous calculation: 150% on the whole shift.",
        unverifiedNote: "Shabbat times didn't load when this shift was saved, so it was paid at the regular rate.",
        recalculate: "Recalculate with the new Shabbat calculation",
        recheck: "Re-check Shabbat times",
        previewTitle: "Recalculation preview",
        before: "Before",
        after: "After",
        beforeHours: "{{hours}} h",
        confirmRecalc: "Confirm recalculation",
        previewHint: "Nothing is saved until you tap Save changes.",
        switchNotice: "This shift will be recalculated with the new Shabbat hours. Pay: {{from}} → {{to}}",
        keepOld: "Keep the previous calculation"
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
        childBirthYearPlaceholder: "Birth year",
        addChild: "+ Add",
        childBirthYear: "{{year}} · age {{age}}",
        childEstimated: "estimated",
        childN: "Child {{n}}",
        childYearInvalid: "Invalid birth year",
        childrenHint: "Credit points follow the child's age in the tax year",
        confirmChildrenTitle: "One-time check: children's birth years",
        confirmChildrenBody: "We now store birth years instead of ages, so points update every year. We worked them out from the ages you entered. Fix any that are off, then confirm.",
        confirmChildrenButton: "Confirm birth years",
        parentColumn: "Form 101 column",
        parentColumn1: "1 · Mother / custodial parent",
        parentColumn2: "2 · Other parent",
        parentColumnHint: "Changes the points for ages 6–18. Default: 1 for women, 2 for men",
        genderRequired: "Choose a gender so we can count credit points. Until then no points are counted, so the net shown is lower than it should be.",
        none: "None",
        serviceType: "Military or National Service",
        serviceNone: "No service",
        serviceMilitary: "Military service",
        serviceNational: "National / Civil service",
        dischargeDate: "Discharge date",
        dischargeDateHint: "Tax credit points for discharged soldiers are granted for 36 months (3 years) starting from the month after discharge.",
        additionalDetails: "Additional details",
        academicDegree: "Academic degree",
        academicHint: "+0.5 tax credit point",
        newImmigrant: "New immigrant",
        newImmigrantHint: "Up to +3 points based on immigration year",
        immigrationYear: "Immigration year",
        defaultHourlyRate: "Default hourly rate",
        defaultHourlyRateHint: "Will be auto-filled in every new shift",
        perHourSuffix: "per hour",
        save: "Save settings",
        saved: "✓ Saved!",
        errorSaveFailed: "Failed to save settings, please try again"
      },

      shiftCard: {
        shiftHours: "Shift hours",
        hours: "hrs",
        income: "Income",
        total: "Total",
        errorUpdateFailed: "Failed to update shift, please try again",
        errorDeleteFailed: "Failed to delete shift, please try again",
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
      },

      stats: {
        title: "Statistics",
        headerSubtitle: "Your work and earnings, over time",
        hoursTitle: "Hours Worked",
        hoursSubtitle: "Total hours over the last 6 months",
        hoursUnit: " hrs",
        rateTitle: "Average Hourly Rate",
        rateSubtitle: "Average ₪/hr over the last 6 months",
        noDataTitle: "No data yet",
        noDataSubtitle: "Add shifts to see your statistics",
        monthsShort: [
          "Jan", "Feb", "Mar", "Apr",
          "May", "Jun", "Jul", "Aug",
          "Sep", "Oct", "Nov", "Dec"
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