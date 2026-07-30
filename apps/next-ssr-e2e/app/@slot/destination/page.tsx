import { StyleSheet } from 'react-native-unistyles'
import { ServerUnistylesStyles } from 'react-native-unistyles/server'
import { getWebProps } from 'react-native-unistyles/web'

export default function DestinationSlot() {
    const cardProps = getWebProps(styles.card)
    const labelProps = getWebProps(styles.label)

    return (
        <>
            <section className={cardProps.className} data-testid="destination-card">
                <span className={labelProps.className}>Destination server slot</span>
            </section>
            <ServerUnistylesStyles />
        </>
    )
}

const styles = StyleSheet.create(theme => ({
    card: {
        backgroundColor: '#654321',
        borderWidth: 7,
        flexDirection: 'row',
        gap: 11,
        padding: 23,
    },
    label: {
        color: theme.colors.text,
        fontSize: 29,
    },
}))
