import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { saveCapture } from "./api";

interface CaptureReviewScreenProps {
  url: string;
  onDone: () => void;
}

export function CaptureReviewScreen({ url, onDone }: CaptureReviewScreenProps) {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  async function submit() {
    setStatus("saving");
    try {
      await saveCapture({
        url,
        note,
        sourceApp: "mobile-share-sheet"
      });
      setStatus("saved");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.eyebrow}>Review</Text>
      <Text style={styles.url}>{url}</Text>
      <TextInput value={note} onChangeText={setNote} placeholder="Note" multiline style={styles.textarea} />
      <TouchableOpacity style={styles.button} onPress={submit} disabled={status === "saving"}>
        {status === "saving" ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Save</Text>}
      </TouchableOpacity>
      {status === "saved" ? (
        <TouchableOpacity style={styles.secondaryButton} onPress={onDone}>
          <Text style={styles.secondaryText}>Done</Text>
        </TouchableOpacity>
      ) : null}
      {status === "failed" ? <Text style={styles.error}>Capture failed.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  url: {
    color: "#171717",
    fontWeight: "800"
  },
  textarea: {
    minHeight: 120,
    borderWidth: 2,
    borderColor: "#171717",
    backgroundColor: "#ffffff",
    padding: 12,
    textAlignVertical: "top"
  },
  button: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171717"
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800"
  },
  secondaryButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#171717"
  },
  secondaryText: {
    color: "#171717",
    fontWeight: "800"
  },
  error: {
    color: "#b93131",
    fontWeight: "800"
  }
});
