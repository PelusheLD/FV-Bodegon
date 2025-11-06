/**
 * Utilidades para búsqueda inteligente de productos
 */

/**
 * Normaliza texto para búsqueda removiendo acentos y caracteres especiales
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^\w\s]/g, '') // Remover caracteres especiales excepto espacios
    .trim();
}

/**
 * Divide un término de búsqueda en palabras individuales y las normaliza
 */
export function getSearchWords(searchTerm: string): string[] {
  return searchTerm
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => normalizeText(word));
}

/**
 * Verifica si un producto coincide con una búsqueda inteligente
 * @param productName - Nombre del producto
 * @param searchTerm - Término de búsqueda
 * @returns true si el producto coincide con la búsqueda
 */
export function matchesSmartSearch(productName: string, searchTerm: string): boolean {
  const searchWords = getSearchWords(searchTerm);
  
  if (searchWords.length === 0) return false;
  
  const normalizedProductName = normalizeText(productName);
  
  // Todas las palabras deben estar presentes en el nombre del producto
  return searchWords.every(word => normalizedProductName.includes(word));
}

/**
 * Busca productos usando búsqueda inteligente
 * @param products - Array de productos
 * @param searchTerm - Término de búsqueda
 * @returns Array de productos que coinciden con la búsqueda
 */
export function searchProducts(products: any[], searchTerm: string): any[] {
  if (!searchTerm.trim()) return products;
  
  return products.filter(product => 
    matchesSmartSearch(product.name, searchTerm)
  );
}

