import React from 'react'

import * as unistyles from '../web/services'
import { generateHash, isServer } from '../web/utils/common'

const serverReact = React as typeof React & {
    cache?: <T>(factory: () => T) => () => T
    cacheSignal?: () => AbortSignal | null
}

const getCachedServerComponentMarker = serverReact.cache?.(() => ({}))

export const isReactServerComponentRender = () => {
    if (!isServer()) {
        return false
    }

    if (serverReact.cacheSignal) {
        return Boolean(serverReact.cacheSignal())
    }

    return Boolean(
        getCachedServerComponentMarker && getCachedServerComponentMarker() === getCachedServerComponentMarker(),
    )
}

const getHash = (className: unknown) => {
    if (!Array.isArray(className)) {
        return undefined
    }

    const [metadata] = className

    if (typeof metadata !== 'object' || metadata === null || !('hash' in metadata)) {
        return undefined
    }

    return typeof metadata.hash === 'string' ? metadata.hash : undefined
}

export const getServerUnistylesStyle = (classNames: Array<unknown>) => {
    if (!isReactServerComponentRender()) {
        return null
    }

    const hashes = classNames.map(getHash).filter((hash): hash is string => Boolean(hash))
    const css = unistyles.services.registry.css.getStylesForHashes(hashes)

    if (!css) {
        return null
    }

    return (
        <style href={`unistyles:${generateHash(css)}`} precedence="unistyles">
            {css}
        </style>
    )
}
