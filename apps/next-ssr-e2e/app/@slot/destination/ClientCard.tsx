'use client'

import { Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

export function ClientCard() {
    return (
        <View style={styles.card} testID="client-card">
            <Text style={styles.label}>Client card</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#112233',
        padding: 8,
    },
    label: {
        color: '#ffffff',
    },
})
