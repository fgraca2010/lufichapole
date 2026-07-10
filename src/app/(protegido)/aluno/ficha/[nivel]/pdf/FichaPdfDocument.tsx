import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const cores = {
  primaria: "#00A887",
  terciaria: "#383838",
  preto: "#000000",
  cinzaClaro: "#E5E5E5",
};

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica" },
  cabecalho: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  logo: { width: 40, height: 40 },
  tituloMarca: { fontSize: 12, fontWeight: 700, color: cores.primaria },
  subtitulo: { fontSize: 9, color: cores.terciaria },
  infoAluno: { marginBottom: 10, flexDirection: "row", justifyContent: "space-between" },
  colunas: { flexDirection: "row", gap: 12 },
  coluna: { width: "48.5%" },
  bloco: { marginBottom: 8 },
  tituloBloco: { fontSize: 10, fontWeight: 700, color: cores.terciaria, marginBottom: 3 },
  linhaMovimento: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: cores.cinzaClaro,
  },
  categoria: {
    width: 12,
    fontSize: 7.5,
    fontWeight: 700,
    color: cores.terciaria,
  },
  nomeMovimento: { flex: 1, fontSize: 7.5, color: cores.preto },
  caixas: { flexDirection: "row", gap: 1.5 },
  caixa: {
    width: 7,
    height: 7,
    borderWidth: 0.6,
    borderColor: cores.terciaria,
  },
  caixaPreenchida: {
    backgroundColor: cores.primaria,
  },
  rodape: {
    position: "absolute",
    bottom: 16,
    left: 28,
    right: 28,
    fontSize: 7,
    color: cores.terciaria,
    textAlign: "center",
  },
});

type Movimento = {
  id: number;
  nome: string;
  categoria: string | null;
  sucessosConsecutivos: number;
  aprovado: boolean;
};

type Bloco = {
  numero: number;
  movimentos: Movimento[];
};

/**
 * Distribui os blocos em 2 colunas, sempre colocando o próximo bloco na
 * coluna com menos linhas acumuladas até agora — fica mais equilibrado do
 * que só alternar par/ímpar, já que os blocos têm tamanhos bem diferentes.
 */
function distribuirEmDuasColunas(blocos: Bloco[]): [Bloco[], Bloco[]] {
  const colunas: [Bloco[], Bloco[]] = [[], []];
  const alturas = [0, 0];

  for (const bloco of blocos) {
    const destino = alturas[0] <= alturas[1] ? 0 : 1;
    colunas[destino].push(bloco);
    alturas[destino] += bloco.movimentos.length + 1; // +1 pelo título do bloco
  }

  return colunas;
}

export function FichaPdfDocument({
  logoBase64,
  nivelNumero,
  nomeAluno,
  nomeProfessor,
  sucessosNecessarios,
  blocos,
  geradoEm,
}: {
  logoBase64: string;
  nivelNumero: number;
  nomeAluno: string;
  nomeProfessor: string | null;
  sucessosNecessarios: number;
  blocos: Bloco[];
  geradoEm: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.cabecalho}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- <Image> aqui é do @react-pdf/renderer, não HTML */}
          <Image src={logoBase64} style={styles.logo} />
          <View>
            <Text style={styles.tituloMarca}>Lu Fortuna Polesport</Text>
            <Text style={styles.subtitulo}>Ficha de evolução — Nível {nivelNumero}</Text>
          </View>
        </View>

        <View style={styles.infoAluno}>
          <Text>Aluno(a): {nomeAluno}</Text>
          <Text>Professor(a): {nomeProfessor ?? "ainda não vinculado"}</Text>
          <Text>Gerado em: {geradoEm}</Text>
        </View>

        <View style={styles.colunas}>
          {distribuirEmDuasColunas(blocos).map((coluna, i) => (
            <View key={i} style={styles.coluna}>
              {coluna.map((bloco) => (
                <View key={bloco.numero} style={styles.bloco} wrap={false}>
                  <Text style={styles.tituloBloco}>Bloco {bloco.numero}</Text>
                  {bloco.movimentos.map((mov) => (
                    <View key={mov.id} style={styles.linhaMovimento}>
                      <Text style={styles.categoria}>{mov.categoria ?? ""}</Text>
                      <Text style={styles.nomeMovimento}>{mov.nome}</Text>
                      <View style={styles.caixas}>
                        {Array.from({ length: sucessosNecessarios }).map((_, j) => {
                          const preenchida = mov.aprovado || j < mov.sucessosConsecutivos;
                          return (
                            <View
                              key={j}
                              style={preenchida ? [styles.caixa, styles.caixaPreenchida] : styles.caixa}
                            />
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.rodape}>
          Lu Fortuna Polesport — ficha gerada automaticamente pelo sistema, use pra anotar seu treino sem celular.
        </Text>
      </Page>
    </Document>
  );
}
