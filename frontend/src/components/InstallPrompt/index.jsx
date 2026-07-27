import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const DISMISS_KEY = 'sr_install_dismissed';

const TXT = {
  lv: { title: 'Instalē Cherry Sushi', sub: 'Pievieno sākuma ekrānam — ātrāk un ērtāk.', btn: 'Instalēt', later: 'Vēlāk',
        ios: 'Nospied ', ios2: ' un “Pievienot sākuma ekrānam”.' },
  ru: { title: 'Установить Cherry Sushi', sub: 'Добавьте на главный экран — быстрее и удобнее.', btn: 'Установить', later: 'Позже',
        ios: 'Нажмите ', ios2: ' и «На экран “Домой”».' },
  en: { title: 'Install Cherry Sushi', sub: 'Add to your home screen — faster and app-like.', btn: 'Install', later: 'Later',
        ios: 'Tap ', ios2: ' then “Add to Home Screen”.' },
};

export default function InstallPrompt() {
  const { lang } = useLanguage();
  const t = TXT[lang] || TXT.lv;
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already installed / running standalone → never show
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    if (ios) {
      setIsIOS(true);
      const timer = setTimeout(() => setShow(true), 3500); // let them browse first
      return () => clearTimeout(timer);
    }

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', () => setShow(false));
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    setShow(false);
    if (outcome !== 'accepted') localStorage.setItem(DISMISS_KEY, '1');
  };

  if (!show) return null;

  return (
    <div className="install-prompt" role="dialog" aria-label={t.title}>
      <img className="install-icon" src="/icon-192.png" alt="" width="46" height="46" />
      <div className="install-body">
        <div className="install-title">{t.title}</div>
        <div className="install-sub">
          {isIOS ? (<>{t.ios}<span className="install-share">⎋</span>{t.ios2}</>) : t.sub}
        </div>
      </div>
      {!isIOS && <button className="install-btn" onClick={install}>{t.btn}</button>}
      <button className="install-x" onClick={dismiss} aria-label={t.later}>✕</button>
    </div>
  );
}
