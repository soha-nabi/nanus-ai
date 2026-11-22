// Small elder-facing dictionary. Only the keys listed here are translated.
import type { LanguageCode } from "./types";

type Dictionary = Record<LanguageCode, Record<string, string>>;

export const STRINGS: Dictionary = {
  en: {
    appName: "NANU'S AI",
    greeting: "Hello, {name}",
    okay: "I am okay",
    needHelp: "I need help",
    contactFamily: "Contact my family",
    emergency: "Emergency help",
    medicines: "Medicines",
    checkin: "Check in",
    help: "Help",
    home: "Home",
    sendToFamily: "Send to my family",
    sentToFamily: "Sent to your family.",
    chooseFeeling: "Choose how you are feeling.",
    sendEmergency: "Send emergency request",
    emergencySent: "Your family has been notified in the app.",
    emergencyWarning:
      "This tells your family in the app. It does not call emergency services. If you are in danger, call your local emergency number now.",
    cancel: "Cancel",
  },
  hi: {
    appName: "नानू'स एआई",
    greeting: "नमस्ते, {name}",
    okay: "मैं ठीक हूँ",
    needHelp: "मुझे मदद चाहिए",
    contactFamily: "मेरे परिवार से संपर्क करें",
    emergency: "आपातकालीन सहायता",
    medicines: "दवाइयाँ",
    checkin: "अपनी स्थिति बताएँ",
    help: "मदद",
    home: "होम",
    sendToFamily: "मेरे परिवार को भेजें",
    sentToFamily: "आपके परिवार को भेज दिया गया है।",
    chooseFeeling: "चुनें कि आप कैसा महसूस कर रहे हैं।",
    sendEmergency: "आपातकालीन अनुरोध भेजें",
    emergencySent: "आपके परिवार को ऐप में सूचना दे दी गई है।",
    emergencyWarning:
      "यह केवल ऐप में आपके परिवार को बताता है। यह आपातकालीन सेवाओं को कॉल नहीं करता। अगर आप खतरे में हैं, तो अभी अपने स्थानीय आपातकालीन नंबर पर कॉल करें।",
    cancel: "रद्द करें",
  },
};

/**
 * Returns the text for a key in the given language. Missing Hindi keys fall back to English,
 * and {name}-style placeholders are replaced from vars. Unknown keys are returned as-is.
 */
export function t(language: LanguageCode, key: string, vars?: Record<string, string>): string {
  const template = STRINGS[language][key] ?? STRINGS.en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : match,
  );
}
