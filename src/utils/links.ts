import * as Linking from 'expo-linking';
import { router } from 'expo-router';

// Opens the real address when there is one, otherwise a "coming soon" page.
export function openLink(title: string, url: string | null = null) {
  if (url) {
    Linking.openURL(url).catch((error) => console.warn('Could not open link', error));
  } else {
    router.push({ pathname: '/coming-soon', params: { title } });
  }
}
