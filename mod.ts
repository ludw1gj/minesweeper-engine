import { bold } from "./deps.ts";

/** Returns `Hello World` in bold */
export function getHelloWorld(): string {
  return bold("Hello World");
}

console.log(getHelloWorld());
