import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';
export default function Footer() {
  const { lang } = useLanguage();
  const t = T[lang];
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div className="f-logo">🍣 SUSHI <span>RĪGA</span></div>
            <p className="f-desc">{t.f_desc}</p>
          </div>
          <div>
            <div className="f-head">{t.c_rolls}</div>
            {['hit','sets','cold','hot','drinks'].map(k => (
              <div key={k} className="f-link">{t['c_'+k]}</div>
            ))}
          </div>
          <div>
            <div className="f-head">{t.s_contacts}</div>
            <div className="f-link">📞 +371 XX XXX XXX</div>
            <div className="f-link">✉️ info@sushiriga.lv</div>
            <div className="f-link">📍 {t.city}</div>
          </div>
          <div>
            <div className="f-head">11:00 – 23:00</div>
            <div className="f-link">Пн–Пт: 11:00–22:30</div>
            <div className="f-link">Сб–Вс: 11:00–23:00</div>
          </div>
        </div>
        <div className="f-bottom">
          <span>© 2026 Sushi Rīga. {t.f_rights}</span>
          <span>Made with ❤️ in Rīga</span>
        </div>
      </div>
    </footer>
  );
}