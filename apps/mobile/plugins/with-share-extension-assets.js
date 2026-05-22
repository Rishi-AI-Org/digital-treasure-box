const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

const EXTENSION_NAME = "DTB21ShareExtension";

module.exports = function withShareExtensionAssets(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const iosRoot = modConfig.modRequest.platformProjectRoot;
      const sourceRoot = path.join(projectRoot, "native", "ios-share-extension");
      const targetRoot = path.join(iosRoot, EXTENSION_NAME);

      fs.mkdirSync(targetRoot, { recursive: true });
      for (const fileName of ["ShareViewController.swift", "Info.plist"]) {
        fs.copyFileSync(path.join(sourceRoot, fileName), path.join(targetRoot, fileName));
      }

      fs.writeFileSync(
        path.join(targetRoot, "README.md"),
        [
          "# DTB21 Share Extension",
          "",
          "These files are staged by `plugins/with-share-extension-assets.js` during `npx expo prebuild`.",
          "Create an iOS Share Extension target named `DTB21ShareExtension` in Xcode and point it at these files.",
          "The target bundle identifier should be `app.digitaltreasurebox.mobile.share`."
        ].join("\n")
      );

      return modConfig;
    }
  ]);
};

