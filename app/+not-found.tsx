import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oups', headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>Cette page n'existe pas.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Retour à l'accueil</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.ink,
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamily.displaySemiBold,
    color: colors.text,
  },
  link: {
    marginTop: 16,
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 14,
    fontFamily: fontFamily.textSemiBold,
    color: colors.lime,
  },
});
