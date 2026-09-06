// Weather App - Using OpenWeatherMap API
// Get your FREE API key from: https://openweathermap.org/api

class WeatherApp {
    constructor() {
        this.apiKey = localStorage.getItem('weatherApiKey') || '';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.currentCity = 'London';
        
        this.initElements();
        this.initEventListeners();
        
        if (this.apiKey) {
            this.showApiStatus('API Key loaded!', 'success');
            this.fetchWeatherData(this.currentCity);
        } else {
            this.showApiStatus('Please enter your API key above', 'error');
        }
    }

    initElements() {
        // Input elements
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.saveKeyBtn = document.getElementById('saveKeyBtn');
        
        // Current weather elements
        this.cityName = document.getElementById('cityName');
        this.currentTemp = document.getElementById('currentTemp');
        this.weatherDesc = document.getElementById('weatherDesc');
        this.weatherIcon = document.getElementById('weatherIcon');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        
        // Rain alert
        this.rainAlert = document.getElementById('rainAlert');
        this.rainMessage = document.getElementById('rainMessage');
        
        // Forecast elements
        this.morningIcon = document.getElementById('morningIcon');
        this.morningTemp = document.getElementById('morningTemp');
        this.morningDesc = document.getElementById('morningDesc');
        this.morningRain = document.getElementById('morningRain');
        
        this.eveningIcon = document.getElementById('eveningIcon');
        this.eveningTemp = document.getElementById('eveningTemp');
        this.eveningDesc = document.getElementById('eveningDesc');
        this.eveningRain = document.getElementById('eveningRain');
        
        this.apiStatus = document.getElementById('apiStatus');
    }

    initEventListeners() {
        this.searchBtn.addEventListener('click', () => {
            const city = this.cityInput.value.trim();
            if (city) {
                this.fetchWeatherData(city);
            }
        });

        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const city = this.cityInput.value.trim();
                if (city) {
                    this.fetchWeatherData(city);
                }
            }
        });

        this.saveKeyBtn.addEventListener('click', () => {
            const apiKey = this.apiKeyInput.value.trim();
            if (apiKey) {
                this.apiKey = apiKey;
                localStorage.setItem('weatherApiKey', apiKey);
                this.showApiStatus('API Key saved successfully!', 'success');
                this.fetchWeatherData(this.currentCity);
            }
        });
    }

    showApiStatus(message, type) {
        this.apiStatus.textContent = message;
        this.apiStatus.className = 'api-status ' + type;
    }

    async fetchWeatherData(city) {
        if (!this.apiKey) {
            this.showApiStatus('Please enter your API key first!', 'error');
            return;
        }

        try {
            // Fetch current weather
            const currentWeatherUrl = `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric`;
            const currentResponse = await fetch(currentWeatherUrl);
            
            if (!currentResponse.ok) {
                throw new Error('City not found or invalid API key');
            }
            
            const currentData = await currentResponse.json();
            this.updateCurrentWeather(currentData);

            // Fetch forecast data
            const forecastUrl = `${this.baseUrl}/forecast?q=${city}&appid=${this.apiKey}&units=metric`;
            const forecastResponse = await fetch(forecastUrl);
            const forecastData = await forecastResponse.json();
            
            this.updateForecast(forecastData);
            
            this.currentCity = city;
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showApiStatus('Error: ' + error.message, 'error');
            this.cityName.textContent = 'Error';
            this.currentTemp.textContent = '--';
            this.weatherDesc.textContent = 'Check API key & city name';
        }
    }

    updateCurrentWeather(data) {
        this.cityName.textContent = `${data.name}, ${data.sys.country}`;
        this.currentTemp.textContent = Math.round(data.main.temp);
        this.weatherDesc.textContent = data.weather[0].description;
        this.weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        this.humidity.textContent = `${data.main.humidity}%`;
        this.windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        
        // Check for rain in current weather
        const isRaining = data.weather.some(w => 
            w.main.toLowerCase().includes('rain') || 
            w.main.toLowerCase().includes('drizzle') ||
            w.main.toLowerCase().includes('thunderstorm')
        );
        
        if (isRaining) {
            this.rainAlert.classList.add('active');
            this.rainMessage.textContent = `It's currently ${data.weather[0].description} in ${data.name}!`;
        } else {
            this.rainAlert.classList.remove('active');
        }
    }

    updateForecast(data) {
        const today = new Date().toDateString();
        
        // Filter forecasts for today
        const todayForecasts = data.list.filter(item => 
            new Date(item.dt * 1000).toDateString() === today
        );
        
        // Find closest forecasts to 10 AM and 5 PM
        const morningForecast = this.findClosestForecast(todayForecasts, 10);
        const eveningForecast = this.findClosestForecast(todayForecasts, 17);
        
        if (morningForecast) {
            this.updateForecastCard(
                this.morningIcon,
                this.morningTemp,
                this.morningDesc,
                this.morningRain,
                morningForecast
            );
        }
        
        if (eveningForecast) {
            this.updateForecastCard(
                this.eveningIcon,
                this.eveningTemp,
                this.eveningDesc,
                this.eveningRain,
                eveningForecast
            );
        }
        
        // Check if rain is expected at any time today
        const rainExpected = data.list.some(item => 
            new Date(item.dt * 1000).toDateString() === today &&
            (item.weather.some(w => 
                w.main.toLowerCase().includes('rain') || 
                w.main.toLowerCase().includes('drizzle') ||
                w.main.toLowerCase().includes('thunderstorm')
            ) || item.pop > 0.3)
        );
        
        if (rainExpected && !this.rainAlert.classList.contains('active')) {
            this.rainAlert.classList.add('active');
            this.rainMessage.textContent = `Rain is expected sometime today in ${data.city.name}!`;
        }
    }

    findClosestForecast(forecasts, targetHour) {
        if (forecasts.length === 0) return null;
        
        let closest = forecasts[0];
        let minDiff = 24;
        
        forecasts.forEach(forecast => {
            const hour = new Date(forecast.dt * 1000).getHours();
            const diff = Math.abs(hour - targetHour);
            
            if (diff < minDiff) {
                minDiff = diff;
                closest = forecast;
            }
        });
        
        return closest;
    }

    updateForecastCard(iconEl, tempEl, descEl, rainEl, forecast) {
        iconEl.src = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`;
        tempEl.textContent = `${Math.round(forecast.main.temp)}°C`;
        descEl.textContent = forecast.weather[0].description;
        
        const isRaining = forecast.weather.some(w => 
            w.main.toLowerCase().includes('rain') || 
            w.main.toLowerCase().includes('drizzle') ||
            w.main.toLowerCase().includes('thunderstorm')
        ) || forecast.pop > 0.3;
        
        if (isRaining) {
            rainEl.textContent = '☔ Rain expected!';
            rainEl.classList.add('raining');
        } else {
            rainEl.textContent = '☀️ No rain';
            rainEl.classList.remove('raining');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});
