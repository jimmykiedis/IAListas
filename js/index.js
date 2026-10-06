async function carregarFormularios() {
  const lista = document.querySelector("#lista-formularios");

  try {
    const resposta = await fetch("./forms/catalogo.json");
    if (!resposta.ok) throw new Error("Catálogo indisponível");

    const formularios = await resposta.json();
    lista.replaceChildren();

    if (formularios.length === 0) {
      lista.innerHTML = "<li>Nenhum formulário disponível ainda.</li>";
      return;
    }

    for (const formulario of formularios) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = formulario.url;
      link.textContent = formulario.titulo;
      item.append(link);
      lista.append(item);
    }
  } catch (erro) {
    lista.innerHTML = "<li>Não foi possível carregar os formulários.</li>";
    console.error(erro);
  }
}

carregarFormularios();
