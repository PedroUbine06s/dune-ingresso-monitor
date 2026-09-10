"""Monitor the Ingresso Duna page and alert when UCI RibeirãoShopping appears."""

from __future__ import annotations

import ctypes
import json
import logging
import sys
from pathlib import Path

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
STATE_PATH = ROOT / "state.txt"
LOG_PATH = ROOT / "monitor.log"
TARGET_TEXT = "UCI RibeirãoShopping"
URL = "https://www.ingresso.com/filme/duna-parte-3?city=ribeirao-preto"


def cinema_is_available(url: str, target_text: str) -> bool:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page(locale="pt-BR")
            page.goto(url, wait_until="domcontentloaded", timeout=60_000)
            # The cinemas/sessions can arrive after the first page response.
            page.wait_for_timeout(5_000)
            return target_text.casefold() in page.locator("body").inner_text().casefold()
        finally:
            browser.close()


def show_windows_alert(message: str) -> None:
    ctypes.windll.user32.MessageBoxW(0, message, "Duna: cinema disponível", 0x40 | 0x1000)


def main() -> int:
    logging.basicConfig(
        filename=LOG_PATH,
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        encoding="utf-8",
    )
    try:
        target_text = TARGET_TEXT
        if "--target" in sys.argv:
            target_index = sys.argv.index("--target") + 1
            if target_index >= len(sys.argv):
                raise RuntimeError("O texto de teste não foi informado.")
            target_text = sys.argv[target_index]

        found = cinema_is_available(URL, target_text)
        if "--json" in sys.argv:
            print(json.dumps({"found": found, "target": target_text}, ensure_ascii=False))
            return 0

        previous = STATE_PATH.read_text(encoding="utf-8").strip() if STATE_PATH.exists() else "unknown"
        STATE_PATH.write_text("found" if found else "absent", encoding="utf-8")

        if not found:
            logging.info("Cinema ainda não encontrado.")
            return 0

        # Alert only when it first appears; the next scheduled checks stay quiet.
        if previous == "found":
            logging.info("Cinema segue disponível; alerta já enviado.")
            return 0

        message = (
            f"{TARGET_TEXT} apareceu na página de Duna Parte 3.\n\n"
            f"Confira sessões e compre aqui:\n{URL}"
        )
        show_windows_alert(message)
        logging.info("Cinema encontrado e alerta do Windows exibido.")
        return 0
    except (PlaywrightError, OSError, RuntimeError, KeyError) as error:
        if "--json" in sys.argv:
            print(json.dumps({"error": str(error)}, ensure_ascii=False))
        logging.exception("Falha no monitor: %s", error)
        return 1


if __name__ == "__main__":
    sys.exit(main())
