import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Not Found' }} />
      <View style={styles.container}>
        <Link href="/" style={styles.button}>
          Go back to Home screen!
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: { flex: 1, backgroundColor: '#BFE7F5', justifyContent: 'center', alignItems: 'center' },
  button: { fontSize: 20, textDecorationLine: 'underline', color: '#00141a' },
=======
  container: { flex: 1, backgroundColor: '#25292e', justifyContent: 'center', alignItems: 'center' },
  button: { fontSize: 20, textDecorationLine: 'underline', color: '#fff' },
>>>>>>> 5c85b6e82ac2d3070d47078950be84ed94fa699d
});