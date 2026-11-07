// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

// Karma configuration used by `ng test`. Adds a headless Chrome launcher for CI and
// Cobertura/lcov coverage reports (GitHub Code Quality ingests Cobertura XML).
module.exports = function (config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine"],
    plugins: [
      require("karma-jasmine"),
      require("karma-chrome-launcher"),
      require("karma-jasmine-html-reporter"),
      require("karma-coverage"),
    ],
    reporters: ["progress", "kjhtml"],
    coverageReporter: {
      dir: require("path").join(__dirname, "coverage"),
      subdir: ".",
      reporters: [{ type: "html" }, { type: "text-summary" }, { type: "cobertura", file: "cobertura.xml" }],
    },
    browsers: ["Chrome"],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: "ChromeHeadless",
        flags: ["--no-sandbox", "--disable-gpu"],
      },
    },
    restartOnFileChange: true,
  });
};
