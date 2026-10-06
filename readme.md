# 📘 Artificial Intelligence Exercises:

<p align="center">
  <a href="https://jimmykiedis.github.io/IAListas/">
    <img src="https://img.shields.io/badge/🤖%20Live%20Demo-E34F26?style=for-the-badge" alt="Live Demo">
  </a>
  <br>
  <em>Click the button to access the live demo.</em>
</p>

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=flat&logo=python&logoColor=white)
![Markdown](https://img.shields.io/badge/Markdown-000000?style=flat&logo=markdown&logoColor=white)
![JSON](https://img.shields.io/badge/JSON-000000?style=flat&logo=json&logoColor=white)
![MathJax](https://img.shields.io/badge/MathJax-000000?style=flat)
![Mermaid](https://img.shields.io/badge/Mermaid-FF3670?style=flat)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=flat&logo=github&logoColor=white)
![Status](https://img.shields.io/badge/status-in%20progress-yellow)

---

Interactive exercise lists for studying Artificial Intelligence. Questions are authored in Markdown and converted into browser-ready forms with Python scripts. JavaScript handles answer selection, feedback, and interactive tables, while a generated catalog links to each exercise list. Published with GitHub Pages.

---

## 🎯 Objective

- 🧠 Study and reinforce Artificial Intelligence concepts through interactive exercises.
- 🔎 Practice topics such as problem formulation, search algorithms, heuristics, and game trees.
- ✅ Check answers and use explanations to understand the reasoning behind each response.
- 🌐 Explore how HTML, CSS, and JavaScript can present educational content in the browser.
- 📝 Keep exercise content maintainable through Markdown specifications and Python generation scripts.

---

## ✨ Features

- 📚 Browse exercise forms from a generated catalog.
- ❓ Answer multiple-choice questions with feedback and explanations.
- 🔀 See alternatives presented in a reordered sequence.
- 📊 Fill in interactive table fields and check answers.
- ∑ Render mathematical expressions and diagrams in supported questions.
- 🐍 Generate form data and the catalog with Python scripts.
- 🔧 Extend the project with additional exercise lists.

---

## 🛠️ How to Use the Repository

### 📥 1. Clone the Repository

Clone the repository and navigate to the project folder:

```bash
git clone https://jimmykiedis.github.io/IAListas/
cd xadrez
```

### 💻 2. Open the Project

Open the project folder in a code editor such as **VS Code**.

### 📂 3. Check the Main Files

Make sure the following files are present:

```text
.github
css/
docs/
forms/
js/
scripts/
index.html
style.css
script.js
```

### ▶️ 4. Run the Project

Open the `index.html` file directly in your browser.

### 📝 5. Work Through an Exercise List

Choose a list from the catalog, answer multiple-choice questions or fill in table fields, and check your responses to see feedback and explanations.

### 🧪 6. Experiment and Learn

Use the project as a foundation for testing, refactoring, and experimenting with programming logic.

> 💡 This repository is intended for study and experimentation and is not a finished production project.


### How generation works

The form content is authored in `docs/Especificacao_Formulario_IA_P1.md`. Running `scripts/gerar_formulario.py` parses that Markdown and writes `forms/exercicios-01.json` and `forms/exercicios-01-data.js`. The HTML form loads the generated JavaScript data, and `js/exercicios-01.js` renders the questions, alternatives, tables, and feedback in the browser.

The home page loads `forms/catalogo.json`. Running `scripts/gerar_catalogo.py` searches recursively for every `.html` file in `forms/`, reads each page's `<title>`, and writes its title and relative URL to the catalog. Thus, a new form page is discovered by the catalog generator automatically.

After changing a question or adding a form, run the generators from the repository root:

```sh
python3 scripts/gerar_formulario.py
python3 scripts/gerar_catalogo.py
```

Both scripts use only the Python standard library. Commit the generated JSON and JavaScript along with their source changes so the site (including GitHub Pages) uses the updated content.

### Maintaining questions and alternatives

1. Edit the question in `docs/Especificacao_Formulario_IA_P1.md`, not in the generated JSON or JavaScript files; those outputs are replaced by the generator.
2. Start each main question with a heading such as `## Questão 1`. Use `### 1.1 – Question title` for each subquestion. The generator associates each question with the closest preceding `# PARTE ...` heading and reads prerequisite codes from the `T01`–`T16` table.
3. For multiple-choice items, write each option with a bold marker on its own line: `**A)**`, `**B)**`, `**C)**`, and `**D)**`. Include exactly one `**Correta**` marker and label the others `**Incorreta**`. Put the explanation in a blockquote beginning with `> Explicação:` immediately after its option. The browser uses these markers to identify, shuffle, and score the alternatives, and to show feedback after a selection.
4. Keep tables and other question content in Markdown. For answer tables, preserve the column names and conventions expected by the form renderer (for example, `Campo do aluno`); table answer handling is implemented in `js/exercicios-01.js`.
5. Regenerate the form data and catalog with the commands above, then open the page in a browser and check the changed question and its feedback.

### Adding an exercise list

The catalog supports multiple forms, but the form-data generator and renderer currently target the first list specifically. To add another list:

1. Add a new specification under `docs/` and a corresponding page under `forms/`. Give the page a descriptive `<title>` and load its matching generated data script and rendering code.
2. Extend or adapt `scripts/gerar_formulario.py` for the new specification, JSON output, JavaScript output, and data global. The current script has fixed paths and writes `window.EXERCICIOS_FORMULARIO_01`; `js/exercicios-01.js` reads that same global. Update or generalize the renderer/page wiring so the new form loads its own data without breaking the first list.
3. Run the form generator(s), then run `python3 scripts/gerar_catalogo.py`. The catalog generator will add the new HTML page automatically, using its `<title>` as the displayed name.
4. Verify both the new page and the home-page link, then commit the source and generated files together.

---

## 🏗️ Implementation Strategy

The project separates exercise content, data generation, and browser behavior:

- 📝 **Markdown** is the source for question and answer content.
- 🐍 **Python** scripts turn the specification into form data and build the catalog from the HTML pages in `forms/`.
- 🧱 **HTML** provides the catalog page and the individual exercise forms.
- 🎨 **CSS** styles the pages, questions, answer fields, and feedback.
- ⚙️ **JavaScript** loads the catalog, renders questions, handles answer selection, and checks interactive table responses.
- 🔄 Generated JSON and JavaScript files connect the authored content to the browser.

This structure makes it possible to maintain exercise content separately from the code that displays and validates it.

---

## 🛠️ Technologies

- **HTML5** — Structure for the catalog and exercise forms.
- **CSS3** — Page layout and visual presentation.
- **JavaScript (ES6+)** — Question rendering, interactions, and answer feedback.
- **DOM (Document Object Model)** — Dynamic updates to questions, tables, and feedback.
- **Python 3.10+** — Scripts that generate form data and the catalog.
- **Markdown and JSON** — Authoring question content and storing generated data.
- **GitHub Pages** — Publishing the static site.

---

## 📁 Suggested Structure

The current structure can be expanded throughout the learning process into something like:

```text
"IAListas/
├── css/
│   └── style.css
├── docs/
│   ├── Especificacao_Formulario_IA_P1.md
│   └── IA_Lista_de_Exercicios_P1_SI.md
├── forms/
│   ├── catalogo.json                 # Generated list of available forms
│   ├── exercicios-01-data.js         # Generated form data for the first list
│   ├── exercicios-01.html            # First list page
│   └── exercicios-01.json            # Generated form data in JSON
├── js/
│   ├── exercicios-01.js              # Form rendering and answer behavior
│   └── index.js                      # Loads the form catalog
├── scripts/
│   ├── gerar_catalogo.py             # Builds the form catalog
│   └── gerar_formulario.py           # Builds the first form's data
├── index.html                        # Form catalog home page
└── readme.md
```

## 📄 License

This project is open and can be freely used for study, learning, and experimentation.

License: Free to use

You are free to copy, adapt, modify, and reuse the code as needed, while respecting the educational purpose of the project and using the content responsibly.