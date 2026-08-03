module.exports = {
  ci: {
    collect: {
      staticDistDir: "./_site",
      numberOfRuns: 1,
      settings: { chromeFlags: "--headless --no-sandbox --disable-gpu" },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.65 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.85 }],
        "resource-summary:script:size": ["warn", { maxNumericValue: 1800000 }],
        "total-byte-weight": ["warn", { maxNumericValue: 2600000 }],
      },
    },
    upload: { target: "filesystem", outputDir: "./outputs/lighthouse" },
  },
};
