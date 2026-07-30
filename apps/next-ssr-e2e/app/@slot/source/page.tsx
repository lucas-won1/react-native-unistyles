import { StyleSheet } from 'react-native-unistyles'
import { ServerUnistylesStyles } from 'react-native-unistyles/server'
import { getWebProps } from 'react-native-unistyles/web'

export default function SourceSlot() {
    const cardProps = getWebProps(styles.card)
    const labelProps = getWebProps(styles.label)

    return (
        <>
            <section className={cardProps.className} data-testid="source-card">
                <span className={labelProps.className}>Source server slot</span>
            </section>
            <ServerUnistylesStyles />
        </>
    )
}

const styles = StyleSheet.create(theme => ({
    card: {
        backgroundColor: '#123456',
        borderRadius: 13,
        padding: 17,
    },
    label: {
        color: theme.colors.background,
        fontSize: 19,
    },
}))
