import type { ReactElement } from 'react'

import { ServerUnistylesStyles } from '../server'
import * as unistyles from '../web/services'

describe('ServerUnistylesStyles', () => {
    beforeEach(() => {
        unistyles.services.registry.reset()
    })

    it('flushes collected styles into a style element', () => {
        unistyles.services.registry.css.set({
            className: 'unistyles_server',
            propertyKey: 'backgroundColor',
            value: 'tomato',
        })

        const element = ServerUnistylesStyles({ nonce: 'test-nonce' }) as ReactElement<{
            children: string
            nonce: string
        }>

        expect(element.type).toBe('style')
        expect(element.props).toEqual({
            children: '.unistyles_server{background-color:tomato;}',
            nonce: 'test-nonce',
        })
        expect(unistyles.services.registry.css.getStyles()).toBe('')
    })

    it('does not render an empty style element', () => {
        expect(ServerUnistylesStyles({})).toBeNull()
    })
})
