import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        logs = []
        page.on("console", lambda msg: logs.append(msg.text))
        page.on("dialog", lambda dialog: logs.append(f"ALERT: {dialog.message}"))
        
        await page.goto("http://localhost:60403") # I don't know the port, wait, the user said "no hay localhost:60403"
        await browser.close()
        
if __name__ == "__main__":
    asyncio.run(main())
