// Wetterdaten (Demo)
const wetterDaten = {
  stadt: "Berlin",
  temperatur: "22°C",
  zustand: "Sonnig"
};

// Widget erstellen
const widget = document.createElement('div');
widget.innerHTML = `
  <h2>${wetterDaten.stadt}</h2>
  <p>${wetterDaten.temperatur}</p>
  <p>${wetterDaten.zustand}</p>
`;
document.getElementById('widget-container').appendChild(widget);

// Button-Download-Funktion
document.getElementById('download-btn').addEventListener('click', () => {
  const code = `
<!-- Wetter Widget -->
<div>
  <h2>${wetterDaten.stadt}</h2>
  <p>${wetterDaten.temperatur}</p>
  <p>${wetterDaten.zustand}</p>
</div>
  `;
  const blob = new Blob([code], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "wetter-widget.html";
  link.click();
});
