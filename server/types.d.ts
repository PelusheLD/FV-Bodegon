declare global {
  var importProgress: Map<string, (data: any) => void> | undefined;
}

export {};

