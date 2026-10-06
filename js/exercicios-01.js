const answeredItems = new Set();
let totalChoiceItems = 0;

const markdownOptions = { gfm: true, breaks: false };

function renderMarkdown(markdown) {
  if (window.marked?.parse) return window.marked.parse(markdown, markdownOptions);
  return `<pre>${escapeHtml(markdown)}</pre>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function stripQuestionEightAnswerTree(markdown) {
  return markdown.replace(
    /\*\*Árvore de busca – primeiro nível \(gabarito\):\*\*[\s\S]*?```mermaid[\s\S]*?```/,
    "**Árvore de busca:** as duas possibilidades e seus valores de heurística serão analisados nas questões abaixo.",
  );
}

function extractSearchTree(markdown) {
  const match = markdown.match(/(\*\*Árvore de busca \(gabarito\)[\s\S]*?```[\s\S]*?```)/);
  if (!match) return { markdown, tree: "" };
  return { markdown: markdown.replace(match[0], "A árvore de análise será exibida depois da tentativa."), tree: match[1] };
}

function extractPeasTable(markdown) {
  const pattern = /(\*\*Tabela do enunciado, preenchida \(gabarito\):\*\*\s*\n\n)(\|[^\n]*\|\n\|[^\n]*\|\n(?:\|[^\n]*\|\n?)*)/;
  const match = markdown.match(pattern);
  if (!match) return { markdown, table: "" };
  return { markdown: markdown.replace(match[0], "**Tabela PEAS de referência:** será exibida depois da tentativa da questão 3.2."), table: match[2] };
}

function parseChoices(markdown) {
  const pattern = /^\*\*([A-D])\)\*\*/gm;
  const markers = [...markdown.matchAll(pattern)];
  if (markers.length < 2) return null;

  const first = markers[0].index;
  const stem = markdown.slice(0, first).trim();
  const choices = markers.map((marker, index) => {
    const start = marker.index;
    const end = index + 1 < markers.length ? markers[index + 1].index : markdown.length;
    const raw = markdown.slice(start + marker[0].length, end).trim();
    const explanationMatch = raw.match(/^([\s\S]*?)\n\s*>\s*Explicação:\s*([\s\S]*)$/m);
    const explanation = explanationMatch
      ? explanationMatch[2].split("\n").map((line) => line.replace(/^\s*>\s?/, "")).join("\n").trim()
      : "";
    let answer = explanationMatch ? explanationMatch[1] : raw;
    const correct = /\*\*Correta\*\*/.test(answer);
    answer = answer
      .replace(/(?:^|\n)\s*—?\s*\*\*(?:Correta|Incorreta)\*\*\s*/g, "\n")
      .replace(/\s+—\s*\*\*(?:Correta|Incorreta)\*\*\s*$/g, "")
      .trim();
    return { label: marker[1], markdown: answer, explanation, correct };
  });

  if (!choices.some((choice) => choice.correct)) return null;
  return { stem, choices };
}

function normalizeAnswer(value) {
  return value.toLocaleLowerCase("pt-BR")
    .replace(/menos\s*infinito/g, "-infinito")
    .replace(/^\+/, "")
    .replace(/[−–]/g, "-")
    .replace(/∞|infinito|inf/g, "infinito")
    .replace(/removido|vazio|∅/g, "removido")
    .replace(/[{}\[\]()]/g, "")
    .replace(/\s+/g, "")
    .replace(/[.;]$/g, "");
}

function answersMatch(actual, expected, flexibleOrder = false) {
  if (/^[—–-]$/.test(expected.trim())) return /^[—–-]$|^removido$/i.test(actual.trim());
  const actualNormalized = normalizeAnswer(actual);
  const expectedNormalized = normalizeAnswer(expected);
  if (actualNormalized === expectedNormalized) return true;
  if (flexibleOrder) {
    const sortValues = (value) => value.split(/[;,]/).map(normalizeAnswer).filter(Boolean).sort().join(",");
    return sortValues(actual) === sortValues(expected);
  }
  return false;
}

function addTableInputs(container, questionNumber) {
  const tables = [...container.querySelectorAll("table")];
  tables.forEach((table, tableIndex) => {
    const headerCells = [...table.querySelectorAll("thead th")];
    let hiddenColumns = [];
    if (questionNumber === "5") {
      hiddenColumns = headerCells
        .map((cell, index) => cell.textContent.toLocaleLowerCase("pt-BR").includes("respostas aceitas") ? index : -1)
        .filter((index) => index >= 0);
    }
    if (questionNumber === "25" && tableIndex === 1) {
      hiddenColumns = headerCells.map((cell, index) => /observação/i.test(cell.textContent) ? index : -1).filter((index) => index >= 0);
    }
    if (questionNumber === "25" && tableIndex === 2) {
      hiddenColumns = headerCells.map((cell, index) => /motivo/i.test(cell.textContent) ? index : -1).filter((index) => index >= 0);
    }
    for (const column of hiddenColumns) {
      if (headerCells[column]) headerCells[column].hidden = true;
      table.querySelectorAll("tbody tr").forEach((row) => {
        if (row.children[column]) row.children[column].hidden = true;
      });
    }
    let columns = headerCells
      .map((cell, index) => cell.textContent.toLocaleLowerCase("pt-BR").includes("campo do aluno") ? index : -1)
      .filter((index) => index >= 0);

    if (questionNumber === "14" && tableIndex >= 2) {
      columns = headerCells.map((_, index) => index);
    }

    if (columns.length === 0) return;
    table.classList.add("answer-table");
    const bodyRows = [...table.querySelectorAll("tbody tr")];
    for (const row of bodyRows) {
      const cells = [...row.children];
      for (const column of columns) {
        const cell = cells[column];
        if (!cell) continue;
        const expected = cell.textContent.trim();
        cell.replaceChildren();
        const input = document.createElement("input");
        input.type = "text";
        input.autocomplete = "off";
        input.className = "cell-answer";
        input.dataset.expected = expected;
        if (questionNumber === "5" && cells[2]) input.dataset.accepted = cells[2].textContent;
        input.dataset.flexibleOrder = questionNumber === "14" && tableIndex === 3 ? "true" : "false";
        input.setAttribute("aria-label", "Resposta desta célula");
        cell.append(input);
      }
    }

    const check = document.createElement("button");
    check.type = "button";
    check.className = "button button-secondary table-check";
    check.textContent = "Conferir tabela";
    const status = document.createElement("p");
    status.className = "table-status";
    status.setAttribute("aria-live", "polite");
    check.addEventListener("click", () => {
      const inputs = [...table.querySelectorAll("input.cell-answer")];
      let correctCount = 0;
      for (const input of inputs) {
        const correct = inputAnswerIsCorrect(input);
        input.classList.toggle("answer-correct", correct);
        input.classList.toggle("answer-incorrect", !correct);
        input.setAttribute("aria-invalid", String(!correct));
        if (correct) correctCount += 1;
      }
      status.textContent = `${correctCount} de ${inputs.length} células corretas. Verde indica acerto; vermelho indica que vale revisar essa resposta.`;
    });
    if (questionNumber === "5") {
      check.remove();
      status.textContent = "Confira cada linha separadamente.";
      for (const row of bodyRows) {
        const input = row.querySelector("input.cell-answer");
        if (!input) continue;
        const rowButton = document.createElement("button");
        rowButton.type = "button";
        rowButton.className = "row-check";
        rowButton.textContent = "Conferir linha";
        rowButton.addEventListener("click", () => {
          const correct = inputAnswerIsCorrect(input);
          input.classList.toggle("answer-correct", correct);
          input.classList.toggle("answer-incorrect", !correct);
          input.setAttribute("aria-invalid", String(!correct));
          input.dataset.checked = "true";
          status.textContent = correct ? "✅ Linha correta." : "❌ Revise a resposta desta linha.";
          if ([...table.querySelectorAll("input.cell-answer")].every((answer) => answer.dataset.checked === "true")) {
            container.querySelectorAll("blockquote").forEach((explanation) => { explanation.hidden = false; });
          }
        });
        input.after(rowButton);
      }
      container.querySelectorAll("blockquote").forEach((explanation) => { explanation.hidden = true; });
      table.after(status);
    } else {
      table.after(check, status);
    }
  });
}

function inputAnswerIsCorrect(input) {
  const accepted = (input.dataset.accepted || "").split(",").map((value) => value.trim()).filter(Boolean);
  return answersMatch(input.value, input.dataset.expected, input.dataset.flexibleOrder === "true")
    || accepted.some((value) => answersMatch(input.value, value));
}

function addBoardEntry(expected) {
  const board = document.createElement("fieldset");
  board.className = "board-entry";
  board.innerHTML = "<legend>Preencha a coluna da rainha em cada linha</legend>";
  expected.forEach((_, index) => {
    const label = document.createElement("label");
    label.textContent = `Linha ${index + 1}: coluna `;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = "4";
    input.step = "1";
    input.className = "board-answer";
    input.dataset.expected = String(expected[index]);
    input.setAttribute("aria-label", `Coluna da rainha na linha ${index + 1}`);
    label.append(input);
    board.append(label);
  });
  const check = document.createElement("button");
  check.type = "button";
  check.className = "button button-secondary";
  check.textContent = "Conferir tabuleiro";
  const status = document.createElement("p");
  status.className = "table-status";
  status.setAttribute("aria-live", "polite");
  check.addEventListener("click", () => {
    const inputs = [...board.querySelectorAll("input")];
    let correctCount = 0;
    inputs.forEach((input) => {
      const correct = input.value === input.dataset.expected;
      input.classList.toggle("answer-correct", correct);
      input.classList.toggle("answer-incorrect", !correct);
      input.setAttribute("aria-invalid", String(!correct));
      if (correct) correctCount += 1;
    });
    status.textContent = `${correctCount} de 4 linhas corretas.`;
  });
  board.append(check, status);
  return board;
}

function prepareMarkdown(markdown, questionNumber, wholeMarkdown, boardAnswers) {
  let source = markdown;
  if (questionNumber === "8") source = stripQuestionEightAnswerTree(source);
  const container = document.createElement("div");
  container.className = "markdown-content";
  container.innerHTML = renderMarkdown(source);

  if (questionNumber === "19" && Array.isArray(boardAnswers) && /solução final \(gabarito/i.test(source)) {
    const answerTable = [...container.querySelectorAll("table")].find((table) => /♛/.test(table.textContent));
    if (answerTable) answerTable.replaceWith(addBoardEntry(boardAnswers));
  }
  addTableInputs(container, questionNumber);

  container.querySelectorAll("pre code.language-mermaid").forEach((code) => {
    const diagram = document.createElement("pre");
    diagram.className = "mermaid";
    diagram.textContent = code.textContent;
    code.parentElement.replaceWith(diagram);
  });
  return container;
}

function openPrerequisiteDialog(prerequisite) {
  const dialog = document.querySelector("#dialogo-pre-requisito");
  document.querySelector("#titulo-pre-requisito").textContent = `${prerequisite.code} — ${prerequisite.title}`;
  document.querySelector("#texto-pre-requisito").textContent = "Use este assunto como referência antes de continuar a questão.";
  dialog.showModal();
}

function updateProgress() {
  document.querySelector("#progresso").textContent = `Itens respondidos: ${answeredItems.size} de ${totalChoiceItems}.`;
}

function renderChoices(parsed, item, question, delayedAnswers) {
  const section = document.createElement("section");
  section.className = "choice-section";
  section.setAttribute("aria-label", `Alternativas da questão ${item.number}`);

  if (parsed.stem) section.append(prepareMarkdown(parsed.stem, question.number, question.intro + item.markdown));
  const prompt = document.createElement("p");
  prompt.className = "answer-prompt";
  prompt.textContent = "Escolha uma alternativa:";
  section.append(prompt);

  const list = document.createElement("div");
  list.className = "choice-list";
  list.setAttribute("role", "group");
  const feedback = document.createElement("div");
  feedback.className = "choice-feedback";
  feedback.setAttribute("aria-live", "polite");
  const itemId = `${question.number}.${item.number}`;

  parsed.choices.forEach((choice) => {
    const button = document.createElement("div");
    button.type = "button";
    button.className = "choice-button";
    button.setAttribute("role", "button");
    button.tabIndex = 0;
    button.dataset.choice = choice.label;
    const letter = document.createElement("span");
    letter.className = "choice-letter";
    letter.textContent = choice.label;
    const content = prepareMarkdown(choice.markdown, question.number, question.intro + item.markdown);
    content.classList.add("choice-content");
    button.append(letter, content);
    button.addEventListener("click", () => {
      list.querySelectorAll(".choice-button").forEach((candidate) => {
        candidate.classList.remove("selected-choice", "correct-choice", "incorrect-choice");
        candidate.removeAttribute("aria-pressed");
      });
      button.classList.add("selected-choice", choice.correct ? "correct-choice" : "incorrect-choice");
      button.setAttribute("aria-pressed", "true");
      const correctChoice = parsed.choices.find((candidate) => candidate.correct);
      feedback.replaceChildren();
      const headline = document.createElement("p");
      headline.className = choice.correct ? "feedback-correct" : "feedback-incorrect";
      headline.textContent = choice.correct ? "✅ Correta!" : "❌ Vamos revisar essa escolha.";
      feedback.append(headline);
      appendExplanation(feedback, choice.correct ? "Por que esta resposta funciona" : "Por que essa alternativa não funciona", choice.explanation);
      if (!choice.correct) {
        const correctLabel = document.createElement("p");
        correctLabel.innerHTML = `<strong>A alternativa correta é ${correctChoice.label}.</strong>`;
        feedback.append(correctLabel);
        appendExplanation(feedback, "Por que a resposta correta funciona", correctChoice.explanation);
      }
      for (const delayed of delayedAnswers) {
        if (delayed.itemNumber === item.number) {
          delayed.details.hidden = false;
          delayed.details.open = true;
        }
      }
      if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([feedback]);
      answeredItems.add(itemId);
      updateProgress();
    });
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        button.click();
      }
    });
    list.append(button);
  });
  section.append(list, feedback);
  return section;
}

function appendExplanation(parent, heading, markdown) {
  if (!markdown) return;
  const block = document.createElement("div");
  block.className = "explanation";
  const title = document.createElement("h4");
  title.textContent = heading;
  block.append(title, prepareMarkdown(markdown, "", ""));
  parent.append(block);
}

function renderItem(item, question, delayedAnswers) {
  const article = document.createElement("article");
  article.className = "subquestion";
  const heading = document.createElement("h3");
  heading.textContent = `${item.number} — ${item.title}`;
  article.append(heading);

  const parsed = parseChoices(item.markdown);
  if (parsed) {
    article.append(renderChoices(parsed, item, question, delayedAnswers));
  } else {
    article.append(prepareMarkdown(item.markdown, question.number, question.intro + item.markdown));
  }
  return article;
}

function renderQuestion(question) {
  const article = document.createElement("article");
  article.className = "question-card";
  article.id = `questao-${question.number}`;
  const heading = document.createElement("div");
  heading.className = "question-heading";
  const title = document.createElement("h2");
  title.textContent = question.title;
  heading.append(title);
  for (const prerequisite of question.prerequisites) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "prerequisite-button";
    button.textContent = `Não domino: ${prerequisite.code}`;
    button.addEventListener("click", () => openPrerequisiteDialog(prerequisite));
    heading.append(button);
  }
  article.append(heading);

  let introMarkdown = question.intro;
  const delayedAnswers = [];
  if (question.number === "3") {
    const extracted = extractPeasTable(introMarkdown);
    introMarkdown = extracted.markdown;
    if (extracted.table) delayedAnswers.push({ itemNumber: "3.2", details: makeDelayedDetails("Tabela PEAS de referência", extracted.table, question.number, question.intro) });
  }
  if (question.number === "18" || question.number === "19") {
    const extracted = extractSearchTree(introMarkdown);
    introMarkdown = extracted.markdown;
    if (extracted.tree) {
      const answerItem = question.number === "18" ? "18.2" : "19.2";
      delayedAnswers.push({ itemNumber: answerItem, details: makeDelayedDetails("Árvore de busca explicada", extracted.tree, question.number, question.intro) });
    }
  }
  if (question.number === "19") {
    introMarkdown = introMarkdown.replace(
      /\*\*Tabuleiro 4 × 4 – solução final \(gabarito, "♛" = rainha\):\*\*[\s\S]*?(?=\n\n> \*\*Instrução ao desenvolvedor)/,
      "**Preencha a posição de cada rainha:**",
    );
  }
  if (introMarkdown) article.append(prepareMarkdown(introMarkdown, question.number, question.intro, question.boardAnswers));
  if (question.number === "19" && !article.querySelector(".board-entry")) article.append(addBoardEntry(question.boardAnswers));
  for (const item of question.items) article.append(renderItem(item, question, delayedAnswers));
  for (const delayed of delayedAnswers) article.append(delayed.details);
  return article;
}

function makeDelayedDetails(label, markdown, questionNumber, wholeQuestionMarkdown) {
  const details = document.createElement("details");
  details.className = "delayed-answer";
  details.hidden = true;
  const summary = document.createElement("summary");
  summary.textContent = label;
  details.append(summary, prepareMarkdown(markdown, questionNumber, wholeQuestionMarkdown));
  return details;
}

async function renderForm() {
  const root = document.querySelector("#formulario");
  try {
    const data = window.EXERCICIOS_FORMULARIO_01;
    if (!data || !Array.isArray(data.questions)) {
      throw new Error("Os dados não foram carregados. Confira se exercicios-01-data.js está ao lado desta página.");
    }
    document.title = data.title;
    let activeSection = "";
    for (const question of data.questions) {
      if (question.section && question.section !== activeSection) {
        activeSection = question.section;
        const sectionHeading = document.createElement("h2");
        sectionHeading.className = "part-heading";
        sectionHeading.textContent = activeSection;
        root.append(sectionHeading);
      }
      try {
        root.append(renderQuestion(question));
      } catch (error) {
        console.error(`Erro ao montar a questão ${question.number}:`, error);
        const notice = document.createElement("p");
        notice.className = "load-error";
        notice.textContent = `A questão ${question.number} não pôde ser montada: ${error.message}`;
        root.append(notice);
      }
    }
    totalChoiceItems = root.querySelectorAll(".choice-list").length;
    if (window.mermaid) {
      window.mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" });
      try {
        await window.mermaid.run({ querySelector: ".mermaid" });
      } catch (error) {
        console.warn("Um diagrama não pôde ser desenhado.", error);
      }
    }
    if (window.MathJax?.typesetPromise) {
      try {
        await window.MathJax.typesetPromise();
      } catch (error) {
        console.warn("Algumas fórmulas não puderam ser renderizadas.", error);
      }
    }
    updateProgress();
  } catch (error) {
    root.innerHTML = `<p class="load-error">Não foi possível abrir este formulário. Detalhe: ${escapeHtml(error.message || String(error))}</p>`;
    console.error(error);
  }
}

renderForm();
