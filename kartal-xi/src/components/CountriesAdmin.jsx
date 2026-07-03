import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import styles from './CountriesAdmin.module.css';

const COUNTRY_CODES = {
  'Türkiye':'tr','Portekiz':'pt','Arjantin':'ar','Brezilya':'br','Fransa':'fr',
  'Almanya':'de','Hollanda':'nl','İtalya':'it','İspanya':'es','Belçika':'be',
  'Sırbistan':'rs','Fas':'ma','Nijerya':'ng','Gana':'gh','Senegal':'sn',
  'Kamerun':'cm','Japonya':'jp','Avustralya':'au','Uruguay':'uy','Kolombiya':'co',
  'Norveç':'no','İsveç':'se','Danimarka':'dk','Polonya':'pl','Romanya':'ro',
  'Ukrayna':'ua','Yunanistan':'gr','İsviçre':'ch','Kosova':'xk','Arnavutluk':'al',
  'Hırvatistan':'hr','Bosna Hersek':'ba','Makedonya':'mk','Macaristan':'hu',
  'Avusturya':'at','Slovakya':'sk','Amerika Birleşik Devletleri':'us',
  'Meksika':'mx','Jamaika':'jm','Güney Kore':'kr','Cezayir':'dz',
  'Tunus':'tn','Mısır':'eg','Rusya':'ru','İngiltere':'gb-eng',
  'İskoçya':'gb-sct','Galler':'gb-wls','Karadağ':'me','Çek Cumhuriyeti':'cz',
  'Benin':'benin',
};

const CUSTOM_FLAGS = {
  'benin':'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Flag_of_Benin.svg/330px-Flag_of_Benin.svg.png',
};

function getFlagUrl(country) {
  const code = COUNTRY_CODES[country];
  if (!code) return null;
  return CUSTOM_FLAGS[code] || `https://flagcdn.com/w40/${code}.png`;
}

export default function CountriesAdmin() {
  const [players, setPlayers] = useState([]);
  const [missing, setMissing] = useState([]);
  const [customUrl, setCustomUrl] = useState({});
  const [saving, setSaving] = useState({});
  const [msg, setMsg] = useState({});

  useEffect(() => { fetchPlayers(); }, []);

  async function fetchPlayers() {
    const { data } = await supabase.from('players').select('id, ad_soyad, ulke, club_id').order('ulke');
    if (!data) return;
    setPlayers(data);
    const missingCountries = [...new Set(data.map(p => p.ulke).filter(u => u && !COUNTRY_CODES[u]))];
    setMissing(missingCountries);
  }

  // Group players by country
  const byCountry = {};
  players.forEach(p => {
    if (!p.ulke) return;
    if (!byCountry[p.ulke]) byCountry[p.ulke] = [];
    byCountry[p.ulke].push(p);
  });

  const countries = Object.keys(byCountry).sort((a, b) => a.localeCompare(b, 'tr'));

  return (
    <div className={styles.wrap}>
      {missing.length > 0 && (
        <div className={styles.missingSection}>
          <div className={styles.sectionTitle}>Bayrak Eksik Ülkeler ({missing.length})</div>
          <div className={styles.hint}>Bu ülkeler için bayrak kodu tanımlı değil. Ülke adını düzelt veya kodu ekle.</div>
          {missing.map(country => (
            <div key={country} className={styles.missingRow}>
              <div className={styles.missingAvatar}>?</div>
              <div className={styles.missingInfo}>
                <div className={styles.countryName}>{country}</div>
                <div className={styles.playerCount}>{byCountry[country]?.length || 0} oyuncu</div>
              </div>
              <div className={styles.missingPlayers}>
                {(byCountry[country]||[]).map(p => <span key={p.id} className={styles.playerTag}>{p.ad_soyad}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.sectionTitle}>Tüm Ülkeler ({countries.length})</div>
      <div className={styles.countryList}>
        {countries.map(country => {
          const flagUrl = getFlagUrl(country);
          const hasMissing = !flagUrl;
          return (
            <div key={country} className={`${styles.countryRow} ${hasMissing ? styles.countryMissing : ''}`}>
              <div className={styles.flagWrap}>
                {flagUrl
                  ? <img src={flagUrl} alt={country} className={styles.flagImg}
                      onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                    />
                  : null}
                <div className={styles.flagFallback} style={{display: flagUrl ? 'none' : 'flex'}}>?</div>
              </div>
              <div className={styles.countryInfo}>
                <div className={styles.countryName}>{country}</div>
                <div className={styles.countryCode}>{COUNTRY_CODES[country] || 'kod yok'}</div>
              </div>
              <div className={styles.playerCount}>{byCountry[country].length} oyuncu</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
