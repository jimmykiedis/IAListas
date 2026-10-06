"""Converte as questoes da especificacao Markdown para dados do formulario."""

from pathlib import Path
import json
import re


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "Especificacao_Formulario_IA_P1.md"
OUTPUT = ROOT / "forms" / "exercicios-01.json"
SCRIPT_OUTPUT = ROOT / "forms" / "exercicios-01-data.js"

QUESTION_HEADING = re.compile(r"^## Questão (\d+)(?:\s*\((.*?)\))?\s*$", re.MULTILINE)
SUBQUESTION_HEADING = re.compile(r"^### (\d+(?:\.\d+)?)\s*[–-]\s*(.+)$", re.MULTILINE)


def prerequisite_catalog(markdown):
    result = {}
    for code, title in re.findall(r"^\|\s*(T\d{2})\s*\|\s*(.*?)\s*\|$", markdown, re.MULTILINE):
        if code != "Código":
            result[code] = title
    return result


def question_chunks(markdown):
    headings = list(QUESTION_HEADING.finditer(markdown))
    parts = list(re.finditer(r"^# (PARTE [^\n]+)$", markdown, re.MULTILINE))
    for index, heading in enumerate(headings):
        end = headings[index + 1].start() if index + 1 < len(headings) else len(markdown)
        section = ""
        for part in parts:
            if part.start() >= heading.start():
                break
            section = part.group(1)
        yield heading, markdown[heading.end():end].strip(), section


def strip_metadata(body):
    kept = []
    for line in body.splitlines():
        if line.startswith("**Pré-requisito:**") or line.startswith("**Tipo:**"):
            continue
        kept.append(line)
    content = "\n".join(kept)
    content = re.sub(r"(?m)^> \*\*Instrução ao desenvolvedor[^\n]*(?:\n>[^\n]*)*\n?", "", content)
    content = re.split(r"(?m)^# PARTE\b|^\*Fim da especificação", content, maxsplit=1)[0]
    content = re.sub(r"(?:\n\s*---\s*)+$", "", content)
    return content.strip()


def parse_prerequisites(body, catalog):
    match = re.search(r"^\*\*Pré-requisito:\*\*\s*(.+)$", body, re.MULTILINE)
    if not match:
        return []
    codes = re.findall(r"T\d{2}", match.group(1))
    return [{"code": code, "title": catalog.get(code, code)} for code in codes]


def item_from_markdown(number, title, markdown):
    return {"number": number, "title": title.strip(), "markdown": markdown.strip()}


def parse_question(heading, body, catalog, section):
    number = heading.group(1)
    title = f"Questão {number}"
    prerequisites = parse_prerequisites(body, catalog)
    content = strip_metadata(body)
    matches = list(SUBQUESTION_HEADING.finditer(content))

    if not matches:
        items = [item_from_markdown(number, title, content)]
        intro = ""
    else:
        intro = content[:matches[0].start()].strip()
        items = []
        seen = {}
        for index, match in enumerate(matches):
            end = matches[index + 1].start() if index + 1 < len(matches) else len(content)
            item_markdown = content[match.end():end].strip()
            key = (match.group(1), match.group(2).strip())
            if key in seen:
                previous = items[seen[key]]
                if len(item_markdown) > len(previous["markdown"]):
                    previous["markdown"] = item_markdown
                continue
            seen[key] = len(items)
            items.append(item_from_markdown(match.group(1), match.group(2), item_markdown))

    result = {
        "number": number,
        "title": title,
        "section": section,
        "prerequisites": prerequisites,
        "intro": intro,
        "items": items,
    }
    if number == "19":
        board = re.search(r"\*\*Tabuleiro 4 × 4 – solução final[^\n]*\n\n((?:\|[^\n]*\|\n)+)", body)
        if board:
            columns = []
            for line in board.group(1).splitlines()[2:]:
                cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
                if cells and cells[0].strip("*") in {"1", "2", "3", "4"}:
                    columns.append(str(next((index for index, cell in enumerate(cells[1:], start=1) if "♛" in cell), "")))
            if len(columns) == 4:
                result["boardAnswers"] = columns
    return result


def main():
    markdown = SOURCE.read_text(encoding="utf-8")
    catalog = prerequisite_catalog(markdown)
    questions = [parse_question(heading, body, catalog, section) for heading, body, section in question_chunks(markdown)]
    payload = {"title": "Inteligência Artificial — P1", "questions": questions}
    serialized = json.dumps(payload, ensure_ascii=False, indent=2)
    OUTPUT.write_text(serialized + "\n", encoding="utf-8")
    SCRIPT_OUTPUT.write_text(
        "window.EXERCICIOS_FORMULARIO_01 = " + serialized + ";\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
