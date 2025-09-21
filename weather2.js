const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const useLocBtn = document.getElementById('use-location');
const weatherArea = document.getElementById('weather-area');
const statusArea = document.getElementById('status-area');
const detailsArea = document.getElementById('details-area');
const miniLoader = document.getElementById('mini-loader');
const localTime = document.getElementById('local-time');


function showLoader(show=true){
  miniLoader.style.display = show ? 'block' : 'none';
}
function setStatus(html){
  statusArea.innerHTML = html || "";
}
function formatTimeFromUnix(unix, tzOffsetSeconds){
  const d = new Date((unix + tzOffsetSeconds) * 1000);
  return d.toUTCString().replace(/GMT/, '').trim();
}

async function fetchWeatherByCity(city){
  try {
    startLoading();
    const res = await fetch(`http://localhost:5000/weather?city=${encodeURIComponent(city)}`);
    if(!res.ok) throw res;
    const data = await res.json();
    renderWeather(data);
  } catch (err) {
    handleFetchError(err);
  } finally {
    stopLoading();
  }
}

async function fetchWeatherByCoords(lat, lon){
  try {
    startLoading();
    const res = await fetch(`http://localhost:5000/weather/coords?lat=${lat}&lon=${lon}`);
    if(!res.ok) throw res;
    const data = await res.json();
    renderWeather(data);
  } catch (err) {
    handleFetchError(err);
  } finally {
    stopLoading();
  }
}

function renderWeather(data){
  const { name, sys, weather, main, wind, dt, timezone } = data;
  const icon = weather?.[0]?.icon || '';
  const desc = weather?.[0]?.description || '';
  const mainWeather = weather?.[0]?.main || '';
  const localTimeStr = formatTimeFromUnix(dt, timezone);

  weatherArea.innerHTML = `
    <div class="main-weather">
      <div class="weather-icon" aria-hidden="true">
        ${ icon ? `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" width="96" height="96">` : '❓' }
      </div>
      <div class="weather-info">
        <h2>${Math.round(main.temp)}°C — ${name}${sys?.country ? ', ' + sys.country : ''}</h2>
        <p style="text-transform:capitalize">${desc} · feels like ${Math.round(main.feels_like)}°C</p>
        <div class="stats" role="list">
          <div class="stat" role="listitem"><small>Humidity</small><strong>${main.humidity}%</strong></div>
          <div class="stat" role="listitem"><small>Wind</small><strong>${wind.speed} m/s ${wind.deg ?? ''}</strong></div>
          <div class="stat" role="listitem"><small>Temp range</small><strong>${Math.round(main.temp_min)}° — ${Math.round(main.temp_max)}°C</strong></div>
          <div class="stat" role="listitem"><small>Condition</small><strong>${mainWeather}</strong></div>
        </div>
      </div>
    </div>
  `;

  detailsArea.innerHTML = `
    <div style="color:var(--muted);font-size:13px">Last update</div>
    <div style="margin-top:6px;font-weight:600">${localTimeStr}</div>
    <div style="margin-top:12px;color:var(--muted);font-size:13px">
      Coordinates: ${data.coord.lat.toFixed(3)}, ${data.coord.lon.toFixed(3)}
    </div>
  `;

  localTime.textContent = localTimeStr;
  setStatus('');
}

function renderError(message){
  weatherArea.innerHTML = `<div class="error" role="alert">${message}</div>`;
  detailsArea.innerHTML = `<div style="color:var(--muted)">No details available</div>`;
  setStatus('');
}

function handleFetchError(err){
  if(err instanceof Response){
    if(err.status === 404){
      renderError("City not found.");
    } else if(err.status === 401){
      renderError("Invalid API key.");
    } else {
      renderError("Error fetching weather. HTTP " + err.status);
    }
  } else {
    renderError("Network error. (" + (err.message || err) + ")");
  }
}

function startLoading(){
  setStatus('<div style="display:flex;gap:8px;align-items:center"><span class="loader"></span><span style="color:var(--muted)">Fetching weather…</span></div>');
  showLoader(true);
}
function stopLoading(){
  showLoader(false);
}

searchBtn.addEventListener('click', () => {
  const q = cityInput.value.trim();
  if(!q) {
    setStatus('<div class="error">Please enter a city name.</div>');
    return;
  }
  fetchWeatherByCity(q);
});

cityInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter'){
    searchBtn.click();
  }
});

useLocBtn.addEventListener('click', () => {
  if(!navigator.geolocation){
    renderError("Geolocation not supported.");
    return;
  }
  setStatus('<div style="display:flex;gap:8px;align-items:center"><span class="loader"></span><span style="color:var(--muted)">Getting your location…</span></div>');
  showLoader(true);
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    fetchWeatherByCoords(latitude, longitude);
  }, (err) => {
    showLoader(false);
    if(err.code === 1){
      renderError("Location permission denied.");
    } else {
      renderError("Unable to get location: " + err.message);
    }
  }, { timeout: 15000 });
});

(function checkQueryString(){
  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';
  if(q) {
    cityInput.value = q;
    fetchWeatherByCity(q);
  }
})();
cityInput.focus();
 