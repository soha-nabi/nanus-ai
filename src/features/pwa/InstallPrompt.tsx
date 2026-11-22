import { useEffect, useState } from 'react';

// Chromium-only event; not part of the standard DOM typings used here.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const INSTALL_HELP_TEXT =
  "Use your browser menu to add Nanu's AI to your home screen.";

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      // Keep the event so the button can trigger the native install dialog later.
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (installed) {
    return <p role="status">Nanu's AI was added to your home screen.</p>;
  }

  if (!installEvent) {
    // Event never fired (or was already used): show nothing.
    return null;
  }

  const handleInstall = async () => {
    const promptEvent = installEvent;
    setInstallEvent(null);
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalled(true);
    }
  };

  return (
    <button type="button" onClick={handleInstall}>
      Install Nanu's AI
    </button>
  );
}
