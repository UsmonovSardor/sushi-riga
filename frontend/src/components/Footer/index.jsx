import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

const ADDRESS = 'Lokomotīves iela 100, Rīga';
const MAP_URL = 'https://maps.google.com/?q=Lokomotīves+iela+100+Riga+Latvia';

export default function Footer() {
  const { lang } = useLanguage();
  const t = T[lang];

  return (
    <footer className="footer">
      <div className="footer-in">
        <div className="footer-grid">

          {/* Brand */}
          <div>
            <div className="footer-logo">🍣 SUSHI <span>RĪGA</span></div>
            <div className="footer-desc">{t.f_desc}</div>
            <div className="footer-socials">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-social">Instagram</a>
              <a href="https://t.me" target="_blank" rel="noreferrer" className="footer-social">Telegram</a>
            </div>
          </div>

          {/* Menu */}
          <div>
            <div className="footer-h">{lang==='ru'?'Меню':lang==='lv'?'Ēdienkarte':'Menu'}</div>
            {['hit','cold','hot','sets','drinks'].map(k => (
              <div key={k} className="footer-link" style={{cursor:'pointer'}}
                onClick={() => {
                  const el = document.getElementById('sec-'+k);
                  if(el) window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-120,behavior:'smooth'});
                }}>
                {t['c_'+k]}
              </div>
            ))}
          </div>

          {/* Contacts */}
          <div>
            <div className="footer-h">{t.s_contacts}</div>
            <a href="tel:+37100000000" className="footer-link footer-link--a">
              📞 +371 XX XXX XXX
            </a>
            <a href="mailto:info@sushiriga.lv" className="footer-link footer-link--a">
              ✉️ info@sushiriga.lv
            </a>
            <a href={MAP_URL} target="_blank" rel="noreferrer" className="footer-link footer-link--a footer-addr">
              📍 {ADDRESS}
            </a>
            <div className="footer-link footer-hours">
              🕐 {lang==='ru'?'Ежедневно':lang==='lv'?'Katru dienu':'Daily'}: 11:00–23:00
            </div>
          </div>

          {/* Map embed */}
          <div>
            <div className="footer-h">{lang==='ru'?'Мы на карте':lang==='lv'?'Mēs kartē':'Find us'}</div>
            <a href={MAP_URL} target="_blank" rel="noreferrer" className="footer-map">
              <div className="footer-map-inner">
                <span className="footer-map-pin">📍</span>
                <div className="footer-map-txt">
                  <div className="footer-map-name">Sushi Rīga</div>
                  <div className="footer-map-addr">{ADDRESS}</div>
                  <div className="footer-map-open">
                    {lang==='ru'?'Открыть в Google Maps':lang==='lv'?'Atvērt Google Maps':'Open in Google Maps'} →
                  </div>
                </div>
              </div>
            </a>
          </div>

        </div>

        <div className="footer-bar">
          <span>© 2026 Sushi Rīga. {t.f_rights}</span>
          <span>Made with ❤️ in Rīga</span>
        </div>
      </div>
    </footer>
  );
}
