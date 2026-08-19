import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { getServerUnistylesStyle } from '../core/ServerUnistylesStyle'
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

    it('does not emit RSC resources during regular component SSR', () => {
        unistyles.services.registry.css.set({
            className: 'unistyles_client_ssr',
            propertyKey: 'color',
            value: 'tomato',
        })

        const Probe = () => getServerUnistylesStyle([[{ hash: 'unistyles_client_ssr' }, []]])

        expect(renderToStaticMarkup(<Probe />)).toBe('')
    })

    it('selects only rules owned by requested hashes', () => {
        unistyles.services.registry.css.set({
            className: 'unistyles_selected',
            propertyKey: 'backgroundColor',
            value: 'tomato',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_selected:first-child',
            propertyKey: 'color',
            value: 'white',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_other',
            propertyKey: 'color',
            value: 'black',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_selected',
            isMq: true,
            mediaQuery: '@media (min-width: 768px)',
            propertyKey: 'padding',
            value: '12px',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_other',
            isMq: true,
            mediaQuery: '@media (min-width: 768px)',
            propertyKey: 'padding',
            value: '24px',
        })

        expect(unistyles.services.registry.css.getStylesForHashes(['unistyles_selected'])).toBe(
            '.unistyles_selected{background-color:tomato;}.unistyles_selected:first-child{color:white;}' +
                '@media (min-width: 768px){.unistyles_selected{padding:12px;}}',
        )
    })
})
