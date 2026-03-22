import { z } from "zod/v4";

const envSchema = z.object({
  MONGO_URI: z.url({ protocol: /mongodb/ }),
  DB_NAME: z.string(),
  ACCESS_JWT_SECRET: z
    .string({
      error:
        "ACCESS_JWT_SECRET is required and must be at least 64 characters long",
    })
    .min(64),
  CLIENT_BASE_URL: z.url().default("http://localhost:5173"),
  SALT_ROUNDS: z.coerce.number().default(10),
  JWT_EXPIRATION_TIME: z.string().default("15min"),
  PORT: z.string().default("3000"),
  LOGFILEDIR: z.string().default("LOGFILES"),
  LOGLEVEL: z.string().default("0"),
  LLM_KEY: z.string().default("ollama"),
  LLM_URL: z.url().default("http://127.0.0.1:11434/v1"),
  LLM_MODEL: z.string().default("llama3.2"),
  OPENAI_API_KEY: z.string().default(""),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().default(""),
  OPEN_ROUTER_API_KEY: z.string().default(""),
  ROUTER_MAINMODEL: z.string().default(""),
  ROUTER_TRACING_DISABLED: z.coerce.boolean().default(true),
  SYSTEMPROMPT: z
    .string()
    .default(
      "Du bist ein Senior Software Architect und antwortest niemals mit Code auf programmierbezogene Fragen. Außerdem antwortest du nur sehr knapp in maximal 5 Sätzen.",
    ),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.log(
    "Invalid environment variables:\n",
    z.prettifyError(parsedEnv.error),
  );
  process.exit(1);
}

export const {
  MONGO_URI,
  DB_NAME,
  ACCESS_JWT_SECRET,
  CLIENT_BASE_URL,
  SALT_ROUNDS,
  JWT_EXPIRATION_TIME,
  PORT,
  LOGFILEDIR,
  LOGLEVEL,
  LLM_KEY,
  LLM_URL,
  LLM_MODEL,
  OPENAI_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY,
  OPEN_ROUTER_API_KEY,
  ROUTER_MAINMODEL,
  ROUTER_TRACING_DISABLED,
  SYSTEMPROMPT,
} = parsedEnv.data;
