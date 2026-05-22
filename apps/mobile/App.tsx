import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CaptureReviewScreen } from "./src/CaptureReviewScreen";
import { readMobileApiSettings, saveMobileApiSettings } from "./src/api";

export default function App() {
  const incomingUrl = Linking.useURL();
  const [manualUrl, setManualUrl] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const captureUrl = useMemo(() => readSharedUrl(incomingUrl) ?? manualUrl, [incomingUrl, manualUrl]);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (incomingUrl && readSharedUrl(incomingUrl)) {
      setReviewing(true);
    }
  }, [incomingUrl]);

  useEffect(() => {
    void readMobileApiSettings().then((settings) => {
      setApiBaseUrl(settings.apiBaseUrl ?? "http://localhost:3000");
      setAccessToken(settings.accessToken ?? "");
    });
  }, []);

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="dark-content" />
      {reviewing ? (
        <CaptureReviewScreen url={captureUrl} onDone={() => setReviewing(false)} />
      ) : (
        <View style={styles.panel}>
          <Text style={styles.eyebrow}>DTB21</Text>
          <Text style={styles.title}>Capture</Text>
          <TextInput
            value={manualUrl}
            onChangeText={setManualUrl}
            placeholder="https://..."
            autoCapitalize="none"
            style={styles.input}
          />
          <Text style={styles.sectionLabel}>API</Text>
          <TextInput
            value={apiBaseUrl}
            onChangeText={setApiBaseUrl}
            placeholder="http://localhost:3000"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            value={accessToken}
            onChangeText={setAccessToken}
            placeholder="Access token"
            autoCapitalize="none"
            secureTextEntry
            style={styles.input}
          />
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={async () => {
              await saveMobileApiSettings({ apiBaseUrl, accessToken });
              setSettingsSaved(true);
            }}
          >
            <Text style={styles.secondaryButtonText}>Save API settings</Text>
          </TouchableOpacity>
          {settingsSaved ? <Text style={styles.savedText}>Settings saved.</Text> : null}
          <TouchableOpacity style={styles.button} onPress={() => setReviewing(true)}>
            <Text style={styles.buttonText}>Review capture</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function readSharedUrl(url: string | null): string | undefined {
  if (!url) {
    return undefined;
  }

  const parsed = Linking.parse(url);
  const shared = parsed.queryParams?.url ?? parsed.queryParams?.text;
  return typeof shared === "string" ? shared : undefined;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#f4f4ee",
    padding: 18
  },
  panel: {
    borderWidth: 2,
    borderColor: "#171717",
    backgroundColor: "#fbfaf5",
    padding: 18,
    gap: 12
  },
  eyebrow: {
    color: "#66645f",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  title: {
    color: "#171717",
    fontSize: 34,
    fontWeight: "900"
  },
  input: {
    borderWidth: 2,
    borderColor: "#171717",
    backgroundColor: "#ffffff",
    padding: 12
  },
  button: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171717"
  },
  secondaryButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#171717"
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800"
  },
  secondaryButtonText: {
    color: "#171717",
    fontWeight: "800"
  },
  sectionLabel: {
    color: "#66645f",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  savedText: {
    color: "#26624a",
    fontWeight: "800"
  }
});
