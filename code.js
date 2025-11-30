// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

// ✅ КРАСИВЫЙ КОЛЛАЖ: СПОСОБ 3 — КВАДРАТНЫЕ КАРТОЧКИ С РАМКАМИ
async function createCollage(files) {
  if (files.length === 0) return null;
  if (files.length === 1) return files[0];

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const ITEM_SIZE = 280; // размер квадратной карточки
  const GAP = 25; // отступ между карточками
  const PADDING = 20; // внутренний отступ от краёв карточки
  const BORDER_COLOR = "#e0e0e0";

  // Загружаем изображения
  const images = await Promise.all(
    Array.from(files).map((file) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = URL.createObjectURL(file);
      });
    })
  );

  // Рассчитываем сетку: максимум 3 в ряд
  const cols = Math.min(images.length, 3);
  const rows = Math.ceil(images.length / cols);

  const totalWidth = cols * (ITEM_SIZE + GAP) - GAP;
  const totalHeight = rows * (ITEM_SIZE + GAP) - GAP;

  canvas.width = totalWidth;
  canvas.height = totalHeight;

  // ✅ БЕЛЫЙ ФОН ВМЕСТО ЧЁРНОГО
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let index = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (index >= images.length) break;

      const img = images[index];
      const x = col * (ITEM_SIZE + GAP);
      const y = row * (ITEM_SIZE + GAP);

      // Рисуем белую карточку
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y, ITEM_SIZE, ITEM_SIZE);

      // Рисуем тонкую рамку
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, ITEM_SIZE, ITEM_SIZE);

      // Рассчитываем, как поместить изображение внутрь с сохранением пропорций
      const imgRatio = img.width / img.height;
      let drawWidth = ITEM_SIZE - 2 * PADDING;
      let drawHeight = drawWidth / imgRatio;
      let dx = x + PADDING;
      let dy = y + PADDING;

      // Если изображение слишком высокое — масштабируем по высоте
      if (drawHeight > ITEM_SIZE - 2 * PADDING) {
        drawHeight = ITEM_SIZE - 2 * PADDING;
        drawWidth = drawHeight * imgRatio;
        dx = x + (ITEM_SIZE - drawWidth) / 2;
        dy = y + PADDING;
      }

      // Рисуем изображение
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        dx,
        dy,
        drawWidth,
        drawHeight
      );

      index++;
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(
          new File([blob], "мой-образ-fstyle.jpg", { type: "image/jpeg" })
        );
      },
      "image/jpeg",
      0.92
    );
  });
}

// === ИЗВЛЕЧЕНИЕ ЦВЕТА ===
async function extractColor(file) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await new Promise((resolve) => (img.onload = resolve));
  const palette = await Vibrant.from(img).getPalette();
  return palette.Vibrant?.getHex() || palette.Muted?.getHex() || "#cccccc";
}

// === ОПРЕДЕЛЕНИЕ ТЁПЛОГО ЦВЕТА ===
function isWarmColor(hex) {
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return r > b;
}

