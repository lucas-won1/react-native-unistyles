import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

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

        const markup = renderToStaticMarkup(<ServerUnistylesStyles nonce="test-nonce" />)

        expect(markup).toBe('<style nonce="test-nonce">.unistyles_server{background-color:tomato;}</style>')
        expect(unistyles.services.registry.css.getStyles()).toBe('')
    })

    it('does not render an empty style element', () => {
        expect(ServerUnistylesStyles({})).toBeNull()
    })
})
