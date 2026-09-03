import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Codigo de terceiro, mantido como veio, e cliente gerado por codegen. As
    // regras aqui nao mudam nada: nao editamos esses arquivos, atualizamos eles
    // recopiando da fonte. Sem isto o lint falha sempre e para de servir de sinal.
    "src/components/vendor/**",
    "src/lib/base-bridge/**/generated/**",
  ]),
]);

export default eslintConfig;