// === ОСНОВНОЙ КОД ===
document.addEventListener("DOMContentLoaded", () => {
  const quizData = [
    {
      question: "Какие цвета вы носите чаще всего?",
      options: [
        "Тёплые: беж, олива, терракота",
        "Холодные: синий, серый",
        "Яркие: красный, жёлтый",
        "Нейтральные: чёрный, белый",
      ],
    },
    {
      question: "Какой у вас тип фигуры?",
      options: ["Песочные часы", "Груша", "Яблоко", "Прямоугольник"],
    },
    {
      question: "Какие образы вас вдохновляют?",
      options: ["Минимализм", "Casual", "Бохо/Романтика", "Классика"],
    },
  ];

  let currentQuestion = 0;
  let answers = [];
  let uploadedItems = [];

  const categories = [
    { value: "top", label: "Топ / Верх" },
    { value: "bottom", label: "Низ (брюки, юбка)" },
    { value: "dress", label: "Платье / Комбинезон" },
    { value: "outer", label: "Верхняя одежда" },
    { value: "shoes", label: "Обувь" },
    { value: "accessory", label: "Аксессуары" },
  ];

  // === ВИКТОРИНА ===
  document.getElementById("start-quiz-btn")?.addEventListener("click", () => {
    document.querySelector(".hero").style.display = "none";
    document.getElementById("quiz").style.display = "block";
    currentQuestion = 0;
    answers = [];
    loadQuestion();
  });

  function loadQuestion() {
    const q = quizData[currentQuestion];
    let html = `<h3>${q.question}</h3>`;
    q.options.forEach((opt) => {
      html += `<div class="quiz-option">${opt}</div>`;
    });
    document.getElementById("question-container").innerHTML = html;
    document.getElementById("next-btn").style.display = "none";

    const progressPercent = ((currentQuestion + 1) / quizData.length) * 100;
    document.getElementById("progress-bar").style.width = `${progressPercent}%`;

    document.querySelectorAll(".quiz-option").forEach((el) => {
      el.onclick = function () {
        document
          .querySelectorAll(".quiz-option")
          .forEach((x) => x.classList.remove("selected"));
        this.classList.add("selected");
        answers[currentQuestion] = this.textContent.trim();
        document.getElementById("next-btn").style.display = "inline-block";
      };
    });
  }

  document.getElementById("next-btn")?.addEventListener("click", () => {
    if (currentQuestion < quizData.length - 1) {
      currentQuestion++;
      loadQuestion();
    } else {
      showResult();
    }
  });

  function showResult() {
    document.getElementById("quiz").style.display = "none";
    document.getElementById("result").style.display = "block";

    const [color, body, style] = [
      answers[0] || "",
      answers[1] || "",
      answers[2] || "",
    ];
    let txt = "";
    if (color.includes("Тёплые"))
      txt += "Ваш цветотип: <strong>Тёплая осень</strong>. ";
    else if (color.includes("Холодные"))
      txt += "Ваш цветотип: <strong>Холодная зима</strong>. ";
    else txt += "Ваш цветотип: <strong>Универсальный</strong>. ";

    if (body === "Груша")
      txt += "Ваша фигура — <strong>груша</strong>: подчеркните талию. ";
    else if (body === "Песочные часы")
      txt += "У вас <strong>песочные часы</strong> — подчёркивайте гармонию! ";

    txt += `Ваш стиль: <strong>${style}</strong>.<br><br>Теперь вы можете составлять луки, которые подчёркивают вашу индивидуальность — без лишних покупок.`;
    document.getElementById("result-text").innerHTML = txt;

    const btn = document.createElement("button");
    btn.textContent = "Создать образ из моих вещей";
    btn.className = "create-outfit-btn";
    btn.onclick = () => {
      document.getElementById("result").style.display = "none";
      document.getElementById("wardrobe-upload").style.display = "block";
      renderUploadUI();
    };
    document.getElementById("result").appendChild(btn);
  }

  // === UI ЗАГРУЗКИ (В СТОЛБИК) ===
  function renderUploadUI() {
    let container = document.getElementById("upload-items");
    if (container) return;

    container = document.createElement("div");
    container.id = "upload-items";
    container.style.margin = "20px 0";
    document.querySelector(".upload-section h2").after(container);

    // ✅ Показываем кнопку "Собрать образ"
    const btn = document.getElementById("generate-outfit-btn");
    if (btn) btn.style.display = "inline-block";
  }

  document.getElementById("add-item-btn")?.addEventListener("click", addItem);

  function addItem() {
    if (uploadedItems.length >= 5) {
      alert("Можно добавить не более 5 вещей.");
      return;
    }

    const id = "item-" + Date.now();
    const container = document.getElementById("upload-items");

    const itemDiv = document.createElement("div");
    itemDiv.style.margin = "10px 0";
    itemDiv.style.padding = "12px";
    itemDiv.style.backgroundColor = "#f9f9f9";
    itemDiv.style.borderRadius = "8px";
    itemDiv.style.border = "1px solid #e0e0e0";

    const label = document.createElement("label");
    label.textContent = "Вещь";
    label.htmlFor = `${id}-file`;
    Object.assign(label.style, {
      display: "inline-block",
      padding: "10px 16px",
      background: "#f0f0f0",
      border: "1px solid #ccc",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      textAlign: "center",
      minWidth: "100px",
      marginBottom: "8px",
    });

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = `${id}-file`;
    fileInput.accept = "image/*";
    fileInput.style.display = "none";

    const typeSelect = document.createElement("select");
    typeSelect.id = `${id}-type`;
    typeSelect.style.cssText = `
      width: 100%;
      padding: 6px;
      font-size: 14px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-top: 6px;
    `;
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.value;
      opt.textContent = cat.label;
      typeSelect.appendChild(opt);
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "Удалить";
    Object.assign(removeBtn.style, {
      background: "#ff6b6b",
      color: "white",
      border: "none",
      borderRadius: "4px",
      padding: "4px 8px",
      fontSize: "12px",
      cursor: "pointer",
      marginTop: "8px",
    });

    const preview = document.createElement("div");
    preview.id = `${id}-preview`;
    preview.style.cssText = "min-height: 60px; margin-top: 10px;";

    itemDiv.append(fileInput, label, typeSelect, removeBtn, preview);
    container.appendChild(itemDiv);

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      preview.innerHTML = `<img src="${url}" style="max-width:100%; height:auto; border-radius:4px; max-height:150px;" />`;
      const color = await extractColor(file);
      const type = typeSelect.value;
      const labelTxt = categories.find((c) => c.value === type).label;
      const existingIndex = uploadedItems.findIndex((item) => item.id === id);
      const newItem = { id, file, type, label: labelTxt, color };
      if (existingIndex >= 0) {
        uploadedItems[existingIndex] = newItem;
      } else {
        uploadedItems.push(newItem);
      }
    });

    typeSelect.addEventListener("change", () => {
      const item = uploadedItems.find((item) => item.id === id);
      if (item) {
        item.type = typeSelect.value;
        item.label = categories.find((c) => c.value === typeSelect.value).label;
      }
    });

    removeBtn.addEventListener("click", () => {
      itemDiv.remove();
      uploadedItems = uploadedItems.filter((item) => item.id !== id);
    });
  }

  // === УМНАЯ ГЕНЕРАЦИЯ ОБРАЗА ===
  document
    .getElementById("generate-outfit-btn")
    ?.addEventListener("click", async () => {
      if (uploadedItems.length === 0) {
        alert("Добавьте хотя бы одну вещь!");
        return;
      }

      // ✅ Защита от непройденной викторины
      if (!Array.isArray(answers) || answers.length !== 3) {
        alert("Пожалуйста, сначала пройдите тест о вашем стиле.");
        document.getElementById("wardrobe-upload").style.display = "none";
        document.querySelector(".hero").style.display = "block";
        return;
      }

      const [colorPref, bodyType, style] = answers;
      const userWantsWarm = colorPref?.includes("Тёплые");
      const userWantsCool = colorPref?.includes("Холодные");

      const tops = uploadedItems.filter((i) => i.type === "top");
      const bottoms = uploadedItems.filter((i) => i.type === "bottom");
      const dresses = uploadedItems.filter((i) => i.type === "dress");
      const shoes = uploadedItems.filter((i) => i.type === "shoes");

      let bestOutfit = null;
      let bestScore = -Infinity;

      for (const dress of dresses) {
        const score = scoreItem(
          dress,
          { isDress: true },
          userWantsWarm,
          userWantsCool,
          bodyType,
          style
        );
        if (score > bestScore) {
          bestScore = score;
          bestOutfit = [dress];
        }
      }

      for (const top of tops) {
        for (const bottom of bottoms) {
          const topScore = scoreItem(
            top,
            { isTop: true },
            userWantsWarm,
            userWantsCool,
            bodyType,
            style
          );
          const bottomScore = scoreItem(
            bottom,
            { isBottom: true },
            userWantsWarm,
            userWantsCool,
            bodyType,
            style
          );
          const comboScore =
            topScore +
            bottomScore +
            scoreCombo(top, bottom, bodyType, userWantsWarm, userWantsCool);
          if (comboScore > bestScore) {
            bestScore = comboScore;
            bestOutfit = [top, bottom];
          }
        }
      }

      if (!bestOutfit) {
        alert(
          "Невозможно собрать образ: добавьте либо платье, либо топ и низ."
        );
        return;
      }

      if (shoes.length > 0) {
        let bestShoe = shoes[0];
        let bestShoeScore = -Infinity;
        for (const shoe of shoes) {
          const score = scoreItem(
            shoe,
            { isShoe: true },
            userWantsWarm,
            userWantsCool,
            bodyType,
            style
          );
          if (score > bestShoeScore) {
            bestShoeScore = score;
            bestShoe = shoe;
          }
        }
        bestOutfit.push(bestShoe);
      }

      let message = "";
      if (bestOutfit.length >= 2) {
        const item1 = bestOutfit[0];
        const item2 = bestOutfit[1];
        const warm1 = isWarmColor(item1.color);
        const warm2 = isWarmColor(item2.color);

        if (userWantsWarm && warm1 && warm2) {
          message += "✅ Тёплые тона идеально подходят вашему цветотипу. ";
        } else if (userWantsCool && !warm1 && !warm2) {
          message += "✅ Холодные тона гармонируют с вашим цветотипом. ";
        } else if (!userWantsWarm && !userWantsCool) {
          message += "✅ Универсальная палитра — отлично для экспериментов. ";
        } else {
          message += "💡 Цвета сбалансированы под ваш цветотип. ";
        }

        if (bodyType === "Груша") {
          message += "Для фигуры «груша» выбран светлый верх и тёмный низ. ";
        } else if (bodyType === "Песочные часы") {
          message += "Подчёркнута талия — акцент на гармонии пропорций. ";
        }
      }

      message += `Стиль: <strong>${style}</strong>.`;

      const files = bestOutfit.map((i) => i.file);
      const collageFile = await createCollage(files);
      const collageUrl = URL.createObjectURL(collageFile);

      let html = `<img src="${collageUrl}" style="max-width:100%; border-radius:8px; border:2px solid #8A9B7C; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" />`;
      html += `<div style="margin-top:16px;">`;
      bestOutfit.forEach((item) => {
        html += `<div style="margin:6px 0;">
        <span style="display:inline-block;width:14px;height:14px;background:${item.color};border:1px solid #333;margin-right:8px;"></span>
        ${item.label}
      </div>`;
      });
      html += `</div><p style="margin-top:20px; font-weight:500;">${message}</p>`;

      const preview = document.getElementById("outfit-preview");
      preview.innerHTML = html;
      preview.style.display = "block";
      document.getElementById("download-outfit-btn").style.display =
        "inline-block";

      // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ОЦЕНКИ ---
      function scoreItem(
        item,
        context = {},
        userWantsWarm,
        userWantsCool,
        bodyType,
        style
      ) {
        let score = 0;
        const warm = isWarmColor(item.color);

        if (userWantsWarm && warm) score += 2;
        if (userWantsCool && !warm) score += 2;
        if (!userWantsWarm && !userWantsCool) score += 1;

        if (bodyType === "Груша") {
          if (context.isTop && warm) score += 1.5;
          if (context.isBottom && !warm) score += 1.5;
        }

        if (bodyType === "Песочные часы") {
          if (context.isTop || context.isBottom || context.isDress) {
            score += 1;
          }
        }

        const neutralColors = [
          "#000000",
          "#ffffff",
          "#cccccc",
          "#eeeeee",
          "#333333",
        ];
        if (style === "Минимализм") {
          if (
            neutralColors.some(
              (c) => c.toLowerCase() === item.color.toLowerCase()
            )
          ) {
            score += 1.5;
          }
        }
        if (style === "Бохо/Романтика" && warm) {
          score += 1;
        }
        if (style === "Casual") {
          score += 0.5;
        }

        return score;
      }

      function scoreCombo(top, bottom, bodyType, userWantsWarm, userWantsCool) {
        let score = 0;
        const topWarm = isWarmColor(top.color);
        const bottomWarm = isWarmColor(bottom.color);

        if (topWarm === bottomWarm) {
          score += 2;
        } else {
          score += 0.5;
        }

        if (bodyType === "Груша") {
          if (topWarm && !bottomWarm) score += 2;
        }

        return score;
      }
    });

  // === СКАЧАТЬ ===
  document
    .getElementById("download-outfit-btn")
    ?.addEventListener("click", () => {
      html2canvas(document.getElementById("outfit-preview")).then((canvas) => {
        const link = document.createElement("a");
        link.download = "мой-образ-fstyle.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    });

  // === EMAIL ===
  const emailForm = document.getElementById("email-form");
  if (emailForm) {
    emailForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!emailForm.querySelector('input[type="email"]').value) {
        alert("Введите email");
        return;
      }
      try {
        const res = await fetch("https://formspree.io/f/xkgyekwg", {
          method: "POST",
          body: new FormData(emailForm),
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          emailForm.innerHTML =
            '<p style="color: green;">Спасибо! Мы напишем вам перед запуском 💚</p>';
        } else {
          throw new Error();
        }
      } catch {
        alert("Ошибка отправки.");
      }
    });
  }
});
