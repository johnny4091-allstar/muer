import { Redirect } from 'expo-router';

/** Unknown paths (e.g. when the web build is hosted under a sub-path) land on Home. */
export default function NotFound() {
  return <Redirect href="/" />;
}
