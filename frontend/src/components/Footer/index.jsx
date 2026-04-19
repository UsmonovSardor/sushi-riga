import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';
export default function Footer() {
  const { lang } = useLanguage();
  const t = T[lang];
  return (
    <footer className="footer">
      <div className="footer-wrap">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">🍣 SUSHI <span>RĪGA</span></div>
            <div className="footer-desc">{t.f_desc}</div>
          </div>
          <div>
            <div className="footer-h">{t.c_rolls}</div>
            {['hit','sets','cold','hot','drinks'].map(k=>(
              <div key={k} className="footer-link">{t['c_'+k]}</div>
            ))}
          </div>
          <div>
            <div className="footer-h">{t.s_contacts}</div>
            <div className="footer-link">📞 +371 XX XXX XXX</div>
            <div className="footer-link">✉️ info@sushiriga.lv</div>
            <div className="footer-link">📍 {t.city}</div>
          </div>
          <div>
            <div className="footer-h">11:00 – 23:00</div>
            <div className="footer-link">Пн–Пт: 11:00–22:30</div>
            <div className="footer-link">Сб–Вс: 11:00–23:00</div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Sushi Rīga. {t.f_rights}</span>
          <span>Made with ❤️ in Rīga</span>
        </div>
      </div>
    </footer>
  );
}