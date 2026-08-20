const STYLE_RESOURCE_ID = Symbol.for('react-native-unistyles.style-resource-id')

export const UNISTYLES_PRECEDENCE = 'unistyles'
export const UNISTYLES_RESOURCE_ANCHOR_ID = 'unistyles-resource-anchor'

type StyleResourceMetadata = {
    [STYLE_RESOURCE_ID]?: string
}

export const getStyleResourceId = (metadata: unknown) => {
    if (typeof metadata !== 'object' || metadata === null) {
        return undefined
    }

    return (metadata as StyleResourceMetadata)[STYLE_RESOURCE_ID]
}

export const setStyleResourceId = <T extends object>(metadata: T, resourceId: string) => {
    // React Native Web interprets enumerable metadata keys as generated classes.
    Object.defineProperty(metadata, STYLE_RESOURCE_ID, {
        configurable: false,
        enumerable: false,
        value: resourceId,
        writable: false,
    })

    return metadata
}
