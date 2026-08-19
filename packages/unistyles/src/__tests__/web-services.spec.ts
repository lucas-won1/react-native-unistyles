const createBrowserGlobals = () => {
    const rootElement = {
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
        },
    }
    const styleElement = {
        id: '',
        innerText: '',
    }

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            addEventListener: jest.fn(),
            devicePixelRatio: 1,
            innerHeight: 768,
            innerWidth: 1024,
            matchMedia: jest.fn(() => ({
                addEventListener: jest.fn(),
                matches: false,
            })),
        },
    })
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: {
            createElement: jest.fn(() => styleElement),
            documentElement: rootElement,
            getElementById: jest.fn(() => null),
            head: {
                appendChild: jest.fn(),
            },
            querySelector: jest.fn(() => rootElement),
        },
    })
}

describe('web services', () => {
    const originalWindow = globalThis.window
    const originalDocument = globalThis.document

    beforeEach(() => {
        jest.resetModules()
        createBrowserGlobals()
        Reflect.deleteProperty(globalThis, '__unistyles__')
    })

    afterEach(() => {
        Object.defineProperty(globalThis, 'window', {
            configurable: true,
            value: originalWindow,
        })
        Object.defineProperty(globalThis, 'document', {
            configurable: true,
            value: originalDocument,
        })
        Reflect.deleteProperty(globalThis, '__unistyles__')
    })

    it('reuses one browser runtime across separately evaluated module graphs', () => {
        let firstServices: typeof import('../web/services').services | undefined
        let secondServices: typeof import('../web/services').services | undefined

        jest.isolateModules(() => {
            firstServices = require('../web/services').services
        })
        jest.isolateModules(() => {
            secondServices = require('../web/services').services
        })

        expect(firstServices).toBeDefined()
        expect(secondServices).toBe(firstServices)
    })
})
