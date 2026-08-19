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

const readUnistylesStyleResources = (page: Page) =>
    page.locator('style[data-precedence="unistyles"]').evaluateAll((styleElements) =>
        styleElements.flatMap((styleElement) => styleElement.getAttribute('data-href')?.split(' ') ?? []),
    )

const readMissingUnistylesClasses = (page: Page) =>
    page.evaluate(() => {
        const classNames = Array.from(document.querySelectorAll('[class*="unistyles_"]')).flatMap((element) =>
            Array.from(element.classList).filter((className) => className.startsWith('unistyles_')),
        )
        const cssText = Array.from(document.styleSheets)
            .flatMap((styleSheet) => {
                try {
                    return Array.from(styleSheet.cssRules).map((rule) => rule.cssText)
                } catch {
                    return []
                }
            })
            .join('\n')

        return Array.from(new Set(classNames)).filter((className) => !cssText.includes(`.${className}`))
    })

test('keeps server-generated styles across parallel route navigation', async ({ page }) => {
    const pageErrors: Array<string> = []

    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.goto('/source')

    await expect(page.getByTestId('source-card')).toBeVisible()
    await expect(auditStyles(page, 'source-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(18, 52, 86)',
        missingClasses: [],
    })
    await expect(page.getByTestId('source-card')).toHaveCSS('flex-direction', 'row')
    await expect(page.getByTestId('source-label')).toHaveCSS('color', 'rgb(254, 220, 186)')

    await page.getByRole('link', { name: 'Open destination route' }).click()

    await expect(page).toHaveURL('/destination')
    await expect(page.getByTestId('destination-card')).toBeVisible()
    await expect(auditStyles(page, 'destination-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(101, 67, 33)',
        missingClasses: [],
    })
    await expect(page.getByTestId('destination-card')).toHaveCSS('flex-direction', 'row')
    await expect(page.getByTestId('late-card')).toBeVisible()
    await expect(auditStyles(page, 'late-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(36, 104, 19)',
        missingClasses: [],
    })
    await expect(auditStyles(page, 'late-image')).resolves.toMatchObject({
        backgroundColor: 'rgb(171, 205, 239)',
        missingClasses: [],
    })
    await expect(auditStyles(page, 'late-pressable')).resolves.toMatchObject({
        backgroundColor: 'rgb(118, 84, 50)',
        missingClasses: [],
    })
    await expect(auditStyles(page, 'client-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(17, 34, 51)',
        missingClasses: [],
    })
    const clientClassNames = await page.getByTestId('client-card').evaluate((element) =>
        Array.from(element.classList).filter((className) => className.startsWith('unistyles_')),
    )
    const serverResourceCSS = await page
        .locator('style[data-precedence="unistyles"]')
        .evaluateAll((styleElements) => styleElements.map((styleElement) => styleElement.textContent ?? '').join('\n'))

    expect(clientClassNames.every((className) => !serverResourceCSS.includes(`.${className}`))).toBe(true)
    await expect(page.getByTestId('late-scroll').locator(':scope > div')).toHaveCSS(
        'background-color',
        'rgb(53, 121, 36)',
    )
    await expect(readMissingUnistylesClasses(page)).resolves.toEqual([])
    const destinationStyleResources = await readUnistylesStyleResources(page)

    await page.getByRole('link', { name: 'Open source route' }).click()

    await expect(page).toHaveURL('/source')
    await expect(auditStyles(page, 'source-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(18, 52, 86)',
        missingClasses: [],
    })
    await expect(page.getByTestId('source-card')).toHaveCSS('flex-direction', 'row')

    const routeStyleResources = await readUnistylesStyleResources(page)

    expect(routeStyleResources.length).toBeGreaterThan(0)
    expect(routeStyleResources.every((href) => href.startsWith('unistyles:'))).toBe(true)
    expect(new Set(routeStyleResources).size).toBe(routeStyleResources.length)
    expect(routeStyleResources.sort()).toEqual(destinationStyleResources.sort())
    expect(pageErrors).toEqual([])
})

test('includes destination server styles on a hard reload', async ({ page }) => {
    await page.goto('/destination')

    await expect(page.getByTestId('destination-card')).toBeVisible()
    await expect(auditStyles(page, 'destination-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(101, 67, 33)',
        missingClasses: [],
    })
    await expect(page.getByTestId('destination-card')).toHaveCSS('flex-direction', 'row')
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
