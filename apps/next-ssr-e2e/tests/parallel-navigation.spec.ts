import { expect, test, type Page } from '@playwright/test'

type StyleAudit = {
    backgroundColor: string
    classNames: string[]
    missingClasses: string[]
}

const auditStyles = (page: Page, testId: string) =>
    page.getByTestId(testId).evaluate<StyleAudit>(element => {
        const classNames = Array.from(element.classList).filter(className => className.startsWith('unistyles_'))
        const cssText = Array.from(document.styleSheets)
            .map(styleSheet => {
                try {
                    return Array.from(styleSheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n')
                } catch {
                    return ''
                }
            })
            .join('\n')

        return {
            backgroundColor: getComputedStyle(element).backgroundColor,
            classNames,
            missingClasses: classNames.filter(className => !cssText.includes(`.${className}`)),
        }
    })

test('keeps server-generated styles across parallel route navigation', async ({ page }) => {
    await page.goto('/source')

    await expect(page.getByTestId('source-card')).toBeVisible()
    await expect(auditStyles(page, 'source-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(18, 52, 86)',
        missingClasses: [],
    })

    await page.getByRole('link', { name: 'Open destination route' }).click()

    await expect(page).toHaveURL('/destination')
    await expect(page.getByTestId('destination-card')).toBeVisible()
    await expect(auditStyles(page, 'destination-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(101, 67, 33)',
        missingClasses: [],
    })

    await page.getByRole('link', { name: 'Open source route' }).click()

    await expect(page).toHaveURL('/source')
    await expect(auditStyles(page, 'source-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(18, 52, 86)',
        missingClasses: [],
    })

    const routeStyleSheets = await page.locator('style').evaluateAll((styleElements) =>
        styleElements.filter((styleElement) => styleElement.textContent?.includes('.unistyles_')).length,
    )

    expect(routeStyleSheets).toBe(1)
})

test('includes destination server styles on a hard reload', async ({ page }) => {
    await page.goto('/destination')

    await expect(page.getByTestId('destination-card')).toBeVisible()
    await expect(auditStyles(page, 'destination-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(101, 67, 33)',
        missingClasses: [],
    })
})

test('isolates styles between concurrent server renders', async ({ request }) => {
    const slowResponsePromise = request.get('/concurrent/slow')

    await new Promise(resolve => setTimeout(resolve, 30))

    const [slowResponse, fastResponse] = await Promise.all([slowResponsePromise, request.get('/concurrent/fast')])
    const [slowHTML, fastHTML] = await Promise.all([slowResponse.text(), fastResponse.text()])
    const slowClassName = slowHTML.match(/data-class="(unistyles_[^"]+)"/)?.[1]
    const fastClassName = fastHTML.match(/data-class="(unistyles_[^"]+)"/)?.[1]

    expect(slowResponse.ok()).toBe(true)
    expect(fastResponse.ok()).toBe(true)
    expect(slowClassName).toBeTruthy()
    expect(fastClassName).toBeTruthy()
    expect(slowHTML).toContain(`.${slowClassName}{`)
    expect(slowHTML).not.toContain(`.${fastClassName}{`)
    expect(fastHTML).toContain(`.${fastClassName}{`)
    expect(fastHTML).not.toContain(`.${slowClassName}{`)
})
