declare module "tree-sitter-javascript" {
  const language: unknown;
  export default language;
}

declare module "tree-sitter-typescript" {
  const languages: {
    typescript: unknown;
    tsx: unknown;
  };
  export default languages;
}
