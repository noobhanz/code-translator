import OpenAI from "openai";

const client = new OpenAI();

export async function compareDocuments(left: string, right: string) {
  return client.responses.create({ model: "gpt-4.1", input: `${left}\n${right}` });
}
