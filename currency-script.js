const BASE_CURRENCY = "USD";

async function localizePrices() {
  const noteEl = document.getElementById("currency-note");

  try {
    // 1. Check sessionStorage first so we don't hit API rate limits on page reload
    let targetCurrency = sessionStorage.getItem("user_currency");
    let rate = parseFloat(sessionStorage.getItem("exchange_rate"));

    if (!targetCurrency || !rate) {
      // 2. Get user's approximate location & currency from IP (No API key required)
      const geoRes = await fetch("https://free.freeipapi.com/api/json");
      if (!geoRes.ok) throw new Error("Geolocation lookup failed");
      const geoData = await geoRes.json();

      // freeipapi returns currency info inside currency.code (fallback to USD)
      targetCurrency = geoData.currency?.code || BASE_CURRENCY;

      // 3. If user isn't in USD, fetch exchange rates
      if (targetCurrency !== BASE_CURRENCY) {
        const rateRes = await fetch(
          `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`,
        );
        if (!rateRes.ok) throw new Error("Exchange rate lookup failed");
        const rateData = await rateRes.json();

        rate = rateData.rates[targetCurrency];
        if (!rate) throw new Error(`Unsupported currency: ${targetCurrency}`);
      } else {
        rate = 1;
      }

      // Cache in sessionStorage for the rest of the user's visit
      sessionStorage.setItem("user_currency", targetCurrency);
      sessionStorage.setItem("exchange_rate", rate);
    }

    // 4. Format and update all prices on the page
    const formatter = new Intl.NumberFormat(navigator.language || "en-US", {
      style: "currency",
      currency: targetCurrency,
    });

    document.querySelectorAll("[data-price-usd]").forEach((el) => {
      const basePrice = parseFloat(el.getAttribute("data-price-usd"));
      const converted = basePrice * rate;
      el.textContent = formatter.format(converted);
    });

    noteEl.textContent = `Prices shown in ${targetCurrency}`;
  } catch (err) {
    console.warn("Currency auto-conversion fallback to USD:", err);
    noteEl.textContent = `Prices shown in ${BASE_CURRENCY}`;
  }
}

document.addEventListener("DOMContentLoaded", localizePrices);
