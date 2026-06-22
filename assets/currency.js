document.addEventListener("DOMContentLoaded", () => {
  const gbpInput = document.querySelector("#gbp-amount");
  const vndInput = document.querySelector("#vnd-amount");
  const rateText = document.querySelector("#currency-rate");

  if (!gbpInput || !vndInput || !rateText) return;

  const FALLBACK_RATE = 35000;
  let gbpToVnd = FALLBACK_RATE;

  const parseAmount = (value) => {
    const normalized = String(value || "")
      .replace(/\s/g, "")
      .replace(/[₫£]/g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatGbp = (value) =>
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);

  const formatVnd = (value) =>
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(Math.round(value));

  const updateFromGbp = () => {
    const gbp = parseAmount(gbpInput.value);
    vndInput.value = formatVnd(gbp * gbpToVnd);
  };

  const updateFromVnd = () => {
    const vnd = parseAmount(vndInput.value);
    gbpInput.value = formatGbp(vnd / gbpToVnd);
  };

  const showRate = (date, isFallback = false) => {
    const formattedRate = formatVnd(gbpToVnd);
    rateText.textContent = isFallback
      ? `1 GBP ≈ ${formattedRate} VND · estimation hors connexion`
      : `1 GBP = ${formattedRate} VND · taux du ${date}`;
  };

  const loadRate = async () => {
    const endpoints = [
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/gbp.min.json",
      "https://latest.currency-api.pages.dev/v1/currencies/gbp.min.json",
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const fetchedRate = Number(data?.gbp?.vnd);

        if (!Number.isFinite(fetchedRate) || fetchedRate <= 0) {
          throw new Error("Taux GBP/VND invalide");
        }

        gbpToVnd = fetchedRate;
        showRate(data.date || "aujourd’hui");
        updateFromGbp();
        return;
      } catch (error) {
        console.warn("Source de taux indisponible :", endpoint, error);
      }
    }

    gbpToVnd = FALLBACK_RATE;
    showRate("", true);
    updateFromGbp();
  };

  gbpInput.addEventListener("input", updateFromGbp);
  vndInput.addEventListener("input", updateFromVnd);

  gbpInput.addEventListener("blur", () => {
    gbpInput.value = formatGbp(parseAmount(gbpInput.value));
  });

  vndInput.addEventListener("blur", () => {
    vndInput.value = formatVnd(parseAmount(vndInput.value));
  });

  showRate("", true);
  updateFromGbp();
  loadRate();
});
