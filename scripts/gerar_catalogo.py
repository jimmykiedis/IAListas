from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote
import json


ROOT = Path(__file__).resolve().parents[1]
FORMS_DIR = ROOT / "forms"
CATALOG_PATH = FORMS_DIR / "catalogo.json"


class TitleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.parts.append(data.strip())


def titulo_da_pagina(path):
    parser = TitleParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return " ".join(part for part in parser.parts if part) or path.stem.replace("-", " ").capitalize()


def main():
    formularios = []
    for path in sorted(FORMS_DIR.rglob("*.html")):
        relativo = path.relative_to(ROOT).as_posix()
        url = "./" + quote(relativo, safe="/-._~")
        formularios.append({"titulo": titulo_da_pagina(path), "url": url})

    CATALOG_PATH.write_text(
        json.dumps(formularios, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
