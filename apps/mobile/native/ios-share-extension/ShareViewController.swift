import Social
import UniformTypeIdentifiers

final class ShareViewController: SLComposeServiceViewController {
  override func isContentValid() -> Bool {
    return true
  }

  override func didSelectPost() {
    guard
      let item = extensionContext?.inputItems.first as? NSExtensionItem,
      let provider = item.attachments?.first
    else {
      extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
      return
    }

    if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
      provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { item, _ in
        let urlString = (item as? URL)?.absoluteString ?? ""
        self.openHostApp(with: urlString)
      }
      return
    }

    if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
      provider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { item, _ in
        self.openHostApp(with: item as? String ?? "")
      }
      return
    }

    extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
  }

  private func openHostApp(with value: String) {
    let escaped = value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
    if let url = URL(string: "dtb://capture?url=\(escaped)") {
      extensionContext?.open(url, completionHandler: nil)
    }

    extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
  }
}
