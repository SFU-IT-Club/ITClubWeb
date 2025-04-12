import { chromium, Browser, Page, BrowserContext } from "playwright";

export async function captureGithubCode(github_filepath: string): Promise<Buffer | undefined> {
    try{
        const browser: Browser = await chromium.launch();
        const context: BrowserContext = await browser.newContext();
        const page: Page = await context.newPage();

        await page.goto(github_filepath, { waitUntil: "networkidle" });

        const screenshotBuffer: Buffer = await page.screenshot();
        await browser.close();

        return screenshotBuffer;
    }
    catch (error) {
        console.error("Error capturing screenshot:", error);
    }
}