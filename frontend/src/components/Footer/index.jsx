import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

const MAP_URL = 'https://maps.google.com/?q=Lokomotīves+iela+100+Riga+Latvia';

export default function Footer() {
  const { lang } = useLanguage();
  const t = T[lang];

  const go = id => {
    const el = document.getElementById('sec-' + id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior:'smooth' });
  };

  return (
    <footer className="footer">
      <div className="footer-in">
        <div className="footer-grid">

          {/* Brand */}
          <div>
            <div className="footer-logo">🍣 SUSHI <span>RĪGA</span></div>
            <div className="footer-desc">{t.f_desc}</div>
            <div className="footer-socials">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-social">Instagram ↗</a>
            </div>
          </div>

          {/* Menu */}
          <div>
            <div className="footer-h">{lang==='lv'?'Ēdienkarte':lang==='en'?'Menu':'Меню'}</div>
            {[
              ['hit','⭐',t.c_hit],['cold','🍣',t.c_cold],['hot','🔥',t.c_hot],
              ['sets','🎁',t.c_sets],['drinks','🥤',t.c_drinks],
            ].map(([id,e,label]) => (
              <div key={id} className="footer-link footer-link--btn" onClick={() => go(id)}>
                {e} {label}
              </div>
            ))}
          </div>

          {/* Contacts - NO email */}
          <div>
            <div className="footer-h">{t.s_contacts}</div>
            <a href={`tel:${t.phone}`} className="footer-link footer-link--a footer-contact-row">
              <span>📞</span><span>{t.phone}</span>
            </a>
            <a href={MAP_URL} target="_blank" rel="noreferrer" className="footer-link footer-link--a footer-contact-row">
              <span>📍</span><span>{t.address}</span>
            </a>
            <div className="footer-link footer-contact-row">
              <span>🕐</span>
              <span>{t.daily}: {t.hours}</span>
            </div>
          </div>

          {/* Map */}
          <div>
            <div className="footer-h">{lang==='lv'?'Mēs kartē':lang==='en'?'Find us':'На карте'}</div>
            <a href={MAP_URL} target="_blank" rel="noreferrer" className="footer-map">
              <div className="footer-map-inner">
                <span className="footer-map-pin">📍</span>
                <div>
                  <div className="footer-map-name">Sushi Rīga</div>
                  <div className="footer-map-addr">{t.address}</div>
                  <div className="footer-map-open">
                    {lang==='lv'?'Atvērt Google Maps':lang==='en'?'Open Google Maps':'Открыть карту'} →
                  </div>
                </div>
              </div>
            </a>
          </div>

        </div>

        <div className="footer-bar">
          <span>© {new Date().getFullYear()} Sushi Rīga. {t.f_rights}</span>
          <span>Made with ❤️ in Rīga</span>
        </div>
      </div>
    </footer>
  );
}
