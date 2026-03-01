declare module "rake-js" {
  interface RakeOptions {
    language?: string;
    delimiters?: string[];
  }

  function Rake(text: string, options?: RakeOptions): string[];
  export = Rake;
}
