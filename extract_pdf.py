import sys
from pathlib import Path

from pypdf import PdfReader


def main() -> None:
    source = Path(sys.argv[1])
    destination = Path(sys.argv[2])
    document = PdfReader(source)
    pages = []

    for number, page in enumerate(document.pages, start=1):
        pages.append(f"\n\n===== PAGE {number} =====\n\n{page.extract_text() or ''}")

    destination.write_text("".join(pages), encoding="utf-8")
    print(f"Extracted {len(document.pages)} pages to {destination}")


if __name__ == "__main__":
    main()
