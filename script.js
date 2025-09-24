document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("nameInput");
  const button = document.getElementById("searchBtn");
  const statusEl = document.getElementById("status");
  const resultEl = document.getElementById("result");

  button.addEventListener("click", async () => {
    const name = input.value.trim();
    if (!name) {
      statusEl.textContent = "Введите имя!";
      return;
    }

    statusEl.textContent = "Загрузка...";
    resultEl.innerHTML = "";

    try {
      const res = await fetch(`https://api.nationalize.io/?name=${name}`);
      if (!res.ok) throw new Error("Ошибка API");
      const data = await res.json();

      if (data.country.length === 0) {
        statusEl.textContent = "Страны не найдены.";
        return;
      }

      statusEl.textContent = `Результаты для имени "${name}":`;

      data.country
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 4)
        .forEach(c => {
          const div = document.createElement("div");
          div.className = "country";

          const flag = document.createElement("img");
          flag.src = `https://flagcdn.com/w80/${c.country_id.toLowerCase()}.png`;
          flag.alt = c.country_id;

          div.appendChild(flag);
          div.innerHTML += `<b>${c.country_id}</b> — ${(c.probability * 100).toFixed(1)}%`;
          resultEl.appendChild(div);
        });

    } catch (err) {
      console.error(err);
      statusEl.textContent = "Ошибка загрузки данных.";
    }
  });
});
