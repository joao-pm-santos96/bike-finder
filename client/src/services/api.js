export async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao carregar ${url}`);
  return response.json();
}

export async function fetchBikeImage(query) {
  const response = await fetch(`/api/images?query=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Falha ao carregar imagem");
  return response.json();
}

export async function fetchBikeComparison(payload) {
  const response = await fetch("/api/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Falha ao carregar comparador");
  return response.json();
}
