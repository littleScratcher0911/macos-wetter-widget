// Mapping WMO-Weathercodes → Klartext + Emoji
const WEATHER = {
  0: ["Klar","☀️"],          1:["Fast klar","🌤️"],
  2:["Wolkig","⛅"],          3:["Bedeckt","☁️"],
  45:["Nebel","🌫️"],         48:["Reif-Nebel","🌫️"],
  51:["Niesel","🌦️"],        53:["Niesel","🌧️"],
  55:["Starker Niesel","🌧️"],56:["Gefrier-Niesel","🌧️"],
  57:["Gefrier-Niesel","🌧️"],61:["Leichter Regen","🌧️"],
  63:["Regen","🌧️"],         65:["Starker Regen","🌧️"],
  66:["Gefrier-Regen","🌧️"], 67:["Starker Gefrier-Regen","🌧️"],
  71:["Leichter Schnee","🌨️"],73:["Schnee","🌨️"],
  75:["Starker Schnee","❄️"],77:["Eiskörner","❄️"],
  80:["Regenschauer","🌧️"],  81:["Starke Schauer","🌧️"],
  82:["Heftige Schauer","🌧️"],85:["Schneeschauer","🌨️"],
  86:["Starke Schneeschauer","🌨️"],95:["Gewitter","⛈️"],
  96:["Gewitter Hagel","⛈️"],99:["Schweres Gewitter","⛈️"]
};

// UI-Elemente
const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const widget = document.getElementById("widget");
const dlBtn  = document.getElementById("download-btn");

// Ort → Geokoordinaten → Forecast holen
form.addEventListener("submit", async e=>{
  e.preventDefault();
  try{
    const city = input.value.trim();
    widget.innerHTML = "⏳ Lade Wetter …";
    const geo = await geocode(city);
    const data = await getForecast(geo);
    renderWidget(data, geo);
    dlBtn.hidden = false;
    dlBtn.onclick = () => downloadSnippet(data, geo);
  }catch(err){
    widget.innerHTML = `<span style="color:red">⚠️ ${err.message}</span>`;
    dlBtn.hidden = true;
  }
});

// --- Hilfsfunktionen ------------------------------------------------------

async function geocode(place){
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=de&format=json`;
  const res = await fetch(url);
  const js  = await res.json();
  if(!js.results?.length) throw new Error("Ort nicht gefunden");
  const {latitude, longitude, name, country} = js.results[0];
  return {latitude, longitude, name, country};
}

async function getForecast({latitude,longitude}){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;
  const res = await fetch(url);
  return await res.json();
}

function renderWidget(data, geo){
  const cw = data.current_weather;
  const [desc,icon] = WEATHER[cw.weathercode] ?? ["",""];
  const hum  = data.hourly.relative_humidity_2m[0];
  const prec = data.hourly.precipitation_probability[0];

  // Aktuell
  const current = `
    <div class="current">
      <div class="temp">${Math.round(cw.temperature)}°C</div>
      <div>
        <h2>${geo.name}, ${geo.country}</h2>
        <p>${icon} ${desc}</p>
        <p>💧 ${hum}% · 🌂 ${prec}% Niederschlagsw-</p>
        <p>💨 ${Math.round(cw.windspeed)} km/h</p>
      </div>
    </div>
  `;

  // 5-Tage-Forecast
  const fcCards = data.daily.time.slice(0,5).map((date,i)=>{
    const d = new Date(date);
    const wcode = data.daily.weathercode[i];
    const [dsc,ico] = WEATHER[wcode] ?? ["",""];
    const tmax = Math.round(data.daily.temperature_2m_max[i]);
    const tmin = Math.round(data.daily.temperature_2m_min[i]);
    return `
      <div class="card">
        <h3>${d.toLocaleDateString("de-DE",{weekday:"short"})}</h3>
        <p>${ico} ${dsc}</p>
        <p>${tmin}° / ${tmax}°</p>
      </div>`;
  }).join("");

  widget.innerHTML = current + `<div class="forecast">${fcCards}</div>`;
}

// Mini-HTML zum Download generieren
function downloadSnippet(data, geo){
  const {latitude,longitude} = geo;
  const snippet = `
<!-- Einbettbares Wetter-Widget -->
<iframe src="https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m&timezone=auto&format=html"
        style="border:none;width:100%;max-width:300px;height:200px;">
</iframe>`;
  const blob = new Blob([snippet],{type:"text/html"});
  const a = Object.assign(document.createElement("a"),{
    href:URL.createObjectURL(blob),
    download:`widget-${geo.name}.html`
  });
  a.click();
  URL.revokeObjectURL(a.href);
}
